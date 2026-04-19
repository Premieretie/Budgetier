import React, { useState } from 'react';
import {
  PlusIcon,
  MapIcon,
  BellIcon,
  Cog6ToothIcon,
  ArrowPathIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { useGamification } from '../hooks/useGamification';
import { useToast } from '../hooks/useToast';
import TreasureChest from '../components/TreasureChest';
import ShipHealth from '../components/ShipHealth';
import LevelProgress from '../components/LevelProgress';
import StreakDisplay from '../components/StreakDisplay';
import QuickAddExpense from '../components/QuickAddExpense';
import LootDrop from '../components/LootDrop';
import api from '../utils/api';

const Dashboard = () => {
  const { success, error } = useToast();
  const {
    stats,
    ship,
    rewards,
    challenges,
    achievements,
    quickButtons,
    recentLoot,
    loading,
    fetchDashboard,
    fetchQuickButtons,
    handleExpenseCreated,
    repairShip,
    getTreasureProgress,
    getStreakMessage,
  } = useGamification();

  const [addingExpense, setAddingExpense] = useState(false);

  // Handle quick expense add
  const handleQuickAdd = async (expenseData) => {
    try {
      setAddingExpense(true);
      const response = await api.post('/expenses', expenseData);
      
      if (response.data?.success) {
        // Show success with gamification
        const gamificationData = response.data.data?.gamification;
        handleExpenseCreated(gamificationData);
        
        if (gamificationData?.loot) {
          success(`🎉 Found ${gamificationData.loot.name}! +${gamificationData.loot.gold} gold!`);
        } else {
          success(`💰 Expense logged! +2 XP`);
        }
        
        // Refresh data
        fetchDashboard();
      }
    } catch (err) {
      error('Failed to log expense. The Kraken got yer coins!');
      console.error(err);
    } finally {
      setAddingExpense(false);
    }
  };

  // Handle ship repair
  const handleRepair = async (cost) => {
    try {
      const result = await repairShip(cost);
      if (result.success) {
        success(`🔧 Ship repaired! Hull integrity restored!`);
      }
    } catch (err) {
      error('Could not repair the ship!');
    }
  };

  // Handle quick button management
  const handleCreateButton = async (buttonData) => {
    try {
      await api.post('/gamification/quick-buttons', buttonData);
      fetchQuickButtons();
      success('Quick button created!');
    } catch (err) {
      error('Failed to create button');
    }
  };

  const handleUpdateButton = async (id, updates) => {
    try {
      if (id) {
        await api.patch(`/gamification/quick-buttons/${id}`, updates);
      } else {
        await api.post('/gamification/quick-buttons', updates);
      }
      fetchQuickButtons();
    } catch (err) {
      error('Failed to update button');
    }
  };

  const handleDeleteButton = async (id) => {
    try {
      await api.delete(`/gamification/quick-buttons/${id}`);
      fetchQuickButtons();
      success('Button removed!');
    } catch (err) {
      error('Failed to delete button');
    }
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">⚓</div>
          <p className="text-gray-600 font-medium">Loading yer ship...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-amber-50">
      {/* Loot Drop Animation */}
      <LootDrop loot={recentLoot} onClose={() => {}} />

      {/* Ship Health Warning Banner */}
      {ship?.health <= 30 && (
        <div className="bg-red-600 text-white px-4 py-2 text-center animate-pulse">
          <span className="font-bold">⚠️ SHIP IN DANGER!</span> Ye be taking on water, Captain!
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-2xl">
              🏴‍☠️
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ahoy, Captain!</h1>
              <p className="text-sm text-gray-600">{getStreakMessage()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={fetchDashboard}
              className="p-2 bg-white rounded-xl shadow-sm hover:shadow-md transition-all"
            >
              <ArrowPathIcon className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 bg-white rounded-xl shadow-sm hover:shadow-md transition-all relative">
              <BellIcon className="w-5 h-5 text-gray-600" />
              {rewards?.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {rewards.length}
                </span>
              )}
            </button>
            <button className="p-2 bg-white rounded-xl shadow-sm hover:shadow-md transition-all">
              <Cog6ToothIcon className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Quick Add Section - MOST IMPORTANT */}
        <div className="bg-white rounded-2xl p-4 shadow-lg mb-6 border-2 border-amber-200">
          <QuickAddExpense
            buttons={quickButtons}
            onAdd={handleQuickAdd}
            onEdit={handleUpdateButton}
            onDelete={handleDeleteButton}
            loading={addingExpense}
          />
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Treasure Chest */}
          <div className="bg-white rounded-2xl p-4 shadow-md">
            <TreasureChest 
              progress={getTreasureProgress()} 
              amount={parseFloat(stats?.treasure_chest_amount || 0)}
            />
          </div>

          {/* Level & XP */}
          <div className="bg-white rounded-2xl p-4 shadow-md">
            <LevelProgress
              level={stats?.level || 1}
              xp={stats?.xp || 0}
              nextLevelXP={stats?.nextLevelXP || 100}
              xpProgress={stats?.levelProgress || 0}
              gold={stats?.gold || 0}
            />
          </div>

          {/* Ship Health */}
          <div className="bg-white rounded-2xl p-4 shadow-md">
            <ShipHealth
              health={ship?.health || 100}
              status={ship?.status || 'smooth'}
              message={ship?.message || 'All clear, Captain!'}
              onRepair={handleRepair}
              gold={stats?.gold || 0}
            />
          </div>

          {/* Streak */}
          <div className="bg-white rounded-2xl p-4 shadow-md">
            <StreakDisplay
              streak={stats?.current_streak || 0}
              longestStreak={stats?.longest_streak || 0}
              message={getStreakMessage()}
            />
          </div>
        </div>

        {/* Daily Challenges */}
        {challenges?.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-md mb-6">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-xl">🎯</span> Daily Challenges
            </h3>
            <div className="space-y-3">
              {challenges.map((challenge) => (
                <div 
                  key={challenge.id}
                  className={`flex items-center gap-3 p-3 rounded-xl ${
                    challenge.completed ? 'bg-green-100' : 'bg-gray-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    challenge.completed ? 'bg-green-500 text-white' : 'bg-gray-200'
                  }`}>
                    {challenge.completed ? '✓' : '○'}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${challenge.completed ? 'text-green-800' : 'text-gray-800'}`}>
                      {challenge.title}
                    </p>
                    <p className="text-xs text-gray-500">{challenge.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-amber-600">+{challenge.reward_gold} 🪙</p>
                    <p className="text-xs text-blue-600">+{challenge.reward_xp} XP</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Achievements */}
        {achievements?.length > 0 && (
          <div className="bg-gradient-to-r from-amber-100 to-yellow-100 rounded-2xl p-4 shadow-md mb-6">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-xl">🏆</span> Recent Achievements
            </h3>
            <div className="flex flex-wrap gap-2">
              {achievements.slice(0, 5).map((achievement) => (
                <div 
                  key={achievement.id}
                  className="bg-white px-3 py-2 rounded-full shadow-sm flex items-center gap-2"
                >
                  <span className="text-lg">🎖️</span>
                  <span className="text-sm font-medium text-gray-700">{achievement.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a 
            href="/expenses/add" 
            className="bg-blue-600 text-white rounded-xl p-4 flex items-center justify-between hover:bg-blue-700 transition-colors"
          >
            <span className="font-semibold">Log Expense</span>
            <PlusIcon className="w-5 h-5" />
          </a>
          <a 
            href="/goals" 
            className="bg-amber-500 text-white rounded-xl p-4 flex items-center justify-between hover:bg-amber-600 transition-colors"
          >
            <span className="font-semibold">Quests</span>
            <MapIcon className="w-5 h-5" />
          </a>
          <a 
            href="/budgets" 
            className="bg-purple-600 text-white rounded-xl p-4 flex items-center justify-between hover:bg-purple-700 transition-colors"
          >
            <span className="font-semibold">Treasure Maps</span>
            <ChevronRightIcon className="w-5 h-5" />
          </a>
          <a 
            href="/categories" 
            className="bg-green-600 text-white rounded-xl p-4 flex items-center justify-between hover:bg-green-700 transition-colors"
          >
            <span className="font-semibold">Cargo</span>
            <ChevronRightIcon className="w-5 h-5" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
