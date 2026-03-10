import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { DaySection, Exercise, Set, Week } from '@/components/builder';
import { OverlayModal } from '@/components/OverlayModal';
import { Colors } from '@/constants/theme';
import { saveProgram as saveProgramToDb, loadProgram } from '@/services/database';

export default function Weeks() {
    const params = useLocalSearchParams<{
        name?: string;
        duration?: string;
        daysPerWeek?: string;
        programId?: string;
    }>();

    const totalWeeks = Number(params.duration ?? 1);
    const totalDays = Number(params.daysPerWeek ?? 7);

    // ---------------- State ----------------
    const [programName, setProgramName] = useState(params.name || 'Program');
    const [programId, setProgramId] = useState<number | undefined>(
        params.programId ? Number(params.programId) : undefined
    );
    const [activeWeek, setActiveWeek] = useState(1);
    const [showSyncModal, setShowSyncModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(!!params.programId);
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);
    const [saveModal, setSaveModal] = useState<{ title: string; message: string } | null>(null);

    const [weekData, setWeekData] = useState<Week[]>(
        params.programId
            ? [] // Will be populated by loadProgram
            : Array.from({ length: totalWeeks }, (_, w) => ({
                  id: `week-${w + 1}`,
                  name: `Week ${w + 1}`,
                  days: Array.from({ length: totalDays }, (_, d) => ({
                      id: `day-${d + 1}`,
                      defaultName: `Day ${d + 1}`,
                      customName: '',
                      isOpen: false,
                      exercises: [],
                  })),
              }))
    );

    const isEditMode = !!programId;
    const activeWeekObj = weekData[activeWeek - 1];

    // Load existing program from DB
    useEffect(() => {
        if (!params.programId) return;
        loadProgram(Number(params.programId))
            .then((data) => {
                setProgramName(data.name);
                setWeekData(data.weeks);
                setProgramId(Number(params.programId));
            })
            .catch((err) => {
                console.error(err);
                Alert.alert('Error', 'Failed to load program.');
                router.back();
            })
            .finally(() => setIsLoading(false));
    }, [params.programId]);

    // ---------------- Handlers ----------------
    const toggleDay = (dayId: string) => {
        setWeekData((prev) =>
            prev.map((w, i) =>
                i === activeWeek - 1
                    ? {
                          ...w,
                          days: w.days.map((d) =>
                              d.id === dayId
                                  ? { ...d, isOpen: !d.isOpen }
                                  : { ...d, isOpen: false }
                          ),
                      }
                    : w
            )
        );
    };

    const updateDayName = (dayId: string, customName: string) => {
        setWeekData((prev) =>
            prev.map((w, i) =>
                i === activeWeek - 1
                    ? {
                          ...w,
                          days: w.days.map((d) =>
                              d.id === dayId ? { ...d, customName } : d
                          ),
                      }
                    : w
            )
        );
    };

    const addExercise = (dayId: string) => {
        setWeekData((prev) =>
            prev.map((w, i) =>
                i === activeWeek - 1
                    ? {
                          ...w,
                          days: w.days.map((d) =>
                              d.id === dayId
                                  ? {
                                        ...d,
                                        exercises: [
                                            ...d.exercises,
                                            {
                                                id: `ex-${Date.now()}`,
                                                name: '',
                                                repRange: '',
                                                sets: [
                                                    {
                                                        id: `set-${Date.now()}`,
                                                        rir: undefined,
                                                        technique: '',
                                                    },
                                                ],
                                            },
                                        ],
                                    }
                                  : d
                          ),
                      }
                    : w
            )
        );
    };

    const deleteExercise = (dayId: string, exerciseId: string) => {
        setWeekData((prev) =>
            prev.map((w, i) =>
                i === activeWeek - 1
                    ? {
                          ...w,
                          days: w.days.map((d) =>
                              d.id === dayId
                                  ? {
                                        ...d,
                                        exercises: d.exercises.filter(
                                            (ex) => ex.id !== exerciseId
                                        ),
                                    }
                                  : d
                          ),
                      }
                    : w
            )
        );
    };

    const updateExercise = (
        dayId: string,
        exerciseId: string,
        changes: Partial<Exercise>
    ) => {
        setWeekData((prev) =>
            prev.map((w, i) =>
                i === activeWeek - 1
                    ? {
                          ...w,
                          days: w.days.map((d) =>
                              d.id === dayId
                                  ? {
                                        ...d,
                                        exercises: d.exercises.map((ex) =>
                                            ex.id === exerciseId
                                                ? { ...ex, ...changes }
                                                : ex
                                        ),
                                    }
                                  : d
                          ),
                      }
                    : w
            )
        );
    };

    const addSet = (dayId: string, exerciseId: string) => {
        setWeekData((prev) =>
            prev.map((w, i) =>
                i === activeWeek - 1
                    ? {
                          ...w,
                          days: w.days.map((d) =>
                              d.id === dayId
                                  ? {
                                        ...d,
                                        exercises: d.exercises.map((ex) =>
                                            ex.id === exerciseId
                                                ? {
                                                      ...ex,
                                                      sets: [
                                                          ...ex.sets,
                                                          {
                                                              id: `set-${Date.now()}`,
                                                              rir: undefined,
                                                              technique: '',
                                                          },
                                                      ],
                                                  }
                                                : ex
                                        ),
                                    }
                                  : d
                          ),
                      }
                    : w
            )
        );
    };

    const deleteSet = (dayId: string, exerciseId: string, setId: string) => {
        setWeekData((prev) =>
            prev.map((w, i) =>
                i === activeWeek - 1
                    ? {
                          ...w,
                          days: w.days.map((d) =>
                              d.id === dayId
                                  ? {
                                        ...d,
                                        exercises: d.exercises.map((ex) =>
                                            ex.id === exerciseId
                                                ? {
                                                      ...ex,
                                                      sets: ex.sets.filter(
                                                          (s) => s.id !== setId
                                                      ),
                                                  }
                                                : ex
                                        ),
                                    }
                                  : d
                          ),
                      }
                    : w
            )
        );
    };

    const updateSet = (
        dayId: string,
        exerciseId: string,
        setId: string,
        changes: Partial<Set>
    ) => {
        setWeekData((prev) =>
            prev.map((w, i) =>
                i === activeWeek - 1
                    ? {
                          ...w,
                          days: w.days.map((d) =>
                              d.id === dayId
                                  ? {
                                        ...d,
                                        exercises: d.exercises.map((ex) =>
                                            ex.id === exerciseId
                                                ? {
                                                      ...ex,
                                                      sets: ex.sets.map((s) =>
                                                          s.id === setId
                                                              ? { ...s, ...changes }
                                                              : s
                                                      ),
                                                  }
                                                : ex
                                        ),
                                    }
                                  : d
                          ),
                      }
                    : w
            )
        );
    };

    const syncWeeks = () => {
        setShowSyncModal(true);
    };

    const confirmSync = () => {
        const currentWeek = weekData[activeWeek - 1];
        setWeekData((prev) =>
            prev.map((w) => ({
                ...w,
                days: currentWeek.days.map((day) => ({
                    ...day,
                    isOpen: false,
                })),
            }))
        );
        setShowSyncModal(false);
    };

    const validateProgram = (): string | null => {
        for (let wi = 0; wi < weekData.length; wi++) {
            const week = weekData[wi];
            const dayNames = new Map<string, number>();

            for (let di = 0; di < week.days.length; di++) {
                const day = week.days[di];
                const dayLabel = `${week.name}, ${day.defaultName}`;
                const name = day.customName.trim();

                if (!name) {
                    return `${dayLabel} has no name. Every day needs a name.`;
                }

                const nameLower = name.toLowerCase();
                if (dayNames.has(nameLower)) {
                    const prevIdx = dayNames.get(nameLower)!;
                    return `${week.name} has duplicate day name "${name}" (Day ${prevIdx + 1} and Day ${di + 1}).`;
                }
                dayNames.set(nameLower, di);

                if (day.exercises.length === 0) {
                    return `${dayLabel} ("${name}") has no exercises.`;
                }

                for (let ei = 0; ei < day.exercises.length; ei++) {
                    const ex = day.exercises[ei];
                    const exLabel = `Exercise ${ei + 1} in ${dayLabel}`;

                    if (!ex.name.trim()) {
                        return `${exLabel} ("${name}") has no name.`;
                    }
                    if (!ex.repRange.trim()) {
                        return `${ex.name} in ${dayLabel} has no rep range.`;
                    }
                }
            }
        }
        return null;
    };

    const handleSave = () => {
        const error = validateProgram();
        if (error) {
            setSaveModal({ title: 'Validation Error', message: error });
            return;
        }
        setShowSaveConfirm(true);
    };

    const confirmSave = async () => {
        setShowSaveConfirm(false);
        if (isSaving) return;
        setIsSaving(true);
        try {
            const actualWeeks = weekData.length;
            const actualDays = weekData[0]?.days.length ?? totalDays;
            const id = await saveProgramToDb(
                programName,
                actualWeeks,
                actualDays,
                weekData,
                programId
            );
            setProgramId(id);
            setSaveModal({ title: 'Saved', message: 'Program saved successfully.' });
        } catch (error: any) {
            const msg = error?.message?.includes('UNIQUE')
                ? 'A program with this name already exists.'
                : 'Failed to save program.';
            setSaveModal({ title: 'Error', message: msg });
        } finally {
            setIsSaving(false);
        }
    };

    // ---------------- Render ----------------
    if (isLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={Colors.accent} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
                </Pressable>
                <View style={styles.headerLeft}>
                    <Text style={styles.title} numberOfLines={1}>{programName}</Text>
                    <Text style={styles.subtitle}>{totalDays} days/week</Text>
                </View>
                <View style={styles.headerRight}>
                    <Pressable style={styles.syncButton} onPress={syncWeeks}>
                        <Ionicons name="sync-outline" size={16} color={Colors.textPrimary} />
                        <Text style={styles.syncButtonText}>Sync</Text>
                    </Pressable>
                    <Pressable
                        style={[styles.saveButton, isSaving && { opacity: 0.6 }]}
                        onPress={handleSave}
                        disabled={isSaving}
                    >
                        <Text style={styles.saveButtonText}>
                            {isSaving ? 'Saving...' : isEditMode ? 'Edit' : 'Save'}
                        </Text>
                    </Pressable>
                </View>
            </View>

            {/* Week Pills */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.weekPillsContainer}
                style={styles.weekPillsWrapper}
            >
                {weekData.map((week, i) => {
                    const isActive = i + 1 === activeWeek;
                    return (
                        <Pressable
                            key={week.id}
                            onPress={() => {
                                setActiveWeek(i + 1);
                                setWeekData((prev) =>
                                    prev.map((w) => ({
                                        ...w,
                                        days: w.days.map((d) => ({ ...d, isOpen: false })),
                                    }))
                                );
                            }}
                            style={[
                                styles.weekPill,
                                isActive && styles.weekPillActive,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.weekPillText,
                                    isActive && styles.weekPillTextActive,
                                ]}
                            >
                                {week.name}
                            </Text>
                        </Pressable>
                    );
                })}
            </ScrollView>

            {/* Days List */}
            <ScrollView
                style={styles.daysContainer}
                contentContainerStyle={styles.daysContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {activeWeekObj.days.map((day) => (
                    <DaySection
                        key={day.id}
                        day={day}
                        onToggle={() => toggleDay(day.id)}
                        onUpdateName={(name) => updateDayName(day.id, name)}
                        onAddExercise={() => addExercise(day.id)}
                        onUpdateExercise={(exerciseId, changes) =>
                            updateExercise(day.id, exerciseId, changes)
                        }
                        onDeleteExercise={(exerciseId) =>
                            deleteExercise(day.id, exerciseId)
                        }
                        onAddSet={(exerciseId) => addSet(day.id, exerciseId)}
                        onUpdateSet={(exerciseId, setId, changes) =>
                            updateSet(day.id, exerciseId, setId, changes)
                        }
                        onDeleteSet={(exerciseId, setId) =>
                            deleteSet(day.id, exerciseId, setId)
                        }
                    />
                ))}
            </ScrollView>

            <OverlayModal
                visible={showSyncModal}
                title="Sync Weeks"
                message={`Copy Week ${activeWeek} content to all other weeks? This will overwrite existing data.`}
                onClose={() => setShowSyncModal(false)}
                buttons={[
                    { label: 'Cancel', onPress: () => setShowSyncModal(false), variant: 'cancel' },
                    { label: 'Sync', onPress: confirmSync, variant: 'confirm' },
                ]}
            />

            <OverlayModal
                visible={showSaveConfirm}
                title={isEditMode ? 'Edit Program' : 'Save Program'}
                message={isEditMode
                    ? `Save changes to "${programName}"?`
                    : `Are you sure you want to save "${programName}"?`
                }
                onClose={() => setShowSaveConfirm(false)}
                buttons={[
                    { label: 'Cancel', onPress: () => setShowSaveConfirm(false), variant: 'cancel' },
                    { label: isEditMode ? 'Confirm' : 'Save', onPress: confirmSave, variant: 'confirm' },
                ]}
            />

            <OverlayModal
                visible={!!saveModal}
                title={saveModal?.title ?? ''}
                message={saveModal?.message ?? ''}
                onClose={() => {
                    const wasSuccess = saveModal?.title === 'Saved';
                    setSaveModal(null);
                    if (wasSuccess) {
                        if (isEditMode) {
                            router.back();
                        } else {
                            router.back();
                            router.back();
                        }
                    }
                }}
                buttons={[{
                    label: 'OK',
                    onPress: () => {
                        const wasSuccess = saveModal?.title === 'Saved';
                        setSaveModal(null);
                        if (wasSuccess) {
                            if (isEditMode) {
                                router.back();
                            } else {
                                router.back();
                                router.back();
                            }
                        }
                    },
                    variant: 'confirm',
                }]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 12,
    },
    backButton: {
        marginRight: 12,
        marginTop: 6,
    },
    headerLeft: {
        flex: 1,
    },
    headerRight: {
        flexDirection: 'row',
        gap: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 12,
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    syncButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.surface,
    },
    syncButtonText: {
        fontSize: 13,
        color: Colors.textPrimary,
        fontWeight: '500',
    },
    saveButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: Colors.accent,
    },
    saveButtonText: {
        fontSize: 13,
        color: Colors.textPrimary,
        fontWeight: '600',
    },

    // Week Pills
    weekPillsWrapper: {
        flexGrow: 0,
        marginBottom: 12,
    },
    weekPillsContainer: {
        gap: 8,
        paddingHorizontal: 20,
    },
    weekPill: {
        height: 36,
        paddingHorizontal: 16,
        borderRadius: 18,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    weekPillActive: {
        backgroundColor: Colors.accent,
        borderColor: Colors.accent,
    },
    weekPillText: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.textSecondary,
    },
    weekPillTextActive: {
        color: Colors.textPrimary,
    },

    // Days
    daysContainer: {
        flex: 1,
    },
    daysContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },

});
