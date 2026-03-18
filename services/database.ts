import * as SQLite from 'expo-sqlite';

import type { Day, Exercise, ProgramSummary, Set, Week } from '@/components/builder/types';
import type { ExportFile, ExportProgram } from './exportTypes';
import { EXPORT_SCHEMA_VERSION } from './exportTypes';

let db: SQLite.SQLiteDatabase | null = null;

const DB_NAME = 'gymlog.db';
const SCHEMA_VERSION = 5;

// ────────────────────────── Init & Migrations ──────────────────────────

export async function initDatabase(): Promise<void> {
    db = await SQLite.openDatabaseAsync(DB_NAME);
    await db.execAsync('PRAGMA journal_mode = WAL;');
    await db.execAsync('PRAGMA foreign_keys = ON;');

    const result = await db.getFirstAsync<{ user_version: number }>(
        'PRAGMA user_version;'
    );
    const currentVersion = result?.user_version ?? 0;

    if (currentVersion < SCHEMA_VERSION) {
        await migrate(currentVersion);
    }
}

async function migrate(fromVersion: number): Promise<void> {
    if (!db) throw new Error('Database not initialized');

    if (fromVersion < 1) {
        await db.withTransactionAsync(async () => {
            await applyV1();
        });
        await db.execAsync('PRAGMA user_version = 1;');
    }
    if (fromVersion < 2) {
        await applyV2();
        await db.execAsync('PRAGMA user_version = 2;');
    }
    if (fromVersion < 3) {
        await applyV3();
        await db.execAsync('PRAGMA user_version = 3;');
    }
    if (fromVersion < 4) {
        await applyV4();
        await db.execAsync('PRAGMA user_version = 4;');
    }
    if (fromVersion < 5) {
        await applyV5();
        await db.execAsync('PRAGMA user_version = 5;');
    }
}

async function applyV1(): Promise<void> {
    if (!db) throw new Error('Database not initialized');

    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS programs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            duration INTEGER NOT NULL,
            days_per_week INTEGER NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS weeks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            program_id INTEGER NOT NULL,
            position INTEGER NOT NULL,
            name TEXT NOT NULL,
            FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS days (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            week_id INTEGER NOT NULL,
            position INTEGER NOT NULL,
            default_name TEXT NOT NULL,
            custom_name TEXT NOT NULL DEFAULT '',
            completed INTEGER NOT NULL DEFAULT 0,
            completed_at TEXT,
            FOREIGN KEY (week_id) REFERENCES weeks(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS exercises (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            day_id INTEGER NOT NULL,
            position INTEGER NOT NULL,
            name TEXT NOT NULL DEFAULT '',
            rep_range TEXT NOT NULL DEFAULT '',
            FOREIGN KEY (day_id) REFERENCES days(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS sets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            exercise_id INTEGER NOT NULL,
            position INTEGER NOT NULL,
            rir INTEGER,
            technique TEXT DEFAULT '',
            weight REAL,
            reps_done INTEGER,
            rir_done INTEGER,
            FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
        );
    `);
}

async function applyV2(): Promise<void> {
    if (!db) throw new Error('Database not initialized');
    await db.execAsync(
        `ALTER TABLE exercises ADD COLUMN notes TEXT NOT NULL DEFAULT '';`
    );
}

async function applyV3(): Promise<void> {
    if (!db) throw new Error('Database not initialized');

    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS exercise_library (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE COLLATE NOCASE,
            muscle_group TEXT NOT NULL DEFAULT '',
            is_custom INTEGER NOT NULL DEFAULT 0
        );
    `);

    // Seed built-in exercises from JSON
    const seedData: { name: string; muscle_group: string }[] =
        require('@/data/exerciseSeed.json');

    for (const exercise of seedData) {
        await db.runAsync(
            'INSERT OR IGNORE INTO exercise_library (name, muscle_group, is_custom) VALUES (?, ?, 0)',
            [exercise.name, exercise.muscle_group]
        );
    }

    // Backfill: insert any exercise names already used in existing programs
    await db.execAsync(`
        INSERT OR IGNORE INTO exercise_library (name, muscle_group, is_custom)
        SELECT DISTINCT e.name, '', 1
        FROM exercises e
        WHERE e.name != ''
    `);
}

async function applyV4(): Promise<void> {
    if (!db) throw new Error('Database not initialized');

    // Re-seed: insert any new built-in exercises added to the seed file
    const seedData: { name: string; muscle_group: string }[] =
        require('@/data/exerciseSeed.json');

    for (const exercise of seedData) {
        await db.runAsync(
            'INSERT OR IGNORE INTO exercise_library (name, muscle_group, is_custom) VALUES (?, ?, 0)',
            [exercise.name, exercise.muscle_group]
        );
    }
}

async function applyV5(): Promise<void> {
    if (!db) throw new Error('Database not initialized');
    await db.execAsync(
        `ALTER TABLE programs ADD COLUMN is_active INTEGER NOT NULL DEFAULT 0;`
    );
}

// ────────────────────────── Active Program ──────────────────────────

export async function setActiveProgram(programId: number | null): Promise<void> {
    if (!db) throw new Error('Database not initialized');
    await db.withTransactionAsync(async () => {
        // Clear any existing active program
        await db!.runAsync('UPDATE programs SET is_active = 0 WHERE is_active = 1');
        // Set the new active program (if not clearing)
        if (programId != null) {
            await db!.runAsync('UPDATE programs SET is_active = 1 WHERE id = ?', [programId]);
        }
    });
}

// ────────────────────────── Dashboard Stats ──────────────────────────

// 'completed' = workout done, 'missed' = past day with no workout, 'today' = current day, 'future' = upcoming
export type WeekDayStatus = 'completed' | 'missed' | 'today' | 'future';

export type DashboardStats = {
    programId: number;
    programName: string;
    totalDays: number;
    completedDays: number;
    currentWeek: number;
    totalWeeks: number;
    nextDay: { id: number; name: string; dayNumber: number; exerciseCount: number } | null;
    lastWorkout: { name: string; completedAt: string } | null;
    workoutsThisWeek: number;
    weeklyActivity: WeekDayStatus[]; // Mon=0 through Sun=6
};

export async function loadDashboardStats(): Promise<DashboardStats | null> {
    if (!db) throw new Error('Database not initialized');

    // Find active program
    const program = await db.getFirstAsync<{ id: number; name: string }>(
        'SELECT id, name FROM programs WHERE is_active = 1'
    );
    if (!program) return null;

    // Total weeks
    const weekRow = await db.getFirstAsync<{ cnt: number }>(
        'SELECT COUNT(*) as cnt FROM weeks WHERE program_id = ?',
        [program.id]
    );
    const totalWeeks = weekRow?.cnt ?? 0;

    // All days with week info, ordered by week then day position
    const days = await db.getAllAsync<{
        day_id: number;
        custom_name: string;
        default_name: string;
        completed: number;
        completed_at: string | null;
        week_position: number;
        day_position: number;
        exercise_count: number;
    }>(`
        SELECT
            d.id AS day_id,
            d.custom_name,
            d.default_name,
            d.completed,
            d.completed_at,
            w.position AS week_position,
            d.position AS day_position,
            (SELECT COUNT(*) FROM exercises e WHERE e.day_id = d.id) AS exercise_count
        FROM days d
        JOIN weeks w ON d.week_id = w.id
        WHERE w.program_id = ?
        ORDER BY w.position, d.position
    `, [program.id]);

    const totalDays = days.length;
    const completedDays = days.filter((d) => d.completed === 1).length;

    // First incomplete day = next workout
    const nextIncomplete = days.find((d) => d.completed === 0);
    const currentWeek = nextIncomplete ? nextIncomplete.week_position + 1 : totalWeeks;

    let nextDay: DashboardStats['nextDay'] = null;
    if (nextIncomplete) {
        // Count completed days before this one in the same week to get day number
        const daysInWeekBefore = days.filter(
            (d) => d.week_position === nextIncomplete.week_position && d.day_position < nextIncomplete.day_position
        ).length;
        nextDay = {
            id: nextIncomplete.day_id,
            name: nextIncomplete.custom_name || nextIncomplete.default_name,
            dayNumber: daysInWeekBefore + 1,
            exerciseCount: nextIncomplete.exercise_count,
        };
    }

    // Last completed day (most recent by completed_at)
    const completedDaysList = days
        .filter((d) => d.completed === 1 && d.completed_at)
        .sort((a, b) => (b.completed_at! > a.completed_at! ? 1 : -1));

    let lastWorkout: DashboardStats['lastWorkout'] = null;
    if (completedDaysList.length > 0) {
        const last = completedDaysList[0];
        lastWorkout = {
            name: last.custom_name || last.default_name,
            completedAt: last.completed_at!,
        };
    }

    // Workouts completed this week (last 7 days)
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString();
    const workoutsThisWeek = completedDaysList.filter(
        (d) => d.completed_at! >= weekAgoStr
    ).length;

    // Weekly activity (Mon=0 .. Sun=6) for the current calendar week
    const todayDow = now.getDay(); // 0=Sun, 1=Mon...
    const mondayOffset = todayDow === 0 ? -6 : 1 - todayDow;
    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(monday.getDate() + mondayOffset);

    // Build a set of day-of-week indices (0=Mon..6=Sun) that had workouts
    const workoutDowSet = new Set<number>();
    for (const d of completedDaysList) {
        const dt = new Date(d.completed_at!);
        if (dt >= monday) {
            const dow = dt.getDay(); // 0=Sun
            const idx = dow === 0 ? 6 : dow - 1; // convert to Mon=0..Sun=6
            workoutDowSet.add(idx);
        }
    }

    const todayIdx = todayDow === 0 ? 6 : todayDow - 1; // Mon=0..Sun=6
    const weeklyActivity: WeekDayStatus[] = Array.from({ length: 7 }, (_, i) => {
        if (i === todayIdx) return 'today';
        if (i > todayIdx) return 'future';
        return workoutDowSet.has(i) ? 'completed' : 'missed';
    });

    return {
        programId: program.id,
        programName: program.name,
        totalDays,
        completedDays,
        currentWeek,
        totalWeeks,
        nextDay,
        lastWorkout,
        workoutsThisWeek,
        weeklyActivity,
    };
}

// ────────────────────────── Exercise Library ──────────────────────────

export async function searchExerciseLibrary(query: string): Promise<string[]> {
    if (!db) throw new Error('Database not initialized');
    if (!query.trim()) return [];

    const rows = await db.getAllAsync<{ name: string }>(
        `SELECT name FROM exercise_library
         WHERE name LIKE ?
         ORDER BY is_custom DESC, name ASC
         LIMIT 10`,
        [`${query.trim()}%`]
    );

    return rows.map((r) => r.name);
}

async function insertExerciseNames(names: string[]): Promise<void> {
    if (!db) return;

    for (const name of names) {
        if (name.trim()) {
            await db.runAsync(
                'INSERT OR IGNORE INTO exercise_library (name, muscle_group, is_custom) VALUES (?, ?, 1)',
                [name.trim(), '']
            );
        }
    }
}

// ────────────────────────── Save ──────────────────────────

export async function saveProgram(
    name: string,
    duration: number,
    daysPerWeek: number,
    weeks: Week[],
    existingProgramId?: number
): Promise<number> {
    if (!db) throw new Error('Database not initialized');

    let programId = existingProgramId ?? 0;

    await db.withTransactionAsync(async () => {
        if (existingProgramId) {
            await db!.runAsync(
                'UPDATE programs SET name = ?, duration = ?, days_per_week = ? WHERE id = ?',
                [name, duration, daysPerWeek, existingProgramId]
            );
            // CASCADE deletes all children
            await db!.runAsync(
                'DELETE FROM weeks WHERE program_id = ?',
                [existingProgramId]
            );
            programId = existingProgramId;
        } else {
            const result = await db!.runAsync(
                'INSERT INTO programs (name, duration, days_per_week) VALUES (?, ?, ?)',
                [name, duration, daysPerWeek]
            );
            programId = result.lastInsertRowId;
        }

        for (let w = 0; w < weeks.length; w++) {
            const week = weeks[w];
            const weekResult = await db!.runAsync(
                'INSERT INTO weeks (program_id, position, name) VALUES (?, ?, ?)',
                [programId, w, week.name]
            );
            const weekId = weekResult.lastInsertRowId;

            for (let d = 0; d < week.days.length; d++) {
                const day = week.days[d];
                const dayResult = await db!.runAsync(
                    'INSERT INTO days (week_id, position, default_name, custom_name, completed, completed_at) VALUES (?, ?, ?, ?, ?, ?)',
                    [weekId, d, day.defaultName, day.customName, day.completed ? 1 : 0, day.completedAt ?? null]
                );
                const dayId = dayResult.lastInsertRowId;

                for (let e = 0; e < day.exercises.length; e++) {
                    const exercise = day.exercises[e];
                    const exResult = await db!.runAsync(
                        'INSERT INTO exercises (day_id, position, name, rep_range, notes) VALUES (?, ?, ?, ?, ?)',
                        [dayId, e, exercise.name, exercise.repRange, exercise.notes ?? '']
                    );
                    const exerciseId = exResult.lastInsertRowId;

                    for (let s = 0; s < exercise.sets.length; s++) {
                        const set = exercise.sets[s];
                        await db!.runAsync(
                            'INSERT INTO sets (exercise_id, position, rir, technique, weight, reps_done, rir_done) VALUES (?, ?, ?, ?, ?, ?, ?)',
                            [exerciseId, s, set.rir ?? null, set.technique ?? '', set.weight ?? null, set.repsDone ?? null, set.rirAchieved ? 1 : null]
                        );
                    }
                }
            }
        }
    });

    // Auto-insert exercise names into the library
    try {
        const exerciseNames = weeks.flatMap((w) =>
            w.days.flatMap((d) => d.exercises.map((e) => e.name))
        );
        await insertExerciseNames(exerciseNames);
    } catch {
        // Non-critical: library update failure should not affect program save
    }

    return programId;
}

// ────────────────────────── Load List ──────────────────────────

export async function loadProgramList(): Promise<ProgramSummary[]> {
    if (!db) throw new Error('Database not initialized');

    const rows = await db.getAllAsync<{
        id: number;
        name: string;
        week_count: number;
        days_per_week: number;
        created_at: string;
        is_active: number;
    }>(`
        SELECT
            p.id,
            p.name,
            COUNT(DISTINCT w.id) AS week_count,
            COALESCE(MAX(day_counts.day_count), 0) AS days_per_week,
            p.created_at,
            p.is_active
        FROM programs p
        LEFT JOIN weeks w ON w.program_id = p.id
        LEFT JOIN (
            SELECT week_id, COUNT(*) AS day_count
            FROM days
            GROUP BY week_id
        ) day_counts ON day_counts.week_id = w.id
        GROUP BY p.id
        ORDER BY p.created_at DESC
    `);

    return rows.map((row) => ({
        id: row.id,
        name: row.name,
        duration: row.week_count,
        daysPerWeek: row.days_per_week,
        createdAt: row.created_at,
        isActive: row.is_active === 1,
    }));
}

// ────────────────────────── Load Single Program ──────────────────────────

export async function loadProgram(programId: number): Promise<{
    name: string;
    duration: number;
    daysPerWeek: number;
    weeks: Week[];
}> {
    if (!db) throw new Error('Database not initialized');

    // Program metadata
    const program = await db.getFirstAsync<{
        id: number; name: string; duration: number; days_per_week: number;
    }>('SELECT * FROM programs WHERE id = ?', [programId]);

    if (!program) throw new Error(`Program ${programId} not found`);

    // All weeks
    const weekRows = await db.getAllAsync<{
        id: number; position: number; name: string;
    }>('SELECT * FROM weeks WHERE program_id = ? ORDER BY position', [programId]);

    const weekIds = weekRows.map((w) => w.id);

    // All days
    const dayRows = weekIds.length > 0
        ? await db.getAllAsync<{
            id: number; week_id: number; position: number;
            default_name: string; custom_name: string;
            completed: number; completed_at: string | null;
        }>(
            `SELECT * FROM days WHERE week_id IN (${weekIds.map(() => '?').join(',')}) ORDER BY position`,
            weekIds
        )
        : [];

    const dayIds = dayRows.map((d) => d.id);

    // All exercises
    const exerciseRows = dayIds.length > 0
        ? await db.getAllAsync<{
            id: number; day_id: number; position: number;
            name: string; rep_range: string; notes: string;
        }>(
            `SELECT * FROM exercises WHERE day_id IN (${dayIds.map(() => '?').join(',')}) ORDER BY position`,
            dayIds
        )
        : [];

    const exerciseIds = exerciseRows.map((e) => e.id);

    // All sets
    const setRows = exerciseIds.length > 0
        ? await db.getAllAsync<{
            id: number; exercise_id: number; position: number;
            rir: number | null; technique: string | null;
            weight: number | null; reps_done: number | null; rir_done: number | null;
        }>(
            `SELECT * FROM sets WHERE exercise_id IN (${exerciseIds.map(() => '?').join(',')}) ORDER BY position`,
            exerciseIds
        )
        : [];

    // Assemble tree bottom-up
    const setsByExercise = new Map<number, Set[]>();
    for (const row of setRows) {
        const sets = setsByExercise.get(row.exercise_id) ?? [];
        sets.push({
            id: String(row.id),
            rir: row.rir ?? undefined,
            technique: row.technique ?? '',
            weight: row.weight ?? undefined,
            repsDone: row.reps_done ?? undefined,
            rirAchieved: row.rir_done != null ? row.rir_done === 1 : undefined,
        });
        setsByExercise.set(row.exercise_id, sets);
    }

    const exercisesByDay = new Map<number, Exercise[]>();
    for (const row of exerciseRows) {
        const exercises = exercisesByDay.get(row.day_id) ?? [];
        exercises.push({
            id: String(row.id),
            name: row.name,
            repRange: row.rep_range,
            notes: row.notes || undefined,
            sets: setsByExercise.get(row.id) ?? [],
        });
        exercisesByDay.set(row.day_id, exercises);
    }

    const daysByWeek = new Map<number, Day[]>();
    for (const row of dayRows) {
        const days = daysByWeek.get(row.week_id) ?? [];
        days.push({
            id: String(row.id),
            defaultName: row.default_name,
            customName: row.custom_name,
            isOpen: false,
            exercises: exercisesByDay.get(row.id) ?? [],
            completed: row.completed === 1,
            completedAt: row.completed_at ?? undefined,
        });
        daysByWeek.set(row.week_id, days);
    }

    const weeks: Week[] = weekRows.map((row) => ({
        id: String(row.id),
        name: row.name,
        days: daysByWeek.get(row.id) ?? [],
    }));

    return {
        name: program.name,
        duration: program.duration,
        daysPerWeek: program.days_per_week,
        weeks,
    };
}

// ────────────────────────── Load Single Day ──────────────────────────

export async function loadDay(dayId: number): Promise<Day> {
    if (!db) throw new Error('Database not initialized');

    const dayRow = await db.getFirstAsync<{
        id: number; week_id: number; position: number;
        default_name: string; custom_name: string;
        completed: number; completed_at: string | null;
    }>('SELECT * FROM days WHERE id = ?', [dayId]);

    if (!dayRow) throw new Error(`Day ${dayId} not found`);

    const exerciseRows = await db.getAllAsync<{
        id: number; day_id: number; position: number;
        name: string; rep_range: string; notes: string;
    }>('SELECT * FROM exercises WHERE day_id = ? ORDER BY position', [dayId]);

    const exerciseIds = exerciseRows.map((e) => e.id);

    const setRows = exerciseIds.length > 0
        ? await db.getAllAsync<{
            id: number; exercise_id: number; position: number;
            rir: number | null; technique: string | null;
            weight: number | null; reps_done: number | null; rir_done: number | null;
        }>(
            `SELECT * FROM sets WHERE exercise_id IN (${exerciseIds.map(() => '?').join(',')}) ORDER BY position`,
            exerciseIds
        )
        : [];

    const setsByExercise = new Map<number, Set[]>();
    for (const row of setRows) {
        const sets = setsByExercise.get(row.exercise_id) ?? [];
        sets.push({
            id: String(row.id),
            rir: row.rir ?? undefined,
            technique: row.technique ?? '',
            weight: row.weight ?? undefined,
            repsDone: row.reps_done ?? undefined,
            rirAchieved: row.rir_done != null ? row.rir_done === 1 : undefined,
        });
        setsByExercise.set(row.exercise_id, sets);
    }

    const exercises: Exercise[] = exerciseRows.map((row) => ({
        id: String(row.id),
        name: row.name,
        repRange: row.rep_range,
        notes: row.notes || undefined,
        sets: setsByExercise.get(row.id) ?? [],
    }));

    return {
        id: String(dayRow.id),
        defaultName: dayRow.default_name,
        customName: dayRow.custom_name,
        isOpen: false,
        exercises,
        completed: dayRow.completed === 1,
        completedAt: dayRow.completed_at ?? undefined,
    };
}

// ────────────────────────── Save Day Log ──────────────────────────

export async function saveDayLog(dayId: number, exercises: Exercise[]): Promise<void> {
    if (!db) throw new Error('Database not initialized');

    await db.withTransactionAsync(async () => {
        for (const exercise of exercises) {
            await db!.runAsync(
                'UPDATE exercises SET notes = ? WHERE id = ?',
                [exercise.notes ?? '', Number(exercise.id)]
            );
            for (const set of exercise.sets) {
                await db!.runAsync(
                    'UPDATE sets SET weight = ?, reps_done = ?, rir_done = ? WHERE id = ?',
                    [
                        set.weight ?? null,
                        set.repsDone ?? null,
                        set.rirAchieved ? 1 : 0,
                        Number(set.id),
                    ]
                );
            }
        }

        await db!.runAsync(
            "UPDATE days SET completed = 1, completed_at = COALESCE(completed_at, datetime('now')) WHERE id = ?",
            [dayId]
        );
    });
}

// ────────────────────────── Delete ──────────────────────────

export async function deleteProgram(programId: number): Promise<void> {
    if (!db) throw new Error('Database not initialized');
    await db.runAsync('DELETE FROM programs WHERE id = ?', [programId]);
}

// ────────────────────────── Mark Day Completed ──────────────────────────

export async function markDayCompleted(dayId: number): Promise<void> {
    if (!db) throw new Error('Database not initialized');
    await db.runAsync(
        "UPDATE days SET completed = 1, completed_at = datetime('now') WHERE id = ?",
        [dayId]
    );
}

// ────────────────────────── Exercise History ──────────────────────────

export type HistoryWeek = {
    weekName: string;
    weekPosition: number;
    completedAt: string;
    notes?: string;
    sets: {
        position: number;
        weight: number | null;
        repsDone: number | null;
        rir: number | null;
        rirAchieved: boolean;
    }[];
};

export async function loadExerciseHistory(exerciseId: number): Promise<HistoryWeek[]> {
    if (!db) throw new Error('Database not initialized');

    // Find the program, exercise name, and day name from this exercise
    const origin = await db.getFirstAsync<{ name: string; program_id: number; day_name: string }>(
        `SELECT e.name, w.program_id, d.default_name AS day_name
         FROM exercises e
         JOIN days d ON e.day_id = d.id
         JOIN weeks w ON d.week_id = w.id
         WHERE e.id = ?`,
        [exerciseId]
    );

    if (!origin) return [];

    // Find matching exercises on the same day name across completed weeks
    const rows = await db.getAllAsync<{
        week_name: string;
        week_position: number;
        completed_at: string;
        exercise_id: number;
        notes: string;
        set_position: number;
        weight: number | null;
        reps_done: number | null;
        rir: number | null;
        rir_done: number | null;
    }>(
        `SELECT
            w.name AS week_name,
            w.position AS week_position,
            d.completed_at,
            e.id AS exercise_id,
            e.notes,
            s.position AS set_position,
            s.weight,
            s.reps_done,
            s.rir,
            s.rir_done
         FROM exercises e
         JOIN days d ON e.day_id = d.id
         JOIN weeks w ON d.week_id = w.id
         JOIN sets s ON s.exercise_id = e.id
         WHERE w.program_id = ?
           AND e.name = ?
           AND d.default_name = ?
           AND d.completed = 1
         ORDER BY w.position DESC, s.position ASC`,
        [origin.program_id, origin.name, origin.day_name]
    );

    // Group by week+exercise (in case same exercise on multiple days in a week)
    const weekMap = new Map<string, HistoryWeek>();
    for (const row of rows) {
        const key = `${row.week_position}-${row.exercise_id}`;
        if (!weekMap.has(key)) {
            weekMap.set(key, {
                weekName: row.week_name,
                weekPosition: row.week_position,
                completedAt: row.completed_at,
                notes: row.notes || undefined,
                sets: [],
            });
        }
        weekMap.get(key)!.sets.push({
            position: row.set_position,
            weight: row.weight,
            repsDone: row.reps_done,
            rir: row.rir,
            rirAchieved: row.rir_done === 1,
        });
    }

    // Sort by week position descending (most recent first)
    return Array.from(weekMap.values()).sort((a, b) => b.weekPosition - a.weekPosition);
}

// ────────────────────────── Validation ──────────────────────────

export async function programNameExists(
    name: string,
    excludeId?: number
): Promise<boolean> {
    if (!db) throw new Error('Database not initialized');

    const row = excludeId
        ? await db.getFirstAsync<{ cnt: number }>(
            'SELECT COUNT(*) as cnt FROM programs WHERE name = ? AND id != ?',
            [name, excludeId]
        )
        : await db.getFirstAsync<{ cnt: number }>(
            'SELECT COUNT(*) as cnt FROM programs WHERE name = ?',
            [name]
        );

    return (row?.cnt ?? 0) > 0;
}

// ────────────────────────── Export / Import ──────────────────────────

export async function exportAllPrograms(): Promise<ExportFile> {
    if (!db) throw new Error('Database not initialized');

    const rows = await db.getAllAsync<{ id: number }>(
        'SELECT id FROM programs ORDER BY created_at ASC'
    );

    const programs: ExportProgram[] = [];

    for (const row of rows) {
        const prog = await loadProgram(row.id);
        programs.push({
            name: prog.name,
            duration: prog.duration,
            daysPerWeek: prog.daysPerWeek,
            weeks: prog.weeks.map((w) => ({
                name: w.name,
                days: w.days.map((d) => ({
                    defaultName: d.defaultName,
                    customName: d.customName,
                    completed: d.completed || undefined,
                    completedAt: d.completedAt,
                    exercises: d.exercises.map((e) => ({
                        name: e.name,
                        repRange: e.repRange,
                        notes: e.notes,
                        sets: e.sets.map((s) => ({
                            rir: s.rir,
                            technique: s.technique || undefined,
                            weight: s.weight,
                            repsDone: s.repsDone,
                            rirAchieved: s.rirAchieved,
                        })),
                    })),
                })),
            })),
        });
    }

    return {
        schemaVersion: EXPORT_SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        programs,
    };
}

export async function importPrograms(
    data: ExportFile
): Promise<{ imported: string[]; skipped: string[] }> {
    if (!db) throw new Error('Database not initialized');

    const imported: string[] = [];
    const skipped: string[] = [];

    for (const prog of data.programs) {
        const exists = await programNameExists(prog.name);
        if (exists) {
            skipped.push(prog.name);
            continue;
        }

        const weeks: Week[] = prog.weeks.map((w, wi) => ({
            id: `import-w${wi}`,
            name: w.name,
            days: w.days.map((d, di) => ({
                id: `import-d${wi}-${di}`,
                defaultName: d.defaultName,
                customName: d.customName,
                isOpen: false,
                completed: d.completed ?? false,
                completedAt: d.completedAt,
                exercises: d.exercises.map((e, ei) => ({
                    id: `import-e${wi}-${di}-${ei}`,
                    name: e.name,
                    repRange: e.repRange,
                    notes: e.notes,
                    sets: e.sets.map((s, si) => ({
                        id: `import-s${wi}-${di}-${ei}-${si}`,
                        rir: s.rir,
                        technique: s.technique,
                        weight: s.weight,
                        repsDone: s.repsDone,
                        rirAchieved: s.rirAchieved,
                    })),
                })),
            })),
        }));

        await saveProgram(prog.name, prog.duration, prog.daysPerWeek, weeks);
        imported.push(prog.name);
    }

    return { imported, skipped };
}
