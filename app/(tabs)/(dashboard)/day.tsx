import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    InteractionManager,
    Pressable,
    StyleSheet,
    View,
} from 'react-native';
import { Text, TextInput } from '@/components/StyledText';

import type { Exercise, Set } from '@/components/builder';
import { ExerciseHistorySheet } from '@/components/ExerciseHistorySheet';
import { OverlayModal } from '@/components/OverlayModal';
import { Colors } from '@/constants/theme';
import { loadDay, saveDayLog } from '@/services/database';

export default function DayScreen() {
    const { dayId, dayNumber, dayName, completed } = useLocalSearchParams<{
        dayId: string;
        dayNumber: string;
        dayName: string;
        completed?: string;
    }>();

    const isEditing = completed === '1';

    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [weightText, setWeightText] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);
    const [historyExercise, setHistoryExercise] = useState<{ id: string; name: string } | null>(null);
    const [toastMsg, setToastMsg] = useState('');
    const [techniqueTooltip, setTechniqueTooltip] = useState<string | null>(null);
    const tooltipAnim = useRef(new Animated.Value(0)).current;
    const toastAnim = useRef(new Animated.Value(0)).current;
    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const scrollY = useRef(new Animated.Value(0)).current;
    const [contentHeight, setContentHeight] = useState(0);
    const [containerHeight, setContainerHeight] = useState(0);

    const showToast = useCallback((msg: string) => {
        if (toastTimer.current) clearTimeout(toastTimer.current);
        setToastMsg(msg);
        Animated.timing(toastAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
        toastTimer.current = setTimeout(() => {
            Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
        }, 2000);
    }, []);

    useEffect(() => {
        if (!dayId) return;
        const task = InteractionManager.runAfterInteractions(() => {
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
        });
        return () => task.cancel();
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
                        <Text style={styles.sessionLabel}>{isEditing ? 'EDITING' : 'ACTIVE SESSION'}</Text>
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
            <View style={styles.scrollWrapper}>
            <Animated.ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: true }
                )}
                scrollEventThrottle={16}
                onScrollBeginDrag={() => techniqueTooltip && setTechniqueTooltip(null)}
                onContentSizeChange={(_, h) => setContentHeight(h)}
                onLayout={(e) => setContainerHeight(e.nativeEvent.layout.height)}
            >
                {/* Workout Overview */}
                {exercises.length > 0 && (
                    <>
                    <View style={styles.overviewContainer}>
                        <View style={styles.overviewList}>
                            {exercises.map((ex) => (
                                <View key={ex.id} style={styles.overviewRow}>
                                    <View style={styles.overviewDot} />
                                    <Text style={styles.overviewName} numberOfLines={1}>{ex.name}</Text>
                                    <Text style={styles.overviewDetail}>
                                        {ex.sets.length} × {ex.repRange}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                    <View style={styles.sectionDivider}>
                        <View style={styles.sectionDividerLine} />
                        <Text style={styles.sectionDividerText}>EXERCISES</Text>
                        <View style={styles.sectionDividerLine} />
                    </View>
                    </>
                )}

                {exercises.map((exercise, i) => (
                    <View key={exercise.id} style={styles.exerciseCard}>
                        {/* Number Badge */}
                        <View style={styles.exerciseNumberBadge}>
                            <Text style={styles.exerciseNumberText}>{i + 1}</Text>
                        </View>
                        {/* Exercise Header */}
                        <View style={styles.exerciseHeader}>
                            <View style={styles.exerciseNameCol}>
                                <Text style={styles.exerciseName}>{exercise.name}</Text>
                                <Text style={styles.goalText}>
                                    Goal: <Text style={styles.goalHighlight}>{exercise.repRange} Reps</Text>
                                </Text>
                            </View>
                            <View style={styles.exerciseActions}>
                                <Pressable
                                    style={styles.actionButton}
                                    onPress={() => {
                                        const firstSet = exercise.sets[0];
                                        const val = weightText[firstSet?.id];
                                        if (!val) {
                                            showToast('Fill in the Set 1 weight to copy it across');
                                            return;
                                        }
                                        const num = parseFloat(val);
                                        if (isNaN(num)) return;
                                        const txtUpdates: Record<string, string> = {};
                                        for (let i = 1; i < exercise.sets.length; i++) {
                                            txtUpdates[exercise.sets[i].id] = val;
                                        }
                                        setWeightText((prev) => ({ ...prev, ...txtUpdates }));
                                        setExercises((prev) =>
                                            prev.map((ex) =>
                                                ex.id === exercise.id
                                                    ? {
                                                          ...ex,
                                                          sets: ex.sets.map((s, si) =>
                                                              si > 0 ? { ...s, weight: num } : s
                                                          ),
                                                      }
                                                    : ex
                                            )
                                        );
                                    }}
                                    hitSlop={6}
                                >
                                    <Ionicons name="copy-outline" size={16} color={Colors.textSecondary} />
                                </Pressable>
                                <Pressable
                                    style={styles.actionButton}
                                    onPress={() => setHistoryExercise({ id: exercise.id, name: exercise.name })}
                                    hitSlop={6}
                                >
                                    <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
                                </Pressable>
                            </View>
                        </View>

                        {/* Column Labels */}
                        <View style={styles.colLabelsRow}>
                            <View style={styles.setNumCol} />
                            <Text style={[styles.colLabel, styles.rirTechCol]}>RIR/TECH</Text>
                            <Text style={[styles.colLabel, styles.inputCol]}>REPS</Text>
                            <Text style={[styles.colLabel, styles.weightCol]}>Weight</Text>
                            <View style={styles.checkCol} />
                        </View>

                        {/* Set Rows */}
                        {exercise.sets.map((set, index) => (
                            <View key={set.id} style={styles.setRowWrapper}>
                                {techniqueTooltip === set.id && (
                                    <Animated.View style={[styles.techTooltip, { opacity: tooltipAnim }]}>
                                        <Text style={styles.techTooltipText}>{set.technique}</Text>
                                        <View style={styles.techTooltipArrow} />
                                    </Animated.View>
                                )}
                                <View style={styles.setRow}>
                                <Text style={[styles.setNumber, styles.setNumCol]}>
                                    #{index + 1}
                                </Text>
                                <View style={styles.rirTechCol}>
                                    <View style={styles.rirTechValue}>
                                        <Text style={styles.rirTechText}>
                                            {set.rir != null ? set.rir : '-'}
                                        </Text>
                                        {set.technique ? (
                                            <Pressable
                                                onPress={() => {
                                                    if (techniqueTooltip === set.id) {
                                                        Animated.timing(tooltipAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start(
                                                            () => setTechniqueTooltip(null)
                                                        );
                                                    } else {
                                                        setTechniqueTooltip(set.id);
                                                        tooltipAnim.setValue(0);
                                                        Animated.timing(tooltipAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
                                                    }
                                                }}
                                                hitSlop={6}
                                            >
                                                <Ionicons name="flash" size={12} color={Colors.accent} />
                                            </Pressable>
                                        ) : null}
                                    </View>
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
            </Animated.ScrollView>
            {contentHeight > containerHeight && (
                <Animated.View
                    pointerEvents="none"
                    style={[
                        styles.scrollThumb,
                        {
                            height: Math.max((containerHeight / contentHeight) * containerHeight, 30),
                            transform: [{
                                translateY: scrollY.interpolate({
                                    inputRange: [0, Math.max(contentHeight - containerHeight, 1)],
                                    outputRange: [0, containerHeight - Math.max((containerHeight / contentHeight) * containerHeight, 30)],
                                    extrapolate: 'clamp',
                                }),
                            }],
                        },
                    ]}
                />
            )}
            </View>

            <OverlayModal
                visible={showSaveConfirm}
                title={isEditing ? 'Save Changes' : 'Finish Workout'}
                message={isEditing
                    ? 'Update the logged data for this workout?'
                    : 'Save your workout and mark this day as completed?'
                }
                onClose={() => setShowSaveConfirm(false)}
                buttons={[
                    { label: 'Cancel', onPress: () => setShowSaveConfirm(false), variant: 'cancel' },
                    { label: 'Save', onPress: confirmSave, variant: 'confirm' },
                ]}
            />

            <ExerciseHistorySheet
                visible={historyExercise != null}
                exerciseId={historyExercise?.id ?? ''}
                exerciseName={historyExercise?.name ?? ''}
                onClose={() => setHistoryExercise(null)}
            />

            {toastMsg !== '' && (
                <Animated.View style={[styles.toast, { opacity: toastAnim }]} pointerEvents="none">
                    <Text style={styles.toastText}>{toastMsg}</Text>
                </Animated.View>
            )}
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
        marginBottom: 12,
    },

    // Workout Overview
    overviewContainer: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        borderLeftWidth: 3,
        borderLeftColor: Colors.accent,
        padding: 14,
    },
    overviewList: {
        gap: 10,
    },
    overviewRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    overviewDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: Colors.accent,
        marginRight: 10,
    },
    overviewName: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textPrimary,
        flex: 1,
        marginRight: 8,
    },
    overviewDetail: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.textSecondary,
        backgroundColor: Colors.surfaceElevated,
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
        overflow: 'hidden',
    },

    // Section Divider
    sectionDivider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 10,
    },
    sectionDividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.border,
    },
    sectionDividerText: {
        fontSize: 10,
        fontWeight: '600',
        color: Colors.textTertiary,
        letterSpacing: 1,
    },

    // Scroll
    scrollWrapper: {
        flex: 1,
    },
    scroll: {
        flex: 1,
    },
    scrollThumb: {
        position: 'absolute',
        right: 2,
        top: 0,
        width: 3,
        borderRadius: 1.5,
        backgroundColor: Colors.textTertiary,
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
    exerciseNumberBadge: {
        position: 'absolute',
        top: -1,
        left: -1,
        backgroundColor: Colors.accent,
        borderTopLeftRadius: 20,
        borderBottomRightRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
        zIndex: 1,
    },
    exerciseNumberText: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    exerciseHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 14,
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
        marginTop: 2,
    },
    goalHighlight: {
        color: Colors.accent,
        fontWeight: '700',
    },
    exerciseActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        width: 36,
        height: 36,
        borderRadius: 9,
        backgroundColor: Colors.surfaceElevated,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Column widths
    setNumCol: {
        width: 20,
    },
    rirTechCol: {
        flex: 1,
        paddingLeft: 4,
        paddingRight: 6,
        alignItems: 'center',
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

    // Column Labels
    colLabelsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: -4,
    },
    colLabel: {
        fontSize: 9,
        fontWeight: '600',
        color: Colors.textTertiary,
        letterSpacing: 0.5,
        textAlign: 'center',
    },

    // Set Row
    setRowWrapper: {
        position: 'relative',
    },
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
    rirTechValue: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        backgroundColor: Colors.surfaceElevated,
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 8,
    },
    rirTechText: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    techTooltip: {
        position: 'absolute',
        top: -28,
        left: 26,
        backgroundColor: Colors.surfaceElevated,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderWidth: 1,
        borderColor: Colors.border,
        zIndex: 100,
    },
    techTooltipText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    techTooltipArrow: {
        position: 'absolute',
        bottom: -5,
        left: 12,
        width: 10,
        height: 10,
        backgroundColor: Colors.surfaceElevated,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: Colors.border,
        transform: [{ rotate: '45deg' }],
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

    // Toast
    toast: {
        position: 'absolute',
        bottom: 40,
        alignSelf: 'center',
        backgroundColor: Colors.surfaceElevated,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    toastText: {
        fontSize: 13,
        color: Colors.textSecondary,
    },
});
