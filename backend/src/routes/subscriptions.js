const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const Subscription = require('../models/subscription');

// All routes require auth
router.use(authenticate);

// GET /api/subscriptions/status - get current user's subscription
router.get('/status', async (req, res) => {
  try {
    const sub = await Subscription.getOrCreate(req.user.id);
    // Derive isPremium from the already-fetched sub — no extra DB round-trip
    const isPrem =
      (sub.plan === 'premium' && sub.status === 'active') ||
      (sub.trial_ends_at && new Date(sub.trial_ends_at) > new Date());

    return res.json({
      success: true,
      data: {
        plan: sub.plan,
        status: sub.status,
        isPremium: isPrem,
        trialEndsAt: sub.trial_ends_at,
        currentPeriodEnd: sub.current_period_end,
        limits: {
          isPremium: isPrem,
          goals: isPrem ? null : 3, // null = unlimited
        },
      },
    });
  } catch (err) {
    console.error('Subscription status error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/subscriptions/start-trial - start 7-day premium trial
router.post('/start-trial', async (req, res) => {
  try {
    const sub = await Subscription.getOrCreate(req.user.id);

    // Only allow trial once (if never had one before)
    if (sub.trial_ends_at) {
      return res.status(400).json({
        success: false,
        message: 'Trial already used. Please upgrade to continue.',
      });
    }

    const updated = await Subscription.upgradeToPremium(req.user.id, { trialDays: 7 });
    return res.json({
      success: true,
      message: 'Your 7-day Premium trial has started!',
      data: updated,
    });
  } catch (err) {
    console.error('Start trial error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/subscriptions/upgrade - upgrade to premium (Stripe integration placeholder)
router.post('/upgrade', async (req, res) => {
  try {
    // Placeholder - in production, verify Stripe payment intent here
    const { stripePaymentIntentId } = req.body;

    // For now, trust-based upgrade (wire Stripe later)
    const updated = await Subscription.upgradeToPremium(req.user.id);
    return res.json({
      success: true,
      message: 'Welcome to Premium! Sail on, Captain! ⚓',
      data: updated,
    });
  } catch (err) {
    console.error('Upgrade error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/subscriptions/cancel - cancel premium
router.post('/cancel', async (req, res) => {
  try {
    const updated = await Subscription.downgradeToFree(req.user.id);
    return res.json({
      success: true,
      message: 'Subscription cancelled. You remain on Free plan.',
      data: updated,
    });
  } catch (err) {
    console.error('Cancel error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
