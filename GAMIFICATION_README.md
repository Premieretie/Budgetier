# 🏴‍☠️ Budgetier Gamification System

## Overview

The Budgetier app has been transformed into an ADHD-friendly, pirate-themed gamified budgeting experience. Every action feels rewarding, and users are motivated to log expenses daily through dopamine-triggering feedback loops.

---

## 🎮 Core Gamification Features

### 1. **XP & Level System**
- Users gain XP for every action (logging expenses, completing goals, etc.)
- 20 levels with exponential XP requirements
- Level-up bonuses: +25 gold per level
- Visual progress bar shows XP to next level

### 2. **Gold Currency**
- Earn gold for:
  - Logging expenses (+5 base + streak bonus)
  - Staying under budget (+50)
  - Completing goals (+100)
  - Finding loot drops (+varies by rarity)
- Spend gold to repair ship health

### 3. **Daily Streaks**
- Track consecutive days of logging
- Streak bonus: +5 gold per day, up to +50 max
- Special achievements at 7 and 30 days
- Visual flame indicator with streak count

### 4. **Ship Health System** (Damage Control)
- Ship health reflects spending behavior:
  - Under 50% budget → Ship heals (+10 health)
  - 50-80% budget → Stable
  - 80-100% budget → Minor damage (-5 health)
  - Over budget → Major damage (-15 health)
- Repair ship by spending gold
- Visual warnings when health < 30%
- Non-shaming pirate-themed messages

### 5. **Treasure Chest** (Visual Savings Progress)
- Animated chest fills as user saves money
- Milestones at $1000 saved
- Coins, gems, and crown appear as chest fills
- Visual dopamine reward for saving

### 6. **Loot Drop System** (Random Rewards)
- 30% chance to find loot when logging expenses
- 5 rarity tiers: Common, Uncommon, Rare, Epic, Legendary
- Each loot grants gold and XP
- Animated pop-up with treasure found
- Examples: Copper Coin (5g), Kraken Eye (500g), Poseidon's Trident (1000g)

### 7. **Daily Challenges**
- 4 daily challenges generated each day:
  - Anchored Ship (no spend day)
  - Frugal Sailor (under 50% budget)
  - Keen Eye (log 3+ expenses)
  - Speed Demon (use Quick Add)
- Rewards: +10 gold, +5 XP per challenge

### 8. **Achievements System**
- 10 unlockable achievements:
  - First Steps (first expense)
  - Daily Sailor (7-day streak)
  - Budget Master (under budget week)
  - Treasure Hunter (complete goal)
  - Hoarding Captain (save $1000)
  - Speedy Spender (Quick Add x10)
  - Anchored Ship (no spend day)
  - Legendary Pirate (30-day streak)
  - Quest Seeker (create first quest)
  - Ship Doctor (recover from overspending)

---

## ⚡ Quick Add System (ADHD-Optimized)

### One-Tap Expense Logging
- Customizable quick buttons for common expenses
- Default buttons: Coffee ($5), Lunch ($15), Gas ($60), Groceries ($80), Drinks ($25)
- One tap = expense logged instantly
- Visual feedback with haptic-like animations
- Buttons track usage count
- Fully editable (name, amount, category, icon, color)

### ADHD-Friendly Design Principles
- **One primary action per screen** - Quick Add at top
- **Large buttons** - Easy to tap, minimal precision needed
- **Immediate feedback** - Loot drops, XP gain, toast notifications
- **Always-visible progress** - Streak, level, chest on dashboard
- **No shame messaging** - Pirate-themed forgiving copy
- **Under 5 seconds** to log any expense

---

## 🗄️ Database Schema

### New Tables Added:

#### `user_stats`
- `xp`, `level`, `gold`, `ship_health`
- `current_streak`, `longest_streak`
- `last_activity_date`
- `treasure_chest_amount`

#### `user_rewards`
- Tracks all loot drops found
- `reward_type`, `reward_name`, `rarity`
- `icon`, `description`, `is_used`

#### `quick_expense_buttons`
- User-customizable one-tap buttons
- `name`, `amount`, `category`
- `icon`, `color`, `usage_count`
- `sort_order`, `is_active`

#### `daily_challenges`
- Daily rotating challenges
- `challenge_type`, `title`, `description`
- `target_amount`, `current_amount`
- `reward_gold`, `reward_xp`, `completed`

#### `achievement_log`
- Unlocked achievements history
- `achievement_type`, `title`, `description`
- `reward_gold`, `reward_xp`

---

## 🔌 API Endpoints

### Gamification Routes (`/api/gamification`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Full gamified dashboard data |
| GET | `/stats` | User stats (XP, gold, level, streaks) |
| GET | `/ship` | Ship health status |
| POST | `/ship/repair` | Repair ship with gold |
| GET | `/achievements` | All user achievements |
| GET | `/rewards` | Recent loot/rewards |
| GET | `/quick-buttons` | Get quick add buttons |
| POST | `/quick-buttons` | Create new button |
| PATCH | `/quick-buttons/:id` | Update button |
| DELETE | `/quick-buttons/:id` | Delete button |
| GET | `/challenges` | Today's challenges |

### Modified Routes:

#### `POST /api/expenses` (Enhanced)
- Now returns gamification data:
  ```json
  {
    "success": true,
    "message": "💰 Expense logged! Found Silver Doubloon! (+15 gold, +2 XP)",
    "data": {
      "expense": {...},
      "gamification": {
        "loot": { "name": "Silver Doubloon", "gold": 15, "xp": 8, "rarity": "uncommon" },
        "xp": 2,
        "gold": 15
      }
    }
  }
  ```
- Automatically updates:
  - Streaks
  - Ship health
  - Daily challenge progress
  - First expense achievement

---

## 🎨 Frontend Components

### New Components Created:

#### `TreasureChest.js`
- Animated treasure chest with fillable gold
- Shows coins, gems, crown at different fill levels
- Progress indicator to $1000 goal

#### `ShipHealth.js`
- Ship status with visual health bar
- Color-coded: Green (healthy), Amber (damaged), Red (critical)
- Context-aware messaging
- Repair button with gold cost

#### `LevelProgress.js`
- XP progress bar with gradient animation
- Current level and gold count
- Next level XP requirement

#### `StreakDisplay.js`
- Flame streak counter
- Streak bonus indicator
- Weekly progress dots
- Best streak tracker

#### `QuickAddExpense.js`
- Grid of customizable buttons
- Add/Edit/Delete button functionality
- Icon and color selectors
- Usage count badges
- One-tap expense logging

#### `LootDrop.js`
- Animated loot drop modal
- Rarity-based colors and glow effects
- Coin falling animation
- Auto-dismiss after 4 seconds
- Shows gold and XP rewards

#### `useGamification.js` (Hook)
- Central state management for all gamification
- API integration
- Helper functions for progress calculations
- Auto-refresh dashboard data

---

## 📱 New Dashboard Layout

### ADHD-Optimized Flow:

```
┌─────────────────────────────────────┐
│  🏴‍☠️ Ahoy, Captain! (Streak msg)    │
├─────────────────────────────────────┤
│                                     │
│  ⚡ QUICK ADD (One-tap buttons)     │  ← PRIMARY ACTION
│  [☕ $5] [🍔 $15] [⛽ $60] ...       │
│                                     │
├─────────────────────────────────────┤
│  🎁 CHEST │ ⭐ LEVEL │ 🚢 SHIP │ 🔥 STREAK  │
│  (Visual) │ (XP)     │ (Health)│ (Days)     │
├─────────────────────────────────────┤
│  🎯 Daily Challenges                │
│  ○ Anchored Ship        +10 🪙     │
│  ✓ Frugal Sailor        +10 🪙     │
├─────────────────────────────────────┤
│  🏆 Recent Achievements             │
│  [🎖️ First Steps] [🎖️ Daily Sailor]│
├─────────────────────────────────────┤
│  [Log Expense] [Quests] [Maps] [Cargo]│
└─────────────────────────────────────┘
```

---

## 🏴‍☠️ Pirate Copy Examples

### Forgiving, Fun Messaging:

- **Welcome**: "🏴‍☠️ Welcome Aboard, Captain! Yer ship be ready!"
- **First Expense**: "First Steps - Logged yer first expense!"
- **Over Budget**: "🌊 Storm ahead! Mind yer spending!"
- **Ship Critical**: "⚠️ SHIP IN DANGER! Ye be taking on water!"
- **No Spend Day**: "Anchored Ship - A full day without spending!"
- **Loot Found**: "Found Silver Doubloon while logging expenses!"
- **Achievement**: "🏆 Achievement Unlocked: Treasure Hunter!"
- **Streak**: "🔥 7 day streak! Yer a regular sailor!"
- **Expense Error**: "The Kraken got yer coins!"

---

## 🚀 Future Enhancements

### Phase 2 Features (Ready for Implementation):

1. **Bank API Integration** (Open Banking Australia)
   - Auto-import transactions
   - Subscription detection
   - Spending pattern analysis

2. **Social Features**
   - Crew (friend) leaderboards
   - Share achievements
   - Challenge friends

3. **Advanced Loot**
   - Ship customization skins
   - Captain avatar items
   - Island map unlocks

4. **Voice Input**
   - "Spent $30 on food"
   - Auto-categorize with AI

5. **Push Notifications**
   - Daily reminders
   - Streak warnings
   - Loot drop alerts

---

## 📦 Files Modified/Created

### Backend:
- `backend/src/config/database.js` - Added gamification tables
- `backend/src/models/gamification.js` - **NEW** - Core gamification logic
- `backend/src/routes/gamification.js` - **NEW** - Gamification API routes
- `backend/src/routes/auth.js` - Initialize user stats on registration
- `backend/src/routes/expenses.js` - Added gamification tracking to expense creation
- `backend/src/server.js` - Registered gamification routes

### Frontend:
- `frontend/src/hooks/useGamification.js` - **NEW** - Gamification hook
- `frontend/src/components/TreasureChest.js` - **NEW**
- `frontend/src/components/ShipHealth.js` - **NEW**
- `frontend/src/components/LevelProgress.js` - **NEW**
- `frontend/src/components/StreakDisplay.js` - **NEW**
- `frontend/src/components/QuickAddExpense.js` - **NEW**
- `frontend/src/components/LootDrop.js` - **NEW**
- `frontend/src/pages/Dashboard.js` - **REWRITTEN** - Gamified dashboard

---

## 🔧 Setup Instructions

### For Existing Users:
1. Deploy new backend code to Render
2. Database tables auto-create on startup
3. Existing users will have gamification stats initialized on next login

### For New Users:
1. Gamification stats auto-initialized on registration
2. Default quick buttons created automatically
3. Start with 100 gold bonus

---

## 📊 Success Metrics to Track

- **Daily Active Users** - Should increase with streaks
- **Average Expense Log Time** - Target under 5 seconds
- **Retention Rate** - 7-day and 30-day streak completion
- **Quick Add Usage** - % of expenses logged via quick buttons
- **Ship Health Average** - Indicator of budgeting success
- **Achievement Unlock Rate** - Engagement metric

---

## ✨ Key Design Principles Applied

1. **Speed Over Features** - Quick Add is the primary action
2. **Dopamine Feedback** - Every action rewards XP/gold/loot
3. **Visual Progress** - Chest, streak, level always visible
4. **Forgiving Tone** - Never shaming, always encouraging
5. **Low Friction** - One tap to log, no complex flows
6. **ADHD-Friendly** - Large buttons, immediate feedback, simple structure

---

---

## 📐 Exact Formulas & Real Implementation Details

### XP System
- Logging any expense: **+2 XP**
- Loot drop XP: **varies by rarity** (Common +2, Uncommon +8, Rare +25, Epic +50, Legendary +250)
- XP thresholds (20 levels, exponential): `[0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3250, 3850, 4500, 5200, 5950, 6750, 7600, 8500, 9450, 10000]`
- Level-up gold bonus: `level × 25 gold` (additive, never overwrites balance)

### Gold System
- Base XP expense log: +0 gold (XP only, unless loot drops)
- Streak bonus each new day: `+5 gold + min(streak × 5, 50)` → max +55 gold/day
- Level-up: `+level × 25 gold`
- Loot drops: Common 3–6g, Uncommon 12–20g, Rare 40–55g, Epic 40–150g, Legendary 500–1000g
- Repair cost: **1 gold = 1 HP** restored

### Ship Health
- Under 50% budget used → **+10 HP**
- 50–80% budget used → **±0 HP** (stable)
- 80–100% budget used → **−5 HP**
- Over budget → **−15 HP**
- Repair economy: `missing_health × 1 gold` total; distributed Hull 40%, Sails 25%, Mast 20%, Deck 15%

### Loot Probabilities
- 30% base chance on each expense log
- Roll distribution: `>0.95` Legendary, `>0.85` Epic, `>0.65` Rare, `>0.40` Uncommon, else Common

### Streak
- Updates once per calendar day (UTC)
- Consecutive day: streak +1, gold +5 + streak_bonus
- Gap > 1 day: streak resets to 1
- Same day log: no change
- Streak also evaluated on every dashboard load (handles login-only days)

### Treasure Chest
- `savings = max(0, total_income − total_expenses)` (all-time)
- Recalculated after every income/expense mutation and on every dashboard load
- Progress: `min(100, savings / 1000 × 100)%`
- Milestone at $1,000 → triggers `BIG_SAVER` achievement

### Daily Challenges
| Challenge | Type | Target | Reward |
|---|---|---|---|
| Anchored Ship | no_spend | 0 expenses today | +10 gold, +5 XP |
| Frugal Sailor | under_budget | Stay under 50% budget | +10 gold, +5 XP |
| Keen Eye | log_expenses | Log 3 expenses | +10 gold, +5 XP |
| Speed Demon | quick_add | Use Quick Add once | +10 gold, +5 XP |

---

## 🔍 System Integrity Improvements

### Bugs Fixed (Apr 2026 Audit)

| # | Bug | Fix Applied |
|---|---|---|
| 1 | `addXP` level-up gold overwrote gold balance instead of adding | Changed `updates.gold = stats.gold + (newLevel × 25)` — now always additive |
| 2 | `generateDailyChallenges` cache-hit returned only `id` column | Added full `SELECT *` query on cache-hit path |
| 3 | `updateChallengeProgress` reward_claimed race condition (double-grant risk) | Added pre-read state check; award only fires on `completed && !reward_claimed` |
| 4 | `BUDGET_MASTER` achievement defined but never triggered | Wired into `trackExpense` — checks monthly spend vs budget after each expense |
| 5 | `NO_SPEND_DAY` / Anchored Ship challenge never auto-evaluated | Added `evaluateNoSpendChallenge()` called from `getGamifiedDashboard` |
| 6 | Streak only updated on expense log, not on login/dashboard load | `getGamifiedDashboard` now calls `updateStreak` — login-only days count |
| 7 | StreakDisplay progress dots showed 0/7 on exact 7-day multiples | Fixed: `streak % 7 === 0 && streak > 0` now shows 7/7 filled |
| 8 | Quick Add expenses never incremented Speed Demon challenge | `trackExpense` now accepts `isQuickAdd` flag; QuickAddExpense passes `buttonId` |
| 9 | `incrementButtonUsage` never called on Quick Add | Now called in POST /expenses when `buttonId` present in body |
| 10 | Treasure chest `addToTreasureChest()` was dead code — never called | Replaced with `recalculateTreasureChest()` — derives savings from real DB totals |

### Logic Improvements
- `getGamifiedDashboard` now returns fully consistent state: streak synced, chest synced, no-spend evaluated — all before data fetch
- Repair system extended to support per-part health restoration with exact gold-to-HP mapping
- `SHIP_SAVED` achievement fires when recovering from critical (<30 → >30 HP) via repair

### Performance
- `generateDailyChallenges` avoids 4 INSERT queries if challenges already exist for today
- Treasure chest uses 2 parallel `SUM` queries instead of loading all rows

---

## ⚠️ Known Limitations

- **Frugal Sailor challenge** (`under_budget`, target 50%) — `updateChallengeProgress` is not automatically called when the budget ratio changes; currently not auto-triggered. Requires manual wiring to the budget evaluation flow.
- **`QUICK_ADD_MASTER` achievement** (Quick Add ×10) — defined in `ACHIEVEMENTS` but achievement check not yet wired (no counter on `quick_expense_buttons.usage_count` threshold check).
- **Streak timezone** — streak uses UTC date from the server. Users in UTC+10 may see streak reset at 10am local time instead of midnight.
- **`NO_SPEND_DAY` challenge** completes on first dashboard load with no spending, not at end of day — so a user who loads the dashboard at 9am then spends at 6pm will still receive the reward.

---

**🏴‍☠️ Ready to set sail, Captain!**
