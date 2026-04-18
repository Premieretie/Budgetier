const bcrypt = require('bcrypt');
const { query, transaction } = require('../config/database');

const SALT_ROUNDS = 12;

class User {
  static async create({ email, password, firstName, lastName, consentGiven, dataRetentionAgreement }) {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    
    const [result] = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, privacy_consent, consent_date)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [email, passwordHash, firstName, lastName, consentGiven]
    );
    
    // Fetch the created user
    const [userRows] = await query(
      'SELECT id, email, first_name, last_name, currency, privacy_consent as consent_given, created_at FROM users WHERE id = ?',
      [result.insertId]
    );
    
    return userRows[0];
  }

  static async findByEmail(email) {
    const [rows] = await query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0] || null;
  }

  static async findById(id) {
    const [rows] = await query(
      `SELECT id, email, first_name, last_name, currency, privacy_consent as consent_given, created_at, updated_at, last_login
       FROM users WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async validatePassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static async updateLastLogin(userId) {
    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [userId]
    );
  }

  static async update(userId, updates) {
    const fieldMapping = {
      'first_name': 'first_name',
      'last_name': 'last_name',
      'currency': 'currency',
      'consent_given': 'privacy_consent',
      'privacy_consent': 'privacy_consent',
      'data_retention_agreement': 'data_retention_agreement',
      'consent_date': 'consent_date',
    };
    
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (fieldMapping[key]) {
        fields.push(`${fieldMapping[key]} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(userId);
    
    await query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    
    // Fetch the updated user
    const [rows] = await query(
      `SELECT id, email, first_name, last_name, currency, privacy_consent as consent_given, created_at, updated_at FROM users WHERE id = ?`,
      [userId]
    );
    
    return rows[0] || null;
  }

  static async updatePassword(userId, newPassword) {
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await query(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [passwordHash, userId]
    );
  }

  static async getAllUserData(userId) {
    return transaction(async (client) => {
      const [userRows] = await client.execute(
        `SELECT id, email, first_name, last_name, currency, privacy_consent as consent_given, consent_date, 
                created_at, updated_at, last_login
         FROM users WHERE id = ?`,
        [userId]
      );

      const [incomeRows] = await client.execute(
        'SELECT * FROM income WHERE user_id = ? ORDER BY date DESC',
        [userId]
      );

      const [expenseRows] = await client.execute(
        'SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC',
        [userId]
      );

      const [goalRows] = await client.execute(
        'SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
      );

      const [budgetRows] = await client.execute(
        'SELECT * FROM budgets WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
      );

      const [categoryRows] = await client.execute(
        'SELECT * FROM categories WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
      );

      const [notificationRows] = await client.execute(
        'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
      );

      return {
        user: userRows[0],
        income: incomeRows,
        expenses: expenseRows,
        goals: goalRows,
        budgets: budgetRows,
        categories: categoryRows,
        notifications: notificationRows,
      };
    });
  }

  static async deleteAllUserData(userId) {
    return transaction(async (client) => {
      await client.execute('DELETE FROM notifications WHERE user_id = ?', [userId]);
      await client.execute('DELETE FROM budgets WHERE user_id = ?', [userId]);
      await client.execute('DELETE FROM goals WHERE user_id = ?', [userId]);
      await client.execute('DELETE FROM income WHERE user_id = ?', [userId]);
      await client.execute('DELETE FROM expenses WHERE user_id = ?', [userId]);
      await client.execute('DELETE FROM categories WHERE user_id = ?', [userId]);
      await client.execute('DELETE FROM users WHERE id = ?', [userId]);
      
      return true;
    });
  }
}

module.exports = User;
