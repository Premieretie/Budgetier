/**
 * Basiq Integration Service
 * Handles Open Banking connections, user management, and transaction syncing
 */

const axios = require('axios');
const { query, transaction } = require('../config/database');

// Basiq API configuration
const BASIQ_API_URL = process.env.BASIQ_API_URL || 'https://au-api.basiq.io';
const BASIQ_API_KEY = process.env.BASIQ_API_KEY;

class BasiqService {
  constructor() {
    if (!BASIQ_API_KEY) {
      console.warn('⚠️ BASIQ_API_KEY not set. Basiq integration will not work.');
    }
    this.apiUrl = BASIQ_API_URL;
    this.apiKey = BASIQ_API_KEY;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Check if Basiq is properly configured
   */
  isConfigured() {
    return !!BASIQ_API_KEY;
  }

  // ============================================
  // AUTHENTICATION
  // ============================================

  /**
   * Get or refresh Basiq access token
   * Tokens expire after 60 minutes
   * Basiq requires: Authorization: Basic base64(API_KEY:)
   */
  async getAccessToken() {
    // Return cached token if still valid (with 5 min buffer)
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry - 300000) {
      return this.accessToken;
    }

    if (!this.apiKey) {
      throw new Error('BASIQ_API_KEY not configured');
    }

    try {
      // Basiq API key is already base64 encoded (key:secret format)
      // Use it directly in the Authorization header
      const response = await axios.post(
        `${this.apiUrl}/token`,
        {},
        {
          headers: {
            'Authorization': `Basic ${this.apiKey}`,
            'Content-Type': 'application/json',
            'basiq-version': '3.0',
          },
        }
      );

      this.accessToken = response.data.access_token;
      // Token expires in 3600 seconds (1 hour)
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
      
      console.log('✅ Basiq access token obtained');
      console.log('🔑 Token preview:', this.accessToken?.substring(0, 15) + '...');
      console.log('⏱️  Expires in:', response.data.expires_in, 'seconds');
      return this.accessToken;
    } catch (error) {
      console.error('❌ Failed to get Basiq access token:', error.response?.data || error.message);
      throw new Error('Basiq authentication failed');
    }
  }

  /**
   * Get headers for Basiq API calls
   */
  async getHeaders() {
    const token = await this.getAccessToken();
    if (!token) {
      throw new Error('Failed to obtain Basiq access token');
    }
    // Log token length for debugging (never log full token)
    console.log(`🔑 Using Basiq token (length: ${token.length})`);
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'basiq-version': '3.0',
    };
  }

  // ============================================
  // USER MANAGEMENT
  // ============================================

  /**
   * Create a Basiq user for a Budgetier user
   * One-to-one mapping
   */
  async createBasiqUser(userId, email, mobile = null) {
    try {
      const headers = await this.getHeaders();
      console.log('📤 Creating Basiq user with headers:', { 
        auth: headers.Authorization?.substring(0, 20) + '...',
        version: headers['basiq-version']
      });
      
      const payload = {
        email: email,
        mobile: mobile || undefined,
      };

      const response = await axios.post(
        `${this.apiUrl}/users`,
        payload,
        { headers }
      );

      const basiqUserId = response.data.id;

      // Store the mapping in our database
      await query(
        `INSERT INTO bank_connections (user_id, basiq_user_id, status, created_at)
         VALUES ($1, $2, 'user_created', CURRENT_TIMESTAMP)
         ON CONFLICT (user_id) DO UPDATE SET
           basiq_user_id = $2,
           status = 'user_created',
           updated_at = CURRENT_TIMESTAMP`,
        [userId, basiqUserId]
      );

      return {
        success: true,
        basiqUserId,
        data: response.data,
      };
    } catch (error) {
      console.error('Failed to create Basiq user:', error.response?.data || error.message);
      throw new Error('Failed to create Basiq user');
    }
  }

  /**
   * Get or create Basiq user for Budgetier user
   */
  async getOrCreateBasiqUser(userId, email, mobile = null) {
    // Check if we already have a Basiq user
    const existing = await query(
      'SELECT basiq_user_id FROM bank_connections WHERE user_id = $1',
      [userId]
    );

    if (existing.length > 0 && existing[0].basiq_user_id) {
      // Verify the user still exists in Basiq
      try {
        const headers = await this.getHeaders();
        const response = await axios.get(
          `${this.apiUrl}/users/${existing[0].basiq_user_id}`,
          { headers }
        );
        return {
          success: true,
          basiqUserId: existing[0].basiq_user_id,
          data: response.data,
        };
      } catch (error) {
        // User might have been deleted, create new one
        if (error.response?.status === 404) {
          return this.createBasiqUser(userId, email, mobile);
        }
        throw error;
      }
    }

    return this.createBasiqUser(userId, email, mobile);
  }

  // ============================================
  // BANK CONNECTION
  // ============================================

  /**
   * Create a Basiq Connect link (URL for user to connect their bank)
   */
  async createConnectLink(userId, email, redirectUrl, mobile) {
    try {
      // First ensure we have a Basiq user
      const userResult = await this.getOrCreateBasiqUser(userId, email);
      const basiqUserId = userResult.basiqUserId;

      const headers = await this.getHeaders();

      // Basiq requires a mobile number on the user or in the auth link
      // Update user with mobile if provided
      if (mobile) {
        try {
          await axios.post(
            `${this.apiUrl}/users/${basiqUserId}`,
            { mobile },
            { headers }
          );
          console.log('✅ Updated Basiq user with mobile');
        } catch (mobileError) {
          console.warn('⚠️ Failed to update mobile (continuing):', mobileError.message);
        }
      }

      const payload = {
        scope: 'server.scope',
        userId: basiqUserId,
        redirect: redirectUrl,
      };

      const response = await axios.post(
        `${this.apiUrl}/users/${basiqUserId}/auth_link`,
        payload,
        { headers }
      );

      // Update connection status
      await query(
        `UPDATE bank_connections 
         SET connect_link_url = $1,
             connect_link_expiry = $2,
             status = 'link_created',
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $3`,
        [response.data.links.self, response.data.expiry, userId]
      );

      return {
        success: true,
        connectUrl: response.data.links.self,
        expiry: response.data.expiry,
      };
    } catch (error) {
      console.error('Failed to create connect link:', error.response?.data || error.message);
      throw new Error('Failed to create bank connection link');
    }
  }

  /**
   * Get all connections (bank accounts) for a user
   */
  async getUserConnections(userId) {
    try {
      const userRecord = await query(
        'SELECT basiq_user_id FROM bank_connections WHERE user_id = $1',
        [userId]
      );

      if (userRecord.length === 0 || !userRecord[0].basiq_user_id) {
        return { success: true, connections: [] };
      }

      const basiqUserId = userRecord[0].basiq_user_id;
      const headers = await this.getHeaders();

      const response = await axios.get(
        `${this.apiUrl}/users/${basiqUserId}/connections`,
        { headers }
      );

      const connections = response.data.data || [];

      // Update local connection records
      for (const conn of connections) {
        await query(
          `INSERT INTO bank_connections (
            user_id, basiq_user_id, basiq_connection_id, institution_id,
            institution_name, account_name, status, last_synced
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
          ON CONFLICT (basiq_connection_id) DO UPDATE SET
            institution_id = $4,
            institution_name = $5,
            account_name = $6,
            status = $7,
            updated_at = CURRENT_TIMESTAMP`,
          [
            userId,
            basiqUserId,
            conn.id,
            conn.institution?.id || null,
            conn.institution?.name || null,
            conn.accounts?.[0]?.name || 'Connected Account',
            conn.status,
          ]
        );
      }

      return {
        success: true,
        connections: connections.map(c => ({
          id: c.id,
          status: c.status,
          institution: c.institution,
          accounts: c.accounts || [],
        })),
      };
    } catch (error) {
      console.error('Failed to get user connections:', error.response?.data || error.message);
      throw new Error('Failed to fetch bank connections');
    }
  }

  /**
   * Handle Basiq Connect callback - validate connection success
   */
  async handleConnectCallback(userId, connectionId) {
    try {
      // Get connection details from Basiq
      const headers = await this.getHeaders();
      const response = await axios.get(
        `${this.apiUrl}/connections/${connectionId}`,
        { headers }
      );

      const connection = response.data;

      if (connection.status === 'active') {
        // Update our records
        await query(
          `UPDATE bank_connections
           SET basiq_connection_id = $1,
               institution_id = $2,
               institution_name = $3,
               account_name = $4,
               status = 'connected',
               connected_at = CURRENT_TIMESTAMP,
               updated_at = CURRENT_TIMESTAMP
           WHERE user_id = $5`,
          [
            connectionId,
            connection.institution?.id || null,
            connection.institution?.name || null,
            connection.accounts?.[0]?.name || 'Connected Account',
            userId,
          ]
        );

        // Trigger initial sync
        await this.syncTransactions(userId, connectionId);

        return {
          success: true,
          status: 'connected',
          institution: connection.institution,
        };
      } else {
        await query(
          `UPDATE bank_connections
           SET status = $1,
               updated_at = CURRENT_TIMESTAMP
           WHERE user_id = $2`,
          [connection.status, userId]
        );

        return {
          success: false,
          status: connection.status,
          message: `Connection status: ${connection.status}`,
        };
      }
    } catch (error) {
      console.error('Failed to handle connect callback:', error.response?.data || error.message);
      throw new Error('Failed to validate bank connection');
    }
  }

  /**
   * Disconnect a bank connection
   */
  async disconnectConnection(userId, connectionId) {
    try {
      const headers = await this.getHeaders();
      await axios.delete(
        `${this.apiUrl}/connections/${connectionId}`,
        { headers }
      );

      // Update our records
      await query(
        `UPDATE bank_connections
         SET status = 'disconnected',
             basiq_connection_id = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $1 AND basiq_connection_id = $2`,
        [userId, connectionId]
      );

      return { success: true, message: 'Bank connection removed' };
    } catch (error) {
      console.error('Failed to disconnect:', error.response?.data || error.message);
      throw new Error('Failed to disconnect bank');
    }
  }

  // ============================================
  // TRANSACTIONS
  // ============================================

  /**
   * Fetch transactions from Basiq
   */
  async fetchTransactions(userId, connectionId, options = {}) {
    try {
      const { since, limit = 100, accountId } = options;

      const headers = await this.getHeaders();
      
      let url = `${this.apiUrl}/users/${await this.getBasiqUserId(userId)}/transactions`;
      const params = new URLSearchParams();
      
      if (since) params.append('filter', `transactionDate>'${since}'`);
      if (limit) params.append('limit', limit.toString());
      if (accountId) params.append('account', accountId);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await axios.get(url, { headers });

      return {
        success: true,
        transactions: response.data.data || [],
        links: response.data.links,
      };
    } catch (error) {
      console.error('Failed to fetch transactions:', error.response?.data || error.message);
      throw new Error('Failed to fetch transactions');
    }
  }

  /**
   * Get Basiq user ID for a Budgetier user
   */
  async getBasiqUserId(userId) {
    const result = await query(
      'SELECT basiq_user_id FROM bank_connections WHERE user_id = $1',
      [userId]
    );

    if (result.length === 0 || !result[0].basiq_user_id) {
      throw new Error('No Basiq user found for this user');
    }

    return result[0].basiq_user_id;
  }

  /**
   * Sync transactions for a user - main entry point for scheduled syncs
   */
  async syncTransactions(userId, specificConnectionId = null) {
    try {
      // Get connection(s) to sync
      let connectionsQuery = 
        'SELECT * FROM bank_connections WHERE user_id = $1 AND status = $2';
      let params = [userId, 'connected'];

      if (specificConnectionId) {
        connectionsQuery += ' AND basiq_connection_id = $3';
        params.push(specificConnectionId);
      }

      const connections = await query(connectionsQuery, params);

      if (connections.length === 0) {
        return { success: true, imported: 0, message: 'No active bank connections' };
      }

      let totalImported = 0;
      const results = [];

      for (const conn of connections) {
        // Get last sync time for incremental sync
        const lastSync = conn.last_synced || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(); // Default 90 days back

        const txResult = await this.fetchTransactions(userId, conn.basiq_connection_id, {
          since: lastSync,
          limit: 500,
        });

        const imported = await this.importTransactions(userId, txResult.transactions);
        totalImported += imported.count;

        // Update last synced time
        await query(
          'UPDATE bank_connections SET last_synced = CURRENT_TIMESTAMP WHERE id = $1',
          [conn.id]
        );

        results.push({
          connectionId: conn.basiq_connection_id,
          institution: conn.institution_name,
          imported: imported.count,
          newTransactions: imported.transactions,
        });
      }

      return {
        success: true,
        imported: totalImported,
        connections: results,
      };
    } catch (error) {
      console.error('Failed to sync transactions:', error);
      throw error;
    }
  }

  /**
   * Import transactions into Budgetier
   * Converts Basiq transactions to Budgetier expenses/income
   */
  async importTransactions(userId, transactions) {
    const imported = [];
    let count = 0;

    for (const tx of transactions) {
      try {
        // Skip if already imported (using Basiq transaction ID)
        const existing = await query(
          'SELECT id FROM basiq_transactions WHERE basiq_transaction_id = $1',
          [tx.id]
        );

        if (existing.length > 0) {
          continue; // Already imported
        }

        // Store raw Basiq transaction
        await query(
          `INSERT INTO basiq_transactions (
            user_id, basiq_transaction_id, account_id, connection_id,
            amount, currency, description, direction, status,
            transaction_date, transaction_type, category, 
            institution_name, merchant_name, raw_data
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          ON CONFLICT (basiq_transaction_id) DO NOTHING`,
          [
            userId,
            tx.id,
            tx.account,
            tx.connection,
            Math.abs(parseFloat(tx.amount)),
            tx.currency || 'AUD',
            tx.description || tx.descriptionLong || 'Unknown',
            tx.direction, // 'credit' or 'debit'
            tx.status,
            tx.transactionDate,
            tx.type || 'transaction',
            tx.category?.code || tx.category?.title || 'uncategorized',
            tx.institution || null,
            tx.merchant?.businessName || null,
            JSON.stringify(tx),
          ]
        );

        // Convert to Budgetier expense or income
        if (tx.direction === 'debit') {
          // Expense (money going out)
          const expenseResult = await query(
            `INSERT INTO expenses (
              user_id, amount, category, date, description, 
              recurring, basiq_transaction_id, source
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *`,
            [
              userId,
              Math.abs(parseFloat(tx.amount)),
              this.mapCategory(tx.category),
              tx.transactionDate,
              tx.description || 'Bank Transaction',
              false,
              tx.id,
              'basiq',
            ]
          );

          imported.push({
            type: 'expense',
            id: expenseResult[0].id,
            amount: Math.abs(parseFloat(tx.amount)),
            description: tx.description,
          });
        } else if (tx.direction === 'credit') {
          // Income (money coming in)
          const incomeResult = await query(
            `INSERT INTO income (
              user_id, amount, source, date, description,
              recurring, basiq_transaction_id, source_type
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *`,
            [
              userId,
              Math.abs(parseFloat(tx.amount)),
              tx.merchant?.businessName || tx.institution || 'Bank Transfer',
              tx.transactionDate,
              tx.description || 'Bank Transaction',
              false,
              tx.id,
              'basiq',
            ]
          );

          imported.push({
            type: 'income',
            id: incomeResult[0].id,
            amount: Math.abs(parseFloat(tx.amount)),
            description: tx.description,
          });
        }

        count++;
      } catch (error) {
        console.error(`Failed to import transaction ${tx.id}:`, error.message);
        // Continue with other transactions
      }
    }

    return { count, transactions: imported };
  }

  /**
   * Map Basiq category to Budgetier category
   */
  mapCategory(basiqCategory) {
    if (!basiqCategory) return 'Uncategorized';

    const categoryMap = {
      'restaurants': 'Food & Dining',
      'groceries': 'Food & Dining',
      'food': 'Food & Dining',
      'transport': 'Transportation',
      'fuel': 'Transportation',
      'taxi': 'Transportation',
      'rent': 'Housing',
      'mortgage': 'Housing',
      'utilities': 'Utilities',
      'electricity': 'Utilities',
      'gas': 'Utilities',
      'water': 'Utilities',
      'entertainment': 'Entertainment',
      'shopping': 'Shopping',
      'clothing': 'Shopping',
      'health': 'Health',
      'medical': 'Health',
      'education': 'Education',
      'salary': 'Salary',
      'transfer': 'Transfer',
      'cash': 'Cash',
    };

    const code = basiqCategory.code?.toLowerCase() || '';
    const title = basiqCategory.title?.toLowerCase() || '';

    for (const [key, value] of Object.entries(categoryMap)) {
      if (code.includes(key) || title.includes(key)) {
        return value;
      }
    }

    return 'Uncategorized';
  }

  // ============================================
  // USER CONNECTION STATUS
  // ============================================

  /**
   * Get bank connection status for a user
   */
  async getConnectionStatus(userId) {
    const result = await query(
      `SELECT 
        basiq_user_id,
        basiq_connection_id,
        institution_name,
        account_name,
        status,
        connected_at,
        last_synced,
        error_message
       FROM bank_connections
       WHERE user_id = $1
       ORDER BY connected_at DESC
       LIMIT 1`,
      [userId]
    );

    if (result.length === 0) {
      return {
        isConnected: false,
        status: 'not_connected',
        message: 'No bank connection found',
      };
    }

    const conn = result[0];

    return {
      isConnected: conn.status === 'connected',
      status: conn.status,
      institution: conn.institution_name,
      accountName: conn.account_name,
      connectedAt: conn.connected_at,
      lastSynced: conn.last_synced,
      errorMessage: conn.error_message,
    };
  }

  /**
   * Get recently imported transactions for display
   */
  async getRecentImportedTransactions(userId, limit = 20) {
    const result = await query(
      `SELECT 
        bt.*,
        CASE 
          WHEN bt.direction = 'debit' THEN 'expense'
          WHEN bt.direction = 'credit' THEN 'income'
          ELSE 'unknown'
        END as import_type,
        e.id as expense_id,
        i.id as income_id
       FROM basiq_transactions bt
       LEFT JOIN expenses e ON e.basiq_transaction_id = bt.basiq_transaction_id
       LEFT JOIN income i ON i.basiq_transaction_id = bt.basiq_transaction_id
       WHERE bt.user_id = $1
       ORDER BY bt.transaction_date DESC
       LIMIT $2`,
      [userId, limit]
    );

    return result;
  }
}

module.exports = new BasiqService();
