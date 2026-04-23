import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

export const useGamification = () => {
  const [stats, setStats] = useState(null);
  const [ship, setShip] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [quickButtons, setQuickButtons] = useState([]);
  const [recentLoot, setRecentLoot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch full dashboard data
  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/gamification/dashboard');
      
      if (response.data?.success) {
        const data = response.data.data;
        setStats(data.stats);
        setShip(data.ship);
        setRewards(data.recentRewards);
        setChallenges(data.dailyChallenges);
        setAchievements(data.achievements);
        setQuickButtons(data.quickButtons);
      }
    } catch (err) {
      console.error('Failed to load gamification data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch only stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/gamification/stats');
      if (response.data?.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }, []);

  // Fetch ship status
  const fetchShip = useCallback(async () => {
    try {
      const response = await api.get('/gamification/ship');
      if (response.data?.success) {
        setShip(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load ship status:', err);
    }
  }, []);

  // Fetch quick buttons
  const fetchQuickButtons = useCallback(async () => {
    try {
      const response = await api.get('/gamification/quick-buttons');
      if (response.data?.success) {
        setQuickButtons(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load quick buttons:', err);
    }
  }, []);

  // Create quick button
  const createQuickButton = useCallback(async (buttonData) => {
    try {
      const response = await api.post('/gamification/quick-buttons', buttonData);
      if (response.data?.success) {
        await fetchQuickButtons();
        return response.data.data;
      }
    } catch (err) {
      console.error('Failed to create quick button:', err);
      throw err;
    }
  }, [fetchQuickButtons]);

  // Update quick button
  const updateQuickButton = useCallback(async (id, updates) => {
    try {
      const response = await api.patch(`/gamification/quick-buttons/${id}`, updates);
      if (response.data?.success) {
        await fetchQuickButtons();
        return response.data.data;
      }
    } catch (err) {
      console.error('Failed to update quick button:', err);
      throw err;
    }
  }, [fetchQuickButtons]);

  // Delete quick button
  const deleteQuickButton = useCallback(async (id) => {
    try {
      await api.delete(`/gamification/quick-buttons/${id}`);
      await fetchQuickButtons();
    } catch (err) {
      console.error('Failed to delete quick button:', err);
      throw err;
    }
  }, [fetchQuickButtons]);

  // Repair ship — goldAmount: gold spent, healthToRestore: explicit HP gain (for per-part repairs)
  const repairShip = useCallback(async (goldAmount, healthToRestore = null) => {
    try {
      const payload = { goldAmount };
      if (healthToRestore !== null) payload.healthToRestore = healthToRestore;
      const response = await api.post('/gamification/ship/repair', payload);
      if (response.data?.success) {
        await fetchShip();
        await fetchStats();
      }
      return response.data;
    } catch (err) {
      console.error('Failed to repair ship:', err);
      throw err;
    }
  }, [fetchShip, fetchStats]);

  // Show loot animation
  const showLoot = useCallback((loot) => {
    setRecentLoot(loot);
    // Auto-hide after 3 seconds
    setTimeout(() => setRecentLoot(null), 3000);
  }, []);

  // Handle expense creation feedback
  const handleExpenseCreated = useCallback((gamificationData) => {
    if (gamificationData?.loot) {
      showLoot(gamificationData.loot);
    }
    // Refresh stats
    fetchStats();
  }, [fetchStats, showLoot]);

  // Get XP progress for level
  const getLevelProgress = () => {
    if (!stats) return 0;
    return stats.levelProgress || 0;
  };

  // Get treasure chest fill percentage
  const getTreasureProgress = () => {
    if (!stats) return 0;
    const maxTreasure = 1000; // $1000 goal
    const current = parseFloat(stats.treasure_chest_amount || 0);
    return Math.min(100, (current / maxTreasure) * 100);
  };

  // Get streak message
  const getStreakMessage = () => {
    if (!stats?.current_streak) return 'Start yer streak today!';
    if (stats.current_streak === 1) return 'First day aboard!';
    if (stats.current_streak < 7) return `${stats.current_streak} day streak! Keep sailing!`;
    if (stats.current_streak < 30) return `🔥 ${stats.current_streak} day streak! Yer a regular sailor!`;
    return `🏆 ${stats.current_streak} day streak! Legendary Pirate!`;
  };

  // Load data on mount
  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    // Data
    stats,
    ship,
    rewards,
    achievements,
    challenges,
    quickButtons,
    recentLoot,
    loading,
    error,
    
    // Actions
    fetchDashboard,
    fetchStats,
    fetchShip,
    fetchQuickButtons,
    createQuickButton,
    updateQuickButton,
    deleteQuickButton,
    repairShip,
    showLoot,
    handleExpenseCreated,
    
    // Helpers
    getLevelProgress,
    getTreasureProgress,
    getStreakMessage,
  };
};

export default useGamification;
