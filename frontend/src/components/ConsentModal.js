import React from 'react';
import { useAuthStore } from '../hooks/useAuthStore';

export default function ConsentModal() {
  const { acceptConsent } = useAuthStore();

  const handleAccept = async () => {
    await acceptConsent();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Privacy Policy</h2>
          
          <div className="prose prose-sm max-w-none mb-6 text-gray-600">
            <p className="mb-4">
              Welcome to Budgeter. Before you continue using our application, please review our privacy practices:
            </p>
            
            <h3 className="font-semibold text-gray-900 mt-4 mb-2">Data We Collect</h3>
            <ul className="list-disc pl-5 mb-4 space-y-1">
              <li>Account information (email, name)</li>
              <li>Financial data (income, expenses, budgets, goals)</li>
              <li>Usage statistics to improve the application</li>
            </ul>
            
            <h3 className="font-semibold text-gray-900 mt-4 mb-2">How We Use Your Data</h3>
            <ul className="list-disc pl-5 mb-4 space-y-1">
              <li>To provide budgeting and financial tracking services</li>
              <li>To generate reports and insights for you</li>
              <li>To send important notifications about your account</li>
            </ul>
            
            <h3 className="font-semibold text-gray-900 mt-4 mb-2">Data Protection</h3>
            <p className="mb-4">
              Your data is stored securely and is only accessible to you. We implement industry-standard 
              security measures to protect your financial information. You can export or delete your data 
              at any time from the Settings page.
            </p>
            
            <h3 className="font-semibold text-gray-900 mt-4 mb-2">Your Rights</h3>
            <ul className="list-disc pl-5 mb-4 space-y-1">
              <li>Access your data anytime</li>
              <li>Export your data in standard formats</li>
              <li>Delete your account and all associated data</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </div>
          
          <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 border-t pt-4">
            <button
              onClick={handleAccept}
              className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-md font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              I Accept - Continue to Budgeter
            </button>
          </div>
          
          <p className="text-xs text-gray-500 mt-4 text-center">
            By clicking "I Accept", you agree to our Privacy Policy and consent to the processing 
            of your personal data as described above.
          </p>
        </div>
      </div>
    </div>
  );
}
