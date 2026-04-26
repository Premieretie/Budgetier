/**
 * Basiq Integration Service
 * Handles Open Banking connections, user management, and transaction syncing
 * 
 * ARCHITECTURE:
 * - Server Token: Used for creating users, admin operations
 * - User Token: Used for auth links, connections, transactions
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
    
    // Server-level token (for creating users, admin ops)
    this.serverToken = null;
    this.serverTokenExpiry = null;
  }

  /**
   * Check if Basiq is properly configured
   */
  isConfigured() {
    return !!BASIQ_API_KEY;
  }

  // ============================================
  // SERVER TOKEN MANAGEMENT
  // ============================================

  /**
   * Get or refresh SERVER token
   * Server token is used for: creating users, getting user info
   */
  async getServerToken() {
    // Return cached token if still valid (with 5 min buffer)
    if (this.serverToken && this.serverTokenExpiry && Date.now() < this.serverTokenExpiry - 300000) {
      console.log('🔑 Using cached SERVER token');
      return this.serverToken;
    }

    if (!this.apiKey) {
      throw new Error('BASIQ_API_KEY not configured');
    }

    try {
      console.log('🔄 Obtaining new SERVER token...');
      
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

      this.serverToken = response.data.access_token;
      this.serverTokenExpiry = Date.now() + (response.data.expires_in * 1000);
      
      console.log('✅ SERVER token obtained:', this.serverToken?.substring(0, 10) + '...');
      return this.serverToken;
    } catch (error) {
      console.error('❌ Failed to get SERVER token:', error.response?.data || error.message);
      throw new Error('Basiq server authentication failed');
    }
  }

  /**
   * Get headers with SERVER token
   */
  async getServerHeaders() {
    const token = await this.getServerToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'basiq-version': '3.0',
    };
  }

  // ============================================
  // USER TOKEN MANAGEMENT
  // ============================================

  /**
   * Generate USER token for a specific Basiq user
   * User token is used for: auth links, connections, transactions
   */
  async generateUserToken(basiqUserId) {
    if (!basiqUserId) {
      throw new Error('basiqUserId is required to generate user token');
    }

    try {
      console.log(`🔄 Generating USER token for Basiq user: ${basiqUserId?.substring(0, 8)}...`);
      
      // Get server token first
      const serverToken = await this.getServerToken();
      
      // Try using Bearer token (server token) for user token generation
      const response = await axios.post(
        `${this.apiUrl}/users/${basiqUserId}/token`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${serverToken}`,
            'Content-Type': 'application/json',
            'basiq-version': '3.0',
          },
        }
      );

      const userToken = response.data.access_token;
      console.log('✅ USER token generated:', userToken?.substring(0, 10) + '...');
      
      return userToken;
    } catch (error) {
      console.error('❌ Failed to generate USER token:', error.response?.data || error.message);
      
      // Check if this is an invalid-token error
      if (error.response?.data?.data?.[0]?.code === 'invalid-authorization-token') {
        console.error('🚨 Server token rejected, trying Basic auth fallback...');
        
        // Fallback to Basic auth
        try {
          const response = await axios.post(
            `${this.apiUrl}/users/${basiqUserId}/token`,
            {},
            {
              headers: {
                'Authorization': `Basic ${this.apiKey}`,
                'Content-Type': 'application/json',
                'basiq-version': '3.0',
              },
            }
          );
          
          const userToken = response.data.access_token;
          console.log('✅ USER token generated (Basic auth fallback):', userToken?.substring(0, 10) + '...');
          return userToken;
        } catch (fallbackError) {
          console.error('❌ Basic auth fallback also failed:', fallbackError.response?.data || fallbackError.message);
          throw new Error('Failed to generate user token with both methods');
        }
      }
      
      throw new Error('Failed to generate user token');
    }
  }

  /**
   * Get headers with USER token
   */
  async getUserHeaders(basiqUserId) {
    const userToken = await this.generateUserToken(basiqUserId);
    return {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json',
      'basiq-version': '3.0',
    };
  }

  // ============================================
  // USER MANAGEMENT
  // ============================================

  /**
   * Get or create Basiq user for a Budgetier user
   * If user was deleted in Basiq dashboard, creates a new one
   */
  async getOrCreateBasiqUser(userId, email, mobile = null) {
    try {
      // Check if user already has a Basiq user ID
      const existing = await query(
        'SELECT basiq_user_id FROM bank_connections WHERE user_id = $1',
        [userId]
      );

      if (existing.length > 0 && existing[0].basiq_user_id) {
        const existingBasiqId = existing[0].basiq_user_id;
        console.log(`🔍 Found existing Basiq user ID in DB: ${existingBasiqId?.substring(0, 8)}...`);
        
        // Verify the user still exists in Basiq
        try {
          const headers = await this.getServerHeaders();
          const response = await axios.get(
            `${this.apiUrl}/users/${existingBasiqId}`,
            { headers }
          );
          
          // User exists, return it
          console.log(`✅ Verified Basiq user exists: ${response.data.id?.substring(0, 8)}...`);
          return { 
            basiqUserId: existingBasiqId, 
            isNew: false 
          };
        } catch (verifyError) {
          if (verifyError.response?.status === 404) {
            console.log('⚠️ Basiq user not found (was deleted), creating new user...');
            // Continue to create new user below
          } else {
            throw verifyError;
          }
        }
      }

      // Create new Basiq user
      console.log('🆕 Creating new Basiq user...');
      
      const headers = await this.getServerHeaders();
      
      const payload = {
        email: email,
        mobile: mobile,
      };

      const response = await axios.post(
        `${this.apiUrl}/users`,
        payload,
        { headers }
      );

      const basiqUserId = response.data.id;
      console.log('✅ Basiq user created:', basiqUserId?.substring(0, 8) + '...');

      // Store in database
      await query(
        `INSERT INTO bank_connections (user_id, basiq_user_id, status, created_at, updated_at)
         VALUES ($1, $2, 'pending', NOW(), NOW())
         ON CONFLICT (user_id) 
         DO UPDATE SET basiq_user_id = $2, status = 'pending', updated_at = NOW()`,
        [userId, basiqUserId]
      );

      return { basiqUserId, isNew: true };
    } catch (error) {
      console.error('❌ Failed to create/get Basiq user:', error.response?.data || error.message);
      throw new Error('Failed to create Basiq user');
    }
  }

  /**
   * Generate CLIENT token bound to a specific Basiq user
   * Client token is used for the Consent UI (connect.basiq.io)
   */
  async generateClientToken(basiqUserId) {
    if (!basiqUserId) {
      throw new Error('basiqUserId is required to generate client token');
    }

    try {
      console.log(`🔄 Generating CLIENT token for Basiq user: ${basiqUserId?.substring(0, 8)}...`);
      
      // Client token endpoint uses Basic auth with API key
      const response = await axios.post(
        `${this.apiUrl}/token`,
        {},
        {
          headers: {
            'Authorization': `Basic ${this.apiKey}`,
            'Content-Type': 'application/json',
            'basiq-version': '3.0',
          },
          params: {
            userId: basiqUserId,
          },
        }
      );

      const clientToken = response.data.access_token;
      console.log('✅ CLIENT token generated:', clientToken?.substring(0, 10) + '...');
      
      return clientToken;
    } catch (error) {
      console.error('❌ Failed to generate CLIENT token:', error.response?.data || error.message);
      throw new Error('Failed to generate client token');
    }
  }

  // ============================================
  // CONNECT LINK CREATION (FIXED)
  // ============================================

  /**
   * Create a Basiq Connect link (URL for user to connect their bank)
   * Uses CLIENT token approach per Basiq docs:
   * https://consent.basiq.io/home?token={{client_token}}&action=connect
   */
  async createConnectLink(userId, email, redirectUrl, mobile) {
    try {
      console.log(`🚀 Creating connect link for user ${userId}`);
      
      // Step 1: Ensure Basiq user exists (uses SERVER token)
      const userResult = await this.getOrCreateBasiqUser(userId, email, mobile);
      const basiqUserId = userResult.basiqUserId;
      
      console.log(`📋 Budgetier user: ${userId} → Basiq user: ${basiqUserId?.substring(0, 8)}...`);

      // Step 2: Update user with mobile if provided (uses SERVER token)
      if (mobile) {
        try {
          const headers = await this.getServerHeaders();
          await axios.post(
            `${this.apiUrl}/users/${basiqUserId}`,
            { mobile },
            { headers }
          );
          console.log('✅ Updated Basiq user with mobile');
        } catch (mobileError) {
          console.warn('⚠️ Failed to update mobile (continuing):', 
            mobileError.response?.data?.data?.[0]?.detail || mobileError.message);
        }
      }

      // Step 3: Generate CLIENT token (bound to user) for consent UI
      console.log('� Generating CLIENT token for consent UI...');
      const clientToken = await this.generateClientToken(basiqUserId);
      
      // Step 4: Build consent.basiq.io URL with action=connect
      // Per Basiq docs: This opens the Connect flow directly
      const params = new URLSearchParams();
      params.append('token', clientToken);
      params.append('action', 'connect');
      if (redirectUrl) {
        params.append('redirect_uri', redirectUrl);
      }
      
      const connectLink = `https://consent.basiq.io/home?${params.toString()}`;
      console.log('✅ Connect link created:', connectLink?.substring(0, 60) + '...');

      return {
        success: true,
        connectLink,
        basiqUserId,
        expiresIn: 3600, // Client tokens typically valid for 1 hour
      };
    } catch (error) {
      console.error('❌ Create connect link error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.data?.[0]?.title || error.response?.data?.data?.[0]?.detail || 'Failed to create connect link');
    }
  }

  // ============================================
  // CONNECTION MANAGEMENT
  // ============================================

  /**
   * Get connection status for a user
   */
  async getConnectionStatus(userId) {
    try {
      const result = await query(
        `SELECT 
          status,
          basiq_user_id,
          basiq_connection_id,
          institution_name,
          account_name,
          last_synced,
          created_at
         FROM bank_connections
         WHERE user_id = $1`,
        [userId]
      );

      if (result.length === 0) {
        return { isConnected: false, status: 'not_connected' };
      }

      const conn = result[0];
      return {
        isConnected: conn.status === 'connected',
        status: conn.status,
        basiqUserId: conn.basiq_user_id,
        connectionId: conn.basiq_connection_id,
        institution: conn.institution_name,
        account: conn.account_name,
        lastSynced: conn.last_synced,
        connectedAt: conn.created_at,
      };
    } catch (error) {
      console.error('Get connection status error:', error);
      throw new Error('Failed to get connection status');
    }
  }

  /**
   * Handle Basiq Connect callback
   * Uses SERVER token - has full access per Basiq docs
   */
  async handleConnectCallback(userId, connectionId) {
    try {
      console.log(`🔗 Handling callback for user ${userId}, connection ${connectionId?.substring(0, 8)}...`);
      
      // Get the Basiq user ID
      const userResult = await query(
        'SELECT basiq_user_id FROM bank_connections WHERE user_id = $1',
        [userId]
      );

      if (userResult.length === 0 || !userResult[0].basiq_user_id) {
        throw new Error('Basiq user not found for this user');
      }

      const basiqUserId = userResult[0].basiq_user_id;

      // Get connection details using SERVER token (simpler, avoids user token issues)
      console.log('📡 Fetching connection details with SERVER token...');
      const serverHeaders = await this.getServerHeaders();
      
      const response = await axios.get(
        `${this.apiUrl}/users/${basiqUserId}/connections/${connectionId}`,
        { headers: serverHeaders }
      );

      const connection = response.data;
      const institution = connection.institution;
      const accounts = connection.accounts || [];
      
      console.log('📊 Connection details:', {
        institution: institution?.name,
        accountCount: accounts.length,
        accountNames: accounts.map(a => a.name)
      });

      // Update connection in database
      await query(
        `UPDATE bank_connections 
         SET status = 'connected',
             basiq_connection_id = $1,
             institution_id = $2,
             institution_name = $3,
             account_id = $4,
             account_name = $5,
             updated_at = NOW()
         WHERE user_id = $6`,
        [
          connectionId,
          institution?.id,
          institution?.name,
          accounts[0]?.id,
          accounts[0]?.name,
          userId,
        ]
      );

      console.log('✅ Connection saved:', institution?.name);

      return {
        success: true,
        institution: institution?.name,
        accounts: accounts.length,
        accountName: accounts[0]?.name,
      };
    } catch (error) {
      console.error('Handle callback error:', error.response?.data || error.message);
      throw new Error('Failed to complete connection');
    }
  }

  /**
   * Get all connections for a user
   */
  async getUserConnections(userId) {
    try {
      const userResult = await query(
        'SELECT basiq_user_id FROM bank_connections WHERE user_id = $1',
        [userId]
      );

      if (userResult.length === 0 || !userResult[0].basiq_user_id) {
        return { connections: [] };
      }

      const basiqUserId = userResult[0].basiq_user_id;
      const serverHeaders = await this.getServerHeaders();

      const response = await axios.get(
        `${this.apiUrl}/users/${basiqUserId}/connections`,
        { headers: serverHeaders }
      );

      return {
        connections: response.data.data || [],
      };
    } catch (error) {
      console.error('Get connections error:', error.response?.data || error.message);
      throw new Error('Failed to fetch connections');
    }
  }

  /**
   * Disconnect a bank connection
   */
  async disconnectConnection(userId, connectionId) {
    try {
      const userResult = await query(
        'SELECT basiq_user_id FROM bank_connections WHERE user_id = $1',
        [userId]
      );

      if (userResult.length === 0 || !userResult[0].basiq_user_id) {
        throw new Error('No Basiq user found');
      }

      const basiqUserId = userResult[0].basiq_user_id;
      const serverHeaders = await this.getServerHeaders();

      await axios.delete(
        `${this.apiUrl}/users/${basiqUserId}/connections/${connectionId}`,
        { headers: serverHeaders }
      );

      // Update database
      await query(
        `UPDATE bank_connections 
         SET status = 'disconnected',
             basiq_connection_id = NULL,
             updated_at = NOW()
         WHERE user_id = $1`,
        [userId]
      );

      return { success: true, message: 'Bank disconnected successfully' };
    } catch (error) {
      console.error('Disconnect error:', error.response?.data || error.message);
      throw new Error('Failed to disconnect bank');
    }
  }

  // ============================================
  // TRANSACTION SYNCING
  // ============================================

  /**
   * Sync transactions for a user
   */
  async syncTransactions(userId, options = {}) {
    const { since, limit = 100 } = options;
    
    try {
      console.log(`🔄 Syncing transactions for user ${userId}`);
      
      const userResult = await query(
        `SELECT basiq_user_id, basiq_connection_id, last_synced 
         FROM bank_connections 
         WHERE user_id = $1 AND status = 'connected'`,
        [userId]
      );

      if (userResult.length === 0 || !userResult[0].basiq_user_id) {
        console.log('ℹ️ No active bank connection found');
        return { imported: 0, connections: 0 };
      }

      const { basiq_user_id: basiqUserId, basiq_connection_id: connectionId, last_synced: lastSynced } = userResult[0];

      if (!connectionId) {
        console.log('ℹ️ No connection ID found');
        return { imported: 0, connections: 0 };
      }

      // Get SERVER token for transaction fetching (server token has full access)
      const serverHeaders = await this.getServerHeaders();

      // Build query params
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      
      // Use provided since date, or last synced, or default to 30 days ago
      const sinceDate = since || lastSynced || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      params.append('filter', `transactionDate>'${sinceDate}'`);

      const response = await axios.get(
        `${this.apiUrl}/users/${basiqUserId}/transactions?${params}`,
        { headers: serverHeaders }
      );

      const transactions = response.data.data || [];
      console.log(`📥 Found ${transactions.length} transactions from Basiq`);

      // Import transactions
      let imported = 0;
      
      for (const tx of transactions) {
        try {
          const importedId = await this.importTransaction(userId, tx);
          if (importedId) imported++;
        } catch (importError) {
          console.warn('Failed to import transaction:', tx.id, importError.message);
        }
      }

      // Update last sync time
      await query(
        'UPDATE bank_connections SET last_synced = NOW(), last_sync_error = NULL WHERE user_id = $1',
        [userId]
      );

      console.log(`✅ Imported ${imported} new transactions`);

      return {
        imported,
        connections: 1,
        totalFetched: transactions.length,
      };
    } catch (error) {
      console.error('Sync transactions error:', error.response?.data || error.message);
      
      // Update sync error
      await query(
        'UPDATE bank_connections SET last_sync_error = $1 WHERE user_id = $2',
        [error.message, userId]
      );
      
      throw new Error('Failed to sync transactions');
    }
  }

  /**
   * Import a single transaction
   */
  async importTransaction(userId, transaction) {
    const tx = transaction;
    
    // Check if already imported
    const existing = await query(
      'SELECT id FROM basiq_transactions WHERE basiq_transaction_id = $1',
      [tx.id]
    );

    if (existing.length > 0) {
      return null; // Already exists
    }

    // Determine transaction type
    const amount = parseFloat(tx.amount);
    const isCredit = amount > 0;
    const absAmount = Math.abs(amount);

    // Store in basiq_transactions
    await query(
      `INSERT INTO basiq_transactions 
       (user_id, basiq_transaction_id, account_id, transaction_date, 
        description, amount, transaction_type, status, raw_data, imported_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
      [
        userId,
        tx.id,
        tx.account,
        tx.transactionDate,
        tx.description,
        absAmount,
        isCredit ? 'credit' : 'debit',
        tx.status,
        JSON.stringify(tx),
      ]
    );

    // Import to expenses or income
    if (isCredit) {
      // Income
      await query(
        `INSERT INTO income 
         (user_id, amount, source, date, description, 
          basiq_transaction_id, source_type, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'basiq', NOW())
         ON CONFLICT (basiq_transaction_id) DO NOTHING`,
        [
          userId,
          absAmount,
          'Bank Import',
          tx.transactionDate,
          tx.description,
          tx.id,
        ]
      );
    } else {
      // Expense
      await query(
        `INSERT INTO expenses 
         (user_id, amount, category, date, description, 
          basiq_transaction_id, source, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'basiq', NOW())
         ON CONFLICT (basiq_transaction_id) DO NOTHING`,
        [
          userId,
          absAmount,
          this.categorizeTransaction(tx.description),
          tx.transactionDate,
          tx.description,
          tx.id,
        ]
      );
    }

    return tx.id;
  }

  /**
   * Get recent imported transactions
   */
  async getRecentImportedTransactions(userId, limit = 20) {
    try {
      const result = await query(
        `SELECT 
          bt.basiq_transaction_id,
          bt.description,
          bt.amount,
          bt.transaction_type,
          bt.transaction_date,
          bt.imported_at,
          bc.institution_name
         FROM basiq_transactions bt
         LEFT JOIN bank_connections bc ON bt.user_id = bc.user_id
         WHERE bt.user_id = $1
         ORDER BY bt.imported_at DESC
         LIMIT $2`,
        [userId, limit]
      );

      return result;
    } catch (error) {
      console.error('Get imported transactions error:', error);
      throw new Error('Failed to fetch imported transactions');
    }
  }

  /**
   * Categorize a transaction based on description
   */
  categorizeTransaction(description) {
    const desc = description.toLowerCase();
    
    if (desc.includes('grocery') || desc.includes('supermarket') || desc.includes('woolworths') || desc.includes('coles')) {
      return 'Food & Groceries';
    }
    if (desc.includes('restaurant') || desc.includes('cafe') || desc.includes('food')) {
      return 'Food & Dining';
    }
    if (desc.includes('uber') || desc.includes('taxi') || desc.includes('transport')) {
      return 'Transport';
    }
    if (desc.includes('petrol') || desc.includes('fuel') || desc.includes('gas')) {
      return 'Fuel';
    }
    if (desc.includes('rent') || desc.includes('mortgage')) {
      return 'Housing';
    }
    if (desc.includes('electric') || desc.includes('water') || desc.includes('bill')) {
      return 'Utilities';
    }
    if (desc.includes('netflix') || desc.includes('spotify') || desc.includes('subscription')) {
      return 'Subscriptions';
    }
    if (desc.includes('shopping') || desc.includes('purchase')) {
      return 'Shopping';
    }
    
    return 'Other';
  }
}

// Export singleton instance
module.exports = new BasiqService();
