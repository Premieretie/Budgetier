import React, { useState, useEffect } from 'react';
import { 
  BanknotesIcon, 
  LinkIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  BuildingLibraryIcon
} from '@heroicons/react/24/outline';
import api from '../utils/api';
import { useToast } from '../hooks/useToast';

const BankConnection = () => {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [mobile, setMobile] = useState('');

  // Fetch connection status on mount
  useEffect(() => {
    fetchStatus();
    fetchTransactions();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await api.get('/banking/status');
      if (res.data?.success) {
        setStatus(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch bank status:', err);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/banking/transactions');
      if (res.data?.success) {
        setTransactions(res.data.data.transactions || []);
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    try {
      // Validate mobile number
      if (!mobile || mobile.trim().length < 10) {
        error('Please enter a valid mobile number');
        setLoading(false);
        return;
      }

      // Get user email from auth store or API
      const userRes = await api.get('/auth/me');
      const email = userRes.data?.data?.user?.email;

      if (!email) {
        error('Could not retrieve user email');
        setLoading(false);
        return;
      }

      const res = await api.post('/banking/connect', {
        email,
        mobile: mobile.trim(),
        redirectUrl: `${window.location.origin}/banking/callback`,
      });

      if (res.data?.success) {
        success('Redirecting to bank connection...');
        // Redirect to Basiq Connect
        window.location.href = res.data.data.connectUrl;
      } else {
        error(res.data?.message || 'Failed to create connection link');
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to initiate bank connection');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setLoading(true);
    try {
      const res = await api.post('/banking/sync');
      if (res.data?.success) {
        success(res.data.message);
        fetchStatus();
        fetchTransactions();
      } else {
        error(res.data?.message || 'Sync failed');
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to sync transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect your bank? This will stop automatic transaction syncing.')) {
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/banking/disconnect', {
        connectionId: status?.connectionId,
      });
      if (res.data?.success) {
        success('Bank disconnected successfully');
        fetchStatus();
      } else {
        error(res.data?.message || 'Failed to disconnect');
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to disconnect bank');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <BuildingLibraryIcon className="w-8 h-8" />
              Bank Connections
            </h1>
            <p className="text-blue-100 max-w-xl">
              Connect your bank accounts to automatically import transactions. 
              Powered by Basiq Open Banking.
            </p>
          </div>
          <div className="hidden sm:block">
            <ShieldCheckIcon className="w-16 h-16 text-blue-200 opacity-50" />
          </div>
        </div>
      </div>

      {/* Status Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <LinkIcon className="w-5 h-5" />
          Connection Status
        </h2>

        {status?.isConnected ? (
          <div className="space-y-4">
            {/* Connected State */}
            <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-900">
                  {status.institution || 'Bank'} Connected
                </h3>
                <p className="text-sm text-green-700">
                  {status.accountName || 'Account'} • Last synced: {status.lastSynced ? formatDate(status.lastSynced) : 'Never'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSync}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
                >
                  <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Sync Now
                </button>
                <button
                  onClick={handleDisconnect}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  <XCircleIcon className="w-4 h-4" />
                  Disconnect
                </button>
              </div>
            </div>

            {status.lastError && (
              <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
                <ExclamationTriangleIcon className="w-5 h-5 text-amber-600" />
                <p className="text-sm text-amber-800">
                  <span className="font-medium">Last sync error:</span> {status.lastError}
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Not Connected State */
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BanknotesIcon className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Bank Connected
            </h3>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              Connect your bank account to automatically import transactions and track your spending in real-time.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setShowPrivacyModal(true)}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl font-semibold transition-colors"
              >
                <LinkIcon className="w-5 h-5" />
                Connect Your Bank
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              🔒 Secure connection via Basiq Open Banking. We never store your bank credentials.
            </p>
          </div>
        )}
      </div>

      {/* How It Works */}
      {!status?.isConnected && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: ShieldCheckIcon,
              title: 'Bank-Grade Security',
              desc: '256-bit encryption. Your credentials are never stored.',
            },
            {
              icon: ClockIcon,
              title: 'Automatic Sync',
              desc: 'Transactions sync every 6 hours automatically.',
            },
            {
              icon: BanknotesIcon,
              title: 'Smart Categorization',
              desc: 'Expenses and income are automatically categorized.',
            },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-xl p-6 border border-gray-200">
              <item.icon className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      )}

      {/* Recent Imported Transactions */}
      {transactions.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Recently Imported Transactions
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Description</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Category</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Amount</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.slice(0, 10).map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatDate(tx.transaction_date)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {tx.description}
                      {tx.merchant_business_name && (
                        <span className="text-xs text-gray-500 block">{tx.merchant_business_name}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {tx.category || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      <span className={tx.direction === 'debit' ? 'text-red-600' : 'text-green-600'}>
                        {tx.direction === 'debit' ? '-' : '+'}{formatCurrency(tx.amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        tx.direction === 'debit' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {tx.direction === 'debit' ? 'Expense' : 'Income'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Privacy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              🔒 Privacy & Security
            </h3>
            <div className="space-y-4 text-gray-600 text-sm">
              <p>
                <strong>What we access:</strong> We use Basiq Open Banking to securely 
                read your transaction history. This is read-only access - we cannot 
                move money or make payments.
              </p>
              <p>
                <strong>What we store:</strong> We store transaction details (amount, 
                description, date) to power your Budgetier insights. We never store 
                your bank login credentials.
              </p>
              <p>
                <strong>Data usage:</strong> Your transaction data is used solely for 
                your personal budgeting and gamification features. We do not sell 
                or share your data with third parties.
              </p>
              <p>
                <strong>You control your data:</strong> You can disconnect your bank 
                at any time. Disconnection removes our access to new transactions.
              </p>
            </div>

            {/* Mobile Number Input */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="+61 400 123 456"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">
                Required by Basiq for bank connection security
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowPrivacyModal(false);
                  handleConnect();
                }}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg font-medium"
              >
                I Understand - Connect Bank
              </button>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankConnection;
