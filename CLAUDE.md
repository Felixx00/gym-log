# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GymLog is a mobile workout tracker built with React Native and Expo. Users create workout program templates via the Library tab, which are persisted locally with SQLite. The Day Workout page allows users to log sets (reps, weight, RIR achieved) during sessions.

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
- **UI**: React Navigation, Expo Vector Icons (Ionicons), Reanimated & Gesture Handler, `expo-linear-gradient`
- **Typography**: Space Grotesk (`@expo-google-fonts/space-grotesk`) — loaded via `useFonts` in root layout
- **File I/O**: `expo-file-system` (new class-based API: `File`, `Paths`) + `expo-sharing`
- **Theming**: Single dark theme — `constants/theme.ts`

## Architecture

```
app/
├── _layout.tsx                  # Root layout (theme + DB init + font loading)
├── (tabs)/
│   ├── _layout.tsx              # Tab bar (Dashboard, Library, Settings)
│   ├── (dashboard)/
│   │   ├── _layout.tsx          # Stack navigator for dashboard flow
│   │   ├── index.tsx            # Dashboard: program list from DB
│   │   ├── program.tsx          # Program view: timeline, progress, day selection
│   │   ├── day.tsx              # Day workout: log sets (reps, weight, RIR)
│   │   └── edit.tsx             # Edit program (re-exports library/weeks.tsx)
│   ├── library/
│   │   ├── _layout.tsx          # Stack navigator
│   │   ├── index.tsx            # Library: program list + "New Routine" button
│   │   ├── create.tsx           # Step 1: program metadata
│   │   ├── weeks.tsx            # Step 2: build weeks/days/exercises
│   │   └── edit.tsx             # Edit program (re-exports weeks.tsx)
│   └── settings/
│       ├── _layout.tsx          # Stack navigator
│       └── index.tsx            # Settings: export/import programs
├── modal.tsx
services/
├── database.ts                  # SQLite service layer (all DB logic)
├── exportTypes.ts               # Export JSON schema types (versioned)
├── exportValidator.ts           # Import file validation
└── devGenerator.ts              # Test program generator (dev tool)
data/
└── exerciseSeed.json            # ~180 built-in exercises for exercise library
components/
├── StyledText.tsx               # Custom Text/TextInput with Space Grotesk font mapping
├── OverlayModal.tsx             # Reusable animated modal overlay (replaces RN Modal)
├── ExerciseHistorySheet.tsx     # Draggable bottom sheet for exercise history
└── builder/
    ├── types.ts                 # Set, Exercise, Day, Week, ProgramSummary
    ├── DaySection.tsx           # Day accordion component
    ├── ExerciseCard.tsx         # Exercise editing card
    ├── ExerciseAutocomplete.tsx # Autocomplete input for exercise names
    └── index.ts                 # Barrel exports
constants/
└── theme.ts                     # Color palette + font family names
docs/
├── database.md                  # Schema, migrations, service API
└── types.md                     # Data type definitions and hierarchy
```

### Key Flows

- **Library**: `library/index.tsx` displays two sections: a featured "Active Routine" card at the top (if one is set) and an "All Routines" list below. Cards are non-tappable (view-only); three-dots menu provides Set as Active / Remove Active, Edit, and Delete. Only one program can be active at a time. A circular "+" button navigates to `library/create.tsx` which collects name/weeks/days (name required, weeks via slider 4–20 default 12, days/week via pill selector 3–12 default 5) → pushes to `weeks.tsx` → user builds program → Save validates all weeks (day names required + unique per week, exercises required per day, exercise name + rep range required) → writes full tree to SQLite in one transaction → returns to Library list.
- **Dashboard**: `(dashboard)/index.tsx` shows the active routine's dashboard. Header displays day of week + "Dashboard" title. Below: weekly progress row (Mon–Sun boxes showing completed checkmarks, missed X icons, today highlighted with accent border, future with date numbers), then the active routine session card (program name, "NEXT SESSION" badge, next workout day name, week progress, exercise count, arrow button to start). Stats row shows workouts this week / total done / remaining. Last workout card shows most recent completion. If no active routine is set, shows an empty state prompt. Data comes from `loadDashboardStats()`. Program view is accessed by tapping the program name link; workout is started via the session card arrow.
- **Program View**: `(dashboard)/program.tsx` shows program overview with compact header (name + progress %), horizontal week pills, and card-based day list. Days are uniform cards with three states: completed (dimmed + checkmark badge), current session (accent border + "Start Workout" button), and future (chevron). Users can tap any incomplete day to select it as the current session. Completed days are tappable to re-edit logged data.
- **Day Workout**: `(dashboard)/day.tsx` — "Start Workout" or tapping a completed day navigates here. Opens with a scrollable workout overview listing all exercises with sets×reps (e.g. "Bench Press 4×12"), separated from the detail cards by an "EXERCISES" divider. Below, shows exercise cards with set rows (RIR number + flash icon for technique with tooltip on tap, reps input, weight input, RIR achieved toggle). Two action buttons per exercise: copy weight (copies Set 1's weight to all sets) and history (draggable bottom sheet via `ExerciseHistorySheet` showing per-week logged data, matched by exercise name + day name within the same program, completed days only). Save persists logged data + marks day completed → navigates back. Uses `OverlayModal` for save confirmation. When editing a completed day, header shows "EDITING" and `completed_at` is preserved (not overwritten).
- **Settings**: `settings/index.tsx` — two actions: Export All Programs (serializes all programs to JSON, opens native share sheet via `expo-sharing`) and Import Programs (picks JSON file via `expo-file-system` `File.pickFileAsync()`, validates structure, saves to DB). On import, programs with duplicate names are skipped and the user is notified in a summary modal.
- **DB Init**: `app/_layout.tsx` calls `initDatabase()` on startup and loads fonts via `useFonts`, gates rendering until both are ready

### Path Aliasing

`@/` maps to root directory. Configured in `tsconfig.json`.

## Theming & Styling

Single dark theme. All colors in `constants/theme.ts` — never hardcode colors.

**Font**: Space Grotesk (geometric sans-serif). All `Text` and `TextInput` components must be imported from `@/components/StyledText` (not `react-native`). `StyledText` wraps RN's `Text`/`TextInput` and auto-maps `fontWeight` → correct Space Grotesk font file (300→Light, 400→Regular, 500→Medium, 600→SemiBold, 700+→Bold), stripping `fontWeight` from the style to avoid Android font resolution failures. Font family names are exported from `constants/theme.ts` via `Fonts`.

**Key colors**: Background `#0F0F0F` · Surface `#1A1A1A` · Elevated `#242424` · Accent `#FF3E3E` · Text `#FAFAFA` / `#9E9E9E` / `#666666` · Border `#2A2A2A`

**Conventions**:
- `StyleSheet.create()` at bottom of files
- `Colors.accent` for primary actions, `Colors.primary` for secondary
- `Text` and `TextInput` from `@/components/StyledText`, never from `react-native`
- Inputs: `surfaceElevated` bg, no border, `borderRadius: 12`, `placeholderTextColor={Colors.textTertiary}`
- Functional components with hooks, types at top of file
- **Modals**: Use `OverlayModal` component (not RN `Modal`) to avoid Android navigation bar flash with `edgeToEdgeEnabled`. Supports fade animation, frozen content during close, single/multi-button layouts.
- **Navigation performance**: Dashboard stack uses `animation: 'fade'` + `enableFreeze(true)` from `react-native-screens`. Heavy screens defer data loading with `InteractionManager.runAfterInteractions` to avoid janking the transition animation.

## Database

SQLite via `expo-sqlite`. Service layer in `services/database.ts`. See `docs/database.md` for schema, migrations, and API details.

**6 tables**: `programs` → `weeks` → `days` → `exercises` → `sets` (all CASCADE delete) + standalone `exercise_library`

Program names must be unique. `is_active` on programs tracks the active routine (only one at a time, enforced by `setActiveProgram()`). `completed` and `completed_at` on days track workout progress. Set logging fields: `weight` (decimal), `reps_done` (integer), `rir_done` (0/1 boolean — RIR achieved, not a number). `exercises.notes` stores per-exercise annotations. Dashboard derives week/day counts from actual child rows (not `programs.duration`/`programs.days_per_week` metadata).

**Exercise Library**: `exercise_library` table stores exercise names for autocomplete. Seeded with ~180 built-in exercises from `data/exerciseSeed.json` on first migration. Names are `UNIQUE COLLATE NOCASE`. When a program is saved, any new exercise names are auto-inserted with `INSERT OR IGNORE` as `is_custom=1`. The `ExerciseAutocomplete` component in the builder queries this table with prefix `LIKE` matching, showing up to 10 suggestions ordered by custom-first then alphabetical.

## Validation

- **Create step 1** (`library/create.tsx`): Program name required (inline error text). Weeks selected via native slider (4–20, default 12, `@react-native-community/slider`). Days/week selected via horizontal pill row (3–12, default 5).
- **Create step 2 / Edit** (`library/weeks.tsx`): On save, validates all weeks — every day must have a non-empty name, day names must be unique within each week (case-insensitive), every day must have at least one exercise, every exercise must have a name and rep range. First error shown in `OverlayModal`.

## Current Limitations

1. **No web support for DB**: `expo-sqlite` doesn't work on web
2. **Edit mode limitations**: Cannot change program name, number of weeks, or days per week when editing — only exercises, sets, day names, and set details.

## Future Ideas

### Critical
- **Edit program metadata** — Allow changing program name, weeks, and days/week during editing (currently only exercises/sets/day names are editable).

### High Value
- **Duplicate program** — Copy a program to repeat a cycle with tweaks.
- **Workout summary after save** — Show total sets, volume, PRs after completing a day instead of silently navigating back.
- **Progress / Stats screen** — Surface trends: total volume over time, personal records, completion rate. Data already exists in DB.

### Quality of Life
- **Rest timer** — Configurable countdown between sets.
- **Reorder exercises during workout** — Swap order based on equipment availability.
- **Program templates** — Pre-built starting programs (PPL, Upper/Lower, Full Body).

## Project Configuration

- **Strict TypeScript** enabled
- **New Architecture** enabled (`newArchEnabled: true`)
- **Experiments**: React Compiler + typed routes enabled
- **URL Scheme**: `gymlog://`
