const bcrypt = require('bcrypt');
const { query, transaction } = require('../config/database');

const SALT_ROUNDS = 12;

class User {
  static async create({ email, password, firstName, lastName, consentGiven, dataRetentionAgreement }) {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    
    const rows = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, privacy_consent, consent_date)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       RETURNING id, email, first_name, last_name, currency, privacy_consent as consent_given, created_at`,
      [email, passwordHash, firstName, lastName, consentGiven]
    );
    
    return rows[0];
  }

  static async findByEmail(email) {
    const rows = await query(
      `SELECT id, email, password_hash, first_name, last_name, currency,
              privacy_consent AS consent_given, consent_date, created_at, updated_at, last_login
       FROM users WHERE email = $1`,
      [email]
    );
    return rows[0] || null;
  }

  static async findById(id) {
    const rows = await query(
      `SELECT id, email, first_name, last_name, currency, privacy_consent as consent_given, created_at, updated_at, last_login
       FROM users WHERE id = $1`,
      [id]
    );
    return rows[0] || null;
  }

  static async validatePassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static async updateLastLogin(userId) {
    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
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
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (fieldMapping[key]) {
        fields.push(`${fieldMapping[key]} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(userId);
    
    await query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
      values
    );
    
    // Fetch the updated user
    const rows = await query(
      `SELECT id, email, first_name, last_name, currency, privacy_consent as consent_given, created_at, updated_at FROM users WHERE id = $1`,
      [userId]
    );
    
    return rows[0] || null;
  }

  static async updatePassword(userId, newPassword) {
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, userId]
    );
  }

  static async getAllUserData(userId) {
    return transaction(async (client) => {
      const userRows = await client.query(
        `SELECT id, email, first_name, last_name, currency, privacy_consent as consent_given, consent_date, 
                created_at, updated_at, last_login
         FROM users WHERE id = $1`,
        [userId]
      );

      const incomeRows = await client.query(
        'SELECT * FROM income WHERE user_id = $1 ORDER BY date DESC',
        [userId]
      );

      const expenseRows = await client.query(
        'SELECT * FROM expenses WHERE user_id = $1 ORDER BY date DESC',
        [userId]
      );

      const goalRows = await client.query(
        'SELECT * FROM goals WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );

      const budgetRows = await client.query(
        'SELECT * FROM budgets WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );

      const categoryRows = await client.query(
        'SELECT * FROM categories WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );

      const notificationRows = await client.query(
        'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
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
      await client.query('DELETE FROM notifications WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM budgets WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM goals WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM income WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM expenses WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM categories WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM users WHERE id = $1', [userId]);
      
      return true;
    });
  }
}

module.exports = User;
