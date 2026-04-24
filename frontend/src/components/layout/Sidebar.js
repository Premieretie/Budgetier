import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  BanknotesIcon,
  ShoppingCartIcon,
  TrophyIcon,
  ChartPieIcon,
  TagIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  ArrowLeftOnRectangleIcon,
  XMarkIcon,
  MapIcon,
  FireIcon,
  SparklesIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../hooks/useAuthStore';
import useSubscription from '../../hooks/useSubscription';
import { useCosmeticStore } from '../../hooks/useCosmeticStore';

const navigation = [
  { name: 'Captain\'s Log', href: '/dashboard', icon: MapIcon },
  { name: 'Treasure In', href: '/income', icon: BanknotesIcon },
  { name: 'Loot Spent', href: '/expenses', icon: FireIcon },
  { name: 'Quests', href: '/goals', icon: TrophyIcon },
  { name: 'Treasure Maps', href: '/budgets', icon: ChartPieIcon },
  { name: 'Cargo Types', href: '/categories', icon: TagIcon },
  { name: 'Cosmetics', href: '/cosmetics', icon: SparklesIcon },
];

const upgradeNav = [
  { name: 'Pricing & Plans', href: '/pricing', icon: CurrencyDollarIcon },
];

const secondaryNavigation = [
  { name: 'Ship Settings', href: '/settings', icon: Cog6ToothIcon },
  { name: 'Pirate Code', href: '/privacy-policy', icon: ShieldCheckIcon },
];

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { logout } = useAuthStore();
  const { isPremium, loading: subLoading } = useSubscription();
  const { getTheme } = useCosmeticStore();
  const theme = getTheme();

  const isActive = (path) => location.pathname === path;

  const activeNavClass = 'border-l-4 font-semibold leading-6 text-sm';
  const inactiveNavClass = 'text-slate-600 hover:text-slate-900 font-semibold leading-6 text-sm';

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-gold-500 to-gold-700 flex items-center justify-center shadow-lg shadow-gold-500/30">
              <span className="text-lg">💀</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-gold-600 to-gold-800 bg-clip-text text-transparent">Budgetier</span>
          </div>
          
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <NavLink
                        to={item.href}
                        className={({ isActive }) =>
                          `group flex gap-x-3 rounded-lg p-2 ${isActive ? activeNavClass : inactiveNavClass}`
                        }
                        style={({ isActive }) => isActive ? {
                          backgroundColor: theme.primaryLight,
                          color: theme.primaryText,
                          borderLeftColor: theme.primary,
                        } : {}}
                      >
                        <item.icon
                          className="h-6 w-6 shrink-0"
                          style={{ color: isActive(item.href) ? theme.primary : undefined }}
                          aria-hidden="true"
                        />
                        {item.name}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </li>
              
              <li className="mt-auto">
                <ul role="list" className="-mx-2 space-y-1">
                  {upgradeNav.map((item) => (
                    <li key={item.name}>
                      <NavLink
                        to={item.href}
                        className={({ isActive }) =>
                          `group flex gap-x-3 rounded-lg p-2 text-sm font-semibold leading-6 ${
                            isActive
                              ? 'bg-amber-100 text-amber-800'
                              : 'text-amber-600 hover:bg-amber-50 hover:text-amber-800'
                          }`
                        }
                      >
                        <item.icon className="h-6 w-6 shrink-0 text-amber-400 group-hover:text-amber-600" aria-hidden="true" />
                        {item.name}
                      </NavLink>
                    </li>
                  ))}
                  {secondaryNavigation.map((item) => (
                    <li key={item.name}>
                      <NavLink
                        to={item.href}
                        className={({ isActive }) =>
                          `group flex gap-x-3 rounded-lg p-2 text-sm font-semibold leading-6 ${
                            isActive
                              ? 'bg-gray-50 text-gray-900'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                          }`
                        }
                      >
                        <item.icon
                          className="h-6 w-6 shrink-0 text-gray-400 group-hover:text-gray-600"
                          aria-hidden="true"
                        />
                        {item.name}
                      </NavLink>
                    </li>
                  ))}
                  <li>
                    <button
                      onClick={logout}
                      className="group flex w-full gap-x-3 rounded-lg p-2 text-sm font-semibold leading-6 text-slate-700 hover:bg-crimson-50 hover:text-crimson-700"
                    >
                      <ArrowLeftOnRectangleIcon
                        className="h-6 w-6 shrink-0 text-slate-400 group-hover:text-crimson-600"
                        aria-hidden="true"
                      />
                      Abandon Ship
                    </button>
                  </li>
                </ul>
              </li>
            </ul>
          </nav>

          {/* Free plan upgrade nudge */}
          {!subLoading && !isPremium && (
            <NavLink
              to="/pricing"
              className="block mx-0 mb-3 bg-gradient-to-r from-amber-500 to-amber-400 text-white rounded-2xl px-4 py-3 text-center shadow-md hover:from-amber-400 hover:to-amber-300 transition-all"
            >
              <p className="text-xs font-bold">⚓ Free Plan</p>
              <p className="text-xs opacity-90 mt-0.5">Upgrade for more features →</p>
            </NavLink>
          )}
          {!subLoading && isPremium && (
            <div className="mx-0 mb-3 bg-gradient-to-r from-amber-100 to-yellow-100 border border-amber-200 rounded-2xl px-4 py-3 text-center">
              <p className="text-xs font-bold text-amber-800">✨ Premium Captain</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-gold-500 to-gold-700 flex items-center justify-center shadow-lg shadow-gold-500/30">
              <span className="text-lg">💀</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-gold-600 to-gold-800 bg-clip-text text-transparent">Budgetier</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-parchment-100 hover:text-slate-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <nav className="px-4 py-4">
          <ul className="space-y-1">
            {navigation.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `group flex gap-x-3 rounded-lg p-3 ${isActive ? activeNavClass : inactiveNavClass}`
                  }
                  style={({ isActive }) => isActive ? {
                    backgroundColor: theme.primaryLight,
                    color: theme.primaryText,
                    borderLeftColor: theme.primary,
                  } : {}}
                >
                  <item.icon
                    className="h-6 w-6 shrink-0"
                    style={{ color: isActive(item.href) ? theme.primary : undefined }}
                  />
                  {item.name}
                </NavLink>
              </li>
            ))}
          </ul>
          
          <div className="mt-8 pt-8 border-t border-gray-200">
            <ul className="space-y-1">
              {upgradeNav.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `group flex gap-x-3 rounded-lg p-3 text-sm font-semibold leading-6 ${
                        isActive ? 'bg-amber-100 text-amber-800' : 'text-amber-600 hover:bg-amber-50 hover:text-amber-800'
                      }`
                    }
                  >
                    <item.icon className="h-6 w-6 shrink-0 text-amber-400 group-hover:text-amber-600" />
                    {item.name}
                  </NavLink>
                </li>
              ))}
              {secondaryNavigation.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `group flex gap-x-3 rounded-lg p-3 text-sm font-semibold leading-6 ${
                        isActive
                          ? 'bg-parchment-100 text-slate-800'
                          : 'text-slate-600 hover:bg-parchment-100 hover:text-slate-900'
                      }`
                    }
                  >
                    <item.icon className="h-6 w-6 shrink-0 text-slate-400 group-hover:text-gold-600" />
                    {item.name}
                  </NavLink>
                </li>
              ))}
              <li>
                <button
                  onClick={() => {
                    onClose();
                    logout();
                  }}
                  className="group flex w-full gap-x-3 rounded-lg p-3 text-sm font-semibold leading-6 text-slate-700 hover:bg-crimson-50 hover:text-crimson-700"
                >
                  <ArrowLeftOnRectangleIcon className="h-6 w-6 shrink-0 text-slate-400 group-hover:text-crimson-600" />
                  Abandon Ship
                </button>
              </li>
            </ul>
          </div>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
