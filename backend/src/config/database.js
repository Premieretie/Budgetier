const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'budgeter',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Initialize database - creates tables if they don't exist
async function initDb() {
  // Create a separate connection to check/create database first
  const setupConnection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
  });

  try {
    await setupConnection.query(
      `CREATE DATABASE IF NOT EXISTS ${process.env.MYSQL_DATABASE || 'budgeter'}`
    );
    await setupConnection.end();

    const connection = await pool.getConnection();

    // Users Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        currency VARCHAR(10) DEFAULT 'AUD',
        privacy_consent BOOLEAN DEFAULT FALSE,
        consent_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      )
    `);

    // Income Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS income (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        source VARCHAR(100),
        date DATE NOT NULL,
        description TEXT,
        recurring BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Categories Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        name VARCHAR(100) NOT NULL,
        type ENUM('income', 'expense') NOT NULL,
        color VARCHAR(7) DEFAULT '#3B82F6',
        icon VARCHAR(50) DEFAULT 'briefcase',
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_category (user_id, name, type)
      )
    `);

    // Expenses Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        category VARCHAR(100),
        date DATE NOT NULL,
        description TEXT,
        recurring BOOLEAN DEFAULT FALSE,
        recurring_frequency VARCHAR(20) DEFAULT 'monthly',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Goals Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS goals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        type ENUM('savings', 'debt') NOT NULL,
        target_amount DECIMAL(12, 2) NOT NULL,
        current_amount DECIMAL(12, 2) DEFAULT 0,
        deadline DATE,
        description TEXT,
        completed BOOLEAN DEFAULT FALSE,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Budgets Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS budgets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        period ENUM('weekly', 'monthly', 'yearly') NOT NULL,
        category_id INT,
        start_date DATE NOT NULL,
        end_date DATE,
        alert_threshold INT DEFAULT 80,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE SET NULL
      )
    `);

    // Notifications Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        is_read BOOLEAN DEFAULT FALSE,
        data JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Insert default categories for new users
    // Fix icon column size if table exists with old schema
    try {
      await connection.query(`ALTER TABLE categories MODIFY icon VARCHAR(50) DEFAULT 'briefcase'`);
    } catch (e) {
      // Ignore if column already correct size or table doesn't exist
    }

    // Add consent_given column to users if missing
    try {
      await connection.query(`ALTER TABLE users ADD COLUMN consent_given BOOLEAN DEFAULT FALSE`);
    } catch (e) {
      // Ignore if column already exists
    }

    // Add recurring_frequency column to expenses if missing
    try {
      await connection.query(`ALTER TABLE expenses ADD COLUMN recurring_frequency VARCHAR(20) DEFAULT 'monthly'`);
    } catch (e) {
      // Ignore if column already exists
    }

    const defaultCategories = [
      ['Food & Dining', 'expense', '#EF4444', '🍔'],
      ['Transportation', 'expense', '#3B82F6', '🚗'],
      ['Housing', 'expense', '#8B5CF6', '🏠'],
      ['Utilities', 'expense', '#F59E0B', '⚡'],
      ['Entertainment', 'expense', '#EC4899', '🎬'],
      ['Shopping', 'expense', '#10B981', '🛍️'],
      ['Health', 'expense', '#DC2626', '🏥'],
      ['Education', 'expense', '#6366F1', '📚'],
      ['Salary', 'income', '#10B981', '💼'],
      ['Freelance', 'income', '#3B82F6', '💻'],
      ['Investments', 'income', '#8B5CF6', '📈'],
      ['Gifts', 'income', '#EC4899', '🎁'],
    ];

    for (const cat of defaultCategories) {
      try {
        await connection.query(
          `INSERT INTO categories (name, type, color, icon, is_default) VALUES (?, ?, ?, ?, TRUE)
           ON DUPLICATE KEY UPDATE name=name`,
          cat
        );
      } catch (e) {
        // Ignore duplicate errors
      }
    }

    console.log('Database initialized successfully');
    connection.release();
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}

// Initialize on require
initDb();

const query = (text, params) => pool.execute(text, params);

const transaction = async (callback) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  pool,
  query,
  transaction,
};
