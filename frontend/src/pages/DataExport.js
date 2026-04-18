import React, { useEffect, useState } from 'react';
import { ArrowDownTrayIcon, DocumentArrowDownIcon, DocumentTextIcon, TableCellsIcon } from '@heroicons/react/24/outline';
import { useToast } from '../hooks/useToast';
import api from '../utils/api';
import Button from '../components/ui/Button';
import { exportToCSV } from '../utils/helpers';

const DataExport = () => {
  const { success, error } = useToast();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/data-export');
      setUserData(response.data.data);
    } catch (err) {
      error('Failed to load your data');
    } finally {
      setLoading(false);
    }
  };

  const exportAsJSON = () => {
    if (!userData) return;
    
    setExporting(true);
    
    const dataStr = JSON.stringify(userData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `budgeter-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    success('Data exported as JSON');
    setExporting(false);
  };

  const exportAsCSV = (type) => {
    if (!userData) return;
    
    setExporting(true);
    
    let dataToExport = [];
    let filename = '';
    
    switch (type) {
      case 'income':
        dataToExport = userData.income.map(i => ({
          date: i.date,
          amount: i.amount,
          source: i.source,
          description: i.description,
          recurring: i.recurring,
        }));
        filename = 'income.csv';
        break;
      case 'expenses':
        dataToExport = userData.expenses.map(e => ({
          date: e.date,
          amount: e.amount,
          category: e.category,
          description: e.description,
          recurring: e.recurring,
        }));
        filename = 'expenses.csv';
        break;
      case 'goals':
        dataToExport = userData.goals.map(g => ({
          name: g.name,
          type: g.type,
          target_amount: g.target_amount,
          current_amount: g.current_amount,
          deadline: g.deadline,
          completed: g.completed,
        }));
        filename = 'goals.csv';
        break;
      default:
        setExporting(false);
        return;
    }
    
    exportToCSV(dataToExport, filename);
    success(`${type} data exported as CSV`);
    setExporting(false);
  };

  const exportAllAsCSV = () => {
    if (!userData) return;
    
    setExporting(true);
    
    // Combine all data into one CSV
    const allTransactions = [
      ...userData.income.map(i => ({ ...i, transaction_type: 'income' })),
      ...userData.expenses.map(e => ({ ...e, transaction_type: 'expense' })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    exportToCSV(allTransactions, `all-transactions-${new Date().toISOString().split('T')[0]}.csv`);
    success('All transactions exported');
    setExporting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load your data</p>
        <Button onClick={fetchData} variant="secondary" className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Export Your Data</h1>
        <p className="page-description">
          Download a copy of your personal data. You own your data and can export it at any time.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{userData.income.length}</p>
          <p className="text-sm text-gray-500">Income Entries</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{userData.expenses.length}</p>
          <p className="text-sm text-gray-500">Expense Entries</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{userData.goals.length}</p>
          <p className="text-sm text-gray-500">Goals</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{userData.budgets.length}</p>
          <p className="text-sm text-gray-500">Budgets</p>
        </div>
      </div>

      {/* Export Options */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Options</h2>
        
        <div className="space-y-4">
          {/* Full JSON Export */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <DocumentTextIcon className="h-8 w-8 text-primary-600" />
              <div>
                <p className="font-medium text-gray-900">Complete Data Export (JSON)</p>
                <p className="text-sm text-gray-500">Download all your data in JSON format</p>
              </div>
            </div>
            <Button
              onClick={exportAsJSON}
              isLoading={exporting}
              icon={ArrowDownTrayIcon}
            >
              Download JSON
            </Button>
          </div>

          {/* All Transactions CSV */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <TableCellsIcon className="h-8 w-8 text-green-600" />
              <div>
                <p className="font-medium text-gray-900">All Transactions (CSV)</p>
                <p className="text-sm text-gray-500">Income and expenses combined in CSV format</p>
              </div>
            </div>
            <Button
              onClick={exportAllAsCSV}
              isLoading={exporting}
              variant="secondary"
              icon={ArrowDownTrayIcon}
            >
              Download CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Individual CSV Exports */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Individual Exports</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <ArrowDownTrayIcon className="h-5 w-5 text-green-600" />
              </div>
              <span className="font-medium">Income</span>
            </div>
            <p className="text-sm text-gray-500 mb-3">{userData.income.length} entries</p>
            <Button
              onClick={() => exportAsCSV('income')}
              isLoading={exporting}
              variant="secondary"
              fullWidth
              size="sm"
            >
              Download
            </Button>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <ArrowDownTrayIcon className="h-5 w-5 text-red-600" />
              </div>
              <span className="font-medium">Expenses</span>
            </div>
            <p className="text-sm text-gray-500 mb-3">{userData.expenses.length} entries</p>
            <Button
              onClick={() => exportAsCSV('expenses')}
              isLoading={exporting}
              variant="secondary"
              fullWidth
              size="sm"
            >
              Download
            </Button>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ArrowDownTrayIcon className="h-5 w-5 text-blue-600" />
              </div>
              <span className="font-medium">Goals</span>
            </div>
            <p className="text-sm text-gray-500 mb-3">{userData.goals.length} goals</p>
            <Button
              onClick={() => exportAsCSV('goals')}
              isLoading={exporting}
              variant="secondary"
              fullWidth
              size="sm"
            >
              Download
            </Button>
          </div>
        </div>
      </div>

      {/* Privacy Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Your data belongs to you.</strong> This export contains all the data we have stored about you. 
          You can use this data to move to another service or for your own records. For questions about your data, 
          please contact us through the Settings page.
        </p>
      </div>
    </div>
  );
};

export default DataExport;
