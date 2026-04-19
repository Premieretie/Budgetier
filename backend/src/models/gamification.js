const { query, transaction } = require('../config/database');

// XP required for each level (exponential growth)
const XP_LEVELS = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3250, 3850, 4500, 5200, 5950, 6750, 7600, 8500, 9450, 10000];

// Achievement definitions
const ACHIEVEMENTS = {
  FIRST_EXPENSE: { title: 'First Steps', description: 'Logged yer first expense!', gold: 10, xp: 5 },
  DAILY_LOGIN: { title: 'Daily Sailor', description: 'Came aboard 7 days straight!', gold: 25, xp: 15 },
  BUDGET_MASTER: { title: 'Budget Master', description: 'Stayed under budget for a week!', gold: 50, xp: 30 },
  GOAL_COMPLETED: { title: 'Treasure Hunter', description: 'Completed a savings goal!', gold: 100, xp: 50 },
  BIG_SAVER: { title: 'Hoarding Captain', description: 'Saved over $1000!', gold: 75, xp: 40 },
  QUICK_ADD_MASTER: { title: 'Speedy Spender', description: 'Used Quick Add 10 times!', gold: 20, xp: 10 },
  NO_SPEND_DAY: { title: 'Anchored Ship', description: 'A full day without spending!', gold: 30, xp: 20 },
  STREAK_30: { title: 'Legendary Pirate', description: '30-day logging streak!', gold: 200, xp: 100 },
  FIRST_QUEST: { title: 'Quest Seeker', description: 'Created yer first quest!', gold: 15, xp: 10 },
  SHIP_SAVED: { title: 'Ship Doctor', description: 'Recovered from overspending!', gold: 40, xp: 25 },
};

// Loot/Reward definitions with rarities
const LOOT_TABLE = {
  common: [
    { name: 'Copper Coin', icon: '🪙', gold: 5, xp: 2 },
    { name: 'Wooden Crate', icon: '📦', gold: 3, xp: 1 },
    { name: 'Rope Bundle', icon: '🪢', gold: 4, xp: 2 },
    { name: 'Old Map Fragment', icon: '🗺️', gold: 6, xp: 3 },
  ],
  uncommon: [
    { name: 'Silver Doubloon', icon: '🪙', gold: 15, xp: 8 },
    { name: 'Crystal Gem', icon: '💎', gold: 20, xp: 10 },
    { name: 'Spyglass', icon: '🔭', gold: 12, xp: 6 },
    { name: 'Compass', icon: '🧭', gold: 18, xp: 9 },
  ],
  rare: [
    { name: 'Gold Doubloon', icon: '🪙', gold: 50, xp: 25 },
    { name: 'Pearl Necklace', icon: '📿', gold: 45, xp: 22 },
    { name: 'Captain\'s Hat', icon: '🎩', gold: 40, xp: 20 },
    { name: 'Treasure Key', icon: '🗝️', gold: 55, xp: 28 },
  ],
  epic: [
    { name: 'Golden Chalice', icon: '🏆', gold: 100, xp: 50 },
    { name: 'Ancient Idol', icon: '🗿', gold: 120, xp: 60 },
    { name: 'Crown Jewels', icon: '👑', gold: 150, xp: 75 },
  ],
  legendary: [
    { name: 'Kraken Eye', icon: '👁️', gold: 500, xp: 250 },
    { name: 'Poseidon\'s Trident', icon: '🔱', gold: 1000, xp: 500 },
  ],
};

class Gamification {
  // ============================================
  // USER STATS MANAGEMENT
  // ============================================
  
  static async initializeUserStats(userId) {
    await query(
      `INSERT INTO user_stats (user_id, gold, xp, level, ship_health, current_streak, longest_streak, treasure_chest_amount, last_activity_date)
       VALUES ($1, 100, 0, 1, 100, 0, 0, 0, CURRENT_DATE)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId]
    );
    
    // Create default quick expense buttons
    await this.createDefaultQuickButtons(userId);
    
    return this.getUserStats(userId);
  }
  
  static async getUserStats(userId) {
    const rows = await query(
      `SELECT * FROM user_stats WHERE user_id = $1`,
      [userId]
    );
    
    if (!rows[0]) {
      return this.initializeUserStats(userId);
    }
    
    const stats = rows[0];
    
    // Calculate next level XP
    const nextLevelXP = XP_LEVELS[stats.level] || XP_LEVELS[XP_LEVELS.length - 1];
    const currentLevelXP = XP_LEVELS[stats.level - 1] || 0;
    const xpProgress = stats.xp - currentLevelXP;
    const xpNeeded = nextLevelXP - currentLevelXP;
    const levelProgress = Math.min(100, Math.round((xpProgress / xpNeeded) * 100));
    
    return {
      ...stats,
      nextLevelXP,
      xpProgress,
      xpNeeded,
      levelProgress,
    };
  }
  
  static async updateUserStats(userId, updates) {
    const allowedFields = ['xp', 'level', 'gold', 'ship_health', 'current_streak', 'longest_streak', 'treasure_chest_amount', 'last_activity_date'];
    const fields = [];
    const values = [];
    let paramIndex = 1;
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }
    
    if (fields.length === 0) return null;
    
    values.push(userId);
    
    await query(
      `UPDATE user_stats SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE user_id = $${paramIndex}`,
      values
    );
    
    return this.getUserStats(userId);
  }
  
  // ============================================
  // XP AND LEVELING
  // ============================================
  
  static async addXP(userId, amount) {
    const stats = await this.getUserStats(userId);
    const newXP = stats.xp + amount;
    
    // Check for level up
    let newLevel = stats.level;
    for (let i = stats.level; i < XP_LEVELS.length; i++) {
      if (newXP >= XP_LEVELS[i]) {
        newLevel = i + 1;
      } else {
        break;
      }
    }
    
    const updates = { xp: newXP };
    if (newLevel > stats.level) {
      updates.level = newLevel;
      // Bonus gold for level up
      updates.gold = stats.gold + (newLevel * 25);
    }
    
    return this.updateUserStats(userId, updates);
  }
  
  static async addGold(userId, amount) {
    const stats = await this.getUserStats(userId);
    const newGold = Math.max(0, stats.gold + amount);
    return this.updateUserStats(userId, { gold: newGold });
  }
  
  // ============================================
  // STREAKS
  // ============================================
  
  static async updateStreak(userId) {
    const stats = await this.getUserStats(userId);
    const today = new Date().toISOString().split('T')[0];
    const lastActivity = stats.last_activity_date ? new Date(stats.last_activity_date).toISOString().split('T')[0] : null;
    
    if (lastActivity === today) {
      // Already logged today
      return stats;
    }
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    let newStreak = stats.current_streak;
    let streakBonus = 0;
    
    if (lastActivity === yesterdayStr) {
      // Continue streak
      newStreak += 1;
      streakBonus = Math.min(newStreak * 5, 50); // Max 50 gold per day for streaks
    } else {
      // Streak broken
      newStreak = 1;
    }
    
    const updates = {
      current_streak: newStreak,
      last_activity_date: today,
    };
    
    if (newStreak > stats.longest_streak) {
      updates.longest_streak = newStreak;
    }
    
    // Add streak gold
    updates.gold = stats.gold + 5 + streakBonus;
    
    // Check for streak achievements
    if (newStreak === 7) {
      await this.unlockAchievement(userId, 'DAILY_LOGIN');
    } else if (newStreak === 30) {
      await this.unlockAchievement(userId, 'STREAK_30');
    }
    
    return this.updateUserStats(userId, updates);
  }
  
  // ============================================
  // SHIP HEALTH SYSTEM
  // ============================================
  
  static async updateShipHealth(userId, spendingRatio) {
    // spendingRatio: 0-1 where 1 = at budget limit, >1 = over budget
    let healthChange = 0;
    
    if (spendingRatio <= 0.5) {
      // Under 50% spending - ship heals
      healthChange = 10;
    } else if (spendingRatio <= 0.8) {
      // 50-80% spending - ship stable
      healthChange = 0;
    } else if (spendingRatio <= 1.0) {
      // 80-100% spending - minor damage
      healthChange = -5;
    } else {
      // Over budget - major damage
      healthChange = -15;
    }
    
    const stats = await this.getUserStats(userId);
    const newHealth = Math.max(0, Math.min(100, stats.ship_health + healthChange));
    
    return this.updateUserStats(userId, { ship_health: newHealth });
  }
  
  static async repairShip(userId, goldCost) {
    const stats = await this.getUserStats(userId);
    
    if (stats.gold < goldCost) {
      return { success: false, message: 'Not enough gold!' };
    }
    
    const newHealth = Math.min(100, stats.ship_health + 20);
    await this.updateUserStats(userId, { 
      ship_health: newHealth,
      gold: stats.gold - goldCost 
    });
    
    return { success: true, newHealth, remainingGold: stats.gold - goldCost };
  }
  
  // ============================================
  // TREASURE CHEST (SAVINGS VISUALIZATION)
  // ============================================
  
  static async addToTreasureChest(userId, amount) {
    const stats = await this.getUserStats(userId);
    const newAmount = parseFloat(stats.treasure_chest_amount) + parseFloat(amount);
    return this.updateUserStats(userId, { treasure_chest_amount: newAmount });
  }
  
  // ============================================
  // REWARDS AND LOOT
  // ============================================
  
  static async rollLoot(userId, chance = 0.3) {
    // 30% chance to get loot when logging expense
    if (Math.random() > chance) return null;
    
    // Determine rarity
    const roll = Math.random();
    let rarity = 'common';
    if (roll > 0.95) rarity = 'legendary';
    else if (roll > 0.85) rarity = 'epic';
    else if (roll > 0.65) rarity = 'rare';
    else if (roll > 0.40) rarity = 'uncommon';
    
    const lootTable = LOOT_TABLE[rarity];
    const loot = lootTable[Math.floor(Math.random() * lootTable.length)];
    
    // Save to user rewards
    await query(
      `INSERT INTO user_rewards (user_id, reward_type, reward_name, description, icon, rarity)
       VALUES ($1, 'loot', $2, $3, $4, $5)`,
      [userId, loot.name, `Found while logging expenses! (+${loot.gold} gold, +${loot.xp} XP)`, loot.icon, rarity]
    );
    
    // Add gold and XP
    await this.addGold(userId, loot.gold);
    await this.addXP(userId, loot.xp);
    
    return { ...loot, rarity };
  }
  
  static async getUserRewards(userId, limit = 50) {
    const rows = await query(
      `SELECT * FROM user_rewards WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [userId, limit]
    );
    return rows;
  }
  
  // ============================================
  // ACHIEVEMENTS
  // ============================================
  
  static async unlockAchievement(userId, achievementKey) {
    const achievement = ACHIEVEMENTS[achievementKey];
    if (!achievement) return null;
    
    // Check if already unlocked
    const existing = await query(
      `SELECT id FROM achievement_log WHERE user_id = $1 AND achievement_type = $2`,
      [userId, achievementKey]
    );
    
    if (existing.length > 0) return null; // Already unlocked
    
    // Log achievement
    await query(
      `INSERT INTO achievement_log (user_id, achievement_type, title, description, reward_gold, reward_xp)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, achievementKey, achievement.title, achievement.description, achievement.gold, achievement.xp]
    );
    
    // Grant rewards
    await this.addGold(userId, achievement.gold);
    await this.addXP(userId, achievement.xp);
    
    // Create notification
    const Notification = require('./notification');
    await Notification.create({
      userId,
      type: 'ACHIEVEMENT_UNLOCKED',
      title: `🏆 Achievement Unlocked: ${achievement.title}`,
      message: `${achievement.description} (+${achievement.gold} gold, +${achievement.xp} XP)`,
      data: { achievementKey, gold: achievement.gold, xp: achievement.xp },
    });
    
    return achievement;
  }
  
  static async getAchievements(userId) {
    const rows = await query(
      `SELECT * FROM achievement_log WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return rows;
  }
  
  // ============================================
  // QUICK EXPENSE BUTTONS
  // ============================================
  
  static async createDefaultQuickButtons(userId) {
    const defaults = [
      { name: 'Coffee', amount: 5, category: 'Food & Dining', icon: '☕', color: '#8B4513' },
      { name: 'Lunch', amount: 15, category: 'Food & Dining', icon: '🍔', color: '#D4AF37' },
      { name: 'Gas', amount: 60, category: 'Transportation', icon: '⛽', color: '#228B22' },
      { name: 'Groceries', amount: 80, category: 'Food & Dining', icon: '🛒', color: '#CD853F' },
      { name: 'Drinks', amount: 25, category: 'Entertainment', icon: '🍺', color: '#B22222' },
    ];
    
    for (const btn of defaults) {
      await query(
        `INSERT INTO quick_expense_buttons (user_id, name, amount, category, icon, color, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT DO NOTHING`,
        [userId, btn.name, btn.amount, btn.category, btn.icon, btn.color, defaults.indexOf(btn)]
      );
    }
  }
  
  static async getQuickButtons(userId) {
    const rows = await query(
      `SELECT * FROM quick_expense_buttons 
       WHERE user_id = $1 AND is_active = TRUE 
       ORDER BY usage_count DESC, sort_order ASC`,
      [userId]
    );
    return rows;
  }
  
  static async createQuickButton(userId, buttonData) {
    const { name, amount, category, icon, color } = buttonData;
    const rows = await query(
      `INSERT INTO quick_expense_buttons (user_id, name, amount, category, icon, color)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, name, amount, category, icon || '💰', color || '#D4AF37']
    );
    return rows[0];
  }
  
  static async updateQuickButton(buttonId, userId, updates) {
    const allowedFields = ['name', 'amount', 'category', 'icon', 'color', 'is_active', 'sort_order'];
    const fields = [];
    const values = [];
    let paramIndex = 1;
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }
    
    if (fields.length === 0) return null;
    
    values.push(buttonId, userId);
    
    const rows = await query(
      `UPDATE quick_expense_buttons SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
       RETURNING *`,
      values
    );
    
    return rows[0] || null;
  }
  
  static async incrementButtonUsage(buttonId) {
    await query(
      `UPDATE quick_expense_buttons SET usage_count = usage_count + 1 WHERE id = $1`,
      [buttonId]
    );
  }
  
  static async deleteQuickButton(buttonId, userId) {
    const rows = await query(
      `DELETE FROM quick_expense_buttons WHERE id = $1 AND user_id = $2 RETURNING id`,
      [buttonId, userId]
    );
    return rows.length > 0;
  }
  
  // ============================================
  // DAILY CHALLENGES
  // ============================================
  
  static async generateDailyChallenges(userId) {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if already generated for today
    const existing = await query(
      `SELECT id FROM daily_challenges WHERE user_id = $1 AND date = $2`,
      [userId, today]
    );
    
    if (existing.length > 0) return existing;
    
    const challenges = [
      { type: 'no_spend', title: 'Anchored Ship', description: 'Don\'t spend any gold today!', target_amount: 0 },
      { type: 'under_budget', title: 'Frugal Sailor', description: 'Stay under 50% of daily budget', target_amount: 50 },
      { type: 'log_expenses', title: 'Keen Eye', description: 'Log 3 or more expenses today', target_amount: 3 },
      { type: 'quick_add', title: 'Speed Demon', description: 'Use Quick Add for all expenses', target_amount: 1 },
    ];
    
    const created = [];
    for (const challenge of challenges) {
      const rows = await query(
        `INSERT INTO daily_challenges (user_id, challenge_type, title, description, target_amount, date)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [userId, challenge.type, challenge.title, challenge.description, challenge.target_amount, today]
      );
      created.push(rows[0]);
    }
    
    return created;
  }
  
  static async getDailyChallenges(userId) {
    await this.generateDailyChallenges(userId);
    const today = new Date().toISOString().split('T')[0];
    
    const rows = await query(
      `SELECT * FROM daily_challenges WHERE user_id = $1 AND date = $2 ORDER BY completed ASC, id ASC`,
      [userId, today]
    );
    return rows;
  }
  
  static async updateChallengeProgress(userId, challengeType, amount) {
    const today = new Date().toISOString().split('T')[0];
    
    const rows = await query(
      `UPDATE daily_challenges 
       SET current_amount = current_amount + $4,
           completed = CASE WHEN current_amount + $4 >= target_amount THEN TRUE ELSE completed END
       WHERE user_id = $1 AND challenge_type = $2 AND date = $3 AND completed = FALSE
       RETURNING *`,
      [userId, challengeType, today, amount]
    );
    
    if (rows[0] && rows[0].completed && !rows[0].reward_claimed) {
      // Challenge just completed - grant rewards
      await this.addGold(userId, rows[0].reward_gold);
      await this.addXP(userId, rows[0].reward_xp);
      
      await query(
        `UPDATE daily_challenges SET reward_claimed = TRUE WHERE id = $1`,
        [rows[0].id]
      );
      
      return { ...rows[0], justCompleted: true };
    }
    
    return rows[0] || null;
  }
  
  // ============================================
  // EXPENSE TRACKING WITH GAMIFICATION
  // ============================================
  
  static async trackExpense(userId, amount, category) {
    // Update streak
    await this.updateStreak(userId);
    
    // Add XP for logging
    await this.addXP(userId, 2);
    
    // Roll for loot
    const loot = await this.rollLoot(userId);
    
    // Update challenges
    await this.updateChallengeProgress(userId, 'log_expenses', 1);
    
    // Check for first expense achievement
    const expenseCount = await query(
      `SELECT COUNT(*) as count FROM expenses WHERE user_id = $1`,
      [userId]
    );
    
    if (parseInt(expenseCount[0].count) === 1) {
      await this.unlockAchievement(userId, 'FIRST_EXPENSE');
    }
    
    return { loot, xp: 2, gold: loot ? loot.gold : 0 };
  }
  
  // ============================================
  // DASHBOARD DATA - GAMIFIED STATS
  // ============================================
  
  static async getGamifiedDashboard(userId) {
    const [stats, rewards, challenges, achievements, quickButtons] = await Promise.all([
      this.getUserStats(userId),
      this.getUserRewards(userId, 5),
      this.getDailyChallenges(userId),
      this.getAchievements(userId),
      this.getQuickButtons(userId),
    ]);
    
    // Ship health status message
    let shipStatus = 'smooth';
    let shipMessage = 'Sailing smooth seas, Captain!';
    
    if (stats.ship_health <= 30) {
      shipStatus = 'critical';
      shipMessage = '⚠️ Ship taking on water! Take action now!';
    } else if (stats.ship_health <= 60) {
      shipStatus = 'damaged';
      shipMessage = '🌊 Storm ahead! Mind yer spending!';
    } else if (stats.ship_health >= 90) {
      shipStatus = 'pristine';
      shipMessage = '⭐ Ship in perfect condition!';
    }
    
    return {
      stats,
      ship: {
        health: stats.ship_health,
        status: shipStatus,
        message: shipMessage,
      },
      recentRewards: rewards,
      dailyChallenges: challenges,
      achievements: achievements.slice(0, 10),
      quickButtons,
      treasureProgress: Math.min(100, (stats.treasure_chest_amount / 1000) * 100), // Percentage to $1000
    };
  }
}

module.exports = Gamification;
