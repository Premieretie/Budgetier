const { pool } = require('../config/database');

const FREE_LIMITS = {
  goals: 3,
};

class Subscription {
  static async getByUserId(userId) {
    const result = await pool.query(
      'SELECT * FROM subscriptions WHERE user_id = $1',
      [userId]
    );
    return result.rows[0] || null;
  }

  static async getOrCreate(userId) {
    let sub = await this.getByUserId(userId);
    if (!sub) {
      const result = await pool.query(
        `INSERT INTO subscriptions (user_id, plan, status)
         VALUES ($1, 'free', 'active')
         RETURNING *`,
        [userId]
      );
      sub = result.rows[0];
    }
    return sub;
  }

  static async isPremium(userId) {
    const sub = await this.getByUserId(userId);
    if (!sub) return false;
    if (sub.plan === 'premium' && sub.status === 'active') return true;
    // Check active trial
    if (sub.trial_ends_at && new Date(sub.trial_ends_at) > new Date()) return true;
    return false;
  }

  static async upgradeToPremium(userId, { trialDays = 0, stripeCustomerId = null, stripeSubscriptionId = null } = {}) {
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const trialEndsAt = trialDays > 0
      ? new Date(now.getTime() + trialDays * 86400 * 1000)
      : null;

    const result = await pool.query(
      `INSERT INTO subscriptions (user_id, plan, status, trial_ends_at, current_period_start, current_period_end, stripe_customer_id, stripe_subscription_id, updated_at)
       VALUES ($1, 'premium', 'active', $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         plan = 'premium',
         status = 'active',
         trial_ends_at = $2,
         current_period_start = $3,
         current_period_end = $4,
         stripe_customer_id = COALESCE($5, subscriptions.stripe_customer_id),
         stripe_subscription_id = COALESCE($6, subscriptions.stripe_subscription_id),
         updated_at = NOW()
       RETURNING *`,
      [userId, trialEndsAt, now, periodEnd, stripeCustomerId, stripeSubscriptionId]
    );
    return result.rows[0];
  }

  static async downgradeToFree(userId) {
    const result = await pool.query(
      `UPDATE subscriptions SET plan = 'free', status = 'active', updated_at = NOW()
       WHERE user_id = $1 RETURNING *`,
      [userId]
    );
    return result.rows[0];
  }

  static async getLimits(userId) {
    const sub = await this.getByUserId(userId);
    const isPrem = sub
      ? (sub.plan === 'premium' && sub.status === 'active') ||
        (sub.trial_ends_at && new Date(sub.trial_ends_at) > new Date())
      : false;
    return {
      isPremium: isPrem,
      goals: isPrem ? Infinity : FREE_LIMITS.goals,
    };
  }
}

module.exports = Subscription;
module.exports.FREE_LIMITS = FREE_LIMITS;
