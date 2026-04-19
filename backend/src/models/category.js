const { query } = require('../config/database');

const DEFAULT_CATEGORIES = {
  income: [
    { name: 'Salary', color: '#10B981', icon: 'briefcase' },
    { name: 'Freelance', color: '#3B82F6', icon: 'laptop' },
    { name: 'Investments', color: '#8B5CF6', icon: 'trending-up' },
    { name: 'Gifts', color: '#F59E0B', icon: 'gift' },
    { name: 'Other Income', color: '#6B7280', icon: 'dollar-sign' },
  ],
  expense: [
    { name: 'Housing', color: '#EF4444', icon: 'home' },
    { name: 'Food', color: '#F59E0B', icon: 'utensils' },
    { name: 'Transportation', color: '#3B82F6', icon: 'car' },
    { name: 'Utilities', color: '#6366F1', icon: 'zap' },
    { name: 'Healthcare', color: '#EC4899', icon: 'heart' },
    { name: 'Entertainment', color: '#8B5CF6', icon: 'film' },
    { name: 'Shopping', color: '#10B981', icon: 'shopping-bag' },
    { name: 'Education', color: '#14B8A6', icon: 'book' },
    { name: 'Debt Payments', color: '#DC2626', icon: 'credit-card' },
    { name: 'Savings', color: '#059669', icon: 'piggy-bank' },
    { name: 'Other', color: '#6B7280', icon: 'more-horizontal' },
  ]
};

class Category {
  static async create({ userId, name, type, color = '#3B82F6', icon }) {
    const [result] = await query(
      `INSERT INTO categories (user_id, name, type, color, icon)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, name, type, color, icon]
    );
    
    const [rows] = await query('SELECT * FROM categories WHERE id = ?', [result.insertId]);
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await query('SELECT * FROM categories WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async findByUserId(userId, options = {}) {
    const { type, limit = 100 } = options;
    
    let queryText = 'SELECT * FROM categories WHERE user_id = ?';
    const values = [userId];

    if (type) {
      queryText += ' AND type = ?';
      values.push(type);
    }

    queryText += ' ORDER BY name ASC LIMIT ?';
    values.push(parseInt(limit));

    const [rows] = await query(queryText, values);
    return rows;
  }

  static async update(id, userId, updates) {
    const allowedFields = ['name', 'color', 'icon'];
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
      `UPDATE categories SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );
    
    const [rows] = await query('SELECT * FROM categories WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async delete(id, userId) {
    const [result] = await query(
      'DELETE FROM categories WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0 ? { id } : null;
  }

  static async createDefaultCategories(userId) {
    const categories = [];
    
    for (const [type, items] of Object.entries(DEFAULT_CATEGORIES)) {
      for (const item of items) {
        const category = await this.create({
          userId,
          name: item.name,
          type,
          color: item.color,
          icon: item.icon,
        });
        categories.push(category);
      }
    }
    
    return categories;
  }

  static async getExpenseCategoriesWithTotals(userId, startDate, endDate) {
    let queryText = `
      SELECT 
        c.*,
        COALESCE(SUM(e.amount), 0) as total
      FROM categories c
      LEFT JOIN expenses e ON c.name = e.category 
        AND e.user_id = c.user_id
      WHERE c.user_id = ? AND c.type = 'expense'
    `;
    const values = [userId];

    if (startDate) {
      queryText += ' AND e.date >= ?';
      values.push(startDate);
    }

    if (endDate) {
      queryText += ' AND e.date <= ?';
      values.push(endDate);
    }

    queryText += ' GROUP BY c.id ORDER BY total DESC';

    const [rows] = await query(queryText, values);
    return rows;
  }
}

module.exports = { Category, DEFAULT_CATEGORIES };
