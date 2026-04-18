import React, { useState } from 'react';
import { UserCircleIcon, ShieldCheckIcon, BellIcon, KeyIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../hooks/useAuthStore';
import { useToast } from '../hooks/useToast';
import { useThemeStore } from '../hooks/useThemeStore';
import api from '../utils/api';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';

const Settings = () => {
  const { user, updateUser, logout } = useAuthStore();
  const { isDarkMode, toggleDarkMode } = useThemeStore();
  const { success, error } = useToast();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    currency: user?.currency || 'AUD',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await api.patch('/auth/me', {
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        currency: profileData.currency,
      });
      updateUser(response.data.data.user);
      success('Profile updated successfully');
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      error('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      error('New password must be at least 8 characters');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await api.patch('/auth/password', {
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
      });
      success('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    
    if (!deletePassword) {
      error('Please enter your password');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await api.delete('/auth/account', { data: { password: deletePassword } });
      success('Your account has been deleted');
      logout();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to delete account');
      setIsLoading(false);
    }
  };

  const currencies = ['AUD', 'USD', 'EUR', 'GBP', 'CAD', 'NZD', 'JPY', 'SGD'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="page-description">Manage your account preferences and privacy</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg ${
                activeTab === 'profile'
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <UserCircleIcon className="h-5 w-5" />
              Profile
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg ${
                activeTab === 'security'
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <KeyIcon className="h-5 w-5" />
              Security
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg ${
                activeTab === 'privacy'
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <ShieldCheckIcon className="h-5 w-5" />
              Privacy
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg ${
                activeTab === 'notifications'
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <BellIcon className="h-5 w-5" />
              Notifications
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Profile Settings */}
          {activeTab === 'profile' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h2>
              
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">First Name</label>
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Last Name</label>
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="input bg-gray-100 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="label">Currency</label>
                  <select
                    value={profileData.currency}
                    onChange={(e) => setProfileData({ ...profileData, currency: e.target.value })}
                    className="input"
                  >
                    {currencies.map((curr) => (
                      <option key={curr} value={curr}>{curr}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <label className="label mb-0">Dark Mode</label>
                  <button
                    type="button"
                    onClick={toggleDarkMode}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isDarkMode ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isDarkMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="pt-4">
                  <Button type="submit" variant="primary" isLoading={isLoading}>
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h2>
              
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="label">Current Password</label>
                  <input
                    type="password"
                    required
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">New Password</label>
                  <input
                    type="password"
                    required
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="input"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Must be at least 8 characters with uppercase, lowercase, number, and special character.
                  </p>
                </div>

                <div>
                  <label className="label">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="input"
                  />
                </div>

                <div className="pt-4">
                  <Button type="submit" variant="primary" isLoading={isLoading}>
                    Change Password
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Privacy Settings */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Privacy & Data</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Export Your Data</p>
                      <p className="text-sm text-gray-500">Download all your data in JSON format</p>
                    </div>
                    <Button variant="secondary" onClick={() => window.location.href = '/data-export'}>
                      Export Data
                    </Button>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Privacy Policy</p>
                        <p className="text-sm text-gray-500">Read our privacy policy</p>
                      </div>
                      <Button variant="secondary" onClick={() => window.location.href = '/privacy-policy'}>
                        View Policy
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card p-6 border-red-200 bg-red-50">
                <h2 className="text-lg font-semibold text-red-800 mb-4">Danger Zone</h2>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-red-800">Delete Account</p>
                    <p className="text-sm text-red-600">Permanently delete your account and all data. This cannot be undone.</p>
                  </div>
                  <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
                    Delete Account
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Budget Alerts</p>
                    <p className="text-sm text-gray-500">Get notified when approaching or exceeding budget limits</p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                  <div>
                    <p className="font-medium text-gray-900">Goal Milestones</p>
                    <p className="text-sm text-gray-500">Celebrate when you reach savings milestones</p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                  <div>
                    <p className="font-medium text-gray-900">Weekly Summary</p>
                    <p className="text-sm text-gray-500">Receive a weekly summary of your finances</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Account Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletePassword('');
        }}
        title="Delete Account"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              <strong>Warning:</strong> This action cannot be undone. All your data including income, expenses, goals, and budgets will be permanently deleted.
            </p>
          </div>
          
          <form onSubmit={handleDeleteAccount} className="space-y-4">
            <div>
              <label className="label">Enter your password to confirm *</label>
              <input
                type="password"
                required
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="input"
                placeholder="Your password"
              />
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="danger" isLoading={isLoading}>
                Delete Account
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default Settings;
