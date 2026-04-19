const express = require('express');
const router = express.Router();
const Expense = require('../models/expense');
const Budget = require('../models/budget');
const Notification = require('../models/notification');
const { authenticate, requireConsent } = require('../middleware/auth');
const { expenseValidation, dateRangeValidation, uuidParamValidation } = require('../middleware/validation');

// All routes require authentication
router.use(authenticate);
router.use(requireConsent);

// Get all expenses
router.get('/', dateRangeValidation, async (req, res) => {
  try {
    const { startDate, endDate, category, limit, offset } = req.query;
    
    const expenses = await Expense.findByUserId(req.user.id, {
      startDate,
      endDate,
      category,
      limit: limit ? parseInt(limit) : 100,
      offset: offset ? parseInt(offset) : 0,
    });

    const total = await Expense.getTotalByUserId(req.user.id, { startDate, endDate, category });

    res.json({
      success: true,
      data: {
        expenses,
        total,
      }
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve expenses.'
    });
  }
});

// Get expense by ID
router.get('/:id', async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    
    if (!expense || expense.user_id !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found.'
      });
    }

    res.json({
      success: true,
      data: { expense }
    });
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve expense.'
    });
  }
});

// Create expense
router.post('/', expenseValidation, async (req, res) => {
  try {
    const { amount, category, date, description, recurring, recurringFrequency } = req.body;

    const expense = await Expense.create({
      userId: req.user.id,
      amount,
      category,
      date,
      description,
      recurring: recurring || false,
      recurringFrequency: recurringFrequency || 'monthly',
    });

    // Check budget alerts
    const budgetAlerts = await Budget.checkOverspending(req.user.id);
    
    for (const alert of budgetAlerts) {
      if (alert.isOverBudget) {
        await Notification.create({
          userId: req.user.id,
          type: Notification.TYPES.OVERSPENDING,
          title: 'Budget Exceeded!',
          message: `You've exceeded your budget "${alert.budget.name}".`,
          data: { budgetId: alert.budget.id },
        });
      } else if (alert.alertTriggered) {
        await Notification.create({
          userId: req.user.id,
          type: Notification.TYPES.BUDGET_ALERT,
          title: 'Budget Alert',
          message: `You've used ${Math.round(alert.percentage)}% of your budget "${alert.budget.name}".`,
          data: { budgetId: alert.budget.id },
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Expense created successfully.',
      data: { expense }
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create expense.'
    });
  }
});

// Update expense
router.patch('/:id', expenseValidation, async (req, res) => {
  try {
    const { amount, category, date, description, recurring, recurringFrequency } = req.body;
    
    const expense = await Expense.update(req.params.id, req.user.id, {
      amount,
      category,
      date,
      description,
      recurring,
      recurringFrequency,
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found.'
      });
    }

    res.json({
      success: true,
      message: 'Expense updated successfully.',
      data: { expense }
    });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update expense.'
    });
  }
});

// Delete expense
router.delete('/:id', async (req, res) => {
  try {
    const expense = await Expense.delete(req.params.id, req.user.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found.'
      });
    }

    res.json({
      success: true,
      message: 'Expense deleted successfully.'
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete expense.'
    });
  }
});

// Get category breakdown
router.get('/stats/by-category', dateRangeValidation, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const breakdown = await Expense.getCategoryBreakdown(req.user.id, startDate, endDate);

    res.json({
      success: true,
      data: { breakdown }
    });
  } catch (error) {
    console.error('Get category breakdown error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve category breakdown.'
    });
  }
});

// Get monthly expense breakdown
router.get('/stats/monthly/:year', async (req, res) => {
  try {
    const year = parseInt(req.params.year) || new Date().getFullYear();
    
    const breakdown = await Expense.getMonthlyBreakdown(req.user.id, year);

    res.json({
      success: true,
      data: { 
        year,
        breakdown 
      }
    });
  } catch (error) {
    console.error('Get monthly expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve monthly breakdown.'
    });
  }
});

// Get recent expenses
router.get('/recent/list', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const expenses = await Expense.getRecentExpenses(req.user.id, limit);

    res.json({
      success: true,
      data: { expenses }
    });
  } catch (error) {
    console.error('Get recent expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve recent expenses.'
    });
  }
});

module.exports = router;
