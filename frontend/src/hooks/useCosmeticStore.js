import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../utils/api';

// ─────────────────────────────────────────────────────────────────────────────
// SHIP THEME DEFINITIONS
// Each key maps to a cosmetic_items.key in the DB.
// Colors applied to: sidebar accent, page bg tint, ship SVG parts, health bar.
// ─────────────────────────────────────────────────────────────────────────────
export const SHIP_THEMES = {
  default_ship: {
    label: 'Classic Galleon',
    // Sidebar / UI accent
    primary:        '#1e40af',   // blue-800
    primaryLight:   '#dbeafe',   // blue-100
    primaryText:    '#1e3a8a',   // blue-900
    accent:         '#f59e0b',   // amber-500
    // Page background tint
    pageBg:         'bg-gray-50',
    pageBgStyle:    {},
    // Ship SVG hull & sails
    hullFill:       '#92400e',
    hullHighlight:  '#b45309',
    sailFill:       '#fef3c7',
    sailStroke:     '#d97706',
    mastFill:       '#78350f',
    waterFill:      '#0ea5e9',
  },
  dark_ship: {
    label: 'Shadow Frigate',
    primary:        '#4c1d95',   // violet-900
    primaryLight:   '#ede9fe',   // violet-100
    primaryText:    '#3b0764',
    accent:         '#8b5cf6',   // violet-500
    pageBg:         'bg-slate-900',
    pageBgStyle:    { color: '#e2e8f0' },
    hullFill:       '#1e1b4b',
    hullHighlight:  '#312e81',
    sailFill:       '#4c1d95',
    sailStroke:     '#7c3aed',
    mastFill:       '#0f172a',
    waterFill:      '#1e3a5f',
  },
  golden_ship: {
    label: 'Golden Galleon',
    primary:        '#b45309',   // amber-700
    primaryLight:   '#fef3c7',   // amber-100
    primaryText:    '#78350f',
    accent:         '#f59e0b',
    pageBg:         'bg-amber-50',
    pageBgStyle:    {},
    hullFill:       '#b45309',
    hullHighlight:  '#fbbf24',
    sailFill:       '#fef9c3',
    sailStroke:     '#f59e0b',
    mastFill:       '#92400e',
    waterFill:      '#0ea5e9',
  },
  emerald_ship: {
    label: 'Emerald Corsair',
    primary:        '#065f46',   // emerald-800
    primaryLight:   '#d1fae5',   // emerald-100
    primaryText:    '#022c22',
    accent:         '#10b981',   // emerald-500
    pageBg:         'bg-emerald-50',
    pageBgStyle:    {},
    hullFill:       '#065f46',
    hullHighlight:  '#34d399',
    sailFill:       '#d1fae5',
    sailStroke:     '#10b981',
    mastFill:       '#022c22',
    waterFill:      '#0891b2',
  },
  crimson_ship: {
    label: 'Crimson Marauder',
    primary:        '#7f1d1d',   // red-900
    primaryLight:   '#fee2e2',   // red-100
    primaryText:    '#450a0a',
    accent:         '#ef4444',   // red-500
    pageBg:         'bg-red-50',
    pageBgStyle:    {},
    hullFill:       '#7f1d1d',
    hullHighlight:  '#f87171',
    sailFill:       '#fee2e2',
    sailStroke:     '#ef4444',
    mastFill:       '#450a0a',
    waterFill:      '#075985',
  },
};

export const DEFAULT_THEME = SHIP_THEMES.default_ship;

// ─────────────────────────────────────────────────────────────────────────────
// CHEST THEMES — applied to TreasureChest component tints
// ─────────────────────────────────────────────────────────────────────────────
export const CHEST_THEMES = {
  chest_classic: { fill: '#a16207', border: '#78350f', label: 'Oak Chest' },
  chest_golden:  { fill: '#f59e0b', border: '#b45309', label: 'Golden Chest' },
  chest_crystal: { fill: '#67e8f9', border: '#0891b2', label: 'Crystal Chest' },
};

export const DEFAULT_CHEST = CHEST_THEMES.chest_classic;

// ─────────────────────────────────────────────────────────────────────────────
// STORE
// ─────────────────────────────────────────────────────────────────────────────
export const useCosmeticStore = create(
  persist(
    (set, get) => ({
      equippedThemeKey:  'default_ship',
      equippedChestKey:  'chest_classic',
      lastFetched: null,

      // Derived helpers
      getTheme: () => SHIP_THEMES[get().equippedThemeKey] || DEFAULT_THEME,
      getChest: () => CHEST_THEMES[get().equippedChestKey] || DEFAULT_CHEST,

      // Fetch equipped cosmetics from /api/cosmetics/equipped and update store
      syncEquipped: async () => {
        try {
          const res = await api.get('/cosmetics/equipped');
          if (!res.data?.success) return;
          const equipped = res.data.data.items;

          let themeKey = 'default_ship';
          let chestKey = 'chest_classic';

          for (const item of equipped) {
            if (item.type === 'theme') themeKey = item.key;
            if (item.type === 'chest') chestKey = item.key;
          }

          set({ equippedThemeKey: themeKey, equippedChestKey: chestKey, lastFetched: Date.now() });
        } catch (_) {
          // Non-critical — keep cached values
        }
      },

      // Call after equip action so UI updates immediately
      setEquipped: (type, key) => {
        if (type === 'theme') set({ equippedThemeKey: key });
        if (type === 'chest') set({ equippedChestKey: key });
      },
    }),
    {
      name: 'cosmetic-storage',
      partialize: (state) => ({
        equippedThemeKey: state.equippedThemeKey,
        equippedChestKey: state.equippedChestKey,
      }),
    }
  )
);
