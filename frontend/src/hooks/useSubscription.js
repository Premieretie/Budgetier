import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const useSubscription = () => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await api.get('/subscriptions/status');
      if (res.data?.success) {
        setSubscription(res.data.data);
      }
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
      await fetchStatus();
    }
    return res.data;
  };

  const upgrade = async () => {
    const res = await api.post('/subscriptions/upgrade');
    if (res.data?.success) {
      await fetchStatus();
    }
    return res.data;
  };

  const cancel = async () => {
    const res = await api.post('/subscriptions/cancel');
    if (res.data?.success) {
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
