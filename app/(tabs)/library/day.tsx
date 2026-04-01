import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
import { Text } from '@/components/StyledText';

import type { Exercise } from '@/components/builder';
import { ExerciseHistorySheet } from '@/components/ExerciseHistorySheet';
import { Colors } from '@/constants/theme';
import { loadDay } from '@/services/database';

export default function LibraryDayScreen() {
    const { dayId, dayNumber, dayName } = useLocalSearchParams<{
        dayId: string;
        dayNumber: string;
        dayName: string;
    }>();

    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [historyExercise, setHistoryExercise] = useState<{ id: string; name: string } | null>(null);
    const [techniqueTooltip, setTechniqueTooltip] = useState<string | null>(null);
    const tooltipAnim = useRef(new Animated.Value(0)).current;
    const scrollY = useRef(new Animated.Value(0)).current;
    const [contentHeight, setContentHeight] = useState(0);
    const [containerHeight, setContainerHeight] = useState(0);

    useEffect(() => {
        if (!dayId) return;
        let cancelled = false;
        const task = InteractionManager.runAfterInteractions(() => {
            loadDay(Number(dayId))
                .then((day) => {
                    if (!cancelled) setExercises(day.exercises);
                })
                .catch((err) => {
                    console.error(err);
                    if (!cancelled) {
                        Alert.alert('Error', 'Failed to load workout.');
                        router.back();
                    }
                })
                .finally(() => {
                    if (!cancelled) setIsLoading(false);
                });
        });
        return () => {
            cancelled = true;
            task.cancel();
        };
    }, [dayId]);

    const dismissTooltip = useCallback(() => {
        if (techniqueTooltip) {
            Animated.timing(tooltipAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start(
                () => setTechniqueTooltip(null)
            );
        }
    }, [techniqueTooltip]);

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
                <Pressable style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color={Colors.textSecondary} />
                </Pressable>
                <View>
                    <Text style={styles.dayTitle} numberOfLines={1}>{title}</Text>
                    <Text style={styles.sessionLabel}>COMPLETED</Text>
                </View>
            </View>

            <View style={styles.headerDivider} />

            {/* Exercise List */}
            <View style={styles.scrollWrapper}>
            <Animated.ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: true }
                )}
                scrollEventThrottle={16}
                onScrollBeginDrag={dismissTooltip}
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
                    <View key={exercise.id} style={styles.exerciseCardOuter}>
                    <LinearGradient
                        colors={['#222222', Colors.surface, Colors.surface]}
                        locations={[0, 0.4, 1]}
                        style={styles.exerciseCard}
                    >
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
                            <Pressable
                                style={styles.actionButton}
                                onPress={() => setHistoryExercise({ id: exercise.id, name: exercise.name })}
                                hitSlop={6}
                            >
                                <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
                            </Pressable>
                        </View>

                        {/* Column Labels */}
                        <View style={styles.colLabelsRow}>
                            <View style={styles.setNumCol} />
                            <Text style={[styles.colLabel, styles.rirTechCol]}>RIR/TECH</Text>
                            <Text style={[styles.colLabel, styles.inputCol]}>REPS</Text>
                            <Text style={[styles.colLabel, styles.weightCol]}>WEIGHT</Text>
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
                                                            dismissTooltip();
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
                                    <View style={[styles.valueCell, styles.inputCol]}>
                                        <Text style={styles.valueCellText}>
                                            {set.repsDone != null ? set.repsDone : '-'}
                                        </Text>
                                    </View>
                                    <View style={[styles.valueCell, styles.weightCol]}>
                                        <Text style={styles.valueCellText}>
                                            {set.weight != null ? set.weight : '-'}
                                        </Text>
                                    </View>
                                    <View style={styles.checkCol}>
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
                                    </View>
                                </View>
                            </View>
                        ))}

                        {/* Notes */}
                        {exercise.notes ? (
                            <>
                                <View style={styles.notesDivider} />
                                <Text style={styles.notesText}>{exercise.notes}</Text>
                            </>
                        ) : null}
                    </LinearGradient>
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

            <ExerciseHistorySheet
                visible={historyExercise != null}
                exerciseId={historyExercise?.id ?? ''}
                exerciseName={historyExercise?.name ?? ''}
                onClose={() => setHistoryExercise(null)}
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
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 16,
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
        color: Colors.success,
        letterSpacing: 1,
        marginTop: 2,
    },
    headerDivider: {
        height: 1,
        backgroundColor: Colors.border,
        marginHorizontal: 20,
        marginBottom: 12,
    },

    // Workout Overview
    overviewContainer: {
        borderRadius: 16,
        borderLeftWidth: 3,
        borderLeftColor: Colors.accent,
        paddingLeft: 14,
        paddingVertical: 6,
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
    exerciseCardOuter: {
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        overflow: 'hidden',
    },
    exerciseCard: {
        padding: 18,
        borderRadius: 20,
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
        fontSize: 13,
        fontWeight: '700',
        color: Colors.background,
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

    // Read-only value cells (replacing TextInputs)
    valueCell: {
        backgroundColor: Colors.surfaceElevated,
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    valueCellText: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.textPrimary,
        textAlign: 'center',
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
    notesText: {
        fontSize: 13,
        color: Colors.textSecondary,
        paddingVertical: 8,
        paddingBottom: 4,
    },
});
