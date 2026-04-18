const { query } = require('../config/database');

class Income {
  static async create({ userId, amount, source, date, description, recurring = false }) {
    const [result] = await query(
      `INSERT INTO income (user_id, amount, source, date, description, recurring)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, amount, source, date, description, recurring]
    );
    
    // Fetch the created record
    const [rows] = await query('SELECT * FROM income WHERE id = ?', [result.insertId]);
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await query('SELECT * FROM income WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async findByUserId(userId, options = {}) {
    const { startDate, endDate, limit = 100, offset = 0 } = options;
    
    let queryText = 'SELECT * FROM income WHERE user_id = ?';
    const values = [userId];

    if (startDate) {
      queryText += ' AND date >= ?';
      values.push(startDate);
    }

    if (endDate) {
      queryText += ' AND date <= ?';
      values.push(endDate);
    }

    queryText += ' ORDER BY date DESC LIMIT ? OFFSET ?';
    values.push(parseInt(limit), parseInt(offset));

    const [rows] = await query(queryText, values);
    return rows;
  }

  static async getTotalByUserId(userId, options = {}) {
    const { startDate, endDate } = options;
    
    let queryText = 'SELECT COALESCE(SUM(amount), 0) as total FROM income WHERE user_id = ?';
    const values = [userId];

    if (startDate) {
      queryText += ' AND date >= ?';
      values.push(startDate);
    }

    if (endDate) {
      queryText += ' AND date <= ?';
      values.push(endDate);
    }

    const [rows] = await query(queryText, values);
    return parseFloat(rows[0].total);
  }

  static async getMonthlyBreakdown(userId, year) {
    const [rows] = await query(
      `SELECT 
        MONTH(date) as month,
        COALESCE(SUM(amount), 0) as total
       FROM income 
       WHERE user_id = ? AND YEAR(date) = ?
       GROUP BY MONTH(date)
       ORDER BY month`,
      [userId, year]
    );
    
    return rows;
  }

  static async update(id, userId, updates) {
    const allowedFields = ['amount', 'source', 'date', 'description', 'recurring'];
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
      `UPDATE income SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );
    
    // Fetch the updated record
    const [rows] = await query('SELECT * FROM income WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async delete(id, userId) {
    const [result] = await query(
      'DELETE FROM income WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0 ? { id } : null;
  }

  static async getIncomeBySource(userId, startDate, endDate) {
    let queryText = `
      SELECT source, COALESCE(SUM(amount), 0) as total
      FROM income 
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

    queryText += ' GROUP BY source ORDER BY total DESC';

    const [rows] = await query(queryText, values);
    return rows;
  }
}

module.exports = Income;
