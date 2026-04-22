import React, { useEffect, useRef, useState } from 'react';
import { Coins } from 'lucide-react';

const MILESTONE = 1000;

const TreasureChest = ({ progress = 0, amount = 0, className = '' }) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const fillHeight = `${clampedProgress}%`;
  const isFull = clampedProgress >= 100;
  const isEmpty = clampedProgress === 0;

  // Milestone celebration: fires once when progress first crosses 100
  const [showCelebration, setShowCelebration] = useState(false);
  const prevProgress = useRef(clampedProgress);

  useEffect(() => {
    if (prevProgress.current < 100 && clampedProgress >= 100) {
      setShowCelebration(true);
      const t = setTimeout(() => setShowCelebration(false), 4000);
      return () => clearTimeout(t);
    }
    prevProgress.current = clampedProgress;
  }, [clampedProgress]);

  // Amount remaining to next milestone
  const remaining = Math.max(0, MILESTONE - amount);
  const nextMilestone = isFull
    ? Math.ceil(amount / MILESTONE + 1) * MILESTONE
    : MILESTONE;

  return (
    <div className={`relative ${className}`}>

      {/* Milestone celebration banner */}
      {showCelebration && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap
                        bg-yellow-400 text-yellow-900 font-extrabold text-xs px-3 py-1.5
                        rounded-full shadow-lg animate-bounce">
          🎉 Treasure secured, captain!
        </div>
      )}

      {/* Chest container */}
      <div className="relative w-32 h-28 mx-auto">

        {/* Lid — tilts open when full */}
        <div
          className={`absolute top-0 left-1/2 -translate-x-1/2 w-28 h-12
                      bg-gradient-to-b from-amber-600 to-amber-700 rounded-t-3xl
                      border-4 border-amber-800 shadow-lg z-10 origin-bottom
                      transition-transform duration-700
                      ${isFull ? '-rotate-12 -translate-y-2' : 'rotate-0'}`}
        >
          {/* Lock — hidden when open */}
          {!isFull && (
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-5 bg-yellow-500 rounded-sm border-2 border-amber-900" />
          )}
        </div>

        {/* Chest body */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-28 h-16 bg-amber-900 rounded-b-xl border-4 border-amber-800 overflow-hidden">

          {/* Empty-state: dark wood grain */}
          {isEmpty && (
            <div className="absolute inset-0 flex items-center justify-center text-amber-700/40 text-3xl select-none">
              💀
            </div>
          )}

          {/* Gold fill */}
          {!isEmpty && (
            <div
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-yellow-500 via-yellow-400 to-amber-300 transition-all duration-700 ease-out"
              style={{ height: fillHeight }}
            >
              {/* Shimmer */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />

              {clampedProgress > 20 && (
                <div className="absolute top-1 left-2 text-xl animate-bounce" style={{ animationDelay: '0ms' }}>🪙</div>
              )}
              {clampedProgress > 40 && (
                <div className="absolute top-0 right-3 text-lg animate-bounce" style={{ animationDelay: '150ms' }}>💰</div>
              )}
              {clampedProgress > 60 && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 text-2xl animate-bounce" style={{ animationDelay: '300ms' }}>👑</div>
              )}
              {clampedProgress > 80 && (
                <div className="absolute -top-2 left-4 text-xl animate-bounce" style={{ animationDelay: '450ms' }}>💎</div>
              )}
            </div>
          )}

          {/* Wood texture overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-amber-800/20 to-transparent pointer-events-none" />
          {/* Metal bands */}
          <div className="absolute left-3 top-0 bottom-0 w-2 bg-amber-700/50" />
          <div className="absolute right-3 top-0 bottom-0 w-2 bg-amber-700/50" />
          <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-1 bg-amber-700/30" />
        </div>

        {/* Glow when full */}
        {isFull && (
          <div className="absolute inset-0 bg-yellow-400/30 blur-xl rounded-full animate-pulse" />
        )}
      </div>

      {/* Label + stats */}
      <div className="mt-3 text-center">
        <div className="flex items-center justify-center gap-1 text-amber-700 font-bold text-sm">
          <Coins size={14} />
          <span>Treasure Chest</span>
        </div>

        <div className={`text-sm font-bold mt-0.5 ${isEmpty ? 'text-gray-400' : 'text-amber-600'}`}>
          ${amount.toFixed(2)} saved
        </div>

        {/* Progress bar */}
        <div className="mx-2 mt-1.5 h-1.5 bg-amber-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 transition-all duration-700"
            style={{ width: `${clampedProgress}%` }}
          />
        </div>

        <div className="text-xs text-amber-500 mt-1">
          {isEmpty
            ? 'Log income to fill yer chest!'
            : isFull
              ? `🎉 Treasure secured! Next: $${nextMilestone.toLocaleString()}`
              : `$${remaining.toFixed(0)} away from $${MILESTONE.toLocaleString()}`}
        </div>
      </div>
    </div>
  );
};

export default TreasureChest;
