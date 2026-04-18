import React, { useEffect, useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, TagIcon, BanknotesIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useToast } from '../hooks/useToast';
import api from '../utils/api';
import { formatCurrency } from '../utils/helpers';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';

const PRESET_COLORS = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1',
  '#8B5CF6', '#EC4899', '#14B8A6', '#DC2626', '#059669',
  '#6B7280', '#84CC16', '#06B6D4', '#F97316', '#8B5CF6',
];

const PRESET_ICONS = ['💼', '🍔', '🚗', '⚡', '🏥', '🎬', '🛍️', '📚', '💳', '🐷', '🏠', '🎮', '✈️', '🎁', '📱'];

const Categories = () => {
  const { success, error } = useToast();
  const [categories, setCategories] = useState({ income: [], expense: [] });
  const [expenseTotals, setExpenseTotals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [activeTab, setActiveTab] = useState('expense');
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense',
    color: '#3B82F6',
    icon: '📦',
  });

  useEffect(() => {
    fetchCategories();
    fetchExpenseTotals();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const [incomeRes, expenseRes] = await Promise.all([
        api.get('/categories?type=income'),
        api.get('/categories?type=expense'),
      ]);
      setCategories({
        income: incomeRes.data.data.categories,
        expense: expenseRes.data.data.categories,
      });
    } catch (err) {
      error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenseTotals = async () => {
    try {
      const response = await api.get('/categories/stats/expense-totals');
      const totalsMap = {};
      response.data.data.categories.forEach((cat) => {
        totalsMap[cat.name] = parseFloat(cat.total);
      });
      setExpenseTotals(totalsMap);
    } catch (err) {
      console.error('Failed to load expense totals');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingCategory) {
        await api.patch(`/categories/${editingCategory.id}`, formData);
        success('Category updated successfully');
      } else {
        await api.post('/categories', formData);
        success('Category created successfully');
      }
      
      setShowModal(false);
      resetForm();
      fetchCategories();
      fetchExpenseTotals();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to save category');
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      color: category.color,
      icon: category.icon || '📦',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category? Expenses in this category will remain but show as "Uncategorized".')) return;
    
    try {
      await api.delete(`/categories/${id}`);
      success('Category deleted successfully');
      fetchCategories();
    } catch (err) {
      error('Failed to delete category');
    }
  };

  const resetForm = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      type: activeTab,
      color: '#3B82F6',
      icon: '📦',
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const openAddModal = (type) => {
    setFormData((prev) => ({ ...prev, type }));
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const currentCategories = categories[activeTab] || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">Categories</h1>
        <p className="page-description">Organize your income and expenses with custom categories</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('expense')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'expense'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <TagIcon className="h-5 w-5" />
              Expense Categories
            </div>
          </button>
          <button
            onClick={() => setActiveTab('income')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'income'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <BanknotesIcon className="h-5 w-5" />
              Income Categories
            </div>
          </button>
        </nav>
      </div>

      {/* Add Button */}
      <div className="flex justify-end">
        <Button onClick={() => openAddModal(activeTab)} icon={PlusIcon}>
          Add {activeTab === 'expense' ? 'Expense' : 'Income'} Category
        </Button>
      </div>

      {/* Categories Grid */}
      {currentCategories.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {currentCategories.map((category) => {
            const total = expenseTotals[category.name] || 0;
            return (
              <div
                key={category.id}
                className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                {/* Top accent bar with gradient */}
                <div
                  className="h-1.5 w-full"
                  style={{
                    background: `linear-gradient(90deg, ${category.color}, ${category.color}80)`,
                  }}
                />

                <div className="p-5">
                  <div className="flex items-start justify-between">
                    {/* Icon with gradient background */}
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner"
                      style={{
                        background: `linear-gradient(135deg, ${category.color}20 0%, ${category.color}10 100%)`,
                        border: `2px solid ${category.color}30`,
                      }}
                    >
                      {category.icon}
                    </div>

                    {/* Action buttons - appear on hover */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => handleEdit(category)}
                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Category info */}
                  <div className="mt-4">
                    <h3 className="font-semibold text-gray-900 text-lg">{category.name}</h3>
                    <p className="text-xs font-medium uppercase tracking-wide mt-1" style={{ color: category.color }}>
                      {category.type}
                    </p>
                  </div>

                  {/* Expense total with visual indicator */}
                  {activeTab === 'expense' && total > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Total Spent</span>
                        <span className="font-bold text-lg" style={{ color: category.color }}>
                          {formatCurrency(total)}
                        </span>
                      </div>
                      {/* Mini progress bar effect */}
                      <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: '100%',
                            background: `linear-gradient(90deg, ${category.color}, ${category.color}80)`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === 'income' && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <span className="text-xs text-gray-400">Income Category</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card p-12 text-center bg-gradient-to-br from-gray-50 to-white">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center mb-4">
            <SparklesIcon className="h-10 w-10 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No {activeTab} categories yet
          </h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            Create your first category to start organizing your {activeTab}s and get better insights into your finances.
          </p>
          <Button
            onClick={() => openAddModal(activeTab)}
            icon={PlusIcon}
            className="mt-6"
          >
            Create {activeTab === 'expense' ? 'Expense' : 'Income'} Category
          </Button>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingCategory ? 'Edit Category' : 'Add Category'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="e.g., Groceries"
            />
          </div>
          
          <div>
            <label className="label">Type *</label>
            <select
              required
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="input"
              disabled={!!editingCategory}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          
          <div>
            <label className="label">Color</label>
            <div className="grid grid-cols-5 gap-3">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-12 h-12 rounded-xl transition-all duration-200 ${
                    formData.color === color
                      ? 'ring-3 ring-offset-2 ring-gray-400 scale-110 shadow-lg'
                      : 'hover:scale-105 hover:shadow-md'
                  }`}
                  style={{
                    backgroundColor: color,
                    boxShadow: formData.color === color ? `0 4px 14px ${color}60` : undefined,
                  }}
                >
                  {formData.color === color && (
                    <svg className="w-6 h-6 text-white mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="label">Icon</label>
            <div className="grid grid-cols-5 gap-3">
              {PRESET_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon })}
                  className={`w-12 h-12 rounded-xl text-2xl transition-all duration-200 ${
                    formData.icon === icon
                      ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white scale-110 shadow-lg shadow-primary-200'
                      : 'bg-gray-50 hover:bg-gray-100 hover:scale-105 border border-gray-200'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingCategory ? 'Update' : 'Add'} Category
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Categories;
