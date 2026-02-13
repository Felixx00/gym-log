import * as SQLite from 'expo-sqlite';

import type { Day, Exercise, ProgramSummary, Set, Week } from '@/components/builder/types';

let db: SQLite.SQLiteDatabase | null = null;

const DB_NAME = 'gymlog.db';
const SCHEMA_VERSION = 1;

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

    await db.withTransactionAsync(async () => {
        if (fromVersion < 1) {
            await applyV1();
        }
        await db!.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION};`);
    });
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
                        'INSERT INTO exercises (day_id, position, name, rep_range) VALUES (?, ?, ?, ?)',
                        [dayId, e, exercise.name, exercise.repRange]
                    );
                    const exerciseId = exResult.lastInsertRowId;

                    for (let s = 0; s < exercise.sets.length; s++) {
                        const set = exercise.sets[s];
                        await db!.runAsync(
                            'INSERT INTO sets (exercise_id, position, rir, technique, weight, reps_done, rir_done) VALUES (?, ?, ?, ?, ?, ?, ?)',
                            [exerciseId, s, set.rir ?? null, set.technique ?? '', set.weight ?? null, set.repsDone ?? null, set.rirDone ?? null]
                        );
                    }
                }
            }
        }
    });

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
    }>(`
        SELECT
            p.id,
            p.name,
            COUNT(DISTINCT w.id) AS week_count,
            COALESCE(MAX(day_counts.day_count), 0) AS days_per_week,
            p.created_at
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
            name: string; rep_range: string;
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
            rirDone: row.rir_done ?? undefined,
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
