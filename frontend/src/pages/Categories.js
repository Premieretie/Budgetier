import React, { useEffect, useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, ArchiveBoxIcon, CurrencyDollarIcon, FaceSmileIcon, MapIcon, FireIcon, BeakerIcon } from '@heroicons/react/24/outline';
import { useToast } from '../hooks/useToast';
import api from '../utils/api';
import { formatCurrency } from '../utils/helpers';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';

// Pirate treasure colors
const PRESET_COLORS = [
  '#D4AF37', // Gold
  '#8B4513', // Saddle Brown (wood)
  '#CD853F', // Peru (sand)
  '#228B22', // Forest Green
  '#B22222', // Firebrick Red
  '#4B0082', // Indigo
  '#191970', // Midnight Blue
  '#FF6B35', // Burnt Orange
  '#2F4F4F', // Dark Slate
  '#800000', // Maroon
  '#006400', // Dark Green
  '#8B0000', // Dark Red
  '#483D8B', // Dark Slate Blue
  '#556B2F', // Dark Olive
  '#8B4513', // Brown
];

// Pirate-themed cargo icons
const PRESET_ICONS = ['⚔️', '�️', '�‍☠️', '�', '🍺', '🐟', '🦜', '⛵', '�', '�', '�️', '🛢️', '⚓', '💀', '�'];

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
      {/* Pirate Header with Scroll Banner */}
      <div className="relative">
        {/* Decorative corners */}
        <div className="absolute -top-2 -left-2 text-gold-500 text-2xl">⚜️</div>
        <div className="absolute -top-2 -right-2 text-gold-500 text-2xl">⚜️</div>
        
        <div className="bg-gradient-to-r from-parchment-100 via-parchment-200 to-parchment-100 border-y-4 border-gold-400 py-6 px-8 shadow-lg relative">
          {/* Scroll edges effect */}
          <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-gold-600 to-gold-400"></div>
          <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-gold-600 to-gold-400"></div>
          
          <div className="text-center">
            <h1 className="text-4xl font-black text-slate-900 tracking-wide" style={{ fontFamily: 'serif' }}>
              📦 CARGO TYPES 📦
            </h1>
            <p className="text-slate-600 italic mt-2 text-lg">
              "Organize yer spoils and treasures by their proper cargo markings!"
            </p>
          </div>
        </div>
      </div>

      {/* Pirate Tabs */}
      <div className="border-b-4 border-gold-400">
        <nav className="-mb-1 flex space-x-1 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 p-2 rounded-t-lg">
          <button
            onClick={() => setActiveTab('expense')}
            className={`flex-1 py-3 px-6 font-bold text-lg rounded-t-md transition-all duration-300 ${
              activeTab === 'expense'
                ? 'bg-gradient-to-b from-crimson-600 to-crimson-700 text-gold-100 border-t-2 border-gold-400'
                : 'text-parchment-300 hover:text-gold-300 hover:bg-slate-600'
            }`}
          >
            <div className="flex items-center justify-center gap-3">
              <FireIcon className="h-6 w-6" />
              <span>Spoils Spent</span>
              <span className="text-2xl">🔥</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('income')}
            className={`flex-1 py-3 px-6 font-bold text-lg rounded-t-md transition-all duration-300 ${
              activeTab === 'income'
                ? 'bg-gradient-to-b from-emerald-600 to-emerald-700 text-gold-100 border-t-2 border-gold-400'
                : 'text-parchment-300 hover:text-gold-300 hover:bg-slate-600'
            }`}
          >
            <div className="flex items-center justify-center gap-3">
              <CurrencyDollarIcon className="h-6 w-6" />
              <span>Treasure Sources</span>
              <span className="text-2xl">💰</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Add New Cargo Button */}
      <div className="flex justify-end">
        <button
          onClick={() => openAddModal(activeTab)}
          className="group relative px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-slate-900 font-bold rounded-lg shadow-lg shadow-gold-500/30 hover:shadow-gold-500/50 hover:scale-105 transition-all duration-300 border-2 border-gold-700"
        >
          <span className="flex items-center gap-2">
            <PlusIcon className="h-5 w-5" />
            Mark New {activeTab === 'expense' ? 'Spoil Type' : 'Treasure Source'}
          </span>
          {/* Decorative corners */}
          <span className="absolute -top-1 -left-1 text-xs">✦</span>
          <span className="absolute -top-1 -right-1 text-xs">✦</span>
          <span className="absolute -bottom-1 -left-1 text-xs">✦</span>
          <span className="absolute -bottom-1 -right-1 text-xs">✦</span>
        </button>
      </div>

      {/* Categories Grid */}
      {currentCategories.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {currentCategories.map((category) => {
            const total = expenseTotals[category.name] || 0;
            return (
              <div
                key={category.id}
                className="group relative bg-gradient-to-b from-amber-50 to-orange-50 rounded-lg border-4 border-amber-700 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden"
                style={{ boxShadow: `0 8px 32px ${category.color}40, inset 0 2px 4px rgba(255,255,255,0.5)` }}
              >
                {/* Treasure chest lid effect */}
                <div
                  className="h-3 w-full bg-gradient-to-r from-amber-800 via-amber-600 to-amber-800 border-b-2 border-amber-900"
                />

                <div className="p-5">
                  <div className="flex items-start justify-between">
                    {/* Icon in treasure style */}
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-inner border-4 border-amber-600 flex-shrink-0"
                      style={{
                        background: `radial-gradient(circle at 30% 30%, ${category.color}60, ${category.color})`,
                        boxShadow: `inset 0 2px 8px rgba(0,0,0,0.3), 0 4px 12px ${category.color}60`,
                      }}
                      title={category.name}
                    >
                      {category.icon || '📦'}
                    </div>

                    {/* Action buttons - pirate style */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => handleEdit(category)}
                        className="p-2 text-amber-700 hover:text-amber-900 hover:bg-amber-200 rounded-lg transition-colors border border-amber-300"
                        title="Alter Markings"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="p-2 text-crimson-600 hover:text-crimson-800 hover:bg-crimson-100 rounded-lg transition-colors border border-crimson-300"
                        title="Scuttle to Davy Jones"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Cargo info with pirate styling */}
                  <div className="mt-4 min-w-0 flex-1">
                    <h3 
                      className="font-black text-slate-900 text-xl tracking-wide truncate" 
                      style={{ fontFamily: 'serif' }}
                      title={category.name}
                    >
                      {category.name}
                    </h3>
                    <p className="text-sm font-bold uppercase tracking-wider mt-2" style={{ color: category.color }}>
                      {activeTab === 'expense' ? '☠️ Spoil Type' : '💎 Treasure Source'}
                    </p>
                  </div>

                  {/* Loot total with treasure styling */}
                  {activeTab === 'expense' && total > 0 && (
                    <div className="mt-4 pt-4 border-t-2 border-amber-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-amber-800">Total Plundered</span>
                        <span className="font-black text-xl text-crimson-700" style={{ fontFamily: 'serif' }}>
                          {formatCurrency(total)}
                        </span>
                      </div>
                      {/* Treasure bar effect */}
                      <div className="mt-2 h-2 bg-amber-200 rounded-full overflow-hidden border border-amber-300">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: '100%',
                            background: `linear-gradient(90deg, ${category.color}, #D4AF37)`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === 'income' && (
                    <div className="mt-4 pt-4 border-t-2 border-amber-200">
                      <span className="text-sm font-bold text-emerald-700">✨ A Source of Wealth</span>
                    </div>
                  )}
                </div>
                
                {/* Bottom chest decoration */}
                <div className="h-2 bg-gradient-to-r from-amber-800 via-amber-600 to-amber-800" />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="relative p-12 text-center bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 rounded-xl border-4 border-gold-500 shadow-2xl">
          {/* Corner decorations */}
          <div className="absolute top-4 left-4 text-gold-400 text-2xl">🏴‍☠️</div>
          <div className="absolute top-4 right-4 text-gold-400 text-2xl">🏴‍☠️</div>
          
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-gold-500/50 border-4 border-gold-700">
            <span className="text-5xl">📦</span>
          </div>
          <h3 className="text-2xl font-black text-gold-300 mb-3" style={{ fontFamily: 'serif' }}>
            {activeTab === 'expense' ? 'The Spoils Chest Be Empty!' : 'No Treasure Sources Charted!'}
          </h3>
          <p className="text-parchment-300 max-w-md mx-auto text-lg italic">
            {activeTab === 'expense' 
              ? "Arr! Ye haven't marked any cargo types for yer spent loot. Create one to track where yer gold goes!"
              : "Shiver me timbers! No sources of income be recorded. Mark yer treasure streams to see the full bounty!"}
          </p>
          <button
            onClick={() => openAddModal(activeTab)}
            className="mt-8 px-8 py-4 bg-gradient-to-r from-gold-500 to-gold-600 text-slate-900 font-bold rounded-lg shadow-lg shadow-gold-500/30 hover:shadow-gold-500/50 hover:scale-105 transition-all duration-300 border-2 border-gold-700"
          >
            <span className="flex items-center gap-2">
              <PlusIcon className="h-5 w-5" />
              Mark First {activeTab === 'expense' ? 'Spoil Type' : 'Treasure Source'}
            </span>
          </button>
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
