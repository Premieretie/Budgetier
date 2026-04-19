const { Pool } = require('pg');

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable is not set');
  console.error('Please set DATABASE_URL to your PostgreSQL connection string');
  process.exit(1);
}

// Parse connection URL to determine if SSL is needed
const isExternalHost = () => {
  const url = process.env.DATABASE_URL || '';
  // External connections typically have these patterns
  return url.includes('.render.com') || 
         url.includes('amazonaws.com') || 
         url.includes('neon.tech') ||
         url.includes('supabase.co') ||
         url.includes('ondigitalocean.com');
};

// Create pool with appropriate SSL settings
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  // Only use SSL for external connections
  ssl: isExternalHost() ? { rejectUnauthorized: false } : false,
  // Connection pool settings
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 5000, // Return error after 5 seconds if connection not established
};

const pool = new Pool(poolConfig);

// Handle pool errors (don't crash the app)
pool.on('error', (err, client) => {
  console.error('Unexpected database pool error:', err);
});

// Test database connection with retries
async function testConnection(retries = 3, delay = 3000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT NOW() as now');
      client.release();
      console.log(`✅ Database connected successfully (attempt ${attempt}/${retries})`);
      console.log(`   Server time: ${result.rows[0].now}`);
      return true;
    } catch (err) {
      console.error(`❌ Database connection attempt ${attempt} failed:`, err.message);
      if (attempt === retries) {
        console.error('   All connection attempts failed. Please check:');
        console.error('   - DATABASE_URL is correct');
        console.error('   - Database server is running');
        console.error('   - Network allows connection');
        return false;
      }
      console.log(`   Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return false;
}

// Initialize database - creates tables if they don't exist
async function initDb() {
  // First test the connection
  const connected = await testConnection();
  if (!connected) {
    console.error('⚠️  Continuing without database initialization. Tables may not exist.');
    return;
  }

  const client = await pool.connect();

  try {
    // Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        currency VARCHAR(10) DEFAULT 'AUD',
        privacy_consent BOOLEAN DEFAULT FALSE,
        consent_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      )
    `);

    // Income Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS income (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        source VARCHAR(100),
        date DATE NOT NULL,
        description TEXT,
        recurring BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Categories Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        user_id INT,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
        color VARCHAR(7) DEFAULT '#3B82F6',
        icon VARCHAR(50) DEFAULT 'briefcase',
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT unique_category UNIQUE (user_id, name, type)
      )
    `);

    // Expenses Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        category VARCHAR(100),
        date DATE NOT NULL,
        description TEXT,
        recurring BOOLEAN DEFAULT FALSE,
        recurring_frequency VARCHAR(20) DEFAULT 'monthly',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Goals Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS goals (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('savings', 'debt')),
        target_amount DECIMAL(12, 2) NOT NULL,
        current_amount DECIMAL(12, 2) DEFAULT 0,
        deadline DATE,
        description TEXT,
        completed BOOLEAN DEFAULT FALSE,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Budgets Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS budgets (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        period VARCHAR(20) NOT NULL CHECK (period IN ('weekly', 'monthly', 'yearly')),
        category_id INT,
        start_date DATE NOT NULL,
        end_date DATE,
        alert_threshold INT DEFAULT 80,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE SET NULL
      )
    `);

    // Notifications Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        is_read BOOLEAN DEFAULT FALSE,
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Insert default categories
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
      await client.query(
        `INSERT INTO categories (name, type, color, icon, is_default)
         VALUES ($1, $2, $3, $4, TRUE)
         ON CONFLICT (user_id, name, type) DO NOTHING`,
        cat
      );
    }

    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err);
  } finally {
    client.release();
  }
}

// Initialize on module load (non-blocking)
initDb().catch(err => {
  console.error('Database initialization failed:', err);
  // Don't exit - let the app start anyway, endpoints will handle DB errors
});

// Query helper - PostgreSQL uses $1, $2 instead of ?
const query = async (text, params) => {
  const result = await pool.query(text, params);
  return result.rows;
};

// Transaction helper
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  query,
  transaction,
};
