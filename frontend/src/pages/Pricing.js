import React, { useState } from 'react';
import { CheckIcon, XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useToast } from '../hooks/useToast';
import useSubscription from '../hooks/useSubscription';

const FREE_FEATURES = [
  { label: 'Expense tracking', included: true },
  { label: '3 active goals', included: true },
  { label: 'Gold & streak system', included: true },
  { label: 'Quick-add expense buttons', included: true },
  { label: 'Basic achievements', included: true },
  { label: 'Custom ship themes', included: false },
  { label: 'Unlimited goals', included: false },
  { label: 'Advanced statistics', included: false },
  { label: 'Rare loot drops', included: false },
];

const PREMIUM_FEATURES = [
  { label: 'Everything in Free', included: true },
  { label: 'Unlimited goals', included: true },
  { label: 'Advanced charts & stats', included: true },
  { label: 'Custom ship themes & skins', included: true },
  { label: 'Rare & legendary loot drops', included: true },
  { label: 'Premium achievements', included: true },
  { label: 'Priority support', included: true },
  { label: 'Early access to AI insights', included: true },
];

const UpgradeModal = ({ onClose, onStartTrial, onUpgrade, hasUsedTrial }) => {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState(hasUsedTrial ? 'pay' : 'trial');

  const handleAction = async () => {
    setLoading(true);
    try {
      if (mode === 'trial') {
        await onStartTrial();
      } else {
        await onUpgrade();
      }
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600">
          <XMarkIcon className="w-5 h-5" />
        </button>
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">⚓</div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Upgrade Your Ship</h2>
          <p className="text-gray-500 text-sm">Unlock the full power of Budgetier Premium</p>
        </div>

        {!hasUsedTrial && (
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            <button
              onClick={() => setMode('trial')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'trial' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
            >
              7-day free trial
            </button>
            <button
              onClick={() => setMode('pay')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'pay' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
            >
              Subscribe now
            </button>
          </div>
        )}

        {mode === 'trial' ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-center">
            <p className="text-amber-800 font-semibold text-sm">Start free for 7 days</p>
            <p className="text-amber-600 text-xs mt-1">Full Premium access. No credit card needed.</p>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 text-center">
            <p className="text-3xl font-extrabold text-gray-900">$7<span className="text-base font-normal text-gray-400">/month</span></p>
            <p className="text-gray-500 text-xs mt-1">Cancel anytime</p>
          </div>
        )}

        <button
          onClick={handleAction}
          disabled={loading}
          className="w-full bg-amber-500 hover:bg-amber-400 text-white font-bold py-4 rounded-2xl transition-all shadow-lg hover:shadow-amber-300 disabled:opacity-50"
        >
          {loading ? 'Setting sail...' : mode === 'trial' ? 'Start Free Trial' : 'Upgrade to Premium'}
        </button>
        <p className="text-center text-xs text-gray-400 mt-3">Secured • Cancel anytime</p>
      </div>
    </div>
  );
};

const Pricing = () => {
  const { success, error } = useToast();
  const { subscription, isPremium, loading, startTrial, upgrade, cancel } = useSubscription();
  const [showModal, setShowModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const hasUsedTrial = !!subscription?.trialEndsAt;

  const handleStartTrial = async () => {
    try {
      const result = await startTrial();
      if (result?.success) {
        success('🎉 Your 7-day Premium trial has started!');
      } else {
        error(result?.message || 'Could not start trial');
      }
    } catch {
      error('Something went wrong');
    }
  };

  const handleUpgrade = async () => {
    try {
      const result = await upgrade();
      if (result?.success) {
        success('⚓ Welcome to Premium, Captain!');
      } else {
        error(result?.message || 'Upgrade failed');
      }
    } catch {
      error('Something went wrong');
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const result = await cancel();
      if (result?.success) {
        success('Subscription cancelled. You\'re on the Free plan.');
      } else {
        error(result?.message || 'Could not cancel');
      }
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Simple, honest pricing</h1>
        <p className="text-gray-500">Start free. Upgrade when you're ready.</p>

        {/* Current plan badge */}
        {!loading && (
          <div className={`inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full text-sm font-semibold ${
            isPremium
              ? 'bg-amber-100 text-amber-800 border border-amber-200'
              : 'bg-gray-100 text-gray-600 border border-gray-200'
          }`}>
            {isPremium ? '✨' : '⚓'} Current plan: {isPremium ? 'Premium' : 'Free'}
          </div>
        )}
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {/* Free */}
        <div className={`rounded-3xl border-2 p-8 bg-white ${!isPremium ? 'border-gray-900 ring-2 ring-gray-900/10' : 'border-gray-200'}`}>
          <div className="mb-6">
            {!isPremium && (
              <span className="bg-gray-900 text-white text-xs font-bold px-3 py-1 rounded-full mb-3 inline-block">CURRENT PLAN</span>
            )}
            <h2 className="text-xl font-bold text-gray-900 mb-1">Free</h2>
            <p className="text-gray-500 text-sm">Everything you need to start</p>
            <div className="mt-4">
              <span className="text-4xl font-extrabold text-gray-900">$0</span>
              <span className="text-gray-400 text-sm"> / forever</span>
            </div>
          </div>
          <ul className="space-y-3 mb-8">
            {FREE_FEATURES.map((f) => (
              <li key={f.label} className="flex items-center gap-3 text-sm">
                {f.included
                  ? <CheckIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                  : <XMarkIcon className="w-4 h-4 text-gray-300 flex-shrink-0" />
                }
                <span className={f.included ? 'text-gray-700' : 'text-gray-400'}>{f.label}</span>
              </li>
            ))}
          </ul>
          {!isPremium
            ? <div className="w-full text-center bg-gray-100 text-gray-500 font-semibold py-3 rounded-xl text-sm">Your current plan</div>
            : <button onClick={handleCancel} disabled={cancelling} className="w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-colors text-sm disabled:opacity-50">
                {cancelling ? 'Cancelling...' : 'Downgrade to Free'}
              </button>
          }
        </div>

        {/* Premium */}
        <div className={`rounded-3xl border-2 p-8 relative overflow-hidden ${isPremium ? 'border-amber-400 bg-gradient-to-b from-amber-50 to-white ring-2 ring-amber-400/20' : 'border-amber-300 bg-gradient-to-b from-amber-50/50 to-white'}`}>
          {isPremium && (
            <span className="absolute top-4 right-4 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">ACTIVE</span>
          )}
          {!isPremium && (
            <span className="absolute top-4 right-4 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">MOST POPULAR</span>
          )}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <SparklesIcon className="w-5 h-5 text-amber-500" />
              <h2 className="text-xl font-bold text-gray-900">Premium</h2>
            </div>
            <p className="text-gray-500 text-sm">For serious treasure hunters</p>
            <div className="mt-4">
              <span className="text-4xl font-extrabold text-gray-900">$7</span>
              <span className="text-gray-400 text-sm"> / month</span>
            </div>
          </div>
          <ul className="space-y-3 mb-8">
            {PREMIUM_FEATURES.map((f) => (
              <li key={f.label} className="flex items-center gap-3 text-sm">
                <CheckIcon className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span className="text-gray-700 font-medium">{f.label}</span>
              </li>
            ))}
          </ul>
          {isPremium ? (
            <div className="w-full text-center bg-amber-100 text-amber-800 font-semibold py-3 rounded-xl text-sm">
              ✅ Active — Enjoy the voyage!
            </div>
          ) : (
            <button
              onClick={() => setShowModal(true)}
              className="w-full bg-amber-500 hover:bg-amber-400 text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-amber-300 text-sm"
            >
              {hasUsedTrial ? 'Upgrade to Premium' : 'Start 7-day free trial'}
            </button>
          )}
          {!isPremium && !hasUsedTrial && (
            <p className="text-center text-xs text-gray-400 mt-3">No credit card required for trial</p>
          )}
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto">
        <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">Common questions</h3>
        <div className="space-y-3">
          {[
            { q: 'Can I cancel anytime?', a: "Yes. Cancel from this page at any time. You won't be charged again." },
            { q: 'What happens when the free trial ends?', a: "You'll drop back to the Free plan automatically — no surprise charges." },
            { q: 'Is my data safe if I downgrade?', a: "Absolutely. Your expenses, goals, and history are always preserved." },
            { q: 'When will payments be live?', a: "Stripe integration is coming soon. For now, upgrades are free to try!" },
          ].map((item) => (
            <div key={item.q} className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
              <p className="font-semibold text-gray-900 text-sm mb-1">{item.q}</p>
              <p className="text-gray-500 text-sm">{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <UpgradeModal
          onClose={() => setShowModal(false)}
          onStartTrial={handleStartTrial}
          onUpgrade={handleUpgrade}
          hasUsedTrial={hasUsedTrial}
        />
      )}
    </div>
  );
};

export default Pricing;
