import React, { useState, useMemo } from 'react';
import { XMarkIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import { useCosmeticStore } from '../hooks/useCosmeticStore';

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
function ShipSVG({ health, theme = {} }) {
  const hullDamage  = getPartHealth(health, 'hull');
  const sailsDamage = getPartHealth(health, 'sails');
  const mastDamage  = getPartHealth(health, 'mast');
  const deckDamage  = getPartHealth(health, 'deck');

  const hullColor  = theme.hullFill       || '#92400e';
  const hullHl     = theme.hullHighlight  || '#b45309';
  const sailColor  = theme.sailFill       || '#fef3c7';
  const sailStroke = theme.sailStroke     || '#d97706';
  const mastColor  = theme.mastFill       || '#78350f';
  const waterColor = theme.waterFill      || '#0ea5e9';

  // Maps 0-100 health to an opacity 0.3–1.0 (damaged = faded)
  const fade = (h) => 0.3 + (h / 100) * 0.7;
  // Crack overlay opacity (more visible at low health)
  const crack = (h) => Math.max(0, 1 - h / 50);

  return (
    /*
      Side-profile pirate ship facing RIGHT.
      Canvas: 280 × 160
      Waterline: y=118
      Hull bottom: y=138
      Deck top: y=98
      Main mast base: x=120, top: y=18
      Fore mast base: x=170, top: y=40
    */
    <svg viewBox="0 0 280 160" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-sm mx-auto drop-shadow-xl">

      {/* ── WATER ── */}
      <rect x="0" y="118" width="280" height="42" fill="#0c4a6e" opacity="0.15" rx="4"/>
      <path d="M 0 122 Q 35 118 70 122 Q 105 126 140 122 Q 175 118 210 122 Q 245 126 280 122 L 280 160 L 0 160 Z"
            fill={waterColor} opacity="0.25"/>
      <path d="M 0 126 Q 40 122 80 126 Q 120 130 160 126 Q 200 122 240 126 Q 260 128 280 126"
            fill="none" stroke={waterColor} strokeWidth="1.5" opacity="0.5"/>

      {/* ── HULL ── */}
      {/*
        Hull is a boat-shaped polygon seen from the side.
        Bow (right) curves up to a point, stern (left) has a raised transom.
        Below waterline: dark shadow.
      */}
      <g opacity={fade(hullDamage)}>
        {/* Below-waterline shadow */}
        <path d="M 38 118 L 242 118 Q 258 118 264 128 L 38 135 Q 26 130 24 118 Z"
              fill="#1e3a5f" opacity="0.35"/>

        {/* Main hull body */}
        <path d="M 30 118
                 L 30 108
                 Q 32 100 40 98
                 L 230 98
                 Q 248 98 262 108
                 L 268 118
                 Q 260 138 240 140
                 L 48 140
                 Q 30 138 30 118 Z"
              fill={hullColor}/>

        {/* Hull highlight (top strip) */}
        <path d="M 40 98 L 230 98 Q 248 98 262 108 L 268 118 Q 248 102 230 100 L 40 100 Q 32 102 30 108 Z"
              fill={hullHl}/>

        {/* Hull planks (horizontal lines along the side) */}
        {[104, 110, 116, 122, 128].map((y, i) => (
          <line key={i}
                x1={i === 4 ? 36 : 32} y1={y}
                x2={i === 4 ? 244 : 260} y2={y}
                stroke="#78350f" strokeWidth="1" opacity="0.35"/>
        ))}

        {/* Stern decoration (left side) */}
        <rect x="28" y="100" width="14" height="38" rx="3" fill={hullHl} opacity="0.7"/>
        <rect x="30" y="103" width="10" height="6"  rx="1" fill="#fbbf24" opacity="0.5"/>
        <rect x="30" y="115" width="10" height="6"  rx="1" fill="#fbbf24" opacity="0.5"/>
        <rect x="30" y="127" width="10" height="6"  rx="1" fill="#fbbf24" opacity="0.5"/>

        {/* Cannon port */}
        <rect x="80"  y="110" width="14" height="8" rx="2" fill="#1c1917" opacity="0.6"/>
        <rect x="140" y="110" width="14" height="8" rx="2" fill="#1c1917" opacity="0.6"/>
        <rect x="200" y="110" width="14" height="8" rx="2" fill="#1c1917" opacity="0.6"/>

        {/* Bow (right) pointed prow */}
        <path d="M 262 108 Q 274 112 274 118 Q 272 126 262 128 L 262 108 Z"
              fill={hullHl}/>
        <path d="M 268 118 L 280 118" stroke="#92400e" strokeWidth="2"/>

        {/* Waterline stripe */}
        <path d="M 32 118 L 266 118" stroke="#1d4ed8" strokeWidth="2" opacity="0.4"/>
      </g>

      {/* Hull crack overlay */}
      {hullDamage < 50 && (
        <g opacity={crack(hullDamage)}>
          <path d="M 100 105 L 95 118 L 103 114 L 98 128" stroke="#ef4444" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          <path d="M 180 106 L 186 118 L 178 115 L 184 130" stroke="#ef4444" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          {hullDamage < 25 && (
            <path d="M 140 103 L 135 120 L 144 116 L 138 135" stroke="#ef4444" strokeWidth="2" fill="none" strokeLinecap="round"/>
          )}
        </g>
      )}

      {/* ── DECK ── */}
      <g opacity={fade(deckDamage)}>
        {/* Deck surface */}
        <rect x="32" y="93" width="232" height="7" rx="2" fill={hullHl}/>
        <rect x="32" y="93" width="232" height="3" rx="1" fill={sailColor} opacity="0.45"/>
        {/* Deck planks (vertical lines across deck) */}
        {[60, 90, 120, 150, 180, 210, 240].map(x => (
          <line key={x} x1={x} y1="93" x2={x} y2="100" stroke="#92400e" strokeWidth="1" opacity="0.5"/>
        ))}
        {/* Railing posts */}
        {[50, 80, 110, 140, 170, 200, 230, 255].map(x => (
          <line key={x} x1={x} y1="86" x2={x} y2="94" stroke="#a16207" strokeWidth="2" opacity="0.7"/>
        ))}
        {/* Top railing */}
        <line x1="42" y1="87" x2="262" y2="87" stroke="#b45309" strokeWidth="2" opacity="0.8"/>
      </g>
      {/* Deck crack overlay */}
      {deckDamage < 50 && (
        <g opacity={crack(deckDamage)}>
          <path d="M 120 93 L 116 100" stroke="#ef4444" strokeWidth="1.5" fill="none"/>
          <path d="M 200 93 L 205 100" stroke="#ef4444" strokeWidth="1.5" fill="none"/>
        </g>
      )}

      {/* ── MAIN MAST (center) ── */}
      <g opacity={fade(mastDamage)}>
        {/* Mast pole */}
        <rect x="118" y="16" width="7" height="78" rx="2" fill={mastColor}/>
        {/* Crow's nest */}
        <rect x="108" y="13" width="27" height="9" rx="3" fill={hullColor}/>
        <rect x="111" y="10" width="21" height="5" rx="2" fill={hullHl}/>
        {/* Yard arms */}
        <line x1="68"  y1="40" x2="175" y2="40" stroke={mastColor} strokeWidth="5" strokeLinecap="round"/>
        <line x1="78"  y1="62" x2="168" y2="62" stroke={mastColor} strokeWidth="4" strokeLinecap="round"/>
        {/* Rigging lines */}
        <line x1="121" y1="18" x2="42"  y2="87" stroke={hullHl} strokeWidth="1.2" opacity="0.55"/>
        <line x1="121" y1="18" x2="200" y2="87" stroke={hullHl} strokeWidth="1.2" opacity="0.55"/>
        <line x1="121" y1="18" x2="260" y2="90" stroke={hullHl} strokeWidth="1"   opacity="0.4"/>
      </g>
      {/* Mast crack overlay */}
      {mastDamage < 50 && (
        <g opacity={crack(mastDamage)}>
          <path d="M 119 45 L 115 58 L 123 53 L 118 68" stroke="#ef4444" strokeWidth="1.5" fill="none"/>
        </g>
      )}

      {/* ── FORE MAST (right, shorter) ── */}
      <g opacity={fade(mastDamage)}>
        <rect x="198" y="38" width="5" height="56" rx="2" fill={mastColor}/>
        {/* Yard arm */}
        <line x1="168" y1="55" x2="230" y2="55" stroke={mastColor} strokeWidth="4" strokeLinecap="round"/>
        {/* Rigging */}
        <line x1="200" y1="40" x2="260" y2="88" stroke={hullHl} strokeWidth="1" opacity="0.45"/>
        <line x1="200" y1="40" x2="140" y2="87" stroke={hullHl} strokeWidth="1" opacity="0.45"/>
      </g>

      {/* ── SAILS ── */}
      <g opacity={fade(sailsDamage)}>
        {/* Main sail (billowing right — wind from left) */}
        <path d="M 122 40 Q 172 50 170 88 L 122 88 Z" fill={sailColor}/>
        <path d="M 122 40 Q 172 50 170 88 L 122 88 Z" fill="none" stroke={sailStroke} strokeWidth="1" opacity="0.5"/>
        {/* Main sail left side (smaller) */}
        <path d="M 118 40 Q 75 52 78 88 L 118 88 Z" fill={sailColor} opacity="0.9"/>
        <path d="M 118 40 Q 75 52 78 88 L 118 88 Z" fill="none" stroke={sailStroke} strokeWidth="1" opacity="0.4"/>
        {/* Top sail */}
        <path d="M 122 16 Q 152 24 150 38 L 122 38 Z" fill={sailColor} opacity="0.85"/>
        <path d="M 118 16 Q 90 24 92 38 L 118 38 Z"  fill={sailColor} opacity="0.85"/>

        {/* Fore mast sail */}
        <path d="M 200 55 Q 232 63 228 88 L 200 88 Z" fill={sailColor} opacity="0.9"/>
        <path d="M 199 55 Q 170 63 172 88 L 199 88 Z" fill={sailColor} opacity="0.8"/>

        {/* Skull & crossbones flag at top of main mast */}
        <rect x="106" y="2" width="15" height="11" rx="1" fill="#1f2937"/>
        <text x="113" y="12" textAnchor="middle" fontSize="8">☠️</text>
        {/* Flag ripple line */}
        <path d="M 121 5 Q 128 7 121 10" fill="none" stroke="#374151" strokeWidth="1"/>
      </g>

      {/* Sail tear overlay */}
      {sailsDamage < 50 && (
        <g opacity={crack(sailsDamage)}>
          <path d="M 148 55 L 142 72 M 158 65 L 153 80" stroke="#ef4444" strokeWidth="1.5" fill="none"/>
          <path d="M 88 58 L 93 73 M 80 68 L 85 82"    stroke="#ef4444" strokeWidth="1.5" fill="none"/>
        </g>
      )}

      {/* ── CRITICAL FIRE ── */}
      {health <= 20 && (
        <>
          <text x="56"  y="110" fontSize="16" style={{animationDelay:'0ms'}}   className="animate-bounce">🔥</text>
          <text x="160" y="108" fontSize="13" style={{animationDelay:'200ms'}} className="animate-bounce">🔥</text>
          <text x="220" y="110" fontSize="12" style={{animationDelay:'350ms'}} className="animate-bounce">🔥</text>
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
function ShipWithTheme({ health }) {
  const { getTheme } = useCosmeticStore();
  return <ShipSVG health={health} theme={getTheme()} />;
}

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
            <ShipWithTheme health={localHealth} />
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
