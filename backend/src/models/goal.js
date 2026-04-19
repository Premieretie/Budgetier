const { query } = require('../config/database');

class Goal {
  static async create({ userId, name, type, targetAmount, currentAmount = 0, deadline, description }) {
    const [result] = await query(
      `INSERT INTO goals (user_id, name, type, target_amount, current_amount, deadline, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, name, type, targetAmount, currentAmount, deadline, description]
    );
    
    const [rows] = await query('SELECT * FROM goals WHERE id = ?', [result.insertId]);
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await query('SELECT * FROM goals WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async findByUserId(userId, options = {}) {
    const { completed, limit = 100, offset = 0 } = options;
    
    let queryText = 'SELECT * FROM goals WHERE user_id = ?';
    const values = [userId];

    if (completed !== undefined) {
      queryText += ' AND completed = ?';
      values.push(completed);
    }

    queryText += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    values.push(parseInt(limit), parseInt(offset));

    const [rows] = await query(queryText, values);
    return rows;
  }

  static async update(id, userId, updates) {
    const allowedFields = ['name', 'type', 'target_amount', 'current_amount', 'deadline', 'description', 'completed'];
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
      `UPDATE goals SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );
    
    const [rows] = await query('SELECT * FROM goals WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async delete(id, userId) {
    const [result] = await query(
      'DELETE FROM goals WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0 ? { id } : null;
  }

  static async addProgress(id, userId, amount) {
    const { transaction } = require('../config/database');
    
    return transaction(async (client) => {
      // First get current values (within transaction for locking)
      const [goalRows] = await client.execute(
        'SELECT current_amount, target_amount FROM goals WHERE id = ? AND user_id = ? FOR UPDATE',
        [id, userId]
      );
      
      if (!goalRows[0]) return null;
      
      const newAmount = parseFloat(goalRows[0].current_amount) + parseFloat(amount);
      const completed = newAmount >= parseFloat(goalRows[0].target_amount);
      
      await client.execute(
        `UPDATE goals SET current_amount = ?, completed = ?, completed_at = ? WHERE id = ? AND user_id = ?`,
        [newAmount, completed, completed ? new Date() : null, id, userId]
      );
      
      const [rows] = await client.execute('SELECT * FROM goals WHERE id = ?', [id]);
      return rows[0] || null;
    });
  }

  static async getStats(userId) {
    const [rows] = await query(
      `SELECT 
        COUNT(*) as total_goals,
        SUM(CASE WHEN completed = true THEN 1 ELSE 0 END) as completed_goals,
        COALESCE(SUM(CASE WHEN type = 'savings' AND completed = false THEN target_amount - current_amount END), 0) as remaining_savings,
        COALESCE(SUM(CASE WHEN type = 'debt' AND completed = false THEN target_amount - current_amount END), 0) as remaining_debt
       FROM goals 
       WHERE user_id = ?`,
      [userId]
    );
    
    return rows[0];
  }

  static async getUpcomingDeadlines(userId, days = 30) {
    const [rows] = await query(
      `SELECT *
       FROM goals 
       WHERE user_id = ? 
         AND completed = false 
         AND deadline IS NOT NULL
         AND deadline <= DATE_ADD(CURRENT_DATE, INTERVAL ? DAY)
       ORDER BY deadline ASC`,
      [userId, parseInt(days)]
    );
    
    return rows;
  }
}

module.exports = Goal;
