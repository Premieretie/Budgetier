import React, { useState, useEffect, useCallback } from 'react';
import { LockClosedIcon, CheckBadgeIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import useSubscription from '../hooks/useSubscription';
import api from '../utils/api';

const TYPE_LABELS = {
  theme: '🚢 Ship Themes',
  chest: '📦 Treasure Chests',
};

const ItemCard = ({ item, onUnlock, onEquip, isPremium }) => {
  const [loading, setLoading] = useState(false);

  const isLocked = !item.owned && (
    (item.unlock_method === 'premium' && !isPremium) ||
    (item.unlock_method === 'gold' && !item.owned)
  );

  const handleAction = async () => {
    setLoading(true);
    try {
      if (!item.owned) {
        await onUnlock(item.key);
      } else if (!item.is_equipped) {
        await onEquip(item.key);
      }
    } finally {
      setLoading(false);
    }
  };

  const colors = item.preview_colors || {};
  const bgStyle = colors.primary
    ? { background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary || colors.primary})` }
    : { background: `linear-gradient(135deg, ${colors.fill || '#f59e0b'}, ${colors.border || '#b45309'})` };

  return (
    <div className={`rounded-3xl border-2 p-5 bg-white transition-all hover:shadow-lg ${
      item.is_equipped ? 'border-amber-400 ring-2 ring-amber-400/20' :
      item.owned ? 'border-green-200' : 'border-gray-200 hover:border-gray-300'
    }`}>
      {/* Preview */}
      <div className="rounded-2xl h-24 flex items-center justify-center mb-4 relative overflow-hidden" style={bgStyle}>
        <span className="text-5xl drop-shadow-lg">{item.preview_emoji}</span>
        {isLocked && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-2xl">
            <LockClosedIcon className="w-8 h-8 text-white" />
          </div>
        )}
        {item.is_equipped && (
          <div className="absolute top-2 right-2 bg-amber-500 rounded-full p-1">
            <CheckBadgeIcon className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      <h3 className="font-bold text-gray-900 text-sm mb-1">{item.name}</h3>
      <p className="text-gray-500 text-xs mb-3 line-clamp-2">{item.description}</p>

      {/* Unlock badge */}
      <div className="flex items-center gap-2 mb-3">
        {item.unlock_method === 'default' && (
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Default</span>
        )}
        {item.unlock_method === 'premium' && (
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1">
            <SparklesIcon className="w-3 h-3" /> Premium
          </span>
        )}
        {item.unlock_method === 'gold' && (
          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
            🪙 {item.gold_cost?.toLocaleString()} gold
          </span>
        )}
      </div>

      {/* Action button */}
      {item.is_equipped ? (
        <div className="w-full text-center text-xs font-semibold text-amber-600 bg-amber-50 py-2 rounded-xl border border-amber-200">
          ✓ Equipped
        </div>
      ) : item.owned ? (
        <button
          onClick={handleAction}
          disabled={loading}
          className="w-full text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 py-2 rounded-xl border border-blue-200 transition-colors disabled:opacity-50"
        >
          {loading ? 'Equipping...' : 'Equip'}
        </button>
      ) : item.unlock_method === 'premium' && !isPremium ? (
        <Link
          to="/pricing"
          className="block w-full text-center text-xs font-semibold text-white bg-amber-500 hover:bg-amber-400 py-2 rounded-xl transition-colors"
        >
          Upgrade to unlock
        </Link>
      ) : (
        <button
          onClick={handleAction}
          disabled={loading || !item.available}
          className="w-full text-xs font-semibold text-white bg-gray-800 hover:bg-gray-700 py-2 rounded-xl transition-colors disabled:opacity-40"
        >
          {loading ? 'Unlocking...' : item.unlock_method === 'gold' ? `Unlock for 🪙${item.gold_cost?.toLocaleString()}` : 'Unlock'}
        </button>
      )}
    </div>
  );
};

const Cosmetics = () => {
  const { success, error } = useToast();
  const { isPremium } = useSubscription();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState('theme');

  const fetchShop = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/cosmetics/shop');
      if (res.data?.success) {
        setItems(res.data.data.items);
      }
    } catch (err) {
      error('Failed to load cosmetics shop');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchShop();
  }, [fetchShop]);

  const handleUnlock = async (key) => {
    try {
      const res = await api.post(`/cosmetics/unlock/${key}`);
      if (res.data?.success) {
        success(res.data.message);
        fetchShop();
      } else {
        error(res.data?.message || 'Could not unlock item');
      }
    } catch (err) {
      error(err.response?.data?.message || 'Could not unlock item');
    }
  };

  const handleEquip = async (key) => {
    try {
      const res = await api.post(`/cosmetics/equip/${key}`);
      if (res.data?.success) {
        success('Item equipped! ⚓');
        fetchShop();
      } else {
        error(res.data?.message || 'Could not equip item');
      }
    } catch (err) {
      error(err.response?.data?.message || 'Could not equip item');
    }
  };

  const typeKeys = [...new Set(items.map(i => i.type))];
  const filtered = items.filter(i => i.type === activeType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Cosmetics Shop</h1>
          <p className="page-description">Customize your ship and treasure chest</p>
        </div>
        {!isPremium && (
          <Link
            to="/pricing"
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all shadow-sm"
          >
            <SparklesIcon className="w-4 h-4" />
            Upgrade
          </Link>
        )}
      </div>

      {/* Premium Banner */}
      {!isPremium && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div>
            <p className="font-bold text-amber-900 text-sm">⚓ Unlock all Premium cosmetics</p>
            <p className="text-amber-700 text-xs mt-0.5">7-day free trial — no credit card needed</p>
          </div>
          <Link
            to="/pricing"
            className="bg-amber-500 hover:bg-amber-400 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all whitespace-nowrap"
          >
            Start free trial
          </Link>
        </div>
      )}

      {/* Type tabs */}
      <div className="flex gap-2 flex-wrap">
        {typeKeys.map((type) => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeType === type
                ? 'bg-gray-900 text-white shadow'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {TYPE_LABELS[type] || type}
          </button>
        ))}
      </div>

      {/* Items grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <ItemCard
              key={item.key}
              item={item}
              onUnlock={handleUnlock}
              onEquip={handleEquip}
              isPremium={isPremium}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Cosmetics;
