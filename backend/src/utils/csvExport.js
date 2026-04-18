const { Parser } = require('json2csv');

/**
 * Export data to CSV format
 * @param {Array} data - Array of objects to export
 * @param {Array} fields - Array of field objects { label, value }
 * @returns {String} CSV string
 */
const exportToCSV = (data, fields) => {
  try {
    const parser = new Parser({ fields });
    return parser.parse(data);
  } catch (error) {
    console.error('CSV export error:', error);
    throw new Error('Failed to export data to CSV');
  }
};

/**
 * Export user financial data
 * @param {Object} userData - User data from User.getAllUserData()
 * @returns {Object} Object containing CSV strings for each data type
 */
const exportUserData = (userData) => {
  const { user, income, expenses, goals, budgets, categories } = userData;
  
  const exports = {
    profile: null,
    income: null,
    expenses: null,
    goals: null,
    budgets: null,
    categories: null,
  };

  // Profile export
  if (user) {
    exports.profile = exportToCSV([{
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      currency: user.currency,
      createdAt: user.created_at,
    }], [
      { label: 'Email', value: 'email' },
      { label: 'First Name', value: 'firstName' },
      { label: 'Last Name', value: 'lastName' },
      { label: 'Currency', value: 'currency' },
      { label: 'Created At', value: 'createdAt' },
    ]);
  }

  // Income export
  if (income && income.length > 0) {
    exports.income = exportToCSV(income.map(i => ({
      date: i.date,
      amount: i.amount,
      source: i.source,
      description: i.description,
      recurring: i.recurring,
      createdAt: i.created_at,
    })), [
      { label: 'Date', value: 'date' },
      { label: 'Amount', value: 'amount' },
      { label: 'Source', value: 'source' },
      { label: 'Description', value: 'description' },
      { label: 'Recurring', value: 'recurring' },
      { label: 'Created At', value: 'createdAt' },
    ]);
  }

  // Expenses export
  if (expenses && expenses.length > 0) {
    exports.expenses = exportToCSV(expenses.map(e => ({
      date: e.date,
      amount: e.amount,
      category: e.category,
      description: e.description,
      recurring: e.recurring,
      createdAt: e.created_at,
    })), [
      { label: 'Date', value: 'date' },
      { label: 'Amount', value: 'amount' },
      { label: 'Category', value: 'category' },
      { label: 'Description', value: 'description' },
      { label: 'Recurring', value: 'recurring' },
      { label: 'Created At', value: 'createdAt' },
    ]);
  }

  // Goals export
  if (goals && goals.length > 0) {
    exports.goals = exportToCSV(goals.map(g => ({
      name: g.name,
      type: g.type,
      targetAmount: g.target_amount,
      currentAmount: g.current_amount,
      deadline: g.deadline,
      completed: g.completed,
      description: g.description,
      createdAt: g.created_at,
    })), [
      { label: 'Name', value: 'name' },
      { label: 'Type', value: 'type' },
      { label: 'Target Amount', value: 'targetAmount' },
      { label: 'Current Amount', value: 'currentAmount' },
      { label: 'Deadline', value: 'deadline' },
      { label: 'Completed', value: 'completed' },
      { label: 'Description', value: 'description' },
      { label: 'Created At', value: 'createdAt' },
    ]);
  }

  // Budgets export
  if (budgets && budgets.length > 0) {
    exports.budgets = exportToCSV(budgets.map(b => ({
      name: b.name,
      amount: b.amount,
      period: b.period,
      startDate: b.start_date,
      endDate: b.end_date,
      alertThreshold: b.alert_threshold,
      createdAt: b.created_at,
    })), [
      { label: 'Name', value: 'name' },
      { label: 'Amount', value: 'amount' },
      { label: 'Period', value: 'period' },
      { label: 'Start Date', value: 'startDate' },
      { label: 'End Date', value: 'endDate' },
      { label: 'Alert Threshold', value: 'alertThreshold' },
      { label: 'Created At', value: 'createdAt' },
    ]);
  }

  // Categories export
  if (categories && categories.length > 0) {
    exports.categories = exportToCSV(categories.map(c => ({
      name: c.name,
      type: c.type,
      color: c.color,
      icon: c.icon,
      createdAt: c.created_at,
    })), [
      { label: 'Name', value: 'name' },
      { label: 'Type', value: 'type' },
      { label: 'Color', value: 'color' },
      { label: 'Icon', value: 'icon' },
      { label: 'Created At', value: 'createdAt' },
    ]);
  }

  return exports;
};

module.exports = {
  exportToCSV,
  exportUserData,
};
