import React, { useEffect, useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useToast } from '../hooks/useToast';
import api from '../utils/api';
import { formatCurrency, formatDate } from '../utils/helpers';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';

const Income = () => {
  const { success, error } = useToast();
  const [income, setIncome] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  const [formData, setFormData] = useState({
    amount: '',
    source: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    recurring: false,
  });

  useEffect(() => {
    fetchIncome();
  }, []);

  const fetchIncome = async () => {
    try {
      setLoading(true);
      const response = await api.get('/income');
      setIncome(response.data.data.income);
      setTotal(response.data.data.total);
    } catch (err) {
      error('Failed to load income data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingIncome) {
        await api.patch(`/income/${editingIncome.id}`, formData);
        success('Income entry updated successfully');
      } else {
        await api.post('/income', formData);
        success('Income entry added successfully');
      }
      
      setShowModal(false);
      resetForm();
      fetchIncome();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to save income entry');
    }
  };

  const handleEdit = (item) => {
    setEditingIncome(item);
    setFormData({
      amount: item.amount,
      source: item.source || '',
      date: item.date,
      description: item.description || '',
      recurring: item.recurring,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this income entry?')) return;
    
    try {
      await api.delete(`/income/${id}`);
      success('Income entry deleted successfully');
      fetchIncome();
    } catch (err) {
      error('Failed to delete income entry');
    }
  };

  const resetForm = () => {
    setEditingIncome(null);
    setFormData({
      amount: '',
      source: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      recurring: false,
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Income</h1>
          <p className="page-description">Track your earnings and revenue streams</p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          icon={PlusIcon}
        >
          Add Income
        </Button>
      </div>

      {/* Total Card */}
      <div className="card p-6 bg-gradient-to-r from-green-50 to-emerald-50">
        <p className="text-sm font-medium text-green-600">Total Income</p>
        <p className="mt-2 text-4xl font-bold text-green-700">{formatCurrency(total)}</p>
      </div>

      {/* Income List */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
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
              {income.length > 0 ? (
                income.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(item.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.source || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {item.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 text-right">
                      +{formatCurrency(item.amount)}
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
                    No income entries yet. Click "Add Income" to get started.
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
        title={editingIncome ? 'Edit Income' : 'Add Income'}
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
            <label className="label">Source</label>
            <input
              type="text"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className="input"
              placeholder="e.g., Salary, Freelance"
            />
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
              This is recurring income
            </label>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingIncome ? 'Update' : 'Add'} Income
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Income;
