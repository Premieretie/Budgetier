import React, { useState, useMemo } from 'react';
import { XMarkIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';

// ─────────────────────────────────────────────
// SHIP PART DEFINITIONS
// Split: Hull 40%, Sails 25%, Mast 20%, Deck 15%
// 1 HP = 1 Gold
// ─────────────────────────────────────────────
const PARTS = [
  { key: 'hull',  label: 'Hull',  share: 0.40, icon: '🛡️', tagline: 'Patch the hull, captain!' },
  { key: 'sails', label: 'Sails', share: 0.25, icon: '⛵', tagline: 'The sails be torn!' },
  { key: 'mast',  label: 'Mast',  share: 0.20, icon: '🪵', tagline: 'The mast is cracking!' },
  { key: 'deck',  label: 'Deck',  share: 0.15, icon: '🪜', tagline: 'The deck needs sealing!' },
];

// How damaged each part looks given overall ship health
// Parts degrade roughly from bottom-up: hull first, then sails, mast, deck last
const PART_HEALTH_OFFSETS = { hull: 0, sails: 10, mast: 20, deck: 30 };

function getPartHealth(shipHealth, partKey) {
  return Math.max(0, Math.min(100, shipHealth - PART_HEALTH_OFFSETS[partKey]));
}

// ─── SVG Ship ───────────────────────────────
// Health-aware pirate ship SVG. Parts receive opacity/filter based on damage.
function ShipSVG({ health }) {
  const hullDamage  = getPartHealth(health, 'hull');
  const sailsDamage = getPartHealth(health, 'sails');
  const mastDamage  = getPartHealth(health, 'mast');
  const deckDamage  = getPartHealth(health, 'deck');

  // Maps 0-100 health to an opacity 0.3–1.0 (damaged = faded)
  const fade = (h) => 0.3 + (h / 100) * 0.7;
  // Crack overlay opacity (more visible at low health)
  const crack = (h) => Math.max(0, 1 - h / 50);

  return (
    <svg viewBox="0 0 220 180" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-xs mx-auto drop-shadow-xl">

      {/* ── WATER ── */}
      <ellipse cx="110" cy="162" rx="100" ry="12" fill="#0ea5e9" opacity="0.25" />
      <ellipse cx="110" cy="162" rx="80"  ry="7"  fill="#38bdf8" opacity="0.3" />

      {/* ── HULL ── */}
      <g opacity={fade(hullDamage)}>
        <path d="M 30 130 Q 110 155 190 130 L 180 145 Q 110 168 40 145 Z" fill="#92400e" />
        <path d="M 35 125 L 185 125 L 180 138 Q 110 155 40 138 Z" fill="#b45309" />
        {/* Hull planks */}
        <line x1="70"  y1="125" x2="55"  y2="148" stroke="#78350f" strokeWidth="1.5" opacity="0.6" />
        <line x1="110" y1="125" x2="110" y2="152" stroke="#78350f" strokeWidth="1.5" opacity="0.6" />
        <line x1="150" y1="125" x2="165" y2="148" stroke="#78350f" strokeWidth="1.5" opacity="0.6" />
        {/* Waterline */}
        <path d="M 40 138 Q 110 155 180 138" fill="none" stroke="#1d4ed8" strokeWidth="2" opacity="0.4" />
      </g>
      {/* Hull crack overlay */}
      {hullDamage < 50 && (
        <g opacity={crack(hullDamage)}>
          <path d="M 90 128 L 85 140 L 92 136 L 88 148" stroke="#ef4444" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          <path d="M 125 127 L 130 139 L 122 137 L 127 150" stroke="#ef4444" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        </g>
      )}

      {/* ── DECK ── */}
      <g opacity={fade(deckDamage)}>
        <rect x="38" y="112" width="144" height="15" rx="2" fill="#d97706" />
        <rect x="38" y="112" width="144" height="4"  rx="1" fill="#f59e0b" opacity="0.5" />
        {/* Deck boards */}
        {[55,75,95,115,135,155].map(x => (
          <line key={x} x1={x} y1="112" x2={x} y2="127" stroke="#92400e" strokeWidth="1" opacity="0.5" />
        ))}
      </g>
      {/* Deck damage */}
      {deckDamage < 50 && (
        <g opacity={crack(deckDamage)}>
          <path d="M 100 113 L 96 125" stroke="#ef4444" strokeWidth="1.5" fill="none" />
          <path d="M 140 113 L 145 125" stroke="#ef4444" strokeWidth="1.5" fill="none" />
        </g>
      )}

      {/* ── MAST ── */}
      <g opacity={fade(mastDamage)}>
        <rect x="107" y="20" width="6" height="95" rx="2" fill="#78350f" />
        {/* Crow's nest */}
        <rect x="97" y="18" width="26" height="10" rx="3" fill="#92400e" />
        {/* Yard arms */}
        <line x1="60"  y1="55" x2="160" y2="55" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
        <line x1="75"  y1="80" x2="145" y2="80" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
        {/* Rigging */}
        <line x1="110" y1="22" x2="45"  y2="115" stroke="#a16207" strokeWidth="1" opacity="0.6" />
        <line x1="110" y1="22" x2="175" y2="115" stroke="#a16207" strokeWidth="1" opacity="0.6" />
      </g>
      {/* Mast crack */}
      {mastDamage < 50 && (
        <g opacity={crack(mastDamage)}>
          <path d="M 108 55 L 105 70 L 111 65 L 108 80" stroke="#ef4444" strokeWidth="1.5" fill="none"/>
        </g>
      )}

      {/* ── SAILS ── */}
      <g opacity={fade(sailsDamage)}>
        {/* Main sail */}
        <path d="M 113 55 Q 168 68 165 105 L 113 105 Z" fill="#fef3c7" />
        <path d="M 113 55 Q 168 68 165 105 L 113 105 Z" fill="none" stroke="#d97706" strokeWidth="1" opacity="0.5"/>
        {/* Fore sail */}
        <path d="M 107 55 Q 55 68 58 105 L 107 105 Z" fill="#fef9c3" />
        <path d="M 107 55 Q 55 68 58 105 L 107 105 Z" fill="none" stroke="#d97706" strokeWidth="1" opacity="0.5"/>
        {/* Top sail */}
        <path d="M 113 22 Q 148 30 148 52 L 113 52 Z" fill="#fde68a" />
        <path d="M 107 22 Q 72 30 72 52 L 107 52 Z" fill="#fde68a" />
        {/* Skull & crossbones flag */}
        <rect x="108" y="5" width="14" height="12" rx="1" fill="#1f2937" />
        <text x="115" y="15" textAnchor="middle" fontSize="9">☠️</text>
      </g>
      {/* Sail tears */}
      {sailsDamage < 50 && (
        <g opacity={crack(sailsDamage)}>
          <path d="M 138 70 L 132 85 M 148 80 L 143 95" stroke="#ef4444" strokeWidth="1.5" fill="none"/>
          <path d="M 80 72 L 85 85 M 70 82 L 76 95"  stroke="#ef4444" strokeWidth="1.5" fill="none"/>
        </g>
      )}

      {/* Critical flame effect */}
      {health <= 20 && (
        <>
          <text x="48" y="135" fontSize="14" className="animate-bounce" style={{animationDelay:'0ms'}}>🔥</text>
          <text x="158" y="132" fontSize="12" className="animate-bounce" style={{animationDelay:'200ms'}}>🔥</text>
          <text x="96"  y="130" fontSize="10" className="animate-bounce" style={{animationDelay:'400ms'}}>🔥</text>
        </>
      )}
    </svg>
  );
}

// ─── Part repair card ────────────────────────
function PartCard({ part, missing, gold, onRepair, repairing }) {
  const cost      = Math.round(missing * part.share);
  const hpGain    = Math.round(missing * part.share);
  const canAfford = gold >= cost;
  const isFixed   = cost === 0;

  return (
    <div className={`rounded-2xl border-2 p-4 flex flex-col gap-2 transition-all ${
      isFixed
        ? 'border-green-200 bg-green-50'
        : canAfford
          ? 'border-amber-200 bg-amber-50 hover:border-amber-400'
          : 'border-gray-200 bg-gray-50 opacity-60'
    }`}>
      <div className="flex items-center gap-2">
        <span className="text-2xl">{part.icon}</span>
        <div>
          <p className="font-bold text-sm text-gray-800">{part.label}</p>
          <p className="text-xs text-gray-500 italic">{isFixed ? 'Back in fighting shape!' : part.tagline}</p>
        </div>
      </div>

      {!isFixed && (
        <>
          <div className="flex justify-between text-xs text-gray-600">
            <span>Cost</span>
            <span className="font-bold text-amber-700">🪙 {cost} gold</span>
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>Restores</span>
            <span className="font-bold text-green-700">+{hpGain}% hull</span>
          </div>
          <button
            onClick={() => onRepair(cost, hpGain)}
            disabled={!canAfford || repairing}
            className={`mt-1 w-full py-1.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
              canAfford && !repairing
                ? 'bg-amber-500 hover:bg-amber-400 text-white shadow-sm'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <WrenchScrewdriverIcon className="w-4 h-4" />
            {repairing ? 'Repairing…' : canAfford ? `Repair ${part.label}` : 'Not enough gold'}
          </button>
        </>
      )}

      {isFixed && (
        <p className="text-xs text-green-600 font-semibold text-center">✓ No repairs needed</p>
      )}
    </div>
  );
}

// ─── Main modal ──────────────────────────────
export default function ShipRepairModal({ health = 100, gold = 0, onClose, onRepair }) {
  const [repairing, setRepairing] = useState(null); // key of part being repaired
  const [localHealth, setLocalHealth] = useState(health);
  const [localGold,   setLocalGold]   = useState(gold);

  const missing = Math.max(0, 100 - localHealth);

  const totalCost = missing; // 1 gold per 1 HP

  const statusLabel = useMemo(() => {
    if (localHealth >= 80) return { label: 'Seaworthy', color: 'text-green-700', bg: 'bg-green-100' };
    if (localHealth >= 50) return { label: 'Storm Damage', color: 'text-amber-700', bg: 'bg-amber-100' };
    if (localHealth >= 20) return { label: 'Heavy Damage', color: 'text-orange-700', bg: 'bg-orange-100' };
    return { label: '⚠️ Critical!', color: 'text-red-700', bg: 'bg-red-100 animate-pulse' };
  }, [localHealth]);

  const handlePartRepair = async (cost, hpGain, partKey) => {
    if (localGold < cost) return;
    setRepairing(partKey);
    try {
      await onRepair(cost, hpGain);
      // Optimistic update
      setLocalHealth(h => Math.min(100, h + hpGain));
      setLocalGold(g => g - cost);
    } finally {
      setRepairing(null);
    }
  };

  const handleRepairAll = async () => {
    if (localGold < totalCost || missing === 0) return;
    setRepairing('all');
    try {
      await onRepair(totalCost, missing);
      setLocalHealth(100);
      setLocalGold(g => g - totalCost);
    } finally {
      setRepairing(null);
    }
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-3xl px-6 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⛵</span>
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">Ship Repair Dock</h2>
              <p className="text-xs text-gray-500">Spend gold to restore hull integrity</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* Status badge + gold */}
          <div className="flex items-center justify-between">
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${statusLabel.bg} ${statusLabel.color}`}>
              {statusLabel.label} — {localHealth}% HP
            </span>
            <span className="text-sm font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full">
              🪙 {localGold} gold available
            </span>
          </div>

          {/* Critical warning */}
          {localHealth < 30 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-red-700 text-sm font-semibold">
              ⚠️ The ship be falling apart! Repair her before she sinks!
            </div>
          )}

          {/* SVG Ship */}
          <div className="py-2">
            <ShipSVG health={localHealth} />
          </div>

          {/* Health bar */}
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Hull Integrity</span>
              <span className="font-bold">{localHealth}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  localHealth >= 80 ? 'bg-green-500' :
                  localHealth >= 50 ? 'bg-amber-500' :
                  localHealth >= 20 ? 'bg-orange-500' : 'bg-red-500'
                }`}
                style={{ width: `${localHealth}%` }}
              />
            </div>
          </div>

          {/* Repair all button */}
          {missing > 0 && (
            <button
              onClick={handleRepairAll}
              disabled={localGold < totalCost || repairing !== null}
              className={`w-full py-3 rounded-2xl font-extrabold text-base flex items-center justify-center gap-2 transition-all shadow-md ${
                localGold >= totalCost && repairing === null
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-white'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <WrenchScrewdriverIcon className="w-5 h-5" />
              {repairing === 'all'
                ? 'Repairing everything…'
                : localGold >= totalCost
                  ? `⚓ Full Repair — ${totalCost} gold`
                  : `Need ${totalCost} gold (have ${localGold})`}
            </button>
          )}

          {/* Full already */}
          {missing === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-4 text-center text-green-700 font-bold">
              ⭐ Ship is in perfect condition, Captain!
            </div>
          )}

          {/* Per-part cards */}
          {missing > 0 && (
            <>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Repair by Part</h3>
              <div className="grid grid-cols-2 gap-3">
                {PARTS.map(part => (
                  <PartCard
                    key={part.key}
                    part={part}
                    missing={missing}
                    gold={localGold}
                    repairing={repairing === part.key}
                    onRepair={(cost, hpGain) => handlePartRepair(cost, hpGain, part.key)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
