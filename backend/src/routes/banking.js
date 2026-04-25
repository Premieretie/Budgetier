/**
 * Banking / Open Banking Routes
 * Handles Basiq integration for bank connections and transaction syncing
 */

const express = require('express');
const router = express.Router();
const { authenticate, requireConsent } = require('../middleware/auth');
const { query } = require('../config/database');

// Conditionally load Basiq service
let BasiqService;
let basiqAvailable = false;
try {
  BasiqService = require('../models/basiq');
  basiqAvailable = BasiqService.isConfigured();
} catch (err) {
  console.warn('⚠️ Basiq service not available:', err.message);
}

const Gamification = require('../models/gamification');
const Budget = require('../models/budget');

// Helper middleware to check if Basiq is configured
const requireBasiq = (req, res, next) => {
  if (!basiqAvailable) {
    return res.status(503).json({
      success: false,
      message: 'Banking integration is not configured. Please contact support.',
    });
  }
  next();
};

// ============================================
// PUBLIC ROUTES (no authentication required)
// ============================================

/**
 * GET /api/banking/callback
 * Handle Basiq Connect callback after user connects their bank
 * NOTE: This is a PUBLIC route - Basiq calls it directly without our auth token
 */
router.get('/callback', async (req, res) => {
  if (!basiqAvailable) {
    return res.status(503).json({
      success: false,
      message: 'Banking integration is not configured',
    });
  }

  try {
    const { connection_id, user_id } = req.query;

    if (!connection_id) {
      return res.status(400).json({
        success: false,
        message: 'Connection ID is required',
      });
    }

    // Basiq passes their user_id in the callback - look up our user
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    // Find our user by Basiq user_id
    const userResult = await query(
      'SELECT user_id FROM bank_connections WHERE basiq_user_id = $1',
      [user_id]
    );

    if (userResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found for this Basiq connection',
      });
    }

    const budgetierUserId = userResult[0].user_id;

    // Handle the connection callback
    const result = await BasiqService.handleConnectCallback(budgetierUserId, connection_id);

    if (result.success) {
      // Trigger gamification - reward for connecting bank
      await Gamification.addXP(budgetierUserId, 50);
      await Gamification.addGold(budgetierUserId, 25);
      
      res.json({
        success: true,
        message: 'Bank connected successfully! 🎉 (+50 XP, +25 Gold)',
        data: result,
      });
    } else {
      res.json({
        success: false,
        message: result.message || 'Connection not completed',
        data: result,
      });
    }
  } catch (error) {
    console.error('Connect callback error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to complete bank connection',
    });
  }
});

// ============================================
// PROTECTED ROUTES (authentication required)
// ============================================
router.use(authenticate);
router.use(requireConsent);

// ============================================
// CONNECTION MANAGEMENT
// ============================================

/**
 * GET /api/banking/status
 * Get bank connection status for current user
 */
router.get('/status', async (req, res) => {
  try {
    if (!basiqAvailable) {
      return res.json({
        success: true,
        data: {
          isConnected: false,
          isAvailable: false,
          message: 'Banking integration is not configured',
        },
      });
    }

    const status = await BasiqService.getConnectionStatus(req.user.id);
    
    res.json({
      success: true,
      data: { ...status, isAvailable: true },
    });
  } catch (error) {
    console.error('Get bank status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve bank connection status',
    });
  }
});

/**
 * POST /api/banking/connect
 * Create a Basiq connect link for the user
 */
router.post('/connect', requireBasiq, async (req, res) => {
  try {
    const { email, redirectUrl } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const result = await BasiqService.createConnectLink(
      req.user.id,
      email,
      redirectUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/banking/callback`
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Create connect link error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create bank connection link',
    });
  }
});

/**
 * GET /api/banking/callback
 * Handle Basiq Connect callback after user connects their bank
 * NOTE: This is a PUBLIC route - Basiq calls it directly without our auth token
 */
router.get('/callback', async (req, res) => {
  if (!basiqAvailable) {
    return res.status(503).json({
      success: false,
      message: 'Banking integration is not configured',
    });
  }
  try {
    const { connection_id, user_id } = req.query;

    if (!connection_id) {
      return res.status(400).json({
        success: false,
        message: 'Connection ID is required',
      });
    }

    // Basiq passes their user_id in the callback - look up our user
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    // Find our user by Basiq user_id
    const userResult = await query(
      'SELECT user_id FROM bank_connections WHERE basiq_user_id = $1',
      [user_id]
    );

    if (userResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found for this Basiq connection',
      });
    }

    const budgetierUserId = userResult[0].user_id;

    // Handle the connection callback
    const result = await BasiqService.handleConnectCallback(budgetierUserId, connection_id);

    if (result.success) {
      // Trigger gamification - reward for connecting bank
      await Gamification.addXP(budgetierUserId, 50);
      await Gamification.addGold(budgetierUserId, 25);
      
      res.json({
        success: true,
        message: 'Bank connected successfully! 🎉 (+50 XP, +25 Gold)',
        data: result,
      });
    } else {
      res.json({
        success: false,
        message: result.message || 'Connection not completed',
        data: result,
      });
    }
  } catch (error) {
    console.error('Connect callback error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to complete bank connection',
    });
  }
});

/**
 * POST /api/banking/disconnect
 * Disconnect bank connection
 */
router.post('/disconnect', requireBasiq, async (req, res) => {
  try {
    const { connectionId } = req.body;

    if (!connectionId) {
      return res.status(400).json({
        success: false,
        message: 'Connection ID is required',
      });
    }

    const result = await BasiqService.disconnectConnection(req.user.id, connectionId);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('Disconnect error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to disconnect bank',
    });
  }
});

/**
 * GET /api/banking/connections
 * Get all bank connections for the user
 */
router.get('/connections', requireBasiq, async (req, res) => {
  try {
    const result = await BasiqService.getUserConnections(req.user.id);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get connections error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch connections',
    });
  }
});

// ============================================
// TRANSACTION SYNC
// ============================================

/**
 * POST /api/banking/sync
 * Sync transactions from all connected banks
 */
router.post('/sync', requireBasiq, async (req, res) => {
  try {
    const result = await BasiqService.syncTransactions(req.user.id);

    if (result.imported > 0) {
      // Update treasure chest with new data
      const chestResult = await Gamification.recalculateTreasureChest(req.user.id);

      // Update ship health based on spending
      const monthlyTotal = await query(
        `SELECT COALESCE(SUM(amount), 0) as total FROM expenses 
         WHERE user_id = $1 
         AND date >= DATE_TRUNC('month', CURRENT_DATE)`,
        [req.user.id]
      );
      
      const budgets = await Budget.findByUserId(req.user.id);
      const totalBudget = budgets.reduce((sum, b) => sum + parseFloat(b.amount), 0);
      const spendingRatio = totalBudget > 0 ? parseFloat(monthlyTotal[0].total) / totalBudget : 0;
      
      await Gamification.updateShipHealth(req.user.id, spendingRatio);

      // Award XP for syncing
      await Gamification.addXP(req.user.id, 5);

      res.json({
        success: true,
        message: `Synced ${result.imported} new transactions (+5 XP)`,
        data: {
          ...result,
          treasureChest: chestResult,
        },
      });
    } else {
      res.json({
        success: true,
        message: 'No new transactions found',
        data: result,
      });
    }
  } catch (error) {
    console.error('Sync transactions error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to sync transactions',
    });
  }
});

/**
 * GET /api/banking/transactions
 * Get recently imported Basiq transactions
 */
router.get('/transactions', requireBasiq, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const transactions = await BasiqService.getRecentImportedTransactions(req.user.id, limit);

    res.json({
      success: true,
      data: { transactions },
    });
  } catch (error) {
    console.error('Get imported transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve imported transactions',
    });
  }
});

/**
 * GET /api/banking/sync-status
 * Get last sync status for the user
 */
router.get('/sync-status', async (req, res) => {
  try {
    const result = await query(
      `SELECT 
        status,
        last_synced,
        last_sync_error,
        institution_name
       FROM bank_connections
       WHERE user_id = $1`,
      [req.user.id]
    );

    if (result.length === 0) {
      return res.json({
        success: true,
        data: {
          isConnected: false,
          status: 'not_connected',
        },
      });
    }

    res.json({
      success: true,
      data: {
        isConnected: result[0].status === 'connected',
        status: result[0].status,
        lastSynced: result[0].last_synced,
        lastError: result[0].last_sync_error,
        institution: result[0].institution_name,
      },
    });
  } catch (error) {
    console.error('Get sync status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve sync status',
    });
  }
});

module.exports = router;
