import type { ExportFile } from './exportTypes';
import { EXPORT_SCHEMA_VERSION } from './exportTypes';

export function validateExportFile(data: unknown): data is ExportFile {
    if (typeof data !== 'object' || data === null) return false;
    const obj = data as Record<string, unknown>;

    if (typeof obj.schemaVersion !== 'number') return false;
    if (obj.schemaVersion > EXPORT_SCHEMA_VERSION) return false;

    if (!Array.isArray(obj.programs)) return false;

    for (const prog of obj.programs) {
        if (typeof prog !== 'object' || prog === null) return false;
        if (typeof prog.name !== 'string' || !prog.name.trim()) return false;
        if (typeof prog.duration !== 'number') return false;
        if (typeof prog.daysPerWeek !== 'number') return false;
        if (!Array.isArray(prog.weeks)) return false;

        for (const week of prog.weeks) {
            if (typeof week !== 'object' || week === null) return false;
            if (typeof week.name !== 'string') return false;
            if (!Array.isArray(week.days)) return false;

            for (const day of week.days) {
                if (typeof day !== 'object' || day === null) return false;
                if (typeof day.defaultName !== 'string') return false;
                if (typeof day.customName !== 'string') return false;
                if (!Array.isArray(day.exercises)) return false;

                for (const ex of day.exercises) {
                    if (typeof ex !== 'object' || ex === null) return false;
                    if (typeof ex.name !== 'string') return false;
                    if (typeof ex.repRange !== 'string') return false;
                    if (!Array.isArray(ex.sets)) return false;
                }
            }
        }
    }

    return true;
}
