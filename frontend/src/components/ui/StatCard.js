import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

const StatCard = ({ title, value, change, changeLabel, icon: Icon, color = 'primary' }) => {
  const colors = {
    primary: 'bg-primary-50 text-primary-600',
    success: 'bg-green-50 text-green-600',
    warning: 'bg-yellow-50 text-yellow-600',
    danger: 'bg-red-50 text-red-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  const isPositive = change > 0;
  const isNegative = change < 0;

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`rounded-xl p-3 ${colors[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      
      {change !== undefined && (
        <div className="mt-4 flex items-center">
          {isPositive ? (
            <ArrowUpIcon className="h-4 w-4 text-green-500" />
          ) : isNegative ? (
            <ArrowDownIcon className="h-4 w-4 text-red-500" />
          ) : null}
          <span
            className={`ml-1 text-sm font-medium ${
              isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-600'
            }`}
          >
            {isPositive ? '+' : ''}{change}%
          </span>
          {changeLabel && (
            <span className="ml-2 text-sm text-gray-500">{changeLabel}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default StatCard;
