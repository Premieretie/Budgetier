import React, { useEffect, useState } from 'react';
import { Sparkles, X } from 'lucide-react';

const rarityColors = {
  common: 'bg-stone-400',
  uncommon: 'bg-green-500',
  rare: 'bg-blue-500',
  epic: 'bg-purple-500',
  legendary: 'bg-amber-500',
};

const rarityGradients = {
  common: 'from-stone-300 to-stone-500',
  uncommon: 'from-green-300 to-green-600',
  rare: 'from-blue-300 to-blue-600',
  epic: 'from-purple-300 to-purple-600',
  legendary: 'from-amber-300 via-yellow-400 to-amber-600',
};

const rarityGlow = {
  common: '',
  uncommon: 'shadow-green-500/50',
  rare: 'shadow-blue-500/50',
  epic: 'shadow-purple-500/50',
  legendary: 'shadow-amber-500/50 shadow-lg',
};

const LootDrop = ({ loot, onClose }) => {
  const [show, setShow] = useState(true);
  const [animationStage, setAnimationStage] = useState(0);

  useEffect(() => {
    if (!loot) return;
    
    // Animation sequence
    const timers = [
      setTimeout(() => setAnimationStage(1), 100),  // Show burst
      setTimeout(() => setAnimationStage(2), 500),  // Show item
    ];

    // Auto close after 4 seconds
    const closeTimer = setTimeout(() => {
      handleClose();
    }, 4000);

    return () => {
      timers.forEach(t => clearTimeout(t));
      clearTimeout(closeTimer);
    };
  }, [loot]);

  const handleClose = () => {
    setShow(false);
    setTimeout(() => onClose && onClose(), 300);
  };

  if (!show || !loot) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto" onClick={handleClose} />
      
      {/* Loot Container */}
      <div className={`relative pointer-events-auto transition-all duration-500 ${
        animationStage >= 2 ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
      }`}>
        {/* Glow/Particles */}
        {animationStage >= 1 && (
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Rotating sparkles */}
            <div className="absolute w-48 h-48 animate-spin" style={{ animationDuration: '3s' }}>
              <Sparkles className="absolute top-0 left-1/2 -translate-x-1/2 text-yellow-400" size={24} />
              <Sparkles className="absolute bottom-0 left-1/2 -translate-x-1/2 text-yellow-400" size={20} />
              <Sparkles className="absolute left-0 top-1/2 -translate-y-1/2 text-yellow-400" size={28} />
              <Sparkles className="absolute right-0 top-1/2 -translate-y-1/2 text-yellow-400" size={18} />
            </div>
            
            {/* Burst effect */}
            <div className={`absolute w-40 h-40 rounded-full ${rarityColors[loot.rarity]} opacity-30 animate-ping`} />
            <div className={`absolute w-32 h-32 rounded-full bg-gradient-to-r ${rarityGradients[loot.rarity]} opacity-50 blur-xl animate-pulse`} />
          </div>
        )}

        {/* Loot Card */}
        <div className={`relative bg-white rounded-2xl p-6 shadow-2xl border-4 ${
          loot.rarity === 'legendary' ? 'border-amber-500' :
          loot.rarity === 'epic' ? 'border-purple-500' :
          loot.rarity === 'rare' ? 'border-blue-500' :
          loot.rarity === 'uncommon' ? 'border-green-500' : 'border-stone-400'
        } ${rarityGlow[loot.rarity]}`}>
          {/* Close button */}
          <button 
            onClick={handleClose}
            className="absolute -top-3 -right-3 w-8 h-8 bg-gray-800 text-white rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
          >
            <X size={16} />
          </button>

          {/* Rarity Badge */}
          <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white ${rarityColors[loot.rarity]}`}>
            {loot.rarity}
          </div>

          {/* Icon */}
          <div className="text-center mt-4">
            <div className={`inline-block text-6xl animate-bounce`} style={{ animationDuration: '1.5s' }}>
              {loot.icon}
            </div>
          </div>

          {/* Name */}
          <h3 className="text-xl font-bold text-center mt-3 text-gray-800">
            {loot.name}
          </h3>

          {/* Rewards */}
          <div className="flex justify-center gap-4 mt-3">
            <div className="flex items-center gap-1 bg-yellow-100 px-3 py-1 rounded-full">
              <span className="text-lg">🪙</span>
              <span className="font-bold text-yellow-700">+{loot.gold}</span>
            </div>
            <div className="flex items-center gap-1 bg-blue-100 px-3 py-1 rounded-full">
              <span className="text-lg">⭐</span>
              <span className="font-bold text-blue-700">+{loot.xp}</span>
            </div>
          </div>

          {/* Message */}
          <p className="text-center text-sm text-gray-500 mt-3">
            Found while logging expenses!
          </p>
        </div>

        {/* Coins falling animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute text-yellow-400 animate-bounce"
              style={{
                left: `${10 + i * 15}%`,
                top: '100%',
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1s',
              }}
            >
              🪙
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LootDrop;
