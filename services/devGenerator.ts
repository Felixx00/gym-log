import type { Day, Exercise, Set, Week } from '@/components/builder/types';
import { saveProgram } from './database';

type Template = { name: string; repRange: string; sets: number; baseWeight: number; technique?: string };

const PUSH: Template[] = [
    { name: 'Barbell Bench Press', repRange: '6-8', sets: 4, baseWeight: 80 },
    { name: 'Overhead Press', repRange: '8-10', sets: 3, baseWeight: 50, technique: 'Strict' },
    { name: 'Incline DB Press', repRange: '10-12', sets: 3, baseWeight: 30 },
    { name: 'Lateral Raises', repRange: '12-15', sets: 3, baseWeight: 10, technique: 'Slow eccentric' },
    { name: 'Tricep Pushdowns', repRange: '12-15', sets: 3, baseWeight: 25 },
];

const PULL: Template[] = [
    { name: 'Barbell Rows', repRange: '6-8', sets: 4, baseWeight: 70 },
    { name: 'Pull-Ups', repRange: '6-10', sets: 3, baseWeight: 0, technique: 'Bodyweight' },
    { name: 'Face Pulls', repRange: '15-20', sets: 3, baseWeight: 15, technique: 'Pause at top' },
    { name: 'Barbell Curls', repRange: '10-12', sets: 3, baseWeight: 30 },
    { name: 'Hammer Curls', repRange: '10-12', sets: 3, baseWeight: 14 },
];

const LEGS: Template[] = [
    { name: 'Barbell Squat', repRange: '6-8', sets: 4, baseWeight: 100 },
    { name: 'Romanian Deadlift', repRange: '8-10', sets: 3, baseWeight: 80, technique: 'Slow eccentric' },
    { name: 'Leg Press', repRange: '10-12', sets: 3, baseWeight: 150 },
    { name: 'Leg Curls', repRange: '12-15', sets: 3, baseWeight: 40 },
    { name: 'Calf Raises', repRange: '15-20', sets: 4, baseWeight: 60, technique: 'Pause at bottom' },
];

const DAY_TEMPLATES = [
    { name: 'Push', exercises: PUSH },
    { name: 'Pull', exercises: PULL },
    { name: 'Legs', exercises: LEGS },
];

const NOTES: Record<string, string> = {
    'Overhead Press': 'Switched from seated to standing',
    'Pull-Ups': 'Add weight next week',
    'Barbell Squat': 'Focus on depth',
    'Leg Press': 'Feet high and wide',
};

const TOTAL_WEEKS = 6;
const COMPLETED_WEEKS = 3; // first N weeks fully completed

function buildSets(
    template: Template,
    weekIdx: number,
    isCompleted: boolean,
): Set[] {
    const sets: Set[] = [];
    for (let s = 0; s < template.sets; s++) {
        const rir = Math.max(0, 3 - s); // 3, 2, 1, 0
        const weight = template.baseWeight + weekIdx * 2.5;
        const maxRep = parseInt(template.repRange.split('-')[1] || '10', 10);
        const reps = Math.max(maxRep - s, parseInt(template.repRange.split('-')[0] || '6', 10));

        const set: Set = {
            id: `set-${Date.now()}-${weekIdx}-${s}-${Math.random()}`,
            rir,
            technique: template.technique,
        };

        if (isCompleted) {
            set.weight = weight;
            set.repsDone = reps;
            set.rirAchieved = s < template.sets - 1; // last set usually misses RIR
        }

        sets.push(set);
    }
    return sets;
}

function buildExercises(
    templates: Template[],
    weekIdx: number,
    isCompleted: boolean,
): Exercise[] {
    return templates.map((t, i) => ({
        id: `ex-${Date.now()}-${weekIdx}-${i}-${Math.random()}`,
        name: t.name,
        repRange: t.repRange,
        notes: isCompleted ? NOTES[t.name] : undefined,
        sets: buildSets(t, weekIdx, isCompleted),
    }));
}

function completedAt(weekIdx: number, dayIdx: number): string {
    const base = new Date();
    base.setDate(base.getDate() - (TOTAL_WEEKS - weekIdx) * 7 + dayIdx);
    return base.toISOString();
}

export async function generateTestProgram(): Promise<number> {
    const weeks: Week[] = [];

    for (let w = 0; w < TOTAL_WEEKS; w++) {
        const isCompletedWeek = w < COMPLETED_WEEKS;
        const days: Day[] = DAY_TEMPLATES.map((dt, d) => {
            const completed = isCompletedWeek;
            return {
                id: `day-${Date.now()}-${w}-${d}-${Math.random()}`,
                defaultName: `Day ${d + 1}`,
                customName: dt.name,
                isOpen: false,
                exercises: buildExercises(dt.exercises, w, completed),
                completed,
                completedAt: completed ? completedAt(w, d) : undefined,
            };
        });

        weeks.push({
            id: `week-${Date.now()}-${w}-${Math.random()}`,
            name: `Week ${w + 1}`,
            days,
        });
    }

    return saveProgram(
        'PPL Strength Program',
        TOTAL_WEEKS,
        DAY_TEMPLATES.length,
        weeks,
    );
}
