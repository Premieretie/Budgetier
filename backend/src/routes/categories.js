const express = require('express');
const router = express.Router();
const { Category } = require('../models/category');
const { authenticate, requireConsent } = require('../middleware/auth');
const { categoryValidation } = require('../middleware/validation');

// All routes require authentication
router.use(authenticate);
router.use(requireConsent);

// Get all categories
router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    
    const categories = await Category.findByUserId(req.user.id, { type });

    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve categories.'
    });
  }
});

// Get category by ID
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category || category.user_id !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.'
      });
    }

    res.json({
      success: true,
      data: { category }
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve category.'
    });
  }
});

// Create category
router.post('/', categoryValidation, async (req, res) => {
  try {
    const { name, type, color, icon } = req.body;

    const category = await Category.create({
      userId: req.user.id,
      name,
      type,
      color,
      icon,
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      data: { category }
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create category.'
    });
  }
});

// Update category
router.patch('/:id', async (req, res) => {
  try {
    const { name, color, icon } = req.body;
    
    const category = await Category.update(req.params.id, req.user.id, {
      name,
      color,
      icon,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.'
      });
    }

    res.json({
      success: true,
      message: 'Category updated successfully.',
      data: { category }
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category.'
    });
  }
});

// Delete category
router.delete('/:id', async (req, res) => {
  try {
    const category = await Category.delete(req.params.id, req.user.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.'
      });
    }

    res.json({
      success: true,
      message: 'Category deleted successfully.'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category.'
    });
  }
});

// Get expense categories with totals
router.get('/stats/expense-totals', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const categories = await Category.getExpenseCategoriesWithTotals(req.user.id, startDate, endDate);

    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    console.error('Get expense category totals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve category totals.'
    });
  }
});

module.exports = router;
