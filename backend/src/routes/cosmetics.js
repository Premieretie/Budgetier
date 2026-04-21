const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const Cosmetic = require('../models/cosmetic');

router.use(authenticate);

// GET /api/cosmetics/shop - get all items with ownership/availability info
router.get('/shop', async (req, res) => {
  try {
    const items = await Cosmetic.getShopItems(req.user.id);
    return res.json({ success: true, data: { items } });
  } catch (err) {
    console.error('Cosmetics shop error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/cosmetics/inventory - get user's owned items
router.get('/inventory', async (req, res) => {
  try {
    const items = await Cosmetic.getUserInventory(req.user.id);
    return res.json({ success: true, data: { items } });
  } catch (err) {
    console.error('Inventory error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/cosmetics/equipped - get user's equipped items
router.get('/equipped', async (req, res) => {
  try {
    const items = await Cosmetic.getEquipped(req.user.id);
    return res.json({ success: true, data: { items } });
  } catch (err) {
    console.error('Equipped error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/cosmetics/unlock/:key - unlock a cosmetic item
router.post('/unlock/:key', async (req, res) => {
  try {
    const result = await Cosmetic.unlock(req.user.id, req.params.key);
    if (!result.success) {
      const statusCode = result.reason === 'premium_required' ? 403 : 400;
      return res.status(statusCode).json({
        success: false,
        message: result.reason === 'premium_required'
          ? 'Upgrade your ship to unlock this item!'
          : result.reason === 'insufficient_gold'
          ? `You need ${result.cost} gold but only have ${result.current}.`
          : 'Cannot unlock this item.',
        code: result.reason?.toUpperCase(),
        data: result,
      });
    }
    return res.json({
      success: true,
      message: `🎉 "${result.item.name}" unlocked!`,
      data: result,
    });
  } catch (err) {
    console.error('Unlock error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/cosmetics/equip/:key - equip an owned cosmetic
router.post('/equip/:key', async (req, res) => {
  try {
    const result = await Cosmetic.equip(req.user.id, req.params.key);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'You do not own this item.',
      });
    }
    return res.json({
      success: true,
      message: 'Item equipped!',
    });
  } catch (err) {
    console.error('Equip error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
