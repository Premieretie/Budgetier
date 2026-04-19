import React from 'react';
import { Ship, AlertTriangle, Wrench } from 'lucide-react';

const ShipHealth = ({ health = 100, status = 'smooth', message = '', onRepair, gold = 0 }) => {
  // Determine ship appearance based on health
  const getShipColor = () => {
    if (health <= 30) return 'text-red-600';
    if (health <= 60) return 'text-amber-600';
    return 'text-blue-600';
  };

  const getHealthColor = () => {
    if (health <= 30) return 'bg-red-500';
    if (health <= 60) return 'bg-amber-500';
    return 'bg-green-500';
  };

  const getHealthBg = () => {
    if (health <= 30) return 'bg-red-100';
    if (health <= 60) return 'bg-amber-100';
    return 'bg-green-100';
  };

  const getStatusIcon = () => {
    if (health <= 30) return '☠️';
    if (health <= 60) return '🌊';
    if (health >= 90) return '⚓';
    return '⛵';
  };

  const repairCost = Math.max(10, Math.floor((100 - health) / 2));
  const canAfford = gold >= repairCost;

  return (
    <div className={`rounded-2xl p-4 ${getHealthBg()} border-2 border-opacity-30 ${
      health <= 30 ? 'border-red-500 animate-pulse' : 
      health <= 60 ? 'border-amber-500' : 'border-green-500'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getStatusIcon()}</span>
          <div>
            <h3 className={`font-bold ${getShipColor()}`}>Ship Health</h3>
            <p className="text-xs text-gray-600">{message}</p>
          </div>
        </div>
        <Ship size={28} className={getShipColor()} />
      </div>

      {/* Health Bar */}
      <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden mb-3">
        <div 
          className={`h-full ${getHealthColor()} transition-all duration-500 ease-out`}
          style={{ width: `${health}%` }}
        >
          {/* Animated waves effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
        </div>
        
        {/* Damage indicators */}
        {health <= 60 && (
          <div className="absolute top-1/2 -translate-y-1/2 left-1/2 text-xs text-red-700 font-bold">
            {health <= 30 && <AlertTriangle size={12} className="inline" />}
          </div>
        )}
      </div>

      {/* Health Text */}
      <div className="flex justify-between items-center text-sm mb-2">
        <span className="text-gray-600">Hull Integrity</span>
        <span className={`font-bold ${getShipColor()}`}>{health}%</span>
      </div>

      {/* Repair Button */}
      {health < 100 && (
        <button
          onClick={() => canAfford && onRepair && onRepair(repairCost)}
          disabled={!canAfford}
          className={`w-full py-2 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
            canAfford 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Wrench size={16} />
          <span>Repair Ship ({repairCost} gold)</span>
        </button>
      )}

      {/* Status Messages */}
      {health <= 30 && (
        <div className="mt-2 p-2 bg-red-200/50 rounded-lg text-xs text-red-800 text-center font-medium">
          ⚠️ CRITICAL: Ship needs repairs NOW!
        </div>
      )}
      {health >= 90 && (
        <div className="mt-2 p-2 bg-green-200/50 rounded-lg text-xs text-green-800 text-center font-medium">
          ⭐ Ship in pristine condition!
        </div>
      )}
    </div>
  );
};

export default ShipHealth;
