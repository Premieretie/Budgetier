import React from 'react';
import { Link } from 'react-router-dom';
import { SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline';

const UpgradePrompt = ({
  title = 'Upgrade your ship!',
  message = 'This feature requires a Premium subscription.',
  compact = false,
  onDismiss = null,
}) => {
  if (compact) {
    return (
      <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
        <SparklesIcon className="w-5 h-5 text-amber-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-amber-900 text-xs font-semibold truncate">{title}</p>
          <p className="text-amber-700 text-xs">{message}</p>
        </div>
        <Link
          to="/pricing"
          className="bg-amber-500 hover:bg-amber-400 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
        >
          Upgrade →
        </Link>
        {onDismiss && (
          <button onClick={onDismiss} className="text-amber-400 hover:text-amber-600">
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-3xl p-8 text-center relative">
      {onDismiss && (
        <button onClick={onDismiss} className="absolute top-4 right-4 p-1 text-amber-400 hover:text-amber-600">
          <XMarkIcon className="w-5 h-5" />
        </button>
      )}
      <div className="text-4xl mb-3">⚓</div>
      <h3 className="text-xl font-extrabold text-amber-900 mb-2">{title}</h3>
      <p className="text-amber-700 text-sm mb-6 max-w-xs mx-auto">{message}</p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          to="/pricing"
          className="bg-amber-500 hover:bg-amber-400 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md hover:shadow-amber-300"
        >
          Upgrade your ship →
        </Link>
        {onDismiss && (
          <button onClick={onDismiss} className="text-amber-600 text-sm font-medium hover:underline">
            Maybe later
          </button>
        )}
      </div>
      <p className="text-amber-500 text-xs mt-3">7-day free trial • No credit card required</p>
    </div>
  );
};

export default UpgradePrompt;
