const { query } = require('../config/database');

class Income {
  static async create({ userId, amount, source, date, description, recurring = false }) {
    const rows = await query(
      `INSERT INTO income (user_id, amount, source, date, description, recurring)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, amount, source, date, description, recurring]
    );
    
    return rows[0];
  }

  static async findById(id) {
    const rows = await query('SELECT * FROM income WHERE id = $1', [id]);
    return rows[0] || null;
  }

  static async findByUserId(userId, options = {}) {
    const { startDate, endDate, limit = 100, offset = 0 } = options;
    
    let queryText = 'SELECT * FROM income WHERE user_id = $1';
    const values = [userId];
    let paramIndex = 1;

    if (startDate) {
      paramIndex++;
      queryText += ` AND date >= $${paramIndex}`;
      values.push(startDate);
    }

    if (endDate) {
      paramIndex++;
      queryText += ` AND date <= $${paramIndex}`;
      values.push(endDate);
    }

    paramIndex++;
    queryText += ` ORDER BY date DESC LIMIT $${paramIndex}`;
    values.push(parseInt(limit));
    
    paramIndex++;
    queryText += ` OFFSET $${paramIndex}`;
    values.push(parseInt(offset));

    const rows = await query(queryText, values);
    return rows;
  }

  static async getTotalByUserId(userId, options = {}) {
    const { startDate, endDate } = options;
    
    let queryText = 'SELECT COALESCE(SUM(amount), 0) as total FROM income WHERE user_id = $1';
    const values = [userId];
    let paramIndex = 1;

    if (startDate) {
      paramIndex++;
      queryText += ` AND date >= $${paramIndex}`;
      values.push(startDate);
    }

    if (endDate) {
      paramIndex++;
      queryText += ` AND date <= $${paramIndex}`;
      values.push(endDate);
    }

    const rows = await query(queryText, values);
    return parseFloat(rows[0].total);
  }

  static async getMonthlyBreakdown(userId, year) {
    const rows = await query(
      `SELECT 
        EXTRACT(MONTH FROM date) as month,
        COALESCE(SUM(amount), 0) as total
       FROM income 
       WHERE user_id = $1 AND EXTRACT(YEAR FROM date) = $2
       GROUP BY EXTRACT(MONTH FROM date)
       ORDER BY month`,
      [userId, year]
    );
    
    return rows;
  }

  static async update(id, userId, updates) {
    const allowedFields = ['amount', 'source', 'date', 'description', 'recurring'];
    const fields = [];
    const values = [];
    let paramIndex = 0;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        paramIndex++;
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
      }
    }

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    paramIndex++;
    values.push(id);
    paramIndex++;
    values.push(userId);
    
    await query(
      `UPDATE income SET ${fields.join(', ')} WHERE id = $${paramIndex - 1} AND user_id = $${paramIndex}`,
      values
    );
    
    const rows = await query('SELECT * FROM income WHERE id = $1', [id]);
    return rows[0] || null;
  }

  static async delete(id, userId) {
    const result = await query(
      'DELETE FROM income WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    return result.length > 0 ? { id } : null;
  }

  static async getIncomeBySource(userId, startDate, endDate) {
    let queryText = `
      SELECT source, COALESCE(SUM(amount), 0) as total
      FROM income 
      WHERE user_id = $1
    `;
    const values = [userId];
    let paramIndex = 1;

    if (startDate) {
      paramIndex++;
      queryText += ` AND date >= $${paramIndex}`;
      values.push(startDate);
    }

    if (endDate) {
      paramIndex++;
      queryText += ` AND date <= $${paramIndex}`;
      values.push(endDate);
    }

    queryText += ' GROUP BY source ORDER BY total DESC';

    const rows = await query(queryText, values);
    return rows;
  }
}

module.exports = Income;
