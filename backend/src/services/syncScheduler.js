/**
 * Transaction Sync Scheduler
 * Automatically syncs bank transactions for all connected users
 * Runs every 6 hours by default
 */

let cron;
try {
  cron = require('node-cron');
} catch (err) {
  console.warn('⚠️ node-cron not available. Scheduled sync disabled.');
}

let BasiqService;
try {
  BasiqService = require('../models/basiq');
} catch (err) {
  console.warn('⚠️ BasiqService not available. Bank sync disabled.');
}

const Gamification = require('../models/gamification');
const Budget = require('../models/budget');
const { query } = require('../config/database');

class SyncScheduler {
  constructor() {
    this.task = null;
    this.isRunning = false;
    this.syncInterval = process.env.SYNC_INTERVAL || '0 */6 * * *'; // Every 6 hours
  }

  /**
   * Start the scheduled sync job
   */
  start() {
    if (!cron) {
      console.log('⏭️ Sync scheduler disabled (node-cron not available)');
      return;
    }

    if (!BasiqService) {
      console.log('⏭️ Sync scheduler disabled (BasiqService not available)');
      return;
    }

    if (this.task) {
      console.log('⚠️ Sync scheduler already running');
      return;
    }

    console.log('📅 Starting transaction sync scheduler...');
    console.log(`   Schedule: ${this.syncInterval} (every 6 hours)`);

    this.task = cron.schedule(this.syncInterval, async () => {
      await this.runSync();
    }, {
      scheduled: true,
      timezone: 'UTC',
    });

    // Run initial sync on startup
    this.runSync();
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.task) {
      this.task.stop();
      this.task = null;
      console.log('📅 Sync scheduler stopped');
    }
  }

  /**
   * Run sync for all connected users
   */
  async runSync() {
    if (this.isRunning) {
      console.log('⏳ Sync already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    console.log('🔄 Starting automatic transaction sync...');

    try {
      // Get all users with active bank connections
      const users = await query(
        `SELECT DISTINCT user_id, basiq_user_id 
         FROM bank_connections 
         WHERE status = 'connected' 
         AND basiq_user_id IS NOT NULL`
      );

      if (users.length === 0) {
        console.log('ℹ️ No users with active bank connections');
        this.isRunning = false;
        return;
      }

      console.log(`📊 Syncing transactions for ${users.length} users...`);

      const results = {
        totalUsers: users.length,
        synced: 0,
        failed: 0,
        totalImported: 0,
        errors: [],
      };

      for (const user of users) {
        try {
          const syncResult = await BasiqService.syncTransactions(user.user_id);
          
          if (syncResult.imported > 0) {
            // Update treasure chest
            await Gamification.recalculateTreasureChest(user.user_id);

            // Update ship health
            const monthlyTotal = await query(
              `SELECT COALESCE(SUM(amount), 0) as total FROM expenses 
               WHERE user_id = $1 
               AND date >= DATE_TRUNC('month', CURRENT_DATE)`,
              [user.user_id]
            );
            
            const budgets = await Budget.findByUserId(user.user_id);
            const totalBudget = budgets.reduce((sum, b) => sum + parseFloat(b.amount), 0);
            const spendingRatio = totalBudget > 0 ? parseFloat(monthlyTotal[0].total) / totalBudget : 0;
            
            await Gamification.updateShipHealth(user.user_id, spendingRatio);
          }

          results.synced++;
          results.totalImported += syncResult.imported;

          console.log(`  ✓ User ${user.user_id}: ${syncResult.imported} transactions`);
        } catch (error) {
          console.error(`  ✗ User ${user.user_id} sync failed:`, error.message);
          results.failed++;
          results.errors.push({
            userId: user.user_id,
            error: error.message,
          });

          // Update last sync error
          await query(
            'UPDATE bank_connections SET last_sync_error = $1 WHERE user_id = $2',
            [error.message, user.user_id]
          );
        }
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ Sync complete: ${results.synced} users, ${results.totalImported} transactions (${duration}s)`);
      
      if (results.failed > 0) {
        console.log(`⚠️ ${results.failed} users failed to sync`);
      }

      return results;
    } catch (error) {
      console.error('❌ Sync scheduler error:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Sync a specific user immediately (manual sync)
   */
  async syncUser(userId) {
    if (!BasiqService) {
      throw new Error('BasiqService not available');
    }

    try {
      const syncResult = await BasiqService.syncTransactions(userId);
      
      if (syncResult.imported > 0) {
        // Update treasure chest
        await Gamification.recalculateTreasureChest(userId);

        // Update ship health
        const monthlyTotal = await query(
          `SELECT COALESCE(SUM(amount), 0) as total FROM expenses 
           WHERE user_id = $1 
           AND date >= DATE_TRUNC('month', CURRENT_DATE)`,
          [userId]
        );
        
        const budgets = await Budget.findByUserId(userId);
        const totalBudget = budgets.reduce((sum, b) => sum + parseFloat(b.amount), 0);
        const spendingRatio = totalBudget > 0 ? parseFloat(monthlyTotal[0].total) / totalBudget : 0;
        
        await Gamification.updateShipHealth(userId, spendingRatio);
      }

      return {
        success: true,
        imported: syncResult.imported,
        connections: syncResult.connections,
      };
    } catch (error) {
      console.error(`Manual sync failed for user ${userId}:`, error);
      
      // Update last sync error
      await query(
        'UPDATE bank_connections SET last_sync_error = $1 WHERE user_id = $2',
        [error.message, userId]
      );

      throw error;
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      isScheduled: this.task !== null,
      schedule: this.syncInterval,
    };
  }
}

// Export singleton instance
module.exports = new SyncScheduler();
