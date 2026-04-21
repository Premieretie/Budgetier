const express = require('express');
const router = express.Router();
const Goal = require('../models/goal');
const Notification = require('../models/notification');
const Subscription = require('../models/subscription');
const { authenticate, requireConsent } = require('../middleware/auth');
const { goalValidation } = require('../middleware/validation');

// All routes require authentication
router.use(authenticate);
router.use(requireConsent);

// Get all goals
router.get('/', async (req, res) => {
  try {
    const { completed, limit, offset } = req.query;
    
    const goals = await Goal.findByUserId(req.user.id, {
      completed: completed !== undefined ? completed === 'true' : undefined,
      limit: limit ? parseInt(limit) : 100,
      offset: offset ? parseInt(offset) : 0,
    });

    const stats = await Goal.getStats(req.user.id);

    res.json({
      success: true,
      data: {
        goals,
        stats,
      }
    });
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve goals.'
    });
  }
});

// Get goal by ID
router.get('/:id', async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    
    if (!goal || goal.user_id !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found.'
      });
    }

    res.json({
      success: true,
      data: { goal }
    });
  } catch (error) {
    console.error('Get goal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve goal.'
    });
  }
});

// Create goal
router.post('/', goalValidation, async (req, res) => {
  try {
    const { name, type, targetAmount, currentAmount, deadline, description } = req.body;

    // Check free plan goal limit
    const limits = await Subscription.getLimits(req.user.id);
    if (limits.goals !== Infinity) {
      const existing = await Goal.findByUserId(req.user.id, { completed: false });
      if (existing.length >= limits.goals) {
        return res.status(403).json({
          success: false,
          message: `Upgrade your ship to unlock more treasure maps! Free plan is limited to ${limits.goals} active goals.`,
          code: 'GOAL_LIMIT_REACHED',
          limit: limits.goals,
        });
      }
    }

    const goal = await Goal.create({
      userId: req.user.id,
      name,
      type,
      targetAmount,
      currentAmount: currentAmount || 0,
      deadline,
      description,
    });

    res.status(201).json({
      success: true,
      message: 'Goal created successfully.',
      data: { goal }
    });
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create goal.'
    });
  }
});

// Update goal
router.patch('/:id', goalValidation, async (req, res) => {
  try {
    const { name, type, targetAmount, currentAmount, deadline, description, completed } = req.body;
    
    const previousGoal = await Goal.findById(req.params.id);
    
    const goal = await Goal.update(req.params.id, req.user.id, {
      name,
      type,
      target_amount: targetAmount,
      current_amount: currentAmount,
      deadline,
      description,
      completed,
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found.'
      });
    }

    // Check for goal completion
    if (!previousGoal.completed && goal.completed) {
      await Notification.create({
        userId: req.user.id,
        type: Notification.TYPES.GOAL_COMPLETED,
        title: 'Goal Completed!',
        message: `Congratulations! You've completed your goal "${goal.name}".`,
        data: { goalId: goal.id },
      });
    }
    // Check for milestones (25%, 50%, 75%)
    else if (!goal.completed) {
      const percentage = (goal.current_amount / goal.target_amount) * 100;
      const previousPercentage = (previousGoal.current_amount / previousGoal.target_amount) * 100;
      
      const milestones = [25, 50, 75];
      for (const milestone of milestones) {
        if (previousPercentage < milestone && percentage >= milestone) {
          await Notification.create({
            userId: req.user.id,
            type: Notification.TYPES.GOAL_MILESTONE,
            title: 'Goal Milestone Reached!',
            message: `You've reached ${milestone}% of your goal "${goal.name}".`,
            data: { goalId: goal.id, milestone },
          });
          break;
        }
      }
    }

    res.json({
      success: true,
      message: 'Goal updated successfully.',
      data: { goal }
    });
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update goal.'
    });
  }
});

// Add progress to goal
router.post('/:id/progress', async (req, res) => {
  console.log('📈 Progress request:', { goalId: req.params.id, amount: req.body?.amount, userId: req.user?.id });
  try {
    const { amount } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
      console.log('❌ Invalid amount:', amount);
      return res.status(400).json({
        success: false,
        message: 'Valid positive amount is required.'
      });
    }

    const previousGoal = await Goal.findById(req.params.id);
    console.log('🔍 Previous goal:', previousGoal ? `Found (current: ${previousGoal.current_amount})` : 'NOT FOUND');
    
    const goal = await Goal.addProgress(req.params.id, req.user.id, amount);
    console.log('✅ Progress added:', goal ? `New amount: ${goal.current_amount}` : 'FAILED');

    if (!goal) {
      console.log('❌ Goal.addProgress returned null');
      return res.status(404).json({
        success: false,
        message: 'Goal not found.'
      });
    }

    // Check for goal completion
    if (!previousGoal.completed && goal.completed) {
      await Notification.create({
        userId: req.user.id,
        type: Notification.TYPES.GOAL_COMPLETED,
        title: 'Goal Completed!',
        message: `Congratulations! You've completed your goal "${goal.name}".`,
        data: { goalId: goal.id },
      });
    }
    // Check for milestones
    else {
      const percentage = (goal.current_amount / goal.target_amount) * 100;
      const previousPercentage = (previousGoal.current_amount / previousGoal.target_amount) * 100;
      
      const milestones = [25, 50, 75];
      for (const milestone of milestones) {
        if (previousPercentage < milestone && percentage >= milestone) {
          await Notification.create({
            userId: req.user.id,
            type: Notification.TYPES.GOAL_MILESTONE,
            title: 'Goal Milestone Reached!',
            message: `You've reached ${milestone}% of your goal "${goal.name}".`,
            data: { goalId: goal.id, milestone },
          });
          break;
        }
      }
    }

    res.json({
      success: true,
      message: 'Progress added successfully.',
      data: { goal }
    });
  } catch (error) {
    console.error('Add progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add progress.'
    });
  }
});

// Delete goal
router.delete('/:id', async (req, res) => {
  try {
    const goal = await Goal.delete(req.params.id, req.user.id);

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found.'
      });
    }

    res.json({
      success: true,
      message: 'Goal deleted successfully.'
    });
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete goal.'
    });
  }
});

// Get upcoming deadlines
router.get('/upcoming/deadlines', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    
    const goals = await Goal.getUpcomingDeadlines(req.user.id, days);

    res.json({
      success: true,
      data: { goals }
    });
  } catch (error) {
    console.error('Get upcoming deadlines error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve upcoming deadlines.'
    });
  }
});

module.exports = router;
