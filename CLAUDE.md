# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GymLog is a mobile workout tracker application built with React Native and Expo. The app enables users to create workout programs, manage them, track workout history, and log daily workout sessions. SQLite is planned for local data persistence.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (choose platform from menu)
npm start

# Start on specific platform
npm run android
npm run ios
npm run web

# Linting
npm run lint

# Reset project (moves current app to app-example)
npm run reset-project
```

## Technology Stack

- **Framework**: React Native 0.81.5 with Expo SDK 54
- **Language**: TypeScript (strict mode enabled)
- **Navigation**: Expo Router (file-based routing)
- **UI Libraries**:
  - React Navigation for tab/stack navigation
  - Expo Vector Icons (Ionicons)
  - React Native Reanimated & Gesture Handler
- **Theming**: Custom theme system with light/dark mode support
- **Planned**: SQLite for local database (not yet implemented)

## Architecture

### Routing Structure

The app uses Expo Router's file-based routing with the following hierarchy:

```
app/
├── _layout.tsx              # Root layout with theme provider
├── (tabs)/                  # Tab navigator group
│   ├── _layout.tsx          # Tab bar configuration (Dashboard, Builder)
│   ├── index.tsx            # Dashboard tab screen
│   └── create/              # Builder workflow (stack navigation)
│       ├── _layout.tsx      # Stack navigator for builder flow
│       ├── index.tsx        # Step 1: Program metadata (name, duration, days/week)
│       ├── weeks.tsx        # Step 2: Build weeks/days/exercises
│       └── [week]/          # Dynamic route (currently minimal)
│           └── index.tsx
└── modal.tsx                # Example modal screen
```

### Navigation Flow

1. **Dashboard Tab** (`(tabs)/index.tsx`): Welcome screen with placeholder content for future program listings
2. **Builder Tab** (`(tabs)/create/`): Multi-step program creation
   - `index.tsx`: Collects program name, duration (weeks), and days per week
   - `weeks.tsx`: Main program builder - allows users to:
     - Switch between weeks via horizontal tabs
     - Add exercises to each day (dynamically based on user input)
     - Configure exercise details: name, sets, reps, RIR (Reps in Reserve), technique

### Data Structure (In-Memory Only)

Currently, all data is managed in component state. Key types defined in `weeks.tsx`:

```typescript
type Exercise = {
  id: string;
  name: string;
  sets: number;
  reps: string;  // Allows flexible formats like "8-10"
  rir?: number;  // Reps in Reserve
  technique?: string;
}

type Day = {
  id: string;
  name: string;
  exercises: Exercise[];
}

type Week = {
  id: string;
  name: string;
  days: Day[];  // Currently always 7 days
}
```

**Important**: Data is NOT persisted yet. Navigating away loses all program data.

### Path Aliasing

The project uses `@/` as an alias for the root directory:

```typescript
import { HelloWave } from '@/components/hello-wave';
import { Colors } from '@/constants/theme';
```

Configured in `tsconfig.json` via `"paths": { "@/*": ["./*"] }`.

### Theming System

The app uses a **single dark theme** - no light/dark mode switching:

- `constants/theme.ts`: All color definitions in one place
- Dark, minimalist, elegant palette with red accent for contrast
- Root layout (`app/_layout.tsx`) applies custom GymLogTheme to React Navigation
- All screens import and use `Colors` directly from `@/constants/theme`

**Color Palette**:
- Background: `#0F0F0F` (deep dark)
- Surface: `#1A1A1A` (cards, elevated surfaces)
- Surface Elevated: `#242424` (higher elevation)
- Text Primary: `#FAFAFA` (off-white)
- Text Secondary: `#9E9E9E` (muted gray)
- Text Tertiary: `#666666` (darker gray)
- **Accent: `#DC3545` (elegant red for primary actions)**
- Primary: `#FFFFFF` (pure white for secondary actions)
- Border: `#2A2A2A` (subtle borders)

## Key Implementation Details

### Builder Workflow State Management

The builder flow uses URL params to pass data between screens:

```typescript
// Step 1 (create/index.tsx) navigates to Step 2:
router.push({
  pathname: '/create/weeks',
  params: { name, duration, daysPerWeek }
});

// Step 2 (weeks.tsx) reads params:
const { name, duration, daysPerWeek } = useLocalSearchParams();
const totalDays = Number(daysPerWeek ?? 7); // Creates dynamic number of days
```

State within `weeks.tsx` uses complex nested updates to modify exercises/days/weeks immutably. The number of days per week is dynamically created based on user input.

### Current Limitations

1. **No data persistence**: SQLite integration is planned but not implemented
2. **No validation**: Users can save incomplete or invalid exercise data
3. **No edit/delete**: Cannot remove exercises or navigate back without losing data
4. **No program list**: Cannot view or select previously created programs

## Development Patterns

### Component Structure

- Use functional components with hooks
- Inline styles via `StyleSheet.create()` at bottom of files
- Separate types/interfaces at top when complex state is involved
- Group related state and handlers with comments

### Styling Conventions

- Colors: Import from `@/constants/theme` - NEVER hardcode colors
- Backgrounds: Use `Colors.background`, `Colors.surface`, `Colors.surfaceElevated` for depth
- Text: Use `Colors.textPrimary`, `Colors.textSecondary`, `Colors.textTertiary` for hierarchy
- Actions:
  - `Colors.accent` (red) for primary buttons and CTAs
  - `Colors.primary` (white) for secondary actions
  - Button text: `Colors.textPrimary` on accent backgrounds
- Active states: Use `Colors.accent` for selected tabs, active weeks, etc.
- Spacing: Consistent padding (10-20px), margin bottom for vertical rhythm
- Inputs: Border radius 6-10px, use `Colors.border`, add `placeholderTextColor={Colors.textTertiary}`
- Buttons: Full-width, rounded (8-12px), high contrast with red accent

## Next Steps for SQLite Integration

When implementing SQLite:

1. Install: `expo install expo-sqlite`
2. Create database schema for Programs, Weeks, Days, Exercises
3. Add database service layer (e.g., `services/database.ts`)
4. Replace state management in `weeks.tsx` with database operations
5. Add program listing screen on Home tab
6. Implement program selection/editing/deletion

## Known Issues

- `[week]/index.tsx` is effectively empty (1 line file) and not yet implemented

## Project Configuration

- **Strict TypeScript**: Enabled in `tsconfig.json`
- **New Architecture**: Expo's new architecture is enabled (`newArchEnabled: true`)
- **Experiments**: React Compiler and typed routes are enabled
- **URL Scheme**: `gymlog://` for deep linking
