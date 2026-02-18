# Database

SQLite via `expo-sqlite`. Single local database file `gymlog.db`.

## Service Layer

All DB logic lives in `services/database.ts`. Components never write SQL directly.

### API

| Function | Description |
|----------|-------------|
| `initDatabase()` | Opens DB, enables WAL + foreign keys, runs migrations |
| `saveProgram(name, duration, daysPerWeek, weeks, existingProgramId?)` | Saves full program tree in a transaction. Returns `programId` |
| `loadProgramList()` | Returns `ProgramSummary[]` for dashboard. Derives week/day counts from actual child rows via JOINs |
| `loadProgram(programId)` | Reconstructs full nested `Week[]` from DB |
| `deleteProgram(programId)` | Deletes program + all children (CASCADE) |
| `loadDay(dayId)` | Loads a single day with exercises and sets |
| `saveDayLog(dayId, exercises)` | Saves logged set data (weight, reps, RIR achieved) + marks day completed. Preserves original `completed_at` on re-save |
| `markDayCompleted(dayId)` | Sets `completed = 1` and `completed_at = now` on a day |
| `loadExerciseHistory(exerciseId)` | Returns per-week history for an exercise (matched by name + day name within same program, completed days only). Returns `HistoryWeek[]` |
| `programNameExists(name, excludeId?)` | Checks for duplicate program names |
| `exportAllPrograms()` | Returns `ExportFile` with all programs serialized (strips IDs/UI state). Uses `loadProgram()` per program |
| `importPrograms(data)` | Imports programs from `ExportFile`. Skips duplicate names. Returns `{ imported: string[], skipped: string[] }` |

### Design Decisions

- **Delete + re-insert children on save** rather than diffing. Simpler and correct for nested trees with reorder/add/remove.
- **4 separate SELECTs on load** (weeks, days, exercises, sets) to avoid Cartesian joins. Assembles tree bottom-up with Maps.
- **Migrations** via `PRAGMA user_version`. Current version: 2. PRAGMA is set outside transactions (it's not transactional in SQLite).
- **IDs**: DB uses `INTEGER PRIMARY KEY AUTOINCREMENT`. In-memory types use `string` IDs. Service layer converts with `String(id)`.

## Schema (v2)

```sql
programs
  id            INTEGER PRIMARY KEY AUTOINCREMENT
  name          TEXT NOT NULL UNIQUE
  duration      INTEGER NOT NULL          -- total weeks
  days_per_week INTEGER NOT NULL
  created_at    TEXT DEFAULT datetime('now')

weeks
  id            INTEGER PRIMARY KEY AUTOINCREMENT
  program_id    INTEGER NOT NULL -> programs(id) ON DELETE CASCADE
  position      INTEGER NOT NULL          -- ordering
  name          TEXT NOT NULL

days
  id            INTEGER PRIMARY KEY AUTOINCREMENT
  week_id       INTEGER NOT NULL -> weeks(id) ON DELETE CASCADE
  position      INTEGER NOT NULL
  default_name  TEXT NOT NULL
  custom_name   TEXT DEFAULT ''
  completed     INTEGER DEFAULT 0         -- boolean 0/1
  completed_at  TEXT                      -- ISO date, nullable

exercises
  id            INTEGER PRIMARY KEY AUTOINCREMENT
  day_id        INTEGER NOT NULL -> days(id) ON DELETE CASCADE
  position      INTEGER NOT NULL
  name          TEXT DEFAULT ''
  rep_range     TEXT DEFAULT ''
  notes         TEXT DEFAULT ''            -- v2: per-exercise annotations

sets
  id            INTEGER PRIMARY KEY AUTOINCREMENT
  exercise_id   INTEGER NOT NULL -> exercises(id) ON DELETE CASCADE
  position      INTEGER NOT NULL
  rir           INTEGER                   -- planned RIR
  technique     TEXT DEFAULT ''
  weight        REAL                      -- logged weight
  reps_done     INTEGER                   -- logged reps
  rir_done      INTEGER                   -- 0/1 boolean: RIR target achieved
```

All foreign keys use `ON DELETE CASCADE`. `position` columns ensure ordering.

`completed` and `completed_at` on days track workout progress. `weight`, `reps_done`, `rir_done` on sets are written by the Day Workout page on save. `rir_done` is a boolean (0/1) indicating whether the target RIR was achieved (not a numeric RIR value).

### Migrations

- **v1**: Initial schema (all 5 tables)
- **v2**: Added `exercises.notes` column

Note: `programs.duration` and `programs.days_per_week` are metadata columns written on save, but `loadProgramList()` derives these values from actual child rows to avoid sync issues.
