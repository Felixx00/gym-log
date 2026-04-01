import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { Text } from '@/components/StyledText';

import type { Week } from '@/components/builder';
import { Colors } from '@/constants/theme';
import { loadProgram } from '@/services/database';

function formatCompletedDate(dateStr?: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function LibraryProgramScreen() {
    const { programId } = useLocalSearchParams<{ programId: string }>();

    const [programName, setProgramName] = useState('');
    const [weekData, setWeekData] = useState<Week[]>([]);
    const [activeWeek, setActiveWeek] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

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
            let cancelled = false;
            loadProgram(Number(programId))
                .then((data) => {
                    if (!cancelled) {
                        setProgramName(data.name);
                        setWeekData(data.weeks);
                    }
                })
                .catch((err) => {
                    console.error(err);
                    if (!cancelled) {
                        Alert.alert('Error', 'Failed to load program.');
                        router.back();
                    }
                })
                .finally(() => {
                    if (!cancelled) setIsLoading(false);
                });
            return () => { cancelled = true; };
        }, [programId])
    );

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
                    const completedInWeek = week.days.filter(d => d.completed).length;
                    const allDone = completedInWeek === week.days.length;
                    return (
                        <Pressable
                            key={week.id}
                            onPress={() => setActiveWeek(i)}
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
                            {allDone ? (
                                <Ionicons name="checkmark-circle" size={12} color={isActive ? Colors.textPrimary : Colors.accent} />
                            ) : completedInWeek > 0 ? (
                                <Text style={[styles.weekPillProgress, isActive && styles.weekPillProgressActive]}>
                                    {completedInWeek}/{week.days.length}
                                </Text>
                            ) : null}
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
                    const dayNumber = index + 1;
                    const displayName = day.customName || day.defaultName;
                    const isLast = index === currentWeek.days.length - 1;

                    const handleDayPress = () => {
                        if (!day.completed) return;
                        router.push({
                            pathname: '/library/day',
                            params: {
                                dayId: day.id,
                                dayNumber: String(dayNumber),
                                dayName: displayName,
                            },
                        });
                    };

                    return (
                        <View key={day.id} style={styles.timelineRow}>
                            {/* Timeline left */}
                            <View style={styles.timelineLeft}>
                                <View style={[
                                    styles.timelineNode,
                                    day.completed && styles.timelineNodeCompleted,
                                ]}>
                                    <Text style={[
                                        styles.timelineNodeText,
                                        day.completed && styles.timelineNodeTextActive,
                                    ]}>{dayNumber}</Text>
                                </View>
                                {!isLast && <View style={styles.timelineLine} />}
                            </View>

                            {/* Card */}
                            <Pressable
                                style={[
                                    styles.dayCard,
                                    !day.completed && styles.dayCardIncomplete,
                                ]}
                                onPress={handleDayPress}
                            >
                                <View style={styles.dayCardTop}>
                                    <Text style={styles.dayName}>{displayName}</Text>
                                    {day.completed && (
                                        <View style={styles.statusBadgeCompleted}>
                                            <Ionicons name="checkmark" size={14} color={Colors.textPrimary} />
                                        </View>
                                    )}
                                </View>

                                <View style={styles.metaRow}>
                                    <Ionicons
                                        name={day.completed ? 'checkmark-circle-outline' : 'barbell-outline'}
                                        size={14}
                                        color={day.completed ? Colors.accent : Colors.textSecondary}
                                    />
                                    <Text style={[styles.metaText, day.completed && styles.metaTextCompleted]}>
                                        {day.completed && day.completedAt
                                            ? `Completed ${formatCompletedDate(day.completedAt)}`
                                            : `${day.exercises.length} ${day.exercises.length === 1 ? 'Exercise' : 'Exercises'}`
                                        }
                                    </Text>
                                </View>
                            </Pressable>
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
        paddingHorizontal: 14,
        borderRadius: 18,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
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
    weekPillProgress: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.textTertiary,
    },
    weekPillProgressActive: {
        color: 'rgba(255,255,255,0.7)',
    },

    // Day Cards
    daysScroll: {
        flex: 1,
    },
    daysContent: {
        paddingHorizontal: 16,
        paddingBottom: 40,
    },

    // Timeline
    timelineRow: {
        flexDirection: 'row',
    },
    timelineLeft: {
        width: 36,
        alignItems: 'center',
        paddingTop: 16,
    },
    timelineLine: {
        flex: 1,
        width: 2,
        backgroundColor: Colors.border,
    },
    timelineNode: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.surfaceElevated,
        borderWidth: 2,
        borderColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    timelineNodeCompleted: {
        backgroundColor: Colors.accent,
        borderColor: Colors.accent,
    },
    timelineNodeText: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.textSecondary,
    },
    timelineNodeTextActive: {
        color: Colors.background,
    },

    dayCard: {
        flex: 1,
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        marginLeft: 10,
        marginBottom: 10,
    },
    dayCardIncomplete: {
        opacity: 0.4,
    },
    dayCardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
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

    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    metaText: {
        fontSize: 13,
        color: Colors.textSecondary,
    },
    metaTextCompleted: {
        color: Colors.textTertiary,
    },
});
