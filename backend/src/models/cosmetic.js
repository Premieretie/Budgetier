const { pool } = require('../config/database');
const Subscription = require('./subscription');

class Cosmetic {
  static async getAllItems() {
    const result = await pool.query(
      'SELECT * FROM cosmetic_items ORDER BY type, is_default DESC, gold_cost ASC'
    );
    return result.rows;
  }

  static async getUserInventory(userId) {
    const result = await pool.query(
      `SELECT ci.*, uc.is_equipped, uc.unlocked_at
       FROM cosmetic_items ci
       INNER JOIN user_cosmetics uc ON ci.key = uc.item_key
       WHERE uc.user_id = $1`,
      [userId]
    );
    return result.rows;
  }

  static async getEquipped(userId) {
    const result = await pool.query(
      `SELECT ci.*, uc.is_equipped
       FROM cosmetic_items ci
       INNER JOIN user_cosmetics uc ON ci.key = uc.item_key
       WHERE uc.user_id = $1 AND uc.is_equipped = TRUE`,
      [userId]
    );
    return result.rows;
  }

  static async unlockDefault(userId) {
    const defaults = await pool.query(
      'SELECT key FROM cosmetic_items WHERE is_default = TRUE'
    );
    for (const item of defaults.rows) {
      await pool.query(
        `INSERT INTO user_cosmetics (user_id, item_key, is_equipped)
         VALUES ($1, $2, TRUE)
         ON CONFLICT (user_id, item_key) DO NOTHING`,
        [userId, item.key]
      );
    }
  }

  // ─────────────────────────────────────────────────────────────
  // UNLOCK — fully atomic transaction
  //   • Checks ownership FIRST to prevent re-purchase gold drain
  //   • SELECT FOR UPDATE on user_stats prevents concurrent drain
  //   • GREATEST(0, gold - cost) prevents negative gold balance
  // ─────────────────────────────────────────────────────────────
  static async unlock(userId, itemKey) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Load item (shared lock — prevents deletion mid-transaction)
      const itemRes = await client.query(
        'SELECT * FROM cosmetic_items WHERE key = $1 FOR SHARE',
        [itemKey]
      );
      const item = itemRes.rows[0];
      if (!item) {
        await client.query('ROLLBACK');
        return { success: false, reason: 'item_not_found' };
      }

      // Check ownership BEFORE touching gold
      const ownershipRes = await client.query(
        'SELECT 1 FROM user_cosmetics WHERE user_id = $1 AND item_key = $2',
        [userId, itemKey]
      );
      if (ownershipRes.rows.length > 0) {
        await client.query('ROLLBACK');
        return { success: false, reason: 'already_owned', item };
      }

      if (item.unlock_method === 'default') {
        // Free — no further checks needed
      } else if (item.unlock_method === 'premium') {
        const isPrem = await Subscription.isPremium(userId);
        if (!isPrem) {
          await client.query('ROLLBACK');
          return { success: false, reason: 'premium_required', item };
        }
      } else if (item.unlock_method === 'gold') {
        // Row-level lock prevents a second concurrent request reading stale gold
        const statsRes = await client.query(
          'SELECT gold FROM user_stats WHERE user_id = $1 FOR UPDATE',
          [userId]
        );
        const gold = statsRes.rows[0]?.gold ?? 0;
        if (gold < item.gold_cost) {
          await client.query('ROLLBACK');
          return { success: false, reason: 'insufficient_gold', cost: item.gold_cost, current: gold, item };
        }
        // GREATEST(0, ...) is a safety net against any edge-case negative balance
        await client.query(
          'UPDATE user_stats SET gold = GREATEST(0, gold - $1) WHERE user_id = $2',
          [item.gold_cost, userId]
        );
      } else {
        await client.query('ROLLBACK');
        return { success: false, reason: 'unknown_method' };
      }

      // Insert ownership — no ON CONFLICT needed; pre-checked above
      await client.query(
        'INSERT INTO user_cosmetics (user_id, item_key) VALUES ($1, $2)',
        [userId, itemKey]
      );

      await client.query('COMMIT');
      return { success: true, item };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // ─────────────────────────────────────────────────────────────
  // EQUIP — atomic: unequip same-type + equip target in one tx
  // ─────────────────────────────────────────────────────────────
  static async equip(userId, itemKey) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verify ownership inside the transaction
      const owned = await client.query(
        'SELECT 1 FROM user_cosmetics WHERE user_id = $1 AND item_key = $2',
        [userId, itemKey]
      );
      if (!owned.rows[0]) {
        await client.query('ROLLBACK');
        return { success: false, reason: 'not_owned' };
      }

      const itemRes = await client.query(
        'SELECT type FROM cosmetic_items WHERE key = $1',
        [itemKey]
      );
      const itemType = itemRes.rows[0]?.type;

      if (itemType) {
        await client.query(
          `UPDATE user_cosmetics SET is_equipped = FALSE
           WHERE user_id = $1 AND item_key IN (
             SELECT key FROM cosmetic_items WHERE type = $2
           )`,
          [userId, itemType]
        );
      }

      await client.query(
        'UPDATE user_cosmetics SET is_equipped = TRUE WHERE user_id = $1 AND item_key = $2',
        [userId, itemKey]
      );

      await client.query('COMMIT');
      return { success: true };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // ─────────────────────────────────────────────────────────────
  // SHOP — parallelised load; returns items + userGold
  //   • canAfford: boolean for gold items (drives lock icon)
  //   • is_equipped: correctly set per item
  // ─────────────────────────────────────────────────────────────
  static async getShopItems(userId) {
    const [isPrem, inventoryRows, allItems, statsRes] = await Promise.all([
      Subscription.isPremium(userId),
      this.getUserInventory(userId),
      this.getAllItems(),
      pool.query('SELECT gold FROM user_stats WHERE user_id = $1', [userId]),
    ]);

    const owned = new Set(inventoryRows.map(i => i.key));
    const equipped = new Set(inventoryRows.filter(i => i.is_equipped).map(i => i.key));
    const userGold = statsRes.rows[0]?.gold ?? 0;

    const items = allItems.map(item => ({
      ...item,
      owned: owned.has(item.key),
      is_equipped: equipped.has(item.key),
      available: item.unlock_method === 'default' ||
        (item.unlock_method === 'premium' && isPrem) ||
        item.unlock_method === 'gold',
      canAfford: item.unlock_method === 'gold' ? userGold >= item.gold_cost : null,
    }));

    return { items, userGold };
  }
}

module.exports = Cosmetic;
