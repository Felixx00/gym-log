import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { Text } from '@/components/StyledText';

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
                <View style={styles.headerRow}>
                    <Pressable style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={24} color={Colors.textSecondary} />
                    </Pressable>
                    <View style={styles.headerInfo}>
                        <Text style={styles.programName} numberOfLines={1}>{programName}</Text>
                        <Text style={styles.progressText}>{progress}%</Text>
                    </View>
                </View>
                <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
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

            {/* Day Cards */}
            <ScrollView
                style={styles.daysScroll}
                contentContainerStyle={styles.daysContent}
                showsVerticalScrollIndicator={false}
            >
                {currentWeek.days.map((day, index) => {
                    const autoCurrentId = firstIncomplete?.weekIndex === activeWeek
                        ? firstIncomplete.dayId : null;
                    const activeDayId = selectedDayId ?? autoCurrentId;
                    const isCurrent = !day.completed && day.id === activeDayId;
                    const status = getDayStatus(day, isCurrent);
                    const dayNumber = index + 1;
                    const displayName = day.customName || day.defaultName;

                    const handleDayPress = () => {
                        if (day.completed) {
                            router.push({
                                pathname: '/day',
                                params: {
                                    dayId: day.id,
                                    dayNumber: String(dayNumber),
                                    dayName: displayName,
                                    completed: '1',
                                },
                            });
                            return;
                        }
                        setSelectedDayId((prev) => prev === day.id ? null : day.id);
                    };

                    return (
                        <Pressable
                            key={day.id}
                            style={[
                                styles.dayCard,
                                status === 'current' && styles.dayCardCurrent,
                                status === 'completed' && styles.dayCardCompleted,
                            ]}
                            onPress={handleDayPress}
                        >
                            <View style={styles.dayCardTop}>
                                <View style={styles.dayCardInfo}>
                                    <Text style={styles.dayLabel}>DAY {dayNumber}</Text>
                                    <Text style={styles.dayName}>{displayName}</Text>
                                </View>
                                {status === 'completed' && (
                                    <View style={styles.statusBadgeCompleted}>
                                        <Ionicons name="checkmark" size={14} color={Colors.textPrimary} />
                                    </View>
                                )}
                                {status === 'future' && (
                                    <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
                                )}
                            </View>

                            <View style={styles.metaRow}>
                                <Ionicons
                                    name={status === 'completed' ? 'checkmark-circle-outline' : 'barbell-outline'}
                                    size={14}
                                    color={Colors.textSecondary}
                                />
                                <Text style={styles.metaText}>
                                    {status === 'completed' && day.completedAt
                                        ? `Completed ${formatCompletedDate(day.completedAt)}`
                                        : `${day.exercises.length} ${day.exercises.length === 1 ? 'Exercise' : 'Exercises'}`
                                    }
                                </Text>
                            </View>

                            {status === 'current' && (
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
                            )}
                        </Pressable>
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
        paddingBottom: 16,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    backButton: {
        marginRight: 10,
    },
    headerInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 10,
    },
    programName: {
        fontSize: 22,
        fontWeight: '700',
        color: Colors.textPrimary,
        flex: 1,
    },
    progressText: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.accent,
    },
    progressBarContainer: {
        height: 3,
        backgroundColor: Colors.border,
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
        marginBottom: 16,
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

    // Day Cards
    daysScroll: {
        flex: 1,
    },
    daysContent: {
        paddingHorizontal: 16,
        paddingBottom: 40,
        gap: 10,
    },
    dayCard: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    dayCardCurrent: {
        borderColor: Colors.accent,
        borderWidth: 1.5,
    },
    dayCardCompleted: {
        opacity: 0.7,
    },
    dayCardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    dayCardInfo: {
        flex: 1,
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
    },
    statusBadgeCompleted: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.accent,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Start button (current session only)
    startButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: Colors.accent,
        borderRadius: 10,
        paddingVertical: 12,
        marginTop: 12,
    },
    startButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.textPrimary,
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
