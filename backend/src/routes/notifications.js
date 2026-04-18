const express = require('express');
const router = express.Router();
const Notification = require('../models/notification');
const { authenticate, requireConsent } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);
router.use(requireConsent);

// Get all notifications
router.get('/', async (req, res) => {
  try {
    const { unreadOnly, limit, offset } = req.query;
    
    const notifications = await Notification.findByUserId(req.user.id, {
      unreadOnly: unreadOnly === 'true',
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
    });

    const unreadCount = await Notification.getUnreadCount(req.user.id);

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve notifications.'
    });
  }
});

// Mark notification as read
router.patch('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.markAsRead(req.params.id, req.user.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.'
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read.',
      data: { notification }
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read.'
    });
  }
});

// Mark all notifications as read
router.patch('/read-all', async (req, res) => {
  try {
    await Notification.markAllAsRead(req.user.id);

    res.json({
      success: true,
      message: 'All notifications marked as read.'
    });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read.'
    });
  }
});

// Delete notification
router.delete('/:id', async (req, res) => {
  try {
    const notification = await Notification.delete(req.params.id, req.user.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted.'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification.'
    });
  }
});

// Delete all notifications
router.delete('/', async (req, res) => {
  try {
    await Notification.deleteAll(req.user.id);

    res.json({
      success: true,
      message: 'All notifications deleted.'
    });
  } catch (error) {
    console.error('Delete all notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notifications.'
    });
  }
});

module.exports = router;
