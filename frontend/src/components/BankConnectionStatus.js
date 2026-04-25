import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BuildingLibraryIcon, 
  CheckCircleIcon, 
  LinkIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import api from '../utils/api';

const BankConnectionStatus = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStatus();
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

  const handleSync = async () => {
    setLoading(true);
    try {
      const res = await api.post('/banking/sync');
      if (res.data?.success) {
        fetchStatus();
      }
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!status) return null;

  // Not connected state
  if (!status.isConnected) {
    return (
      <Link 
        to="/banking"
        className="block bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-200 hover:border-blue-300 transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
            <LinkIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Connect Your Bank</h3>
            <p className="text-sm text-gray-600">
              Auto-import transactions via Open Banking
            </p>
          </div>
          <div className="text-blue-600 text-sm font-medium">
            Connect →
          </div>
        </div>
      </Link>
    );
  }

  // Connected state
  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
          <CheckCircleIcon className="w-5 h-5 text-green-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">
            {status.institution || 'Bank'} Connected
          </h3>
          <p className="text-sm text-gray-600">
            {status.lastSynced ? (
              <>Last synced: {new Date(status.lastSynced).toLocaleDateString()}</>
            ) : (
              'Never synced'
            )}
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={loading}
          className="p-2 hover:bg-green-100 rounded-lg transition-colors"
          title="Sync now"
        >
          <ArrowPathIcon className={`w-5 h-5 text-green-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {status.lastError && (
        <div className="mt-3 p-2 bg-amber-50 rounded-lg border border-amber-200 flex items-center gap-2">
          <ExclamationTriangleIcon className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <p className="text-xs text-amber-800">
            Last sync failed. <Link to="/banking" className="underline">View details</Link>
          </p>
        </div>
      )}
    </div>
  );
};

export default BankConnectionStatus;
