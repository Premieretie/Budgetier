const express = require('express');
const router = express.Router();
const Income = require('../models/income');
const { authenticate, requireConsent } = require('../middleware/auth');
const { incomeValidation, dateRangeValidation } = require('../middleware/validation');

// All routes require authentication
router.use(authenticate);
router.use(requireConsent);

// Get all income entries
router.get('/', dateRangeValidation, async (req, res) => {
  try {
    const { startDate, endDate, limit, offset } = req.query;
    
    const income = await Income.findByUserId(req.user.id, {
      startDate,
      endDate,
      limit: limit ? parseInt(limit) : 100,
      offset: offset ? parseInt(offset) : 0,
    });

    const total = await Income.getTotalByUserId(req.user.id, { startDate, endDate });

    res.json({
      success: true,
      data: {
        income,
        total,
      }
    });
  } catch (error) {
    console.error('Get income error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve income entries.'
    });
  }
});

// Get income by ID
router.get('/:id', async (req, res) => {
  try {
    const income = await Income.findById(req.params.id);
    
    if (!income || income.user_id !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Income entry not found.'
      });
    }

    res.json({
      success: true,
      data: { income }
    });
  } catch (error) {
    console.error('Get income error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve income entry.'
    });
  }
});

// Create income entry
router.post('/', incomeValidation, async (req, res) => {
  try {
    const { amount, source, date, description, recurring } = req.body;

    const income = await Income.create({
      userId: req.user.id,
      amount,
      source,
      date,
      description,
      recurring: recurring || false,
    });

    res.status(201).json({
      success: true,
      message: 'Income entry created successfully.',
      data: { income }
    });
  } catch (error) {
    console.error('Create income error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create income entry.'
    });
  }
});

// Update income entry
router.patch('/:id', incomeValidation, async (req, res) => {
  try {
    const { amount, source, date, description, recurring } = req.body;
    
    const income = await Income.update(req.params.id, req.user.id, {
      amount,
      source,
      date,
      description,
      recurring,
    });

    if (!income) {
      return res.status(404).json({
        success: false,
        message: 'Income entry not found.'
      });
    }

    res.json({
      success: true,
      message: 'Income entry updated successfully.',
      data: { income }
    });
  } catch (error) {
    console.error('Update income error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update income entry.'
    });
  }
});

// Delete income entry
router.delete('/:id', async (req, res) => {
  try {
    const income = await Income.delete(req.params.id, req.user.id);

    if (!income) {
      return res.status(404).json({
        success: false,
        message: 'Income entry not found.'
      });
    }

    res.json({
      success: true,
      message: 'Income entry deleted successfully.'
    });
  } catch (error) {
    console.error('Delete income error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete income entry.'
    });
  }
});

// Get income by source breakdown
router.get('/stats/by-source', dateRangeValidation, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const breakdown = await Income.getIncomeBySource(req.user.id, startDate, endDate);

    res.json({
      success: true,
      data: { breakdown }
    });
  } catch (error) {
    console.error('Get income by source error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve income breakdown.'
    });
  }
});

// Get monthly income breakdown
router.get('/stats/monthly/:year', async (req, res) => {
  try {
    const year = parseInt(req.params.year) || new Date().getFullYear();
    
    const breakdown = await Income.getMonthlyBreakdown(req.user.id, year);

    res.json({
      success: true,
      data: { 
        year,
        breakdown 
      }
    });
  } catch (error) {
    console.error('Get monthly income error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve monthly breakdown.'
    });
  }
});

module.exports = router;
