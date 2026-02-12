import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { DaySection, Exercise, Set, Week } from '@/components/builder';
import { Colors } from '@/constants/theme';

export default function Weeks() {
    const { name, duration, daysPerWeek } = useLocalSearchParams<{
        name?: string;
        duration?: string;
        daysPerWeek?: string;
    }>();

    const totalWeeks = Number(duration ?? 1);
    const totalDays = Number(daysPerWeek ?? 7);

    // ---------------- State ----------------
    const [activeWeek, setActiveWeek] = useState(1);
    const [showSyncModal, setShowSyncModal] = useState(false);

    const [weekData, setWeekData] = useState<Week[]>(
        Array.from({ length: totalWeeks }, (_, w) => ({
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

    const activeWeekObj = weekData[activeWeek - 1];

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

    const saveProgram = () => {
        // TODO: Implement save to database
        console.log('Saving program...', weekData);
    };

    // ---------------- Render ----------------
    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
                </Pressable>
                <View style={styles.headerLeft}>
                    <Text style={styles.title} numberOfLines={1}>{name || 'Program'}</Text>
                    <Text style={styles.subtitle}>{totalDays} days/week</Text>
                </View>
                <View style={styles.headerRight}>
                    <Pressable style={styles.syncButton} onPress={syncWeeks}>
                        <Ionicons name="sync-outline" size={16} color={Colors.textPrimary} />
                        <Text style={styles.syncButtonText}>Sync</Text>
                    </Pressable>
                    <Pressable style={styles.saveButton} onPress={saveProgram}>
                        <Text style={styles.saveButtonText}>Save</Text>
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

            {/* Sync Confirmation Modal */}
            <Modal
                visible={showSyncModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowSyncModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Sync Weeks</Text>
                        <Text style={styles.modalMessage}>
                            Copy Week {activeWeek} content to all other weeks? This will overwrite existing data.
                        </Text>
                        <View style={styles.modalButtons}>
                            <Pressable
                                style={styles.modalCancelButton}
                                onPress={() => setShowSyncModal(false)}
                            >
                                <Text style={styles.modalCancelButtonText}>Cancel</Text>
                            </Pressable>
                            <Pressable
                                style={styles.modalConfirmButton}
                                onPress={confirmSync}
                            >
                                <Text style={styles.modalConfirmButtonText}>Sync</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
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
        paddingTop: 40,
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

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 320,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginBottom: 12,
    },
    modalMessage: {
        fontSize: 14,
        color: Colors.textSecondary,
        lineHeight: 20,
        marginBottom: 24,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    modalCancelButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
    },
    modalCancelButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    modalConfirmButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: Colors.accent,
        alignItems: 'center',
    },
    modalConfirmButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
});
