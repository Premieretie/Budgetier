import React, { useEffect, useState } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';

const PrivacyPolicy = ({ publicView }) => {
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPolicy();
  }, []);

  const fetchPolicy = async () => {
    try {
      const response = await api.get('/privacy-policy');
      setPolicy(response.data.data);
    } catch (err) {
      console.error('Failed to load privacy policy');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Default policy if API fails
  const defaultSections = [
    {
      title: 'Information We Collect',
      content: 'We collect your email address, name, and financial data (income, expenses, budgets, goals) to provide our budgeting services.',
    },
    {
      title: 'How We Use Your Data',
      content: 'Your data is used solely to provide you with budgeting features, generate financial reports, and send you notifications about your financial goals and budget alerts.',
    },
    {
      title: 'Data Security',
      content: 'We use industry-standard security practices including password hashing with bcrypt, JWT-based authentication, input validation and sanitization, and rate limiting to prevent abuse.',
    },
    {
      title: 'Your Rights (GDPR & Australian Privacy Act)',
      content: 'You have the right to access all your stored data, export your data in a portable format, delete your account and all associated data, and withdraw consent at any time.',
    },
    {
      title: 'Data Retention',
      content: 'We retain your data as long as your account is active. When you delete your account, all your data is permanently removed from our systems within 30 days.',
    },
    {
      title: 'Third-Party Sharing',
      content: 'We do not sell or share your personal data with third parties. Your financial data is private and only accessible to you.',
    },
  ];

  const sections = policy?.sections || defaultSections;

  return (
    <div className="max-w-3xl mx-auto">
      {publicView && (
        <div className="mb-6">
          <a href="/login" className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700">
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to login
          </a>
        </div>
      )}

      <div className="card p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {policy?.title || 'Privacy Policy'}
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Last updated: {policy?.lastUpdated || new Date().toISOString().split('T')[0]}
        </p>

        <div className="space-y-8">
          <p className="text-gray-700 leading-relaxed">
            At Budgeter, we take your privacy seriously. This Privacy Policy explains how we collect, use, 
            store, and protect your personal information when you use our budgeting application.
          </p>

          {sections.map((section, index) => (
            <div key={index}>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">{section.title}</h2>
              <p className="text-gray-600 leading-relaxed">{section.content}</p>
            </div>
          ))}

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Contact Us</h2>
            <p className="text-gray-600 leading-relaxed">
              If you have any questions about this Privacy Policy or our data practices, please contact us 
              through the Settings page or email us at privacy@budgeter.app.
            </p>
          </div>

          <div className="border-t border-gray-200 pt-6 mt-8">
            <p className="text-sm text-gray-500">
              By using Budgeter, you consent to the terms of this Privacy Policy. We may update this policy 
              from time to time, and we will notify you of any significant changes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
