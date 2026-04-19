import React from 'react';
import { Flame } from 'lucide-react';

const StreakDisplay = ({ streak, longestStreak, message }) => {
  const getStreakIcon = () => {
    if (streak >= 30) return '👑';
    if (streak >= 7) return '🔥';
    if (streak >= 3) return '⚡';
    return '🌱';
  };

  const getStreakColor = () => {
    if (streak >= 30) return 'from-amber-500 to-yellow-600';
    if (streak >= 7) return 'from-orange-500 to-red-600';
    if (streak >= 3) return 'from-blue-500 to-blue-600';
    return 'from-green-500 to-green-600';
  };

  return (
    <div className={`rounded-2xl p-4 bg-gradient-to-br ${getStreakColor()} text-white shadow-lg`}>
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-3xl">
          {getStreakIcon()}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Flame className="text-white/80" size={18} />
            <span className="text-white/80 text-sm font-medium">Daily Streak</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{streak || 0}</span>
            <span className="text-white/70 text-sm">days</span>
          </div>
        </div>
      </div>
      
      <p className="mt-2 text-sm text-white/90 font-medium">
        {message}
      </p>
      
      {longestStreak > streak && (
        <p className="mt-1 text-xs text-white/60">
          Best: {longestStreak} days
        </p>
      )}
      
      {/* Progress dots */}
      <div className="flex gap-1 mt-3">
        {[...Array(7)].map((_, i) => (
          <div 
            key={i}
            className={`flex-1 h-1.5 rounded-full ${
              i < (streak % 7 || 7) ? 'bg-white' : 'bg-white/30'
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-white/60 mt-1">
        {7 - (streak % 7 || 7)} days to streak bonus!
      </p>
    </div>
  );
};

export default StreakDisplay;
