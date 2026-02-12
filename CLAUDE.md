# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GymLog is a mobile workout tracker built with React Native and Expo. Users create workout program templates via the Builder, which are persisted locally with SQLite. A workout logging page (for tracking actual sets/reps/weight during sessions) is planned but not yet implemented.

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
│   ├── index.tsx                # Dashboard: program list from DB
│   └── builder/
│       ├── _layout.tsx          # Stack navigator
│       ├── index.tsx            # Step 1: program metadata
│       └── weeks.tsx            # Step 2: build weeks/days/exercises
├── modal.tsx
services/
└── database.ts                  # SQLite service layer (all DB logic)
components/
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

- **Builder**: `builder/index.tsx` collects name/weeks/days → pushes to `weeks.tsx` → user builds program → Save writes full tree to SQLite in one transaction → redirects to Dashboard
- **Dashboard**: loads program list on focus → tap to edit (passes `programId`) → delete with confirmation
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

## Database

SQLite via `expo-sqlite`. Service layer in `services/database.ts`. See `docs/database.md` for schema, migrations, and API details.

**5 tables**: `programs` → `weeks` → `days` → `exercises` → `sets` (all CASCADE delete)

Program names must be unique. Logging fields (`weight`, `reps_done`, `rir_done`, `completed`, `completed_at`) exist in schema but are unused by the builder — reserved for future workout logging page.

## Current Limitations

1. **No workout logging**: Builder creates templates only. No page yet for entering actual workout data (weight, reps, RIR)
2. **No validation**: Users can save incomplete exercise data
3. **No web support for DB**: `expo-sqlite` doesn't work on web

## Project Configuration

- **Strict TypeScript** enabled
- **New Architecture** enabled (`newArchEnabled: true`)
- **Experiments**: React Compiler + typed routes enabled
- **URL Scheme**: `gymlog://`
