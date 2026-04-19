import React from 'react';
import { Star, Coins } from 'lucide-react';

const LevelProgress = ({ level, xp, nextLevelXP, xpProgress, gold }) => {
  const progressPercent = xpProgress || 0;
  
  return (
    <div className="bg-white rounded-2xl p-4 shadow-md border-2 border-amber-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
            <Star className="text-white" size={20} />
          </div>
          <div>
            <span className="text-xs text-gray-500 uppercase tracking-wide">Captain Level</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-gray-800">{level}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-yellow-100 px-3 py-1 rounded-full">
          <Coins className="text-yellow-600" size={16} />
          <span className="font-bold text-yellow-700">{gold || 0}</span>
        </div>
      </div>

      {/* XP Progress */}
      <div className="relative">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>XP: {xp || 0}</span>
          <span>Next: {nextLevelXP || '∞'}</span>
        </div>
        
        {/* Progress Bar */}
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          >
            <div className="h-full w-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse" />
          </div>
        </div>
        
        {/* Level indicators */}
        <div className="flex justify-between mt-1">
          <span className="text-xs font-bold text-blue-600">Lvl {level}</span>
          <span className="text-xs text-gray-400">Lvl {level + 1}</span>
        </div>
      </div>

      {/* Motivational message */}
      <p className="mt-3 text-xs text-center text-gray-500">
        {progressPercent > 80 
          ? '🎉 Almost there! Keep logging!' 
          : progressPercent > 50 
            ? '⚡ Halfway to next level!' 
            : '🏴‍☠️ Log expenses to gain XP!'}
      </p>
    </div>
  );
};

export default LevelProgress;
