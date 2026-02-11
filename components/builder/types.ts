export type Set = {
    id: string;
    rir?: number;
    technique?: string;
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
};

export type Week = {
    id: string;
    name: string;
    days: Day[];
};
