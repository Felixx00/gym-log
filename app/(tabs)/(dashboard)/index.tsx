import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { Colors } from '@/constants/theme';
import { type DashboardStats, type WeekDayStatus, loadDashboardStats } from '@/services/database';
import { generateTestProgram } from '@/services/devGenerator';

const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

function getWeekDates(): number[] {
    const now = new Date();
    const dow = now.getDay(); // 0=Sun
    const mondayOffset = dow === 0 ? -6 : 1 - dow;
    const monday = new Date(now);
    monday.setDate(monday.getDate() + mondayOffset);
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(d.getDate() + i);
        return d.getDate();
    });
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatRelativeDate(dateStr: string): string {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function DashboardScreen() {
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const today = new Date();
    const dayName = WEEKDAYS[today.getDay()];

    useFocusEffect(
        useCallback(() => {
            loadDashboardStats().then(setStats).catch(console.error);
        }, [])
    );

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            await generateTestProgram();
            const data = await loadDashboardStats();
            setStats(data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleOpenProgram = () => {
        if (!stats) return;
        router.push({
            pathname: '/program',
            params: { programId: stats.programId },
        });
    };

    const handleStartWorkout = () => {
        if (!stats?.nextDay) return;
        router.push({
            pathname: '/day',
            params: {
                dayId: stats.nextDay.id,
                dayNumber: String(stats.nextDay.dayNumber),
                dayName: stats.nextDay.name,
            },
        });
    };

    const progress = stats && stats.totalDays > 0
        ? Math.round((stats.completedDays / stats.totalDays) * 100)
        : 0;

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.dayText}>{dayName}</Text>
                        <Text style={styles.greeting}>Dashboard</Text>
                    </View>
                    <Pressable
                        style={styles.generateButton}
                        onPress={handleGenerate}
                        disabled={isGenerating}
                        hitSlop={6}
                    >
                        <Ionicons
                            name="flask-outline"
                            size={20}
                            color={isGenerating ? Colors.textTertiary : Colors.textSecondary}
                        />
                    </Pressable>
                </View>

                {!stats ? (
                    /* No active program */
                    <View style={styles.emptyCard}>
                        <Ionicons name="barbell-outline" size={48} color={Colors.textTertiary} />
                        <Text style={styles.emptyTitle}>No active routine</Text>
                        <Text style={styles.emptySubtitle}>
                            Set a routine as active from the Library tab to see it here.
                        </Text>
                    </View>
                ) : (
                    <>
                        {/* Weekly Progress */}
                        <View style={styles.weeklyCard}>
                            <View style={styles.weeklyLabelsRow}>
                                {DAY_LABELS.map((label, i) => (
                                    <Text
                                        key={i}
                                        style={[
                                            styles.weeklyDayLabel,
                                            stats.weeklyActivity[i] === 'today' && styles.weeklyDayLabelToday,
                                        ]}
                                    >
                                        {label}
                                    </Text>
                                ))}
                            </View>
                            <View style={styles.weeklyRow}>
                                {stats.weeklyActivity.map((status, i) => (
                                    <View
                                        key={i}
                                        style={[
                                            styles.weeklyDayBox,
                                            (status === 'completed' || status === 'missed') && styles.weeklyDayPast,
                                            status === 'today' && styles.weeklyDayToday,
                                        ]}
                                    >
                                        {status === 'completed' ? (
                                            <Ionicons name="checkmark-sharp" size={16} color={Colors.accent} />
                                        ) : status === 'missed' ? (
                                            <Ionicons name="close" size={16} color={Colors.textTertiary} />
                                        ) : (
                                            <Text style={[
                                                styles.weeklyDateText,
                                                status === 'today' && styles.weeklyDateToday,
                                            ]}>
                                                {String(getWeekDates()[i]).padStart(2, '0')}
                                            </Text>
                                        )}
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Active Routine — header row */}
                        <View style={styles.activeHeader}>
                            <Text style={styles.activeLabel}>ACTIVE ROUTINE</Text>
                            <Pressable onPress={handleOpenProgram} hitSlop={8}>
                                <Text style={styles.activeProgramLink} numberOfLines={1}>
                                    {stats.programName}
                                </Text>
                            </Pressable>
                        </View>

                        {/* Combined session card */}
                        <Pressable
                            style={styles.sessionCard}
                            onPress={stats.nextDay ? handleStartWorkout : handleOpenProgram}
                        >
                            {stats.nextDay ? (
                                <>
                                    <View style={styles.sessionBody}>
                                        <View style={styles.sessionContent}>
                                            <View style={styles.sessionBadge}>
                                                <Text style={styles.sessionBadgeText}>NEXT SESSION</Text>
                                            </View>

                                            <Text style={styles.sessionDayName} numberOfLines={1}>
                                                {stats.nextDay.name}
                                            </Text>

                                            <Text style={styles.sessionWeek}>
                                                Week {stats.currentWeek} of {stats.totalWeeks}
                                            </Text>
                                        </View>

                                        <View style={styles.sessionArrow}>
                                            <Ionicons name="arrow-forward" size={20} color={Colors.textPrimary} />
                                        </View>
                                    </View>

                                    <View style={styles.sessionDivider} />

                                    <View style={styles.sessionFooter}>
                                        <View style={styles.sessionMetaItem}>
                                            <Ionicons name="barbell-outline" size={14} color={Colors.textSecondary} />
                                            <Text style={styles.sessionMetaText}>
                                                {stats.nextDay.exerciseCount} {stats.nextDay.exerciseCount === 1 ? 'EXERCISE' : 'EXERCISES'}
                                            </Text>
                                        </View>
                                        <View style={styles.sessionMetaItem}>
                                            <Ionicons name="pie-chart-outline" size={14} color={Colors.textSecondary} />
                                            <Text style={styles.sessionMetaText}>{progress}%</Text>
                                        </View>
                                    </View>
                                </>
                            ) : (
                                <>
                                    <View style={styles.sessionBody}>
                                        <View style={styles.sessionContent}>
                                            <View style={styles.sessionBadge}>
                                                <Text style={styles.sessionBadgeText}>COMPLETED</Text>
                                            </View>
                                            <Text style={styles.sessionDayName}>All workouts done!</Text>
                                            <Text style={styles.sessionWeek}>
                                                {stats.completedDays}/{stats.totalDays} sessions completed
                                            </Text>
                                        </View>
                                        <View style={styles.sessionArrow}>
                                            <Ionicons name="arrow-forward" size={20} color={Colors.textPrimary} />
                                        </View>
                                    </View>

                                    <View style={styles.sessionDivider} />

                                    <View style={styles.sessionFooter}>
                                        <View style={styles.sessionMetaItem}>
                                            <Ionicons name="checkmark-circle-outline" size={14} color={Colors.success} />
                                            <Text style={[styles.sessionMetaText, { color: Colors.success }]}>
                                                {progress}% COMPLETE
                                            </Text>
                                        </View>
                                    </View>
                                </>
                            )}
                        </Pressable>

                        {/* Stats Row */}
                        <View style={styles.statsRow}>
                            <View style={styles.statCard}>
                                <Text style={styles.statValue}>{stats.workoutsThisWeek}</Text>
                                <Text style={styles.statLabel}>This Week</Text>
                            </View>
                            <View style={styles.statCard}>
                                <Text style={styles.statValue}>{stats.completedDays}</Text>
                                <Text style={styles.statLabel}>Total Done</Text>
                            </View>
                            <View style={styles.statCard}>
                                <Text style={styles.statValue}>
                                    {stats.totalDays - stats.completedDays}
                                </Text>
                                <Text style={styles.statLabel}>Remaining</Text>
                            </View>
                        </View>

                        {/* Last Workout */}
                        {stats.lastWorkout && (
                            <View style={styles.lastCard}>
                                <Text style={styles.sectionLabel}>LAST WORKOUT</Text>
                                <View style={styles.lastRow}>
                                    <View style={styles.lastIcon}>
                                        <Ionicons name="checkmark" size={16} color={Colors.textPrimary} />
                                    </View>
                                    <View style={styles.lastContent}>
                                        <Text style={styles.lastName} numberOfLines={1}>
                                            {stats.lastWorkout.name}
                                        </Text>
                                        <Text style={styles.lastDate}>
                                            {formatRelativeDate(stats.lastWorkout.completedAt)}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )}
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingTop: 80,
        paddingBottom: 28,
    },
    dayText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.accent,
        letterSpacing: 1,
        marginBottom: 4,
    },
    greeting: {
        fontSize: 32,
        fontWeight: '800',
        color: Colors.textPrimary,
        letterSpacing: -0.5,
    },
    generateButton: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
    },

    // Weekly progress
    weeklyCard: {
        marginBottom: 20,
    },
    weeklyLabelsRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    weeklyRow: {
        flexDirection: 'row',
        gap: 6,
    },
    weeklyDayBox: {
        flex: 1,
        height: 44,
        borderRadius: 10,
        backgroundColor: Colors.surfaceElevated,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    weeklyDayPast: {
        backgroundColor: Colors.border,
    },
    weeklyDayToday: {
        borderColor: Colors.accent,
    },
    weeklyDayLabel: {
        flex: 1,
        fontSize: 11,
        fontWeight: '600',
        color: Colors.textTertiary,
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    weeklyDayLabelToday: {
        color: Colors.accent,
        fontWeight: '800',
    },
    weeklyDateText: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.textSecondary,
    },
    weeklyDateToday: {
        color: Colors.textPrimary,
    },

    // Empty state
    emptyCard: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 40,
        alignItems: 'center',
        gap: 12,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    emptySubtitle: {
        fontSize: 14,
        color: Colors.textTertiary,
        textAlign: 'center',
        lineHeight: 20,
    },

    // Active routine header row
    activeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    activeLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.textSecondary,
        letterSpacing: 1.5,
    },
    activeProgramLink: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.accent,
        flexShrink: 1,
    },

    // Combined session card
    sessionCard: {
        backgroundColor: Colors.surfaceElevated,
        borderRadius: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        overflow: 'hidden',
    },
    sessionBody: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 24,
        paddingBottom: 20,
    },
    sessionContent: {
        flex: 1,
    },
    sessionBadge: {
        alignSelf: 'flex-start',
        backgroundColor: Colors.accent,
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 5,
        marginBottom: 16,
    },
    sessionBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        color: Colors.background,
        letterSpacing: 1.5,
    },
    sessionDayName: {
        fontSize: 26,
        fontWeight: '800',
        color: Colors.textPrimary,
        letterSpacing: -0.5,
        marginBottom: 4,
    },
    sessionWeek: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    sessionArrow: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.accent,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 16,
    },
    sessionDivider: {
        height: 1,
        backgroundColor: Colors.border,
        marginHorizontal: 24,
    },
    sessionFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 24,
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    sessionMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    sessionMetaText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.textSecondary,
        letterSpacing: 1,
    },

    // Section labels (reused)
    sectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.textSecondary,
        letterSpacing: 2,
        marginBottom: 10,
    },

    // Stats row
    statsRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16,
    },
    statCard: {
        flex: 1,
        backgroundColor: Colors.surface,
        borderRadius: 14,
        paddingVertical: 18,
        alignItems: 'center',
        gap: 6,
    },
    statValue: {
        fontSize: 28,
        fontWeight: '300',
        color: Colors.textPrimary,
        letterSpacing: -1,
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.textSecondary,
        letterSpacing: 0.5,
    },

    // Last workout
    lastCard: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 20,
    },
    lastRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    lastIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.accent,
        justifyContent: 'center',
        alignItems: 'center',
    },
    lastContent: {
        flex: 1,
        gap: 2,
    },
    lastName: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    lastDate: {
        fontSize: 13,
        color: Colors.textSecondary,
    },
});
