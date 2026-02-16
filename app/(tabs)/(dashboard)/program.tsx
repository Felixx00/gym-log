import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import type { Day, Week } from '@/components/builder';
import { Colors } from '@/constants/theme';
import { loadProgram } from '@/services/database';

type DayStatus = 'completed' | 'current' | 'future';

function getDayStatus(day: Day, isCurrentDay: boolean): DayStatus {
    if (day.completed) return 'completed';
    if (isCurrentDay) return 'current';
    return 'future';
}

function formatCompletedDate(dateStr?: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ProgramScreen() {
    const { programId } = useLocalSearchParams<{ programId: string }>();

    const [programName, setProgramName] = useState('');
    const [weekData, setWeekData] = useState<Week[]>([]);
    const [activeWeek, setActiveWeek] = useState(0);
    const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Find the first incomplete day across all weeks
    const firstIncomplete = useMemo(() => {
        for (let w = 0; w < weekData.length; w++) {
            for (let d = 0; d < weekData[w].days.length; d++) {
                if (!weekData[w].days[d].completed) {
                    return { weekIndex: w, dayId: weekData[w].days[d].id };
                }
            }
        }
        return null;
    }, [weekData]);

    // Progress calculation
    const progress = useMemo(() => {
        let total = 0;
        let completed = 0;
        for (const week of weekData) {
            for (const day of week.days) {
                total++;
                if (day.completed) completed++;
            }
        }
        return total > 0 ? Math.round((completed / total) * 100) : 0;
    }, [weekData]);

    useFocusEffect(
        useCallback(() => {
            if (!programId) return;
            loadProgram(Number(programId))
                .then((data) => {
                    setProgramName(data.name);
                    setWeekData(data.weeks);
                })
                .catch((err) => {
                    console.error(err);
                    Alert.alert('Error', 'Failed to load program.');
                    router.back();
                })
                .finally(() => setIsLoading(false));
        }, [programId])
    );

    // Auto-select the week containing the first incomplete day
    useEffect(() => {
        if (firstIncomplete) {
            setActiveWeek(firstIncomplete.weekIndex);
        }
    }, [firstIncomplete]);

    if (isLoading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={Colors.accent} />
            </View>
        );
    }

    const currentWeek = weekData[activeWeek];
    if (!currentWeek) return null;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Pressable style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={24} color={Colors.textSecondary} />
                    </Pressable>
                    <Text style={styles.headerLabel}>PROGRAMS</Text>
                </View>
                <Text style={styles.programName}>{programName}</Text>
            </View>

            {/* Progress */}
            <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
            </View>
            <View style={styles.progressSection}>
                <Text style={styles.progressLabel}>PROGRESS</Text>
                <Text style={styles.progressValue}>{progress}% COMPLETE</Text>
            </View>

            {/* Week Pills */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.weekPillsContainer}
                style={styles.weekPillsWrapper}
            >
                {weekData.map((week, i) => {
                    const isActive = i === activeWeek;
                    return (
                        <Pressable
                            key={week.id}
                            onPress={() => { setActiveWeek(i); setSelectedDayId(null); }}
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

            {/* Days Timeline */}
            <ScrollView
                style={styles.daysScroll}
                contentContainerStyle={styles.daysContent}
                showsVerticalScrollIndicator={false}
            >
                {currentWeek.days.map((day, index) => {
                    // A day is "current" if manually selected, or if it's the auto-detected first incomplete
                    const autoCurrentId = firstIncomplete?.weekIndex === activeWeek
                        ? firstIncomplete.dayId : null;
                    const activeDayId = selectedDayId ?? autoCurrentId;
                    const isCurrent = !day.completed && day.id === activeDayId;
                    const status = getDayStatus(day, isCurrent);
                    const isLast = index === currentWeek.days.length - 1;
                    const dayNumber = index + 1;
                    const displayName = day.customName || day.defaultName;

                    const handleDayPress = () => {
                        if (day.completed) return;
                        // Tap to select; tap again to deselect (back to auto)
                        setSelectedDayId((prev) => prev === day.id ? null : day.id);
                    };

                    return (
                        <View key={day.id} style={styles.timelineRow}>
                            {/* Timeline indicator */}
                            <View style={styles.timelineLeft}>
                                {status === 'completed' ? (
                                    <View style={styles.indicatorCompleted}>
                                        <Ionicons name="checkmark" size={16} color={Colors.textPrimary} />
                                    </View>
                                ) : status === 'current' ? (
                                    <View style={styles.indicatorCurrent}>
                                        <View style={styles.indicatorCurrentDot} />
                                    </View>
                                ) : (
                                    <View style={styles.indicatorFuture}>
                                        <Text style={styles.indicatorFutureText}>{dayNumber}</Text>
                                    </View>
                                )}
                                {!isLast && <View style={styles.timelineLine} />}
                            </View>

                            {/* Day content */}
                            {status === 'current' ? (
                                <Pressable style={styles.currentCard} onPress={handleDayPress}>
                                    <Text style={styles.currentLabel}>CURRENT SESSION</Text>
                                    <Text style={styles.currentDayName}>
                                        Day {dayNumber}: {displayName}
                                    </Text>
                                    <View style={styles.metaRow}>
                                        <Ionicons name="barbell-outline" size={14} color={Colors.textSecondary} />
                                        <Text style={styles.metaText}>
                                            {day.exercises.length} {day.exercises.length === 1 ? 'Exercise' : 'Exercises'}
                                        </Text>
                                    </View>
                                    <Pressable
                                        style={styles.startButton}
                                        onPress={() => {
                                            router.push({
                                                pathname: '/day',
                                                params: {
                                                    dayId: day.id,
                                                    dayNumber: String(dayNumber),
                                                    dayName: displayName,
                                                },
                                            });
                                        }}
                                    >
                                        <Text style={styles.startButtonText}>Start Workout</Text>
                                        <Ionicons name="chevron-forward" size={18} color={Colors.textPrimary} />
                                    </Pressable>
                                </Pressable>
                            ) : (
                                <Pressable
                                    style={styles.dayCard}
                                    onPress={handleDayPress}
                                    disabled={day.completed}
                                >
                                    <Text style={styles.dayLabel}>DAY {dayNumber}</Text>
                                    <Text style={[
                                        styles.dayName,
                                        status === 'future' && styles.dayNameFuture,
                                    ]}>
                                        {displayName}
                                    </Text>
                                    <View style={styles.metaRow}>
                                        {status === 'completed' && day.completedAt ? (
                                            <>
                                                <Ionicons name="checkmark-circle-outline" size={14} color={Colors.textSecondary} />
                                                <Text style={styles.metaText}>
                                                    Completed {formatCompletedDate(day.completedAt)}
                                                </Text>
                                            </>
                                        ) : (
                                            <>
                                                <Ionicons name="barbell-outline" size={14} color={Colors.textSecondary} />
                                                <Text style={styles.metaText}>
                                                    {day.exercises.length} {day.exercises.length === 1 ? 'Exercise' : 'Exercises'}
                                                </Text>
                                            </>
                                        )}
                                    </View>
                                </Pressable>
                            )}
                        </View>
                    );
                })}
            </ScrollView>
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
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 10,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    backButton: {
        marginRight: 10,
    },
    headerLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.accent,
        letterSpacing: 1.5,
    },
    programName: {
        fontSize: 28,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    // Progress
    progressSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 6,
        marginBottom: 20,
    },
    progressLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.textSecondary,
        letterSpacing: 1,
    },
    progressValue: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.textSecondary,
        letterSpacing: 1,
    },
    progressBarContainer: {
        height: 3,
        backgroundColor: Colors.border,
        marginHorizontal: 20,
        borderRadius: 2,
    },
    progressBarFill: {
        height: 3,
        backgroundColor: Colors.accent,
        borderRadius: 2,
    },

    // Week Pills
    weekPillsWrapper: {
        flexGrow: 0,
        marginBottom: 20,
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

    // Timeline
    daysScroll: {
        flex: 1,
    },
    daysContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    timelineRow: {
        flexDirection: 'row',
    },
    timelineLeft: {
        width: 40,
        alignItems: 'center',
    },
    timelineLine: {
        flex: 1,
        width: 2,
        backgroundColor: Colors.border,
    },

    // Indicators
    indicatorCompleted: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: Colors.accent,
        justifyContent: 'center',
        alignItems: 'center',
    },
    indicatorCurrent: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: Colors.accent,
        justifyContent: 'center',
        alignItems: 'center',
    },
    indicatorCurrentDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Colors.accent,
    },
    indicatorFuture: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 1.5,
        borderColor: Colors.textTertiary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    indicatorFutureText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textTertiary,
    },

    // Current session card
    currentCard: {
        flex: 1,
        backgroundColor: Colors.surfaceElevated,
        borderRadius: 14,
        padding: 18,
        marginLeft: 12,
        marginBottom: 16,
    },
    currentLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.accent,
        letterSpacing: 1,
        marginBottom: 6,
    },
    currentDayName: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginBottom: 6,
    },
    startButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: Colors.accent,
        borderRadius: 10,
        paddingVertical: 12,
        marginTop: 14,
    },
    startButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.textPrimary,
    },

    // Regular day card
    dayCard: {
        flex: 1,
        marginLeft: 12,
        paddingVertical: 4,
        marginBottom: 16,
    },
    dayLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.textSecondary,
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    dayName: {
        fontSize: 17,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginBottom: 4,
    },
    dayNameFuture: {
        color: Colors.accent,
    },

    // Shared meta
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    metaText: {
        fontSize: 13,
        color: Colors.textSecondary,
    },
});
