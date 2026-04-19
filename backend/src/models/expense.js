const { query } = require('../config/database');

class Expense {
  static async create({ userId, amount, category, date, description, recurring = false, recurringFrequency = 'monthly' }) {
    const rows = await query(
      `INSERT INTO expenses (user_id, amount, category, date, description, recurring, recurring_frequency)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, amount, category, date, description, recurring, recurringFrequency]
    );
    
    return rows[0];
  }

  static async findById(id) {
    const rows = await query('SELECT * FROM expenses WHERE id = $1', [id]);
    return rows[0] || null;
  }

  static async findByUserId(userId, options = {}) {
    const { startDate, endDate, category, limit = 100, offset = 0 } = options;
    
    let queryText = 'SELECT * FROM expenses WHERE user_id = $1';
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

    if (category) {
      paramIndex++;
      queryText += ` AND category = $${paramIndex}`;
      values.push(category);
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
    const { startDate, endDate, category } = options;
    
    let queryText = 'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = $1';
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

    if (category) {
      paramIndex++;
      queryText += ` AND category = $${paramIndex}`;
      values.push(category);
    }

    const rows = await query(queryText, values);
    return parseFloat(rows[0].total);
  }

  static async getCategoryBreakdown(userId, startDate, endDate) {
    let queryText = `
      SELECT category, COALESCE(SUM(amount), 0) as total
      FROM expenses 
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

    queryText += ' GROUP BY category ORDER BY total DESC';

    const rows = await query(queryText, values);
    return rows;
  }

  static async getMonthlyBreakdown(userId, year) {
    const rows = await query(
      `SELECT 
        EXTRACT(MONTH FROM date) as month,
        COALESCE(SUM(amount), 0) as total
       FROM expenses 
       WHERE user_id = $1 AND EXTRACT(YEAR FROM date) = $2
       GROUP BY EXTRACT(MONTH FROM date)
       ORDER BY month`,
      [userId, year]
    );
    
    return rows;
  }

  static async update(id, userId, updates) {
    const allowedFields = ['amount', 'category', 'date', 'description', 'recurring', 'recurring_frequency'];
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
      `UPDATE expenses SET ${fields.join(', ')} WHERE id = $${paramIndex - 1} AND user_id = $${paramIndex}`,
      values
    );
    
    // Fetch the updated record
    const rows = await query('SELECT * FROM expenses WHERE id = $1', [id]);
    return rows[0] || null;
  }

  static async delete(id, userId) {
    const result = await query(
      'DELETE FROM expenses WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    return result.length > 0 ? { id } : null;
  }

  static async getRecentExpenses(userId, limit = 5) {
    const rows = await query(
      `SELECT e.*, c.color, c.icon
       FROM expenses e
       LEFT JOIN categories c ON e.category = c.name AND c.user_id = e.user_id
       WHERE e.user_id = $1
       ORDER BY e.date DESC
       LIMIT $2`,
      [userId, parseInt(limit)]
    );
    return rows;
  }
}

module.exports = Expense;
