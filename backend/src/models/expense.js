const { query } = require('../config/database');

class Expense {
  static async create({ userId, amount, category, date, description, recurring = false, recurringFrequency = 'monthly' }) {
    const [result] = await query(
      `INSERT INTO expenses (user_id, amount, category, date, description, recurring, recurring_frequency)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, amount, category, date, description, recurring, recurringFrequency]
    );
    
    // Fetch the created record
    const [rows] = await query('SELECT * FROM expenses WHERE id = ?', [result.insertId]);
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await query('SELECT * FROM expenses WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async findByUserId(userId, options = {}) {
    const { startDate, endDate, category, limit = 100, offset = 0 } = options;
    
    let queryText = 'SELECT * FROM expenses WHERE user_id = ?';
    const values = [userId];

    if (startDate) {
      queryText += ' AND date >= ?';
      values.push(startDate);
    }

    if (endDate) {
      queryText += ' AND date <= ?';
      values.push(endDate);
    }

    if (category) {
      queryText += ' AND category = ?';
      values.push(category);
    }

    queryText += ' ORDER BY date DESC LIMIT ? OFFSET ?';
    values.push(parseInt(limit), parseInt(offset));

    const [rows] = await query(queryText, values);
    return rows;
  }

  static async getTotalByUserId(userId, options = {}) {
    const { startDate, endDate, category } = options;
    
    let queryText = 'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ?';
    const values = [userId];

    if (startDate) {
      queryText += ' AND date >= ?';
      values.push(startDate);
    }

    if (endDate) {
      queryText += ' AND date <= ?';
      values.push(endDate);
    }

    if (category) {
      queryText += ' AND category = ?';
      values.push(category);
    }

    const [rows] = await query(queryText, values);
    return parseFloat(rows[0].total);
  }

  static async getCategoryBreakdown(userId, startDate, endDate) {
    let queryText = `
      SELECT category, COALESCE(SUM(amount), 0) as total
      FROM expenses 
      WHERE user_id = ?
    `;
    const values = [userId];

    if (startDate) {
      queryText += ' AND date >= ?';
      values.push(startDate);
    }

    if (endDate) {
      queryText += ' AND date <= ?';
      values.push(endDate);
    }

    queryText += ' GROUP BY category ORDER BY total DESC';

    const [rows] = await query(queryText, values);
    return rows;
  }

  static async getMonthlyBreakdown(userId, year) {
    const [rows] = await query(
      `SELECT 
        MONTH(date) as month,
        COALESCE(SUM(amount), 0) as total
       FROM expenses 
       WHERE user_id = ? AND YEAR(date) = ?
       GROUP BY MONTH(date)
       ORDER BY month`,
      [userId, year]
    );
    
    return rows;
  }

  static async update(id, userId, updates) {
    const allowedFields = ['amount', 'category', 'date', 'description', 'recurring', 'recurring_frequency'];
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(id, userId);
    
    await query(
      `UPDATE expenses SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );
    
    // Fetch the updated record
    const [rows] = await query('SELECT * FROM expenses WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async delete(id, userId) {
    const [result] = await query(
      'DELETE FROM expenses WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0 ? { id } : null;
  }

  static async getRecentExpenses(userId, limit = 5) {
    const [rows] = await query(
      `SELECT e.*, c.color, c.icon
       FROM expenses e
       LEFT JOIN categories c ON e.category = c.name AND c.user_id = e.user_id
       WHERE e.user_id = ?
       ORDER BY e.date DESC
       LIMIT ?`,
      [userId, parseInt(limit)]
    );
    return rows;
  }
}

module.exports = Expense;
