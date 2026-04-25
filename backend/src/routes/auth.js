const express = require('express');
const router = express.Router();
const User = require('../models/user');
const { Category } = require('../models/category');
const Notification = require('../models/notification');
const Gamification = require('../models/gamification');
const Subscription = require('../models/subscription');
const Cosmetic = require('../models/cosmetic');
const { generateToken } = require('../middleware/auth');
const { registerValidation, loginValidation } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');

// Register
router.post('/register', registerValidation, async (req, res) => {
  console.log('📥 REGISTER endpoint hit:', req.body?.email);
  try {
    const { email, password, firstName, lastName, consentGiven, dataRetentionAgreement } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.'
      });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      consentGiven,
      dataRetentionAgreement,
    });

    // Create default categories
    await Category.createDefaultCategories(user.id);

    // Initialize gamification stats
    await Gamification.initializeUserStats(user.id);

    // Initialize subscription (free plan)
    await Subscription.getOrCreate(user.id);

    // Unlock default cosmetics
    await Cosmetic.unlockDefault(user.id);

    // Create welcome notification
    await Notification.create({
      userId: user.id,
      type: Notification.TYPES.WELCOME,
      title: '🏴‍☠️ Welcome Aboard, Captain!',
      message: 'Yer ship be ready! Start tracking yer treasure and complete quests to become a legendary pirate!',
    });

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          currency: user.currency,
          consentGiven: user.consent_given,
        },
        token,
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create account. Please try again.'
    });
  }
});

// Login
router.post('/login', loginValidation, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Validate password
    const isValidPassword = await User.validatePassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Update last login
    await User.updateLastLogin(user.id);

    // Generate token
    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          currency: user.currency,
          consentGiven: user.consent_given,
        },
        token,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: {
          id: req.user.id,
          email: req.user.email,
          firstName: req.user.first_name,
          lastName: req.user.last_name,
          currency: req.user.currency,
          consentGiven: req.user.consent_given,
        }
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user information.'
    });
  }
});

// Update user profile
router.patch('/me', authenticate, async (req, res) => {
  try {
    const allowedUpdates = ['first_name', 'last_name', 'currency', 'mobile'];
    const updates = {};
    
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update.'
      });
    }

    const user = await User.update(req.user.id, updates);

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          currency: user.currency,
          consentGiven: user.consent_given,
        }
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile.'
    });
  }
});

// Update consent
router.patch('/consent', authenticate, async (req, res) => {
  try {
    const { consentGiven, dataRetentionAgreement } = req.body;

    if (typeof consentGiven !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'consentGiven must be a boolean value.'
      });
    }

    const user = await User.update(req.user.id, {
      privacy_consent: consentGiven,
      data_retention_agreement: dataRetentionAgreement,
      consent_date: new Date(),
    });

    res.json({
      success: true,
      message: 'Consent updated successfully.',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          currency: user.currency,
          consentGiven: user.consent_given,
        }
      }
    });
  } catch (error) {
    console.error('Update consent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update consent.'
    });
  }
});

// Delete account (GDPR compliance)
router.delete('/account', authenticate, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to delete your account.'
      });
    }

    // Verify password
    const user = await User.findById(req.user.id);
    const isValidPassword = await User.validatePassword(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password.'
      });
    }

    // Delete all user data
    await User.deleteAllUserData(req.user.id);

    res.json({
      success: true,
      message: 'Your account and all associated data have been permanently deleted.'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete account.'
    });
  }
});

// Get all user data (GDPR data portability)
router.get('/data-export', authenticate, async (req, res) => {
  try {
    const userData = await User.getAllUserData(req.user.id);

    res.json({
      success: true,
      data: userData
    });
  } catch (error) {
    console.error('Data export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export data.'
    });
  }
});

module.exports = router;
