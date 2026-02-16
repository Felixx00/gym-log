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
};
```

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
