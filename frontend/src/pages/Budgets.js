import React, { useEffect, useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, ChartPieIcon, ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useToast } from '../hooks/useToast';
import api from '../utils/api';
import { formatCurrency, formatDate } from '../utils/helpers';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import GoldDisplay from '../components/GoldDisplay';
import NotificationsDropdown from '../components/NotificationsDropdown';

const Budgets = () => {
  const { success, error } = useToast();
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gold, setGold] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [budgetProgress, setBudgetProgress] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    period: 'monthly',
    categoryId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    alertThreshold: 80,
  });

  useEffect(() => {
    fetchCategories();
    fetchBudgets();
    fetchUserStats();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories?type=expense');
      setCategories(response.data.data.categories);
    } catch (err) {
      console.error('Failed to load categories');
    }
  };

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const response = await api.get('/budgets');
      const budgetsData = response.data.data.budgets;
      setBudgets(budgetsData);
      
      // Fetch progress for each budget
      const progressPromises = budgetsData.map(async (budget) => {
        try {
          const progressRes = await api.get(`/budgets/${budget.id}/progress`);
          return { id: budget.id, progress: progressRes.data.data.progress };
        } catch {
          return { id: budget.id, progress: null };
        }
      });
      
      const progressResults = await Promise.all(progressPromises);
      const progressMap = {};
      progressResults.forEach(({ id, progress }) => {
        if (progress) progressMap[id] = progress;
      });
      setBudgetProgress(progressMap);
    } catch (err) {
      error('Failed to load budgets');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await api.get('/gamification/stats');
      if (response.data?.success) {
        setGold(response.data.data.gold || 0);
      }
    } catch (err) {
      console.error('Failed to load user stats:', err);
    }
  };

  const refreshAll = async () => {
    setLoading(true);
    await Promise.all([fetchCategories(), fetchBudgets(), fetchUserStats()]);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Convert empty categoryId to null
      const dataToSend = {
        ...formData,
        categoryId: formData.categoryId || null,
      };
      
      if (editingBudget) {
        await api.patch(`/budgets/${editingBudget.id}`, dataToSend);
        success('Budget updated successfully');
      } else {
        await api.post('/budgets', dataToSend);
        success('Budget created successfully');
      }
      
      setShowModal(false);
      resetForm();
      fetchBudgets();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to save budget');
    }
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setFormData({
      name: budget.name,
      amount: budget.amount,
      period: budget.period,
      categoryId: budget.category_id || '',
      startDate: budget.start_date,
      endDate: budget.end_date || '',
      alertThreshold: budget.alert_threshold,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this budget?')) return;
    
    try {
      await api.delete(`/budgets/${id}`);
      success('Budget deleted successfully');
      fetchBudgets();
    } catch (err) {
      error('Failed to delete budget');
    }
  };

  const resetForm = () => {
    setEditingBudget(null);
    setFormData({
      name: '',
      amount: '',
      period: 'monthly',
      categoryId: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      alertThreshold: 80,
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const activeBudgets = budgets.filter((b) => !b.end_date || new Date(b.end_date) >= new Date());
  const pastBudgets = budgets.filter((b) => b.end_date && new Date(b.end_date) < new Date());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Budgets</h1>
          <p className="page-description">Set spending limits and track your progress</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Gold Display */}
          <GoldDisplay gold={gold} size="md" />
          
          {/* Refresh Button */}
          <button
            onClick={refreshAll}
            disabled={loading}
            className="p-2 bg-white rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50"
            title="Refresh data"
          >
            <ArrowPathIcon className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          {/* Notifications */}
          <NotificationsDropdown />
          
          <Button onClick={() => setShowModal(true)} icon={PlusIcon}>
            New Budget
          </Button>
        </div>
      </div>

      {/* Active Budgets */}
      {activeBudgets.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {activeBudgets.map((budget) => {
            const progress = budgetProgress[budget.id];
            const isOverBudget = progress?.isOverBudget;
            const alertTriggered = progress?.alertTriggered;
            const percentage = progress?.percentage || 0;

            return (
              <div key={budget.id} className={`card p-6 ${isOverBudget ? 'border-red-300 bg-red-50' : alertTriggered ? 'border-yellow-300 bg-yellow-50' : ''}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ChartPieIcon className={`h-5 w-5 ${isOverBudget ? 'text-red-500' : alertTriggered ? 'text-yellow-500' : 'text-primary-500'}`} />
                    <h3 className="font-semibold text-gray-900">{budget.name}</h3>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(budget)}
                      className="text-gray-400 hover:text-primary-600"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(budget.id)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Budget Info */}
                <div className="mb-4">
                  <p className="text-sm text-gray-500">
                    {budget.period.charAt(0).toUpperCase() + budget.period.slice(1)} Budget
                    {budget.category_name && ` • ${budget.category_name}`}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(budget.amount)}
                  </p>
                </div>

                {/* Progress */}
                {progress && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className={`${isOverBudget ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                        {isOverBudget ? 'Over budget!' : `${formatCurrency(progress.spent)} spent`}
                      </span>
                      <span className={`font-medium ${isOverBudget ? 'text-red-600' : alertTriggered ? 'text-yellow-600' : 'text-gray-900'}`}>
                        {Math.round(percentage)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          isOverBudget ? 'bg-red-500' : alertTriggered ? 'bg-yellow-500' : 'bg-primary-500'
                        }`}
                        style={{ width: `${Math.min(100, percentage)}%` }}
                      ></div>
                    </div>
                    {!isOverBudget && (
                      <p className="text-xs text-gray-500 mt-1">
                        {formatCurrency(progress.remaining)} remaining
                      </p>
                    )}
                  </div>
                )}

                {/* Date Range */}
                <p className="text-xs text-gray-500">
                  From {formatDate(budget.start_date)}
                  {budget.end_date && ` to ${formatDate(budget.end_date)}`}
                </p>

                {/* Alerts */}
                {(isOverBudget || alertTriggered) && (
                  <div className={`mt-3 flex items-center gap-2 text-sm ${isOverBudget ? 'text-red-600' : 'text-yellow-600'}`}>
                    <ExclamationTriangleIcon className="h-4 w-4" />
                    <span>
                      {isOverBudget ? 'Budget exceeded!' : 'Approaching limit!'}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card p-8 text-center">
          <p className="text-gray-500">No active budgets. Create one to start tracking your spending!</p>
        </div>
      )}

      {/* Past Budgets */}
      {pastBudgets.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Past Budgets</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pastBudgets.map((budget) => (
              <div key={budget.id} className="card p-6 opacity-60 bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <ChartPieIcon className="h-5 w-5 text-gray-400" />
                  <h3 className="font-semibold text-gray-700">{budget.name}</h3>
                </div>
                <p className="text-sm text-gray-500">{budget.period} Budget</p>
                <p className="text-lg font-bold text-gray-700 mt-1">
                  {formatCurrency(budget.amount)}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Ended {formatDate(budget.end_date)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingBudget ? 'Edit Budget' : 'Create New Budget'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Budget Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="e.g., Monthly Groceries"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Amount *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="input"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="label">Period *</label>
              <select
                required
                value={formData.period}
                onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                className="input"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="label">Category (Optional)</label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="input"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start Date *</label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">End Date (Optional)</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="input"
              />
            </div>
          </div>
          
          <div>
            <label className="label">Alert Threshold (%)</label>
            <input
              type="number"
              min="1"
              max="100"
              value={formData.alertThreshold}
              onChange={(e) => setFormData({ ...formData, alertThreshold: e.target.value })}
              className="input"
            />
            <p className="text-xs text-gray-500 mt-1">
              You'll be notified when you reach this percentage of your budget.
            </p>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingBudget ? 'Update' : 'Create'} Budget
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Budgets;
