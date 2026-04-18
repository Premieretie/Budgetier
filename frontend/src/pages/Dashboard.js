import React, { useEffect, useState } from 'react';
import {
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  WalletIcon,
  TrophyIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import StatCard from '../components/ui/StatCard';
import LineChart from '../components/charts/LineChart';
import DoughnutChart from '../components/charts/DoughnutChart';
import { useToast } from '../hooks/useToast';
import api from '../utils/api';
import { formatCurrency, formatDate, calculateProgress } from '../utils/helpers';

const Dashboard = () => {
  const { error } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard/summary');
      setData(response.data.data);
    } catch (err) {
      error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load dashboard data</p>
        <button
          onClick={fetchDashboardData}
          className="mt-4 btn-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  const { summary, goals, budgets, recentActivity, charts, notifications } = data;

  // Prepare chart data
  const monthlyLabels = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const incomeData = new Array(12).fill(0);
  const expenseData = new Array(12).fill(0);

  charts.incomeByMonth.forEach((item) => {
    incomeData[parseInt(item.month) - 1] = parseFloat(item.total);
  });

  charts.expensesByMonth.forEach((item) => {
    expenseData[parseInt(item.month) - 1] = parseFloat(item.total);
  });

  const categoryLabels = charts.categoryBreakdown.map((c) => c.category);
  const categoryValues = charts.categoryBreakdown.map((c) => parseFloat(c.total));
  const categoryColors = charts.categoryBreakdown.map((c) => c.color || '#6B7280');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-description">Overview of your financial health</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Balance"
          value={formatCurrency(summary.totalBalance)}
          icon={BanknotesIcon}
          color="primary"
        />
        <StatCard
          title="Monthly Income"
          value={formatCurrency(summary.monthlyIncome)}
          icon={ArrowTrendingUpIcon}
          color="success"
        />
        <StatCard
          title="Monthly Expenses"
          value={formatCurrency(summary.monthlyExpenses)}
          icon={ArrowTrendingDownIcon}
          color="danger"
        />
        <StatCard
          title="Monthly Savings"
          value={formatCurrency(summary.monthlySavings)}
          change={summary.savingsRate.toFixed(1)}
          changeLabel="savings rate"
          icon={WalletIcon}
          color="blue"
        />
      </div>

      {/* Budget Alerts */}
      {budgets.alerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
            Budget Alerts
          </h3>
          <div className="grid gap-4">
            {budgets.alerts.map((alert, index) => (
              <div
                key={index}
                className={`rounded-lg border p-4 ${
                  alert.isOverBudget
                    ? 'bg-red-50 border-red-200'
                    : 'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-medium ${
                      alert.isOverBudget ? 'text-red-800' : 'text-yellow-800'
                    }`}>
                      {alert.budget.name}
                    </p>
                    <p className={`text-sm ${
                      alert.isOverBudget ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {alert.isOverBudget
                        ? `Over budget by ${formatCurrency(Math.abs(alert.remaining))}`
                        : `${Math.round(alert.percentage)}% of budget used`}
                    </p>
                  </div>
                  <div className={`text-2xl font-bold ${
                    alert.isOverBudget ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {Math.round(alert.percentage)}%
                  </div>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      alert.isOverBudget ? 'bg-red-500' : 'bg-yellow-500'
                    }`}
                    style={{ width: `${Math.min(100, alert.percentage)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Income vs Expenses Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Income vs Expenses
          </h3>
          <LineChart
            data={[
              { label: 'Income', data: incomeData, color: '#10b981' },
              { label: 'Expenses', data: expenseData, color: '#ef4444' },
            ]}
            labels={monthlyLabels}
          />
        </div>

        {/* Expense Breakdown */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Expense Breakdown
          </h3>
          {categoryValues.length > 0 ? (
            <DoughnutChart
              data={categoryValues}
              labels={categoryLabels}
              colors={categoryColors}
            />
          ) : (
            <p className="text-center text-gray-500 py-12">No expense data available</p>
          )}
        </div>
      </div>

      {/* Recent Activity & Goals */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Expenses */}
        <div className="card overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-white to-gray-50">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <BanknotesIcon className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Recent Expenses</h3>
            </div>
            <a
              href="/expenses"
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1 hover:gap-2 transition-all"
            >
              View All
              <ArrowRightIcon className="h-4 w-4" />
            </a>
          </div>
          <div className="divide-y divide-gray-50">
            {recentActivity.expenses.length > 0 ? (
              recentActivity.expenses.map((expense, index) => (
                <div
                  key={expense.id}
                  className="group p-4 flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex items-center gap-4">
                    {/* Left accent bar */}
                    <div
                      className="w-1 h-12 rounded-full"
                      style={{
                        background: expense.color
                          ? `linear-gradient(180deg, ${expense.color}, ${expense.color}80)`
                          : '#e5e7eb',
                      }}
                    />

                    {/* Icon with gradient background */}
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shadow-sm"
                      style={{
                        background: expense.color
                          ? `linear-gradient(135deg, ${expense.color}20 0%, ${expense.color}10 100%)`
                          : 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                        border: expense.color ? `2px solid ${expense.color}30` : '2px solid #e5e7eb',
                      }}
                    >
                      <span className="text-xl">{expense.icon || '📦'}</span>
                    </div>

                    {/* Expense details */}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{expense.category}</p>
                        {expense.recurring && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            <ArrowPathIcon className="h-3 w-3" />
                            Recurring
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">{formatDate(expense.date)}</span>
                        {expense.description && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="text-gray-600 truncate max-w-[150px]">
                              {expense.description}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Amount with hover effect */}
                  <div className="text-right">
                    <span className="font-bold text-lg text-red-600 group-hover:scale-110 inline-block transition-transform">
                      -{formatCurrency(expense.amount)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-3">
                  <BanknotesIcon className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">No recent expenses</p>
                <p className="text-sm text-gray-400 mt-1">
                  Your recent spending will appear here
                </p>
                <a
                  href="/expenses"
                  className="inline-flex items-center gap-1 mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Add your first expense
                  <ArrowRightIcon className="h-4 w-4" />
                </a>
              </div>
            )}
          </div>

          {/* Footer showing total of displayed expenses */}
          {recentActivity.expenses.length > 0 && (
            <div className="p-4 bg-gray-50 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  Showing {recentActivity.expenses.length} recent expense
                  {recentActivity.expenses.length !== 1 ? 's' : ''}
                </span>
                <span className="font-semibold text-red-600">
                  Total: -
                  {formatCurrency(
                    recentActivity.expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0)
                  )}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Active Goals */}
        <div className="card">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrophyIcon className="h-5 w-5 text-yellow-500" />
              Active Goals
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {goals.upcoming.length > 0 ? (
              goals.upcoming.slice(0, 5).map((goal) => {
                const progress = calculateProgress(goal.current_amount, goal.target_amount);
                return (
                  <div key={goal.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-gray-900">{goal.name}</p>
                      <span className={`badge ${goal.type === 'savings' ? 'badge-success' : 'badge-warning'}`}>
                        {goal.type}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-500">
                        {formatCurrency(goal.current_amount)} of {formatCurrency(goal.target_amount)}
                      </span>
                      <span className="font-medium text-gray-900">{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          goal.type === 'savings' ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    {goal.deadline && (
                      <p className="text-xs text-gray-500 mt-1">
                        Due {formatDate(goal.deadline)}
                      </p>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center">
                <p className="text-gray-500">No active goals</p>
                <a href="/goals" className="text-primary-600 hover:text-primary-700 text-sm mt-2 inline-block">
                  Create a goal →
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
