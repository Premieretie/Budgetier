const { query } = require('../config/database');

class Budget {
  static async create({ userId, name, amount, period, categoryId, startDate, endDate, alertThreshold = 80 }) {
    const rows = await query(
      `INSERT INTO budgets (user_id, name, amount, period, category_id, start_date, end_date, alert_threshold)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [userId, name, amount, period, categoryId, startDate, endDate, alertThreshold]
    );
    
    return rows[0];
  }

  static async findById(id) {
    const rows = await query(
      `SELECT b.*, c.name as category_name, c.color as category_color
       FROM budgets b
       LEFT JOIN categories c ON b.category_id = c.id
       WHERE b.id = $1`,
      [id]
    );
    return rows[0] || null;
  }

  static async findByUserId(userId, options = {}) {
    const { active, limit = 100, offset = 0 } = options;
    
    let queryText = `
      SELECT b.*, c.name as category_name, c.color as category_color
      FROM budgets b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.user_id = $1
    `;
    const values = [userId];
    let paramIndex = 1;

    if (active) {
      queryText += ' AND (b.end_date IS NULL OR b.end_date >= CURRENT_DATE)';
    }

    paramIndex++;
    queryText += ` ORDER BY b.created_at DESC LIMIT $${paramIndex}`;
    values.push(parseInt(limit));
    
    paramIndex++;
    queryText += ` OFFSET $${paramIndex}`;
    values.push(parseInt(offset));

    const rows = await query(queryText, values);
    return rows;
  }

  static async update(id, userId, updates) {
    const allowedFields = ['name', 'amount', 'period', 'category_id', 'start_date', 'end_date', 'alert_threshold'];
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
      `UPDATE budgets SET ${fields.join(', ')} WHERE id = $${paramIndex - 1} AND user_id = $${paramIndex}`,
      values
    );
    
    const rows = await query('SELECT * FROM budgets WHERE id = $1', [id]);
    return rows[0] || null;
  }

  static async delete(id, userId) {
    const result = await query(
      'DELETE FROM budgets WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    return result.length > 0 ? { id } : null;
  }

  static async getBudgetProgress(budgetId, userId) {
    const budgetRows = await query(
      'SELECT * FROM budgets WHERE id = $1 AND user_id = $2',
      [budgetId, userId]
    );

    if (budgetRows.length === 0) {
      return null;
    }

    const budget = budgetRows[0];

    let expenseQuery = `
      SELECT COALESCE(SUM(amount), 0) as spent
      FROM expenses 
      WHERE user_id = $1 AND date >= $2
    `;
    const expenseValues = [userId, budget.start_date];
    let paramIndex = 2;

    if (budget.end_date) {
      paramIndex++;
      expenseQuery += ` AND date <= $${paramIndex}`;
      expenseValues.push(budget.end_date);
    }

    if (budget.category_id) {
      const categoryRows = await query(
        'SELECT name FROM categories WHERE id = $1',
        [budget.category_id]
      );
      if (categoryRows.length > 0) {
        paramIndex++;
        expenseQuery += ` AND category = $${paramIndex}`;
        expenseValues.push(categoryRows[0].name);
      }
    }

    const expenseRows = await query(expenseQuery, expenseValues);
    const spent = parseFloat(expenseRows[0].spent);
    const remaining = budget.amount - spent;
    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
    const isOverBudget = spent > budget.amount;
    const alertTriggered = percentage >= budget.alert_threshold && !isOverBudget;

    return {
      budget,
      spent,
      remaining: Math.max(0, remaining),
      percentage: Math.min(100, percentage),
      isOverBudget,
      alertTriggered,
    };
  }

  static async getAllBudgetsProgress(userId) {
    const budgets = await this.findByUserId(userId, { active: true });
    
    const progressPromises = budgets.map(budget => 
      this.getBudgetProgress(budget.id, userId)
    );
    
    return Promise.all(progressPromises);
  }

  static async checkOverspending(userId) {
    const budgetsProgress = await this.getAllBudgetsProgress(userId);
    
    return budgetsProgress.filter(bp => bp.isOverBudget || bp.alertTriggered);
  }
}

module.exports = Budget;
