export type Set = {
    id: string;
    rir?: number;
    technique?: string;
    weight?: number;
    repsDone?: number;
    rirDone?: number;
};

export type Exercise = {
    id: string;
    name: string;
    repRange: string;
    sets: Set[];
};

export type Day = {
    id: string;
    defaultName: string;
    customName: string;
    isOpen: boolean;
    exercises: Exercise[];
    completed?: boolean;
    completedAt?: string;
};

export type Week = {
    id: string;
    name: string;
    days: Day[];
};

export type ProgramSummary = {
    id: number;
    name: string;
    duration: number;
    daysPerWeek: number;
    createdAt: string;
};
