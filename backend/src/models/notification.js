const { query } = require('../config/database');

class Notification {
  static async create({ userId, type, title, message, data = null }) {
    const [result] = await query(
      `INSERT INTO notifications (user_id, type, title, message, data)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, type, title, message, data ? JSON.stringify(data) : null]
    );
    
    const [rows] = await query('SELECT * FROM notifications WHERE id = ?', [result.insertId]);
    return rows[0];
  }

  static async findByUserId(userId, options = {}) {
    const { unreadOnly, limit = 50, offset = 0 } = options;
    
    let queryText = 'SELECT * FROM notifications WHERE user_id = ?';
    const values = [userId];

    if (unreadOnly) {
      queryText += ' AND is_read = false';
    }

    queryText += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    values.push(parseInt(limit), parseInt(offset));

    const [rows] = await query(queryText, values);
    return rows;
  }

  static async markAsRead(id, userId) {
    await query(
      'UPDATE notifications SET is_read = true WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    const [rows] = await query('SELECT * FROM notifications WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async markAllAsRead(userId) {
    await query(
      'UPDATE notifications SET is_read = true WHERE user_id = ? AND is_read = false',
      [userId]
    );
    return true;
  }

  static async delete(id, userId) {
    const [result] = await query(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0 ? { id } : null;
  }

  static async deleteAll(userId) {
    await query('DELETE FROM notifications WHERE user_id = ?', [userId]);
    return true;
  }

  static async getUnreadCount(userId) {
    const [rows] = await query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = false',
      [userId]
    );
    return parseInt(rows[0].count);
  }

  static TYPES = {
    BUDGET_ALERT: 'budget_alert',
    GOAL_MILESTONE: 'goal_milestone',
    GOAL_COMPLETED: 'goal_completed',
    OVERSPENDING: 'overspending',
    WELCOME: 'welcome',
  };
}

module.exports = Notification;
