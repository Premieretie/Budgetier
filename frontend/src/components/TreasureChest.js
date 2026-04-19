import React from 'react';
import { Coins } from 'lucide-react';

const TreasureChest = ({ progress = 0, amount = 0, className = '' }) => {
  // progress is 0-100
  const fillHeight = `${Math.min(100, Math.max(0, progress))}%`;
  
  return (
    <div className={`relative ${className}`}>
      {/* Treasure Chest Container */}
      <div className="relative w-32 h-28 mx-auto">
        {/* Chest Back/Lid */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-12 bg-gradient-to-b from-amber-600 to-amber-700 rounded-t-3xl border-4 border-amber-800 shadow-lg z-10">
          {/* Lock */}
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-5 bg-yellow-500 rounded-sm border-2 border-amber-900" />
        </div>
        
        {/* Chest Body - Fillable Area */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-28 h-16 bg-amber-900 rounded-b-xl border-4 border-amber-800 overflow-hidden">
          {/* Gold Fill */}
          <div 
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-yellow-500 via-yellow-400 to-amber-300 transition-all duration-700 ease-out"
            style={{ height: fillHeight }}
          >
            {/* Gold shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
            
            {/* Coins on top of fill */}
            {progress > 20 && (
              <div className="absolute top-1 left-2 text-xl animate-bounce" style={{ animationDelay: '0ms' }}>🪙</div>
            )}
            {progress > 40 && (
              <div className="absolute top-0 right-3 text-lg animate-bounce" style={{ animationDelay: '150ms' }}>💰</div>
            )}
            {progress > 60 && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 text-2xl animate-bounce" style={{ animationDelay: '300ms' }}>👑</div>
            )}
            {progress > 80 && (
              <div className="absolute -top-2 left-4 text-xl animate-bounce" style={{ animationDelay: '450ms' }}>💎</div>
            )}
          </div>
          
          {/* Chest wood texture overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-amber-800/20 to-transparent pointer-events-none" />
          
          {/* Metal bands */}
          <div className="absolute left-3 top-0 bottom-0 w-2 bg-amber-700/50" />
          <div className="absolute right-3 top-0 bottom-0 w-2 bg-amber-700/50" />
          <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-1 bg-amber-700/30" />
        </div>
        
        {/* Glow effect when full */}
        {progress >= 100 && (
          <div className="absolute inset-0 bg-yellow-400/30 blur-xl rounded-full animate-pulse" />
        )}
      </div>
      
      {/* Label */}
      <div className="mt-3 text-center">
        <div className="flex items-center justify-center gap-1 text-amber-700 font-bold">
          <Coins size={16} />
          <span>Treasure Chest</span>
        </div>
        <div className="text-sm text-amber-600">
          ${amount.toFixed(2)} saved
        </div>
        <div className="text-xs text-amber-500 mt-1">
          {progress >= 100 ? '🎉 Ready for a big quest!' : `${Math.round(progress)}% to $1,000`}
        </div>
      </div>
    </div>
  );
};

export default TreasureChest;
