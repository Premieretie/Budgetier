import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

// Module-level cache so multiple components don't each fire a network request
let _cache = null;
let _cacheTime = 0;
let _inflight = null;
const CACHE_TTL = 30_000; // 30 seconds

const fetchSubscriptionStatus = async () => {
  const now = Date.now();
  if (_cache && now - _cacheTime < CACHE_TTL) return _cache;
  if (_inflight) return _inflight;

  _inflight = api.get('/subscriptions/status').then(res => {
    if (res.data?.success) {
      _cache = res.data.data;
      _cacheTime = Date.now();
    }
    _inflight = null;
    return _cache;
  }).catch(err => {
    _inflight = null;
    throw err;
  });
  return _inflight;
};

const invalidateCache = () => { _cache = null; _cacheTime = 0; };

const useSubscription = () => {
  const [subscription, setSubscription] = useState(_cache || null);
  const [loading, setLoading] = useState(!_cache);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await fetchSubscriptionStatus();
      if (data) setSubscription(data);
    } catch (err) {
      console.error('Subscription fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const startTrial = async () => {
    const res = await api.post('/subscriptions/start-trial');
    if (res.data?.success) {
      invalidateCache();
      await fetchStatus();
    }
    return res.data;
  };

  const upgrade = async () => {
    const res = await api.post('/subscriptions/upgrade');
    if (res.data?.success) {
      invalidateCache();
      await fetchStatus();
    }
    return res.data;
  };

  const cancel = async () => {
    const res = await api.post('/subscriptions/cancel');
    if (res.data?.success) {
      invalidateCache();
      await fetchStatus();
    }
    return res.data;
  };

  return {
    subscription,
    loading,
    isPremium: subscription?.isPremium || false,
    plan: subscription?.plan || 'free',
    limits: subscription?.limits || { goals: 3 },
    refresh: fetchStatus,
    startTrial,
    upgrade,
    cancel,
  };
};

export default useSubscription;
