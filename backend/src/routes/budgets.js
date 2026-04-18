const express = require('express');
const router = express.Router();
const Budget = require('../models/budget');
const { authenticate, requireConsent } = require('../middleware/auth');
const { budgetValidation } = require('../middleware/validation');

// All routes require authentication
router.use(authenticate);
router.use(requireConsent);

// Get all budgets
router.get('/', async (req, res) => {
  try {
    const { active, limit, offset } = req.query;
    
    const budgets = await Budget.findByUserId(req.user.id, {
      active: active !== undefined ? active === 'true' : undefined,
      limit: limit ? parseInt(limit) : 100,
      offset: offset ? parseInt(offset) : 0,
    });

    res.json({
      success: true,
      data: { budgets }
    });
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve budgets.'
    });
  }
});

// Get budget by ID
router.get('/:id', async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);
    
    if (!budget || budget.user_id !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found.'
      });
    }

    res.json({
      success: true,
      data: { budget }
    });
  } catch (error) {
    console.error('Get budget error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve budget.'
    });
  }
});

// Create budget
router.post('/', budgetValidation, async (req, res) => {
  try {
    const { name, amount, period, categoryId, startDate, endDate, alertThreshold } = req.body;

    const budget = await Budget.create({
      userId: req.user.id,
      name,
      amount,
      period,
      categoryId,
      startDate,
      endDate,
      alertThreshold: alertThreshold || 80,
    });

    res.status(201).json({
      success: true,
      message: 'Budget created successfully.',
      data: { budget }
    });
  } catch (error) {
    console.error('Create budget error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create budget.'
    });
  }
});

// Update budget
router.patch('/:id', budgetValidation, async (req, res) => {
  try {
    const { name, amount, period, categoryId, startDate, endDate, alertThreshold } = req.body;
    
    const budget = await Budget.update(req.params.id, req.user.id, {
      name,
      amount,
      period,
      category_id: categoryId,
      start_date: startDate,
      end_date: endDate,
      alert_threshold: alertThreshold,
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found.'
      });
    }

    res.json({
      success: true,
      message: 'Budget updated successfully.',
      data: { budget }
    });
  } catch (error) {
    console.error('Update budget error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update budget.'
    });
  }
});

// Delete budget
router.delete('/:id', async (req, res) => {
  try {
    const budget = await Budget.delete(req.params.id, req.user.id);

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found.'
      });
    }

    res.json({
      success: true,
      message: 'Budget deleted successfully.'
    });
  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete budget.'
    });
  }
});

// Get budget progress
router.get('/:id/progress', async (req, res) => {
  try {
    const progress = await Budget.getBudgetProgress(req.params.id, req.user.id);

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found.'
      });
    }

    res.json({
      success: true,
      data: { progress }
    });
  } catch (error) {
    console.error('Get budget progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve budget progress.'
    });
  }
});

// Get all budgets progress
router.get('/all/progress', async (req, res) => {
  try {
    const progress = await Budget.getAllBudgetsProgress(req.user.id);

    res.json({
      success: true,
      data: { progress }
    });
  } catch (error) {
    console.error('Get all budgets progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve budgets progress.'
    });
  }
});

// Check for overspending
router.get('/alerts/overspending', async (req, res) => {
  try {
    const alerts = await Budget.checkOverspending(req.user.id);

    res.json({
      success: true,
      data: { alerts }
    });
  } catch (error) {
    console.error('Check overspending error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check for overspending.'
    });
  }
});

module.exports = router;
