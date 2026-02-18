<p align="center">
  <img src="assets/images/icon.png" width="100" height="100" alt="GymLog icon" />
</p>

<h1 align="center">GymLog</h1>

<p align="center">
  <strong>Program-first workout tracker for structured training.</strong>
  <br />
  Build periodized programs. Log every set. Track your progress.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Expo_SDK-54-000020?style=flat&logo=expo" alt="Expo SDK 54" />
  <img src="https://img.shields.io/badge/React_Native-0.81-61DAFB?style=flat&logo=react" alt="React Native" />
  <img src="https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Storage-SQLite-003B57?style=flat&logo=sqlite" alt="SQLite" />
  <img src="https://img.shields.io/badge/License-MIT-22c55e?style=flat" alt="MIT License" />
</p>

---

## Why GymLog?

Most gym apps are built around logging individual workouts. GymLog is built around **programs** — multi-week training blocks with structured days, exercises, sets, and progression targets.

If you run periodized programs (PPL, Upper/Lower, block periodization, etc.), GymLog lets you define the full template once and then work through it day by day, tracking reps, weight, and RIR as you go.

**100% offline. No account. No cloud. Your data stays on your device.**

## Features

**Program Builder**
- Create multi-week programs with custom days and exercises per week
- Configure sets with rep ranges, RIR targets, and technique notes
- Full validation — ensures complete, well-structured programs before saving

**Workout Logging**
- Log reps, weight, and RIR achieved for every set
- Copy weights across sets for quick entry
- View exercise history in a draggable bottom sheet — per-week data matched by exercise and day name
- Edit previously completed workouts without losing the original completion date

**Program Tracking**
- Visual timeline with week pills and a progress bar
- Day states: completed (with date), current session, and upcoming
- Tap any incomplete day to start, or revisit completed days to review/edit

**Data Management**
- Export all programs to a JSON backup file via the native share sheet
- Import programs from backup — duplicates are detected and skipped with a clear summary
- Edit existing programs (exercises, sets, day names, and set details)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native 0.81 + Expo SDK 54 |
| Language | TypeScript (strict mode) |
| Navigation | Expo Router (file-based) |
| Database | SQLite via `expo-sqlite` |
| Animations | Reanimated + Gesture Handler |
| File I/O | `expo-file-system` + `expo-sharing` |
| Icons | Ionicons via `@expo/vector-icons` |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- Android emulator, iOS simulator, or a physical device with [Expo Go](https://expo.dev/go)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/gym-log.git
cd gym-log

# Install dependencies
npm install

# Start the development server
npm start
```

Then press `a` for Android or `i` for iOS.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo dev server |
| `npm run android` | Run on Android |
| `npm run ios` | Run on iOS |
| `npm run lint` | Run linter |

## Project Structure

```
app/
├── _layout.tsx                  # Root layout (theme + DB init)
├── (tabs)/
│   ├── _layout.tsx              # Tab bar (Dashboard, Builder, Settings)
│   ├── (dashboard)/             # Program list → program view → workout logging
│   ├── builder/                 # Program creation (metadata → weeks/days/exercises)
│   └── settings/                # Export & import
services/
├── database.ts                  # SQLite service layer
├── exportTypes.ts               # Export JSON schema (versioned)
└── exportValidator.ts           # Import file validation
components/
├── OverlayModal.tsx             # Animated modal overlay
├── ExerciseHistorySheet.tsx     # Draggable bottom sheet
└── builder/                     # Builder-specific components
constants/
└── theme.ts                     # Dark theme color palette
```

## Database

SQLite with 5 tables in a single hierarchy:

```
programs → weeks → days → exercises → sets
```

All foreign keys cascade on delete. Workout progress is tracked via `completed` and `completed_at` on days. Set logging stores `weight`, `reps_done`, and `rir_done` (boolean — target RIR achieved or not).

Full schema and service API documented in [`docs/database.md`](docs/database.md).

## Roadmap

- [ ] Edit program metadata (name, weeks, days/week)
- [ ] Exercise library with autocomplete
- [ ] Duplicate program
- [ ] Workout summary after save
- [ ] Progress & stats screen
- [ ] Rest timer
- [ ] Reorder exercises during workout
- [ ] Pre-built program templates

## License

This project is licensed under the [MIT License](LICENSE).
