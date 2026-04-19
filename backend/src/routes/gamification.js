const express = require('express');
const router = express.Router();
const Gamification = require('../models/gamification');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// ============================================
// USER STATS & DASHBOARD
// ============================================

// Get full gamified dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const dashboard = await Gamification.getGamifiedDashboard(req.user.id);
    
    res.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    console.error('Get gamified dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load yer captain\'s log!',
    });
  }
});

// Get user stats
router.get('/stats', async (req, res) => {
  try {
    const stats = await Gamification.getUserStats(req.user.id);
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Couldn\'t fetch yer treasure stats!',
    });
  }
});

// ============================================
// SHIP HEALTH
// ============================================

// Get ship status
router.get('/ship', async (req, res) => {
  try {
    const stats = await Gamification.getUserStats(req.user.id);
    
    let shipStatus = 'smooth';
    let shipMessage = 'Sailing smooth seas, Captain!';
    
    if (stats.ship_health <= 30) {
      shipStatus = 'critical';
      shipMessage = '⚠️ Ship taking on water! Take action now!';
    } else if (stats.ship_health <= 60) {
      shipStatus = 'damaged';
      shipMessage = '🌊 Storm ahead! Mind yer spending!';
    } else if (stats.ship_health >= 90) {
      shipStatus = 'pristine';
      shipMessage = '⭐ Ship in perfect condition!';
    }
    
    res.json({
      success: true,
      data: {
        health: stats.ship_health,
        status: shipStatus,
        message: shipMessage,
      },
    });
  } catch (error) {
    console.error('Get ship status error:', error);
    res.status(500).json({
      success: false,
      message: 'Ship status unavailable!',
    });
  }
});

// Repair ship (spend gold to restore health)
router.post('/ship/repair', async (req, res) => {
  try {
    const { goldAmount } = req.body;
    
    if (!goldAmount || goldAmount < 10) {
      return res.status(400).json({
        success: false,
        message: 'Need at least 10 gold to repair!',
      });
    }
    
    const result = await Gamification.repairShip(req.user.id, goldAmount);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json({
      success: true,
      message: `Ship repaired! Health restored to ${result.newHealth}%`,
      data: result,
    });
  } catch (error) {
    console.error('Repair ship error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to repair the ship!',
    });
  }
});

// ============================================
// ACHIEVEMENTS
// ============================================

// Get user achievements
router.get('/achievements', async (req, res) => {
  try {
    const achievements = await Gamification.getAchievements(req.user.id);
    
    res.json({
      success: true,
      data: achievements,
    });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({
      success: false,
      message: 'Couldn\'t fetch yer trophies!',
    });
  }
});

// ============================================
// REWARDS/LOOT
// ============================================

// Get user rewards
router.get('/rewards', async (req, res) => {
  try {
    const rewards = await Gamification.getUserRewards(req.user.id, 100);
    
    res.json({
      success: true,
      data: rewards,
    });
  } catch (error) {
    console.error('Get rewards error:', error);
    res.status(500).json({
      success: false,
      message: 'Couldn\'t find yer treasure hoard!',
    });
  }
});

// ============================================
// QUICK EXPENSE BUTTONS
// ============================================

// Get user's quick expense buttons
router.get('/quick-buttons', async (req, res) => {
  try {
    const buttons = await Gamification.getQuickButtons(req.user.id);
    
    res.json({
      success: true,
      data: buttons,
    });
  } catch (error) {
    console.error('Get quick buttons error:', error);
    res.status(500).json({
      success: false,
      message: 'Couldn\'t fetch yer quick-log buttons!',
    });
  }
});

// Create new quick button
router.post('/quick-buttons', async (req, res) => {
  try {
    const { name, amount, category, icon, color } = req.body;
    
    if (!name || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Name and amount be required!',
      });
    }
    
    const button = await Gamification.createQuickButton(req.user.id, {
      name,
      amount,
      category,
      icon,
      color,
    });
    
    res.status(201).json({
      success: true,
      message: 'Quick button created!',
      data: button,
    });
  } catch (error) {
    console.error('Create quick button error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create quick button!',
    });
  }
});

// Update quick button
router.patch('/quick-buttons/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const button = await Gamification.updateQuickButton(id, req.user.id, updates);
    
    if (!button) {
      return res.status(404).json({
        success: false,
        message: 'Button not found!',
      });
    }
    
    res.json({
      success: true,
      message: 'Button updated!',
      data: button,
    });
  } catch (error) {
    console.error('Update quick button error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update button!',
    });
  }
});

// Delete quick button
router.delete('/quick-buttons/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deleted = await Gamification.deleteQuickButton(id, req.user.id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Button not found!',
      });
    }
    
    res.json({
      success: true,
      message: 'Button scuttled!',
    });
  } catch (error) {
    console.error('Delete quick button error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete button!',
    });
  }
});

// ============================================
// DAILY CHALLENGES
// ============================================

// Get today's challenges
router.get('/challenges', async (req, res) => {
  try {
    const challenges = await Gamification.getDailyChallenges(req.user.id);
    
    res.json({
      success: true,
      data: challenges,
    });
  } catch (error) {
    console.error('Get challenges error:', error);
    res.status(500).json({
      success: false,
      message: 'Couldn\'t fetch today\'s challenges!',
    });
  }
});

// ============================================
// MANUAL REWARDS (ADMIN/DEBUG)
// ============================================

// Manually add gold (for testing)
router.post('/debug/add-gold', async (req, res) => {
  try {
    const { amount } = req.body;
    const stats = await Gamification.addGold(req.user.id, amount);
    
    res.json({
      success: true,
      message: `Added ${amount} gold!`,
      data: stats,
    });
  } catch (error) {
    console.error('Add gold error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add gold!',
    });
  }
});

// Manually add XP (for testing)
router.post('/debug/add-xp', async (req, res) => {
  try {
    const { amount } = req.body;
    const stats = await Gamification.addXP(req.user.id, amount);
    
    res.json({
      success: true,
      message: `Added ${amount} XP!`,
      data: stats,
    });
  } catch (error) {
    console.error('Add XP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add XP!',
    });
  }
});

module.exports = router;
