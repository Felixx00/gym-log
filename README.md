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

---

## Features

### Program Builder
- Create multi-week programs (4–20 weeks) with custom days and exercises
- Configure sets with rep ranges, RIR targets, and technique notes
- Exercise autocomplete powered by a built-in library of ~180 exercises (plus your own custom entries)
- Full validation — ensures complete, well-structured programs before saving

### Dashboard
- Weekly progress row showing completed, missed, and upcoming days at a glance
- Next session card with program name, day name, week progress, and exercise count
- Stats overview: workouts this week, total completed, remaining
- Last workout card showing most recent completion

### Workout Logging
- Log reps, weight, and RIR achieved for every set
- Copy weights across sets for quick entry
- View exercise history in a draggable bottom sheet — per-week data matched by exercise and day name
- Edit previously completed workouts without losing the original completion date

### Program Tracking
- Visual timeline with week pills and progress percentage
- Day cards with three states: completed (dimmed + checkmark), current session (accent border), and upcoming
- Tap any incomplete day to start, or revisit completed days to review/edit

### Data Management
- Export all programs to JSON via the native share sheet
- Import programs from backup — duplicates are detected and skipped with a summary
- Edit existing programs (exercises, sets, day names, and set details)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native 0.81 + Expo SDK 54 |
| Language | TypeScript (strict mode) |
| Navigation | Expo Router (file-based) |
| Database | SQLite via `expo-sqlite` |
| Typography | Space Grotesk via `@expo-google-fonts` |
| Animations | Reanimated + Gesture Handler |
| File I/O | `expo-file-system` + `expo-sharing` |
| Icons | Ionicons via `@expo/vector-icons` |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- Android emulator, iOS simulator, or a physical device with [Expo Go](https://expo.dev/go)

### Installation

```bash
git clone https://github.com/Felixx00/gym-log.git
cd gym-log

npm install

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

---

## Project Structure

```
app/
├── _layout.tsx                  # Root layout (theme + DB init + font loading)
├── (tabs)/
│   ├── _layout.tsx              # Tab bar (Dashboard, Library, Settings)
│   ├── (dashboard)/             # Dashboard → program view → workout logging
│   ├── library/                 # Program creation & editing
│   └── settings/                # Export & import
services/
├── database.ts                  # SQLite service layer
├── exportTypes.ts               # Export JSON schema (versioned)
└── exportValidator.ts           # Import file validation
components/
├── StyledText.tsx               # Text/TextInput with Space Grotesk font mapping
├── OverlayModal.tsx             # Animated modal overlay
├── ExerciseHistorySheet.tsx     # Draggable bottom sheet for exercise history
└── builder/                     # Builder-specific components
constants/
└── theme.ts                     # Dark theme color palette + font families
data/
└── exerciseSeed.json            # ~180 built-in exercises for autocomplete
```

---

## Database

SQLite with 6 tables:

```
programs → weeks → days → exercises → sets
                                       + exercise_library (standalone)
```

All foreign keys cascade on delete. Workout progress is tracked via `completed` and `completed_at` on days. Set logging stores `weight`, `reps_done`, and `rir_done` (boolean — target RIR achieved or not).

The `exercise_library` table stores exercise names for autocomplete, seeded with ~180 built-in entries on first launch. Custom exercises are added automatically when saving programs.

Full schema and service API documented in [`docs/database.md`](docs/database.md).

---

## Roadmap

- [ ] Edit program metadata (name, weeks, days/week)
- [ ] Duplicate program
- [ ] Workout summary after save
- [ ] Progress & stats screen
- [ ] Rest timer
- [ ] Reorder exercises during workout
- [ ] Pre-built program templates

---

## License

This project is licensed under the [MIT License](LICENSE).
