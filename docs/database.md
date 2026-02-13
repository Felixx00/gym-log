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
| `markDayCompleted(dayId)` | Sets `completed = 1` and `completed_at = now` on a day |
| `programNameExists(name, excludeId?)` | Checks for duplicate program names |

### Design Decisions

- **Delete + re-insert children on save** rather than diffing. Simpler and correct for nested trees with reorder/add/remove.
- **4 separate SELECTs on load** (weeks, days, exercises, sets) to avoid Cartesian joins. Assembles tree bottom-up with Maps.
- **Migrations** via `PRAGMA user_version`. Current version: 1.
- **IDs**: DB uses `INTEGER PRIMARY KEY AUTOINCREMENT`. In-memory types use `string` IDs. Service layer converts with `String(id)`.

## Schema (v1)

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

sets
  id            INTEGER PRIMARY KEY AUTOINCREMENT
  exercise_id   INTEGER NOT NULL -> exercises(id) ON DELETE CASCADE
  position      INTEGER NOT NULL
  rir           INTEGER                   -- planned RIR
  technique     TEXT DEFAULT ''
  weight        REAL                      -- actual weight (logging, future)
  reps_done     INTEGER                   -- actual reps (logging, future)
  rir_done      INTEGER                   -- actual RIR (logging, future)
```

All foreign keys use `ON DELETE CASCADE`. `position` columns ensure ordering.

`completed` and `completed_at` on days are used by the Program View screen to track workout progress. Fields `weight`, `reps_done`, `rir_done` on sets are reserved for the future detailed workout logging page.

Note: `programs.duration` and `programs.days_per_week` are metadata columns written on save, but `loadProgramList()` derives these values from actual child rows to avoid sync issues.
