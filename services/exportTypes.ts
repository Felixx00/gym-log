export const EXPORT_SCHEMA_VERSION = 1;

export type ExportSet = {
    rir?: number;
    technique?: string;
    weight?: number;
    repsDone?: number;
    rirAchieved?: boolean;
};

export type ExportExercise = {
    name: string;
    repRange: string;
    notes?: string;
    sets: ExportSet[];
};

export type ExportDay = {
    defaultName: string;
    customName: string;
    exercises: ExportExercise[];
    completed?: boolean;
    completedAt?: string;
};

export type ExportWeek = {
    name: string;
    days: ExportDay[];
};

export type ExportProgram = {
    name: string;
    duration: number;
    daysPerWeek: number;
    weeks: ExportWeek[];
};

export type ExportFile = {
    schemaVersion: number;
    exportedAt: string;
    programs: ExportProgram[];
};
