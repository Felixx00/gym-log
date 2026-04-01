# Data Types

Defined in `components/builder/types.ts`. Exported via `components/builder/index.ts`.

## Core Types

```typescript
type Set = {
    id: string;
    rir?: number;           // planned Reps in Reserve
    technique?: string;     // technique/notes for the set
    weight?: number;        // logged weight (decimal)
    repsDone?: number;      // logged reps
    rirAchieved?: boolean;  // whether target RIR was achieved
};

type Exercise = {
    id: string;
    name: string;
    repRange: string;       // e.g. "8-12"
    notes?: string;         // per-exercise annotations
    sets: Set[];
};

type Day = {
    id: string;
    defaultName: string;    // "Day 1", "Day 2"...
    customName: string;     // user-defined name
    isOpen: boolean;        // UI-only accordion state (NOT persisted)
    exercises: Exercise[];
    completed?: boolean;    // day marked done after workout save
    completedAt?: string;   // ISO date of completion
};

type Week = {
    id: string;
    name: string;           // "Week 1", "Week 2"...
    days: Day[];
};

type ProgramSummary = {
    id: number;             // DB integer ID
    name: string;
    duration: number;       // total weeks
    daysPerWeek: number;
    createdAt: string;      // ISO timestamp
    isActive: boolean;      // whether this is the active routine
    isCompleted: boolean;   // all days in the program are completed
};
```

## Export Types

Defined in `services/exportTypes.ts`. Used for JSON export/import. Mirrors the core types but strips internal IDs and UI state (`isOpen`). Includes a `schemaVersion` for forward-compatibility.

```typescript
type ExportFile = {
    schemaVersion: number;      // current: 1
    exportedAt: string;         // ISO timestamp
    programs: ExportProgram[];
};

type ExportProgram = { name, duration, daysPerWeek, weeks: ExportWeek[] };
type ExportWeek = { name, days: ExportDay[] };
type ExportDay = { defaultName, customName, exercises: ExportExercise[], completed?, completedAt? };
type ExportExercise = { name, repRange, notes?, sets: ExportSet[] };
type ExportSet = { rir?, technique?, weight?, repsDone?, rirAchieved? };
```

Validation lives in `services/exportValidator.ts` — `validateExportFile(data): data is ExportFile` performs structural type checking and rejects unknown schema versions.

## ID Strategy

- In-memory: temporary string IDs (`week-1`, `day-1`, `ex-{timestamp}`, `set-{timestamp}`)
- After DB save: numeric IDs converted to strings (`String(row.id)`)
- `ProgramSummary.id` is always `number` (always from DB)

## Hierarchy

```
Program (metadata only, not a type — passed as params)
  └── Week[]
        └── Day[]
              └── Exercise[]
                    └── Set[]
```
