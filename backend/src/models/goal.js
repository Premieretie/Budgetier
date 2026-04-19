const { query } = require('../config/database');

class Goal {
  static async create({ userId, name, type, targetAmount, currentAmount = 0, deadline, description }) {
    const rows = await query(
      `INSERT INTO goals (user_id, name, type, target_amount, current_amount, deadline, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, name, type, targetAmount, currentAmount, deadline, description]
    );
    
    return rows[0];
  }

  static async findById(id) {
    const rows = await query('SELECT * FROM goals WHERE id = $1', [id]);
    return rows[0] || null;
  }

  static async findByUserId(userId, options = {}) {
    const { completed, limit = 100, offset = 0 } = options;
    
    let queryText = 'SELECT * FROM goals WHERE user_id = $1';
    const values = [userId];
    let paramIndex = 1;

    if (completed !== undefined) {
      paramIndex++;
      queryText += ` AND completed = $${paramIndex}`;
      values.push(completed);
    }

    paramIndex++;
    queryText += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
    values.push(parseInt(limit));
    
    paramIndex++;
    queryText += ` OFFSET $${paramIndex}`;
    values.push(parseInt(offset));

    const rows = await query(queryText, values);
    return rows;
  }

  static async update(id, userId, updates) {
    const allowedFields = ['name', 'type', 'target_amount', 'current_amount', 'deadline', 'description', 'completed'];
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
      `UPDATE goals SET ${fields.join(', ')} WHERE id = $${paramIndex - 1} AND user_id = $${paramIndex}`,
      values
    );
    
    const rows = await query('SELECT * FROM goals WHERE id = $1', [id]);
    return rows[0] || null;
  }

  static async delete(id, userId) {
    const result = await query(
      'DELETE FROM goals WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    return result.length > 0 ? { id } : null;
  }

  static async addProgress(id, userId, amount) {
    const { transaction } = require('../config/database');
    
    return transaction(async (client) => {
      // First get current values (within transaction for locking)
      const goalResult = await client.query(
        'SELECT current_amount, target_amount FROM goals WHERE id = $1 AND user_id = $2 FOR UPDATE',
        [id, userId]
      );
      
      if (!goalResult.rows[0]) return null;
      
      const newAmount = parseFloat(goalResult.rows[0].current_amount) + parseFloat(amount);
      const completed = newAmount >= parseFloat(goalResult.rows[0].target_amount);
      
      await client.query(
        `UPDATE goals SET current_amount = $1, completed = $2, completed_at = $3 WHERE id = $4 AND user_id = $5`,
        [newAmount, completed, completed ? new Date() : null, id, userId]
      );
      
      const result = await client.query('SELECT * FROM goals WHERE id = $1', [id]);
      return result.rows[0] || null;
    });
  }

  static async getStats(userId) {
    const rows = await query(
      `SELECT 
        COUNT(*) as total_goals,
        SUM(CASE WHEN completed = true THEN 1 ELSE 0 END) as completed_goals,
        COALESCE(SUM(CASE WHEN type = 'savings' AND completed = false THEN target_amount - current_amount END), 0) as remaining_savings,
        COALESCE(SUM(CASE WHEN type = 'debt' AND completed = false THEN target_amount - current_amount END), 0) as remaining_debt
       FROM goals 
       WHERE user_id = $1`,
      [userId]
    );
    
    return rows[0];
  }

  static async getUpcomingDeadlines(userId, days = 30) {
    const daysInt = parseInt(days);
    const rows = await query(
      `SELECT *
       FROM goals 
       WHERE user_id = $1 
         AND completed = false 
         AND deadline IS NOT NULL
         AND deadline <= CURRENT_DATE + INTERVAL '${daysInt} days'
       ORDER BY deadline ASC`,
      [userId]
    );
    
    return rows;
  }
}

module.exports = Goal;
