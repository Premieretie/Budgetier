import React from 'react';

const GoldDisplay = ({ gold = 0, size = 'md', showAnimation = false }) => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-3 py-1.5 text-base',
    lg: 'px-4 py-2 text-lg',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div 
      className={`inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-100 to-yellow-100 
        border border-amber-300 rounded-full ${sizeClasses[size]} 
        shadow-sm hover:shadow-md transition-all cursor-pointer
        ${showAnimation ? 'animate-pulse' : ''}`}
      title="Your gold treasure"
    >
      <span className={`${iconSizes[size]} text-amber-500`}>🪙</span>
      <span className="font-bold text-amber-700">
        {gold.toLocaleString()}
      </span>
    </div>
  );
};

export default GoldDisplay;
