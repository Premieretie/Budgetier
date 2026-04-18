import React, { useEffect, useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { useToast } from '../hooks/useToast';
import api from '../utils/api';
import { formatCurrency, formatDate, getCategoryColor } from '../utils/helpers';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import BarChart from '../components/charts/BarChart';

const Expenses = () => {
  const { success, error } = useToast();
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    recurring: false,
  });

  useEffect(() => {
    fetchCategories();
    fetchExpenses();
    fetchCategoryBreakdown();
  }, [categoryFilter]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories?type=expense');
      setCategories(response.data.data.categories);
    } catch (err) {
      console.error('Failed to load categories');
    }
  };

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = categoryFilter ? { category: categoryFilter } : {};
      const response = await api.get('/expenses', { params });
      setExpenses(response.data.data.expenses);
      setTotal(response.data.data.total);
    } catch (err) {
      error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryBreakdown = async () => {
    try {
      const response = await api.get('/expenses/stats/by-category');
      setCategoryBreakdown(response.data.data.breakdown);
    } catch (err) {
      console.error('Failed to load category breakdown');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingExpense) {
        await api.patch(`/expenses/${editingExpense.id}`, formData);
        success('Expense updated successfully');
      } else {
        await api.post('/expenses', formData);
        success('Expense added successfully');
      }
      
      setShowModal(false);
      resetForm();
      fetchExpenses();
      fetchCategoryBreakdown();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to save expense');
    }
  };

  const handleEdit = (item) => {
    setEditingExpense(item);
    setFormData({
      amount: item.amount,
      category: item.category,
      date: item.date,
      description: item.description || '',
      recurring: item.recurring,
      recurringFrequency: item.recurring_frequency || 'monthly',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    
    try {
      await api.delete(`/expenses/${id}`);
      success('Expense deleted successfully');
      fetchExpenses();
      fetchCategoryBreakdown();
    } catch (err) {
      error('Failed to delete expense');
    }
  };

  const resetForm = () => {
    setEditingExpense(null);
    setFormData({
      amount: '',
      category: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      recurring: false,
      recurringFrequency: 'monthly',
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

  const chartData = categoryBreakdown.slice(0, 8).map((cat) => ({
    label: cat.category,
    data: [parseFloat(cat.total)],
    color: getCategoryColor(cat.category),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Expenses</h1>
          <p className="page-description">Track and categorize your spending</p>
        </div>
        <Button onClick={() => setShowModal(true)} icon={PlusIcon}>
          Add Expense
        </Button>
      </div>

      {/* Total Card */}
      <div className="card p-6 bg-gradient-to-r from-red-50 to-orange-50">
        <p className="text-sm font-medium text-red-600">Total Expenses</p>
        <p className="mt-2 text-4xl font-bold text-red-700">{formatCurrency(total)}</p>
      </div>

      {/* Category Breakdown Chart */}
      {categoryBreakdown.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Expenses by Category</h3>
          <BarChart
            data={chartData}
            labels={['']}
            horizontal={true}
          />
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <FunnelIcon className="h-4 w-4" />
          Filter by category:
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="input w-auto"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.name}>
              {cat.name}
            </option>
          ))}
        </select>
        {categoryFilter && (
          <button
            onClick={() => setCategoryFilter('')}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Expenses List */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recurring
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expenses.length > 0 ? (
                expenses.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(item.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: getCategoryColor(item.category) + '20',
                          color: getCategoryColor(item.category),
                        }}
                      >
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {item.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600 text-right">
                      -{formatCurrency(item.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {item.recurring ? (
                        <span className="badge badge-success">Yes</span>
                      ) : (
                        <span className="badge badge-info">No</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-primary-600 hover:text-primary-900 mr-3"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No expenses yet. Click "Add Expense" to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingExpense ? 'Edit Expense' : 'Add Expense'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <label className="label">Category *</label>
            <select
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="input"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="label">Date *</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="input"
            />
          </div>
          
          <div>
            <label className="label">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              rows="2"
              placeholder="Optional details..."
            />
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="recurring"
              checked={formData.recurring}
              onChange={(e) => setFormData({ ...formData, recurring: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="recurring" className="text-sm text-gray-700">
              This is a recurring expense
            </label>
          </div>
          
          {formData.recurring && (
            <div>
              <label className="label">Recurring Frequency</label>
              <select
                value={formData.recurringFrequency}
                onChange={(e) => setFormData({ ...formData, recurringFrequency: e.target.value })}
                className="input"
              >
                <option value="weekly">Weekly</option>
                <option value="fortnightly">Fortnightly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          )}
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingExpense ? 'Update' : 'Add'} Expense
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Expenses;
