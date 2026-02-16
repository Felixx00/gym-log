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
    TextInput,
    View,
} from 'react-native';

import type { Exercise, Set } from '@/components/builder';
import { OverlayModal } from '@/components/OverlayModal';
import { Colors } from '@/constants/theme';
import { loadDay, saveDayLog } from '@/services/database';

export default function DayScreen() {
    const { dayId, dayNumber, dayName } = useLocalSearchParams<{
        dayId: string;
        dayNumber: string;
        dayName: string;
    }>();

    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [weightText, setWeightText] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);

    useEffect(() => {
        if (!dayId) return;
        loadDay(Number(dayId))
            .then((day) => {
                setExercises(day.exercises);
                const initial: Record<string, string> = {};
                for (const ex of day.exercises) {
                    for (const s of ex.sets) {
                        if (s.weight != null) initial[s.id] = String(s.weight);
                    }
                }
                setWeightText(initial);
            })
            .catch((err) => {
                console.error(err);
                Alert.alert('Error', 'Failed to load workout.');
                router.back();
            })
            .finally(() => setIsLoading(false));
    }, [dayId]);

    const updateSet = (exerciseId: string, setId: string, changes: Partial<Set>) => {
        setExercises((prev) =>
            prev.map((ex) =>
                ex.id === exerciseId
                    ? {
                          ...ex,
                          sets: ex.sets.map((s) =>
                              s.id === setId ? { ...s, ...changes } : s
                          ),
                      }
                    : ex
            )
        );
    };

    const updateExerciseNotes = (exerciseId: string, notes: string) => {
        setExercises((prev) =>
            prev.map((ex) =>
                ex.id === exerciseId ? { ...ex, notes } : ex
            )
        );
    };

    const confirmSave = async () => {
        setShowSaveConfirm(false);
        if (!dayId) return;
        setIsSaving(true);
        try {
            await saveDayLog(Number(dayId), exercises);
            router.back();
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to save workout.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={Colors.accent} />
            </View>
        );
    }

    const title = `Day ${dayNumber}: ${dayName}`;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Pressable style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={24} color={Colors.textSecondary} />
                    </Pressable>
                    <View>
                        <Text style={styles.dayTitle} numberOfLines={1}>{title}</Text>
                        <Text style={styles.sessionLabel}>ACTIVE SESSION</Text>
                    </View>
                </View>
                <Pressable
                    style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                    onPress={() => setShowSaveConfirm(true)}
                    disabled={isSaving}
                >
                    <Text style={styles.saveButtonText}>
                        {isSaving ? 'Saving...' : 'Save'}
                    </Text>
                </Pressable>
            </View>

            <View style={styles.headerDivider} />

            {/* Exercise List */}
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {exercises.map((exercise) => (
                    <View key={exercise.id} style={styles.exerciseCard}>
                        {/* Exercise Header */}
                        <View style={styles.exerciseHeader}>
                            <View style={styles.exerciseNameCol}>
                                <Text style={styles.exerciseName}>{exercise.name}</Text>
                                <Text style={styles.goalText}>
                                    Goal: <Text style={styles.goalHighlight}>{exercise.repRange} Reps</Text>
                                </Text>
                            </View>
                            <Pressable style={styles.historyButton}>
                                <Ionicons name="time-outline" size={14} color={Colors.accent} />
                                <Text style={styles.historyButtonText}>History</Text>
                            </Pressable>
                        </View>

                        {/* Set Rows */}
                        {exercise.sets.map((set, index) => (
                            <View key={set.id} style={styles.setRow}>
                                <Text style={[styles.setNumber, styles.setNumCol]}>
                                    #{index + 1}
                                </Text>
                                <View style={styles.rirTechCol}>
                                    <Text style={styles.rirTechLabel}>RIR/TECH</Text>
                                    <Text style={styles.rirTechText} numberOfLines={1}>
                                        {set.rir != null ? set.rir : '-'}{'\u2022'}{set.technique || 'Default'}
                                    </Text>
                                </View>
                                <TextInput
                                    style={[styles.setInput, styles.inputCol]}
                                    keyboardType="number-pad"
                                    placeholder="Reps"
                                    placeholderTextColor={Colors.textTertiary}
                                    value={set.repsDone != null ? String(set.repsDone) : ''}
                                    onChangeText={(val) => {
                                        const num = val ? parseInt(val, 10) : undefined;
                                        updateSet(exercise.id, set.id, {
                                            repsDone: num != null && !isNaN(num) ? num : undefined,
                                        });
                                    }}
                                />
                                <View style={[styles.weightInputWrapper, styles.weightCol]}>
                                    <TextInput
                                        style={styles.weightInput}
                                        keyboardType="decimal-pad"
                                        placeholder="Kg."
                                        placeholderTextColor={Colors.textTertiary}
                                        value={weightText[set.id] ?? ''}
                                        onChangeText={(val) => {
                                            setWeightText((prev) => ({ ...prev, [set.id]: val }));
                                            const num = val ? parseFloat(val) : undefined;
                                            updateSet(exercise.id, set.id, {
                                                weight: num != null && !isNaN(num) ? num : undefined,
                                            });
                                        }}
                                    />
                                </View>
                                <Pressable
                                    style={styles.checkCol}
                                    onPress={() =>
                                        updateSet(exercise.id, set.id, {
                                            rirAchieved: !set.rirAchieved,
                                        })
                                    }
                                    hitSlop={8}
                                >
                                    <View
                                        style={[
                                            styles.rirCheck,
                                            set.rirAchieved && styles.rirCheckActive,
                                        ]}
                                    >
                                        {set.rirAchieved && (
                                            <Ionicons name="checkmark-sharp" size={16} color={Colors.background} />
                                        )}
                                    </View>
                                </Pressable>
                            </View>
                        ))}

                        {/* Notes */}
                        <View style={styles.notesDivider} />
                        <TextInput
                            style={styles.notesInput}
                            placeholder="Exercise note..."
                            placeholderTextColor={Colors.textTertiary}
                            value={exercise.notes ?? ''}
                            onChangeText={(val) => updateExerciseNotes(exercise.id, val)}
                            multiline
                        />
                    </View>
                ))}
            </ScrollView>

            <OverlayModal
                visible={showSaveConfirm}
                title="Finish Workout"
                message="Save your workout and mark this day as completed?"
                onClose={() => setShowSaveConfirm(false)}
                buttons={[
                    { label: 'Cancel', onPress: () => setShowSaveConfirm(false), variant: 'cancel' },
                    { label: 'Save', onPress: confirmSave, variant: 'confirm' },
                ]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 16,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12,
    },
    backButton: {
        marginRight: 10,
    },
    dayTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    sessionLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.textSecondary,
        letterSpacing: 1,
        marginTop: 2,
    },
    saveButton: {
        backgroundColor: Colors.accent,
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textPrimary,
    },

    headerDivider: {
        height: 1,
        backgroundColor: Colors.border,
        marginHorizontal: 20,
        marginBottom: 16,
    },

    // Scroll
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 40,
        gap: 16,
    },

    // Exercise Card
    exerciseCard: {
        backgroundColor: Colors.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        padding: 18,
    },
    exerciseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    exerciseNameCol: {
        flex: 1,
        marginRight: 12,
    },
    exerciseName: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    goalText: {
        fontSize: 13,
        fontWeight: '500',
        color: Colors.textSecondary,
        marginTop: 4,
    },
    goalHighlight: {
        color: Colors.accent,
        fontWeight: '700',
    },
    historyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderWidth: 1,
        borderColor: Colors.accent,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    historyButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.accent,
    },

    // Column widths
    setNumCol: {
        width: 20,
    },
    rirTechCol: {
        flex: 1,
        paddingLeft: 4,
        paddingRight: 6,
    },
    inputCol: {
        width: 68,
        textAlign: 'center',
    },
    weightCol: {
        width: 78,
    },
    checkCol: {
        width: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Set Row
    setRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        gap: 6,
    },
    setNumber: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.textTertiary,
    },
    rirTechLabel: {
        fontSize: 9,
        fontWeight: '600',
        color: Colors.textTertiary,
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    rirTechText: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    setInput: {
        backgroundColor: Colors.surfaceElevated,
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 4,
        fontSize: 15,
        fontWeight: '600',
        color: Colors.textPrimary,
        textAlign: 'center',
    },
    weightInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceElevated,
        borderRadius: 8,
        paddingRight: 6,
    },
    weightInput: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 4,
        fontSize: 15,
        fontWeight: '600',
        color: Colors.textPrimary,
        textAlign: 'center',
    },
    kgLabel: {
        fontSize: 6,
        fontWeight: '600',
        color: Colors.textTertiary,
    },

    // RIR Check
    rirCheck: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: Colors.textTertiary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rirCheckActive: {
        backgroundColor: Colors.accent,
        borderColor: Colors.accent,
    },

    // Notes
    notesDivider: {
        height: 1,
        backgroundColor: Colors.border,
        marginTop: 8,
        marginBottom: 4,
    },
    notesInput: {
        fontSize: 13,
        color: Colors.textSecondary,
        paddingVertical: 8,
        paddingBottom: 4,
    },
});
