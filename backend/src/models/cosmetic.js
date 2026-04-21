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

  static async canUnlock(userId, itemKey) {
    const itemRes = await pool.query(
      'SELECT * FROM cosmetic_items WHERE key = $1',
      [itemKey]
    );
    const item = itemRes.rows[0];
    if (!item) return { allowed: false, reason: 'Item not found' };
    if (item.unlock_method === 'default') return { allowed: true };

    if (item.unlock_method === 'premium') {
      const isPrem = await Subscription.isPremium(userId);
      if (!isPrem) return { allowed: false, reason: 'premium_required', item };
      return { allowed: true, item };
    }

    if (item.unlock_method === 'gold') {
      const statsRes = await pool.query(
        'SELECT gold FROM user_stats WHERE user_id = $1',
        [userId]
      );
      const gold = statsRes.rows[0]?.gold || 0;
      if (gold < item.gold_cost) {
        return { allowed: false, reason: 'insufficient_gold', cost: item.gold_cost, current: gold, item };
      }
      return { allowed: true, item, goldCost: item.gold_cost };
    }

    return { allowed: false, reason: 'unknown_method' };
  }

  static async unlock(userId, itemKey) {
    const check = await this.canUnlock(userId, itemKey);
    if (!check.allowed) return { success: false, ...check };

    // Deduct gold if needed
    if (check.item?.unlock_method === 'gold' && check.goldCost > 0) {
      await pool.query(
        'UPDATE user_stats SET gold = gold - $1 WHERE user_id = $2',
        [check.goldCost, userId]
      );
    }

    await pool.query(
      `INSERT INTO user_cosmetics (user_id, item_key)
       VALUES ($1, $2)
       ON CONFLICT (user_id, item_key) DO NOTHING`,
      [userId, itemKey]
    );

    return { success: true, item: check.item };
  }

  static async equip(userId, itemKey) {
    // Check user owns it
    const owned = await pool.query(
      'SELECT * FROM user_cosmetics WHERE user_id = $1 AND item_key = $2',
      [userId, itemKey]
    );
    if (!owned.rows[0]) return { success: false, reason: 'not_owned' };

    const itemRes = await pool.query(
      'SELECT type FROM cosmetic_items WHERE key = $1',
      [itemKey]
    );
    const itemType = itemRes.rows[0]?.type;

    // Unequip other items of same type
    if (itemType) {
      await pool.query(
        `UPDATE user_cosmetics SET is_equipped = FALSE
         WHERE user_id = $1 AND item_key IN (
           SELECT key FROM cosmetic_items WHERE type = $2
         )`,
        [userId, itemType]
      );
    }

    await pool.query(
      `UPDATE user_cosmetics SET is_equipped = TRUE
       WHERE user_id = $1 AND item_key = $2`,
      [userId, itemKey]
    );

    return { success: true };
  }

  static async getShopItems(userId) {
    const isPrem = await Subscription.isPremium(userId);
    const inventoryRes = await this.getUserInventory(userId);
    const owned = new Set(inventoryRes.map(i => i.key));

    const all = await this.getAllItems();
    return all.map(item => ({
      ...item,
      owned: owned.has(item.key),
      available: item.unlock_method === 'default' ||
        (item.unlock_method === 'premium' && isPrem) ||
        item.unlock_method === 'gold',
    }));
  }
}

module.exports = Cosmetic;
