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
│   ├── _layout.tsx          # Tab bar configuration (Home, Create)
│   ├── index.tsx            # Home tab screen
│   └── create/              # Create workflow (stack navigation)
│       ├── _layout.tsx      # Stack navigator for create flow
│       ├── index.tsx        # Step 1: Program metadata (name, duration, days/week)
│       ├── weeks.tsx        # Step 2: Build weeks/days/exercises
│       └── [week]/          # Dynamic route (currently minimal)
│           └── index.tsx
└── modal.tsx                # Example modal screen
```

### Navigation Flow

1. **Home Tab** (`(tabs)/index.tsx`): Welcome screen with placeholder content
2. **Create Tab** (`(tabs)/create/`): Multi-step program creation
   - `index.tsx`: Collects program name, duration (weeks), and days per week
   - `weeks.tsx`: Main program builder - allows users to:
     - Switch between weeks via horizontal tabs
     - Add exercises to each day (7 days per week currently hardcoded)
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
import { useColorScheme } from '@/hooks/use-color-scheme';
```

Configured in `tsconfig.json` via `"paths": { "@/*": ["./*"] }`.

### Theming System

- `hooks/use-color-scheme.ts`: Detects system color scheme (light/dark)
- `hooks/use-theme-color.ts`: Returns theme-aware colors
- `constants/theme.ts`: Color definitions
- `components/themed-*.tsx`: Theme-aware wrapper components
- Root layout applies `@react-navigation/native` theme based on color scheme

## Key Implementation Details

### Create Workflow State Management

The create flow uses URL params to pass data between screens:

```typescript
// Step 1 (create/index.tsx) navigates to Step 2:
router.push({
  pathname: '/create/weeks',
  params: { name, duration, daysPerWeek }
});

// Step 2 (weeks.tsx) reads params:
const { name, duration } = useLocalSearchParams();
```

State within `weeks.tsx` uses complex nested updates to modify exercises/days/weeks immutably.

### Current Limitations

1. **No data persistence**: SQLite integration is planned but not implemented
2. **Hardcoded values**: Days per week is always 7, regardless of user input from Step 1
3. **No validation**: Users can save incomplete or invalid exercise data
4. **No edit/delete**: Cannot remove exercises or navigate back without losing data
5. **No program list**: Cannot view or select previously created programs

## Development Patterns

### Component Structure

- Use functional components with hooks
- Inline styles via `StyleSheet.create()` at bottom of files
- Separate types/interfaces at top when complex state is involved
- Group related state and handlers with comments

### Styling Conventions

- Colors: Black (`#000`) for primary actions, light grays for inactive states
- Spacing: Consistent padding (10-20px), margin bottom for vertical rhythm
- Inputs: Border radius 6-12px, border color `#ccc`/`#ddd`
- Buttons: Full-width, rounded, clear visual hierarchy

## Next Steps for SQLite Integration

When implementing SQLite:

1. Install: `expo install expo-sqlite`
2. Create database schema for Programs, Weeks, Days, Exercises
3. Add database service layer (e.g., `services/database.ts`)
4. Replace state management in `weeks.tsx` with database operations
5. Add program listing screen on Home tab
6. Implement program selection/editing/deletion

## Known Issues

- `app/(tabs)/index.tsx:68` contains inappropriate placeholder text that should be removed
- `[week]/index.tsx` is effectively empty (1 line file)
- `daysPerWeek` param from Step 1 is collected but not used in Step 2

## Project Configuration

- **Strict TypeScript**: Enabled in `tsconfig.json`
- **New Architecture**: Expo's new architecture is enabled (`newArchEnabled: true`)
- **Experiments**: React Compiler and typed routes are enabled
- **URL Scheme**: `gymlog://` for deep linking
