const express = require('express');
const router = express.Router();
const Income = require('../models/income');
const Expense = require('../models/expense');
const Goal = require('../models/goal');
const Budget = require('../models/budget');
const Notification = require('../models/notification');
const { authenticate, requireConsent } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);
router.use(requireConsent);

// Get dashboard summary
router.get('/summary', async (req, res) => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Date ranges
    const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];
    const startOfYear = new Date(currentYear, 0, 1).toISOString().split('T')[0];

    // Get totals
    const [totalIncome, totalExpenses, monthlyIncome, monthlyExpenses] = await Promise.all([
      Income.getTotalByUserId(req.user.id),
      Expense.getTotalByUserId(req.user.id),
      Income.getTotalByUserId(req.user.id, { startDate: startOfMonth, endDate: endOfMonth }),
      Expense.getTotalByUserId(req.user.id, { startDate: startOfMonth, endDate: endOfMonth }),
    ]);

    const balance = totalIncome - totalExpenses;
    const monthlySavings = monthlyIncome - monthlyExpenses;

    // Get goal stats
    const goalStats = await Goal.getStats(req.user.id);

    // Get recent data
    const [recentExpenses, upcomingGoals, budgetAlerts, unreadNotifications] = await Promise.all([
      Expense.getRecentExpenses(req.user.id, 5),
      Goal.getUpcomingDeadlines(req.user.id, 30),
      Budget.checkOverspending(req.user.id),
      Notification.getUnreadCount(req.user.id),
    ]);

    // Get monthly breakdowns
    const [incomeByMonth, expensesByMonth] = await Promise.all([
      Income.getMonthlyBreakdown(req.user.id, currentYear),
      Expense.getMonthlyBreakdown(req.user.id, currentYear),
    ]);

    // Get category breakdown
    const categoryBreakdown = await Expense.getCategoryBreakdown(req.user.id, startOfMonth, endOfMonth);

    // Get income source breakdown
    const sourceBreakdown = await Income.getIncomeBySource(req.user.id, startOfMonth, endOfMonth);

    res.json({
      success: true,
      data: {
        summary: {
          totalBalance: balance,
          totalIncome,
          totalExpenses,
          monthlyIncome,
          monthlyExpenses,
          monthlySavings,
          savingsRate: monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0,
        },
        goals: {
          stats: goalStats,
          upcoming: upcomingGoals.slice(0, 3),
        },
        budgets: {
          alerts: budgetAlerts,
        },
        recentActivity: {
          expenses: recentExpenses,
        },
        charts: {
          incomeByMonth,
          expensesByMonth,
          categoryBreakdown,
          sourceBreakdown,
        },
        notifications: {
          unreadCount: unreadNotifications,
        },
      }
    });
  } catch (error) {
    console.error('Get dashboard summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard summary.'
    });
  }
});

// Get quick stats
router.get('/stats', async (req, res) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];

    const [monthlyIncome, monthlyExpenses, goalStats, unreadCount] = await Promise.all([
      Income.getTotalByUserId(req.user.id, { startDate: startOfMonth, endDate: endOfMonth }),
      Expense.getTotalByUserId(req.user.id, { startDate: startOfMonth, endDate: endOfMonth }),
      Goal.getStats(req.user.id),
      Notification.getUnreadCount(req.user.id),
    ]);

    res.json({
      success: true,
      data: {
        monthlyIncome,
        monthlyExpenses,
        monthlySavings: monthlyIncome - monthlyExpenses,
        activeGoals: parseInt(goalStats.total_goals) - parseInt(goalStats.completed_goals),
        completedGoals: parseInt(goalStats.completed_goals),
        unreadNotifications: unreadCount,
      }
    });
  } catch (error) {
    console.error('Get quick stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve quick stats.'
    });
  }
});

module.exports = router;
