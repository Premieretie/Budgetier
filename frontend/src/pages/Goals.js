import React, { useEffect, useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, TrophyIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useToast } from '../hooks/useToast';
import api from '../utils/api';
import { formatCurrency, formatDate, calculateProgress } from '../utils/helpers';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';

const Goals = () => {
  const { success, error } = useToast();
  const [goals, setGoals] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [progressAmount, setProgressAmount] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    type: 'savings',
    targetAmount: '',
    currentAmount: '0',
    deadline: '',
    description: '',
  });

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const response = await api.get('/goals');
      setGoals(response.data.data.goals);
      setStats(response.data.data.stats);
    } catch (err) {
      error('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingGoal) {
        await api.patch(`/goals/${editingGoal.id}`, formData);
        success('Goal updated successfully');
      } else {
        await api.post('/goals', formData);
        success('Goal created successfully');
      }
      
      setShowModal(false);
      resetForm();
      fetchGoals();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to save goal');
    }
  };

  const handleAddProgress = async (e) => {
    e.preventDefault();
    
    if (!progressAmount || isNaN(progressAmount) || progressAmount <= 0) {
      error('Please enter a valid amount');
      return;
    }
    
    try {
      await api.post(`/goals/${selectedGoal.id}/progress`, { amount: parseFloat(progressAmount) });
      success('Progress added successfully');
      setShowProgressModal(false);
      setProgressAmount('');
      setSelectedGoal(null);
      fetchGoals();
    } catch (err) {
      error('Failed to add progress');
    }
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setFormData({
      name: goal.name,
      type: goal.type,
      targetAmount: goal.target_amount,
      currentAmount: goal.current_amount,
      deadline: goal.deadline || '',
      description: goal.description || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) return;
    
    try {
      await api.delete(`/goals/${id}`);
      success('Goal deleted successfully');
      fetchGoals();
    } catch (err) {
      error('Failed to delete goal');
    }
  };

  const openProgressModal = (goal) => {
    setSelectedGoal(goal);
    setShowProgressModal(true);
  };

  const resetForm = () => {
    setEditingGoal(null);
    setFormData({
      name: '',
      type: 'savings',
      targetAmount: '',
      currentAmount: '0',
      deadline: '',
      description: '',
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

  const activeGoals = goals.filter((g) => !g.completed);
  const completedGoals = goals.filter((g) => g.completed);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Financial Goals</h1>
          <p className="page-description">Set and track your savings and debt repayment goals</p>
        </div>
        <Button onClick={() => setShowModal(true)} icon={PlusIcon}>
          New Goal
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="card p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
            <p className="text-sm font-medium text-blue-600">Total Goals</p>
            <p className="mt-2 text-3xl font-bold text-blue-700">{stats.total_goals}</p>
          </div>
          <div className="card p-6 bg-gradient-to-r from-green-50 to-emerald-50">
            <p className="text-sm font-medium text-green-600">Completed</p>
            <p className="mt-2 text-3xl font-bold text-green-700">{stats.completed_goals}</p>
          </div>
          <div className="card p-6 bg-gradient-to-r from-purple-50 to-pink-50">
            <p className="text-sm font-medium text-purple-600">Active</p>
            <p className="mt-2 text-3xl font-bold text-purple-700">
              {(parseInt(stats.total_goals) || 0) - (parseInt(stats.completed_goals) || 0)}
            </p>
          </div>
        </div>
      )}

      {/* Active Goals */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrophyIcon className="h-5 w-5 text-yellow-500" />
          Active Goals
        </h2>
        
        {activeGoals.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {activeGoals.map((goal) => {
              const progress = calculateProgress(goal.current_amount, goal.target_amount);
              return (
                <div key={goal.id} className="card p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{goal.name}</h3>
                      <span className={`badge mt-1 ${goal.type === 'savings' ? 'badge-success' : 'badge-warning'}`}>
                        {goal.type}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(goal)}
                        className="text-gray-400 hover:text-primary-600"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(goal.id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium">{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          goal.type === 'savings' ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex justify-between text-sm mb-4">
                    <span className="text-gray-600">
                      {formatCurrency(goal.current_amount)} saved
                    </span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(goal.target_amount)}
                    </span>
                  </div>

                  {goal.deadline && (
                    <p className="text-xs text-gray-500 mb-3">
                      Due {formatDate(goal.deadline)}
                    </p>
                  )}

                  <Button
                    onClick={() => openProgressModal(goal)}
                    variant="secondary"
                    fullWidth
                    size="sm"
                  >
                    Add Progress
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card p-8 text-center">
            <p className="text-gray-500">No active goals. Create one to get started!</p>
          </div>
        )}
      </div>

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5 text-green-500" />
            Completed Goals
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {completedGoals.map((goal) => (
              <div key={goal.id} className="card p-6 bg-gray-50 opacity-75">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 line-through">{goal.name}</h3>
                    <span className="badge badge-success mt-1">Completed</span>
                  </div>
                  <CheckCircleIcon className="h-6 w-6 text-green-500" />
                </div>
                <p className="text-sm text-gray-600">
                  Target: {formatCurrency(goal.target_amount)}
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
        title={editingGoal ? 'Edit Goal' : 'Create New Goal'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Goal Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="e.g., Emergency Fund, New Car"
            />
          </div>
          
          <div>
            <label className="label">Goal Type *</label>
            <select
              required
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="input"
            >
              <option value="savings">Savings Goal</option>
              <option value="debt">Debt Repayment</option>
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Target Amount *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={formData.targetAmount}
                onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                className="input"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="label">Current Amount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.currentAmount}
                onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                className="input"
                placeholder="0.00"
              />
            </div>
          </div>
          
          <div>
            <label className="label">Deadline (Optional)</label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
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
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingGoal ? 'Update' : 'Create'} Goal
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Progress Modal */}
      <Modal
        isOpen={showProgressModal}
        onClose={() => {
          setShowProgressModal(false);
          setProgressAmount('');
          setSelectedGoal(null);
        }}
        title="Add Progress"
      >
        {selectedGoal && (
          <form onSubmit={handleAddProgress} className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-medium text-gray-900">{selectedGoal.name}</p>
              <p className="text-sm text-gray-500">
                Current: {formatCurrency(selectedGoal.current_amount)} / {formatCurrency(selectedGoal.target_amount)}
              </p>
            </div>
            
            <div>
              <label className="label">Amount to Add *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={progressAmount}
                onChange={(e) => setProgressAmount(e.target.value)}
                className="input"
                placeholder="0.00"
                autoFocus
              />
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowProgressModal(false);
                  setProgressAmount('');
                  setSelectedGoal(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Add Progress
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Goals;
