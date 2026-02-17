# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GymLog is a mobile workout tracker built with React Native and Expo. Users create workout program templates via the Builder, which are persisted locally with SQLite. The Day Workout page allows users to log sets (reps, weight, RIR achieved) during sessions.

## Development Commands

```bash
npm install          # Install dependencies
npm start            # Start dev server (choose platform)
npm run android      # Start on Android
npm run ios          # Start on iOS
npm run web          # Start on web
npm run lint         # Linting
```

## Technology Stack

- **Framework**: React Native 0.81.5 with Expo SDK 54
- **Language**: TypeScript (strict mode)
- **Navigation**: Expo Router (file-based routing)
- **Database**: SQLite via `expo-sqlite` (local persistence)
- **UI**: React Navigation, Expo Vector Icons (Ionicons), Reanimated & Gesture Handler
- **Theming**: Single dark theme — `constants/theme.ts`

## Architecture

```
app/
├── _layout.tsx                  # Root layout (theme + DB init)
├── (tabs)/
│   ├── _layout.tsx              # Tab bar (Dashboard, Builder)
│   ├── (dashboard)/
│   │   ├── _layout.tsx          # Stack navigator for dashboard flow
│   │   ├── index.tsx            # Dashboard: program list from DB
│   │   ├── program.tsx          # Program view: timeline, progress, day selection
│   │   ├── day.tsx              # Day workout: log sets (reps, weight, RIR)
│   │   └── edit.tsx             # Edit program (re-exports builder/weeks.tsx)
│   └── builder/
│       ├── _layout.tsx          # Stack navigator
│       ├── index.tsx            # Step 1: program metadata
│       └── weeks.tsx            # Step 2: build weeks/days/exercises
├── modal.tsx
services/
├── database.ts                  # SQLite service layer (all DB logic)
└── devGenerator.ts              # Test program generator (dev tool)
components/
├── OverlayModal.tsx             # Reusable animated modal overlay (replaces RN Modal)
├── ExerciseHistorySheet.tsx     # Draggable bottom sheet for exercise history
└── builder/
    ├── types.ts                 # Set, Exercise, Day, Week, ProgramSummary
    ├── DaySection.tsx           # Day accordion component
    ├── ExerciseCard.tsx         # Exercise editing card
    └── index.ts                 # Barrel exports
constants/
└── theme.ts                     # Color palette
docs/
├── database.md                  # Schema, migrations, service API
└── types.md                     # Data type definitions and hierarchy
```

### Key Flows

- **Builder**: `builder/index.tsx` collects name/weeks/days (validated: max 24 weeks, max 20 days/week, name required) → pushes to `weeks.tsx` → user builds program → Save validates all weeks (day names required + unique per week, exercises required per day, exercise name + rep range required) → writes full tree to SQLite in one transaction → redirects to Dashboard
- **Dashboard**: loads program list on focus (weeks/days counts derived from actual data, not metadata columns) → three-dots menu per card with Edit and Delete options. Edit navigates to `(dashboard)/edit.tsx` (reuses `builder/weeks.tsx` on the dashboard stack). Delete shows confirmation modal.
- **Program View**: `(dashboard)/program.tsx` shows program timeline with week pills, progress bar, and day list. Days have three states: completed (checkmark + date), current session (highlighted card with "Start Workout"), and future (numbered). Users can tap any incomplete day to select it as the current session. Completed days are tappable to re-edit logged data.
- **Day Workout**: `(dashboard)/day.tsx` — "Start Workout" or tapping a completed day navigates here. Shows exercise cards with set rows (RIR/technique info, reps input, weight input, RIR achieved toggle). Two action buttons per exercise: copy weight (copies Set 1's weight to all sets) and history (draggable bottom sheet via `ExerciseHistorySheet` showing per-week logged data, matched by exercise name + day name within the same program, completed days only). Save persists logged data + marks day completed → navigates back. Uses `OverlayModal` for save confirmation. When editing a completed day, header shows "EDITING" and `completed_at` is preserved (not overwritten).
- **DB Init**: `app/_layout.tsx` calls `initDatabase()` on startup, gates rendering until ready

### Path Aliasing

`@/` maps to root directory. Configured in `tsconfig.json`.

## Theming & Styling

Single dark theme. All colors in `constants/theme.ts` — never hardcode colors.

**Key colors**: Background `#0F0F0F` · Surface `#1A1A1A` · Elevated `#242424` · Accent `#E11D48` · Text `#FAFAFA` / `#9E9E9E` / `#666666` · Border `#2A2A2A`

**Builder-specific reds**: Title text `#DF1B46` · Separator `#C91A41` · Button `#E11D48`

**Conventions**:
- `StyleSheet.create()` at bottom of files
- `Colors.accent` for primary actions, `Colors.primary` for secondary
- Inputs: `surfaceElevated` bg, no border, `borderRadius: 12`, `placeholderTextColor={Colors.textTertiary}`
- Functional components with hooks, types at top of file
- **Modals**: Use `OverlayModal` component (not RN `Modal`) to avoid Android navigation bar flash with `edgeToEdgeEnabled`. Supports fade animation, frozen content during close, single/multi-button layouts.
- **Navigation performance**: Dashboard stack uses `animation: 'fade'` + `enableFreeze(true)` from `react-native-screens`. Heavy screens defer data loading with `InteractionManager.runAfterInteractions` to avoid janking the transition animation.

## Database

SQLite via `expo-sqlite`. Service layer in `services/database.ts`. See `docs/database.md` for schema, migrations, and API details.

**5 tables**: `programs` → `weeks` → `days` → `exercises` → `sets` (all CASCADE delete)

Program names must be unique. `completed` and `completed_at` on days track workout progress. Set logging fields: `weight` (decimal), `reps_done` (integer), `rir_done` (0/1 boolean — RIR achieved, not a number). `exercises.notes` stores per-exercise annotations. Dashboard derives week/day counts from actual child rows (not `programs.duration`/`programs.days_per_week` metadata).

## Validation

- **Builder step 1** (`builder/index.tsx`): Program name required, weeks clamped 1–24, days/week clamped 1–20. Inline error text shown below inputs.
- **Builder step 2 / Edit** (`builder/weeks.tsx`): On save, validates all weeks — every day must have a non-empty name, day names must be unique within each week (case-insensitive), every day must have at least one exercise, every exercise must have a name and rep range. First error shown in `OverlayModal`.

## Current Limitations

1. **No web support for DB**: `expo-sqlite` doesn't work on web
2. **Edit mode limitations**: Cannot change program name, number of weeks, or days per week when editing — only exercises, sets, day names, and set details.

## Future Ideas

### Critical
- **Edit program metadata** — Allow changing program name, weeks, and days/week during editing (currently only exercises/sets/day names are editable).
- **Exercise library / autocomplete** — Avoid manual typing and typos that break history matching (exact name match).

### High Value
- **Duplicate program** — Copy a program to repeat a cycle with tweaks.
- **Workout summary after save** — Show total sets, volume, PRs after completing a day instead of silently navigating back.
- **Progress / Stats screen** — Surface trends: total volume over time, personal records, completion rate. Data already exists in DB.

### Quality of Life
- **Rest timer** — Configurable countdown between sets.
- **Data export / backup** — JSON or CSV export to prevent data loss (no cloud, single device).
- **Reorder exercises during workout** — Swap order based on equipment availability.
- **Program templates** — Pre-built starting programs (PPL, Upper/Lower, Full Body).

## Project Configuration

- **Strict TypeScript** enabled
- **New Architecture** enabled (`newArchEnabled: true`)
- **Experiments**: React Compiler + typed routes enabled
- **URL Scheme**: `gymlog://`
