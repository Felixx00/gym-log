import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { Text } from '@/components/StyledText';

import { Colors } from '@/constants/theme';
import { type DashboardStats, type WeekDayStatus, loadDashboardStats } from '@/services/database';


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


    const today = new Date();
    const dayName = WEEKDAYS[today.getDay()];

    useFocusEffect(
        useCallback(() => {
            loadDashboardStats().then(setStats).catch(console.error);
        }, [])
    );

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
                        <Text style={styles.dayText}>{dayName}, {today.getDate()}</Text>
                        <Text style={styles.greeting}>Dashboard</Text>
                    </View>
                    <View style={styles.headerLogo}>
                        <Text style={styles.headerLogoText}>Φ</Text>
                    </View>
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
                            <LinearGradient
                                colors={['#2A1A1A', Colors.surface]}
                                locations={[0, 0.7]}
                                style={styles.sessionGradient}
                            >
                                {stats.nextDay ? (
                                    <View style={styles.sessionLayout}>
                                        <View style={styles.sessionLeft}>
                                            <View style={styles.sessionBadge}>
                                                <View style={styles.sessionBadgeDot} />
                                                <Text style={styles.sessionBadgeText}>NEXT SESSION</Text>
                                            </View>

                                            <Text style={styles.sessionDayName} numberOfLines={1}>
                                                {stats.nextDay.name}
                                            </Text>

                                            <View style={styles.sessionMeta}>
                                                <Text style={styles.sessionMetaText}>
                                                    Week {stats.currentWeek}
                                                </Text>
                                                <View style={styles.sessionMetaDot} />
                                                <Text style={styles.sessionMetaText}>
                                                    Day {stats.nextDay.dayNumber}
                                                </Text>
                                                <View style={styles.sessionMetaDot} />
                                                <Text style={styles.sessionMetaText}>
                                                    {stats.nextDay.exerciseCount} {stats.nextDay.exerciseCount === 1 ? 'exercise' : 'exercises'}
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={styles.sessionCta}>
                                            <Ionicons name="play" size={24} color={Colors.background} />
                                        </View>
                                    </View>
                                ) : (
                                    <View style={styles.sessionLayout}>
                                        <View style={styles.sessionLeft}>
                                            <View style={[styles.sessionBadge, styles.sessionBadgeCompleted]}>
                                                <Text style={[styles.sessionBadgeText, { color: Colors.success }]}>COMPLETED</Text>
                                            </View>

                                            <Text style={styles.sessionDayName}>All workouts done!</Text>

                                            <View style={styles.sessionMeta}>
                                                <Text style={styles.sessionMetaText}>
                                                    {stats.completedDays}/{stats.totalDays} sessions
                                                </Text>
                                                <View style={styles.sessionMetaDot} />
                                                <Text style={styles.sessionMetaText}>
                                                    {progress}% complete
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={styles.sessionCta}>
                                            <Ionicons name="arrow-forward" size={24} color={Colors.background} />
                                        </View>
                                    </View>
                                )}
                            </LinearGradient>
                        </Pressable>

                        {/* Stats Row */}
                        <View style={styles.statsRow}>
                            <View style={styles.statCard}>
                                <Text style={styles.statValue}>{stats.workoutsThisMonth}</Text>
                                <Text style={styles.statLabel}>This Month</Text>
                            </View>
                            <View style={styles.statCard}>
                                <Text style={styles.statValue}>
                                    {stats.totalDays > 0
                                        ? Math.round((stats.completedDays / stats.totalDays) * 100)
                                        : 0}%
                                </Text>
                                <Text style={styles.statLabel}>Completion</Text>
                            </View>
                            <View style={styles.statCard}>
                                <Text style={styles.statValue}>
                                    {stats.currentWeek}/{stats.totalWeeks}
                                </Text>
                                <Text style={styles.statLabel}>Week</Text>
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
        alignItems: 'center',
        paddingTop: 80,
        paddingBottom: 28,
    },
    headerLogo: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerLogoText: {
        fontSize: 27,
        fontWeight: '700',
        color: Colors.accent,
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
        borderRadius: 20,
        marginBottom: 16,
        borderLeftWidth: 3,
        borderLeftColor: Colors.accent,
        backgroundColor: Colors.surface,
        overflow: 'hidden',
    },
    sessionGradient: {
        padding: 24,
    },
    sessionBadge: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        backgroundColor: 'rgba(255,62,62,0.12)',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginBottom: 14,
    },
    sessionBadgeCompleted: {
        backgroundColor: 'rgba(76,175,80,0.12)',
    },
    sessionBadgeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.accent,
    },
    sessionBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.textPrimary,
        letterSpacing: 1.5,
    },
    sessionDayName: {
        fontSize: 28,
        fontWeight: '800',
        color: Colors.textPrimary,
        letterSpacing: -0.5,
        marginBottom: 8,
    },
    sessionMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
    },
    sessionMetaDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.textTertiary,
    },
    sessionMetaText: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.textSecondary,
    },
    sessionLayout: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    sessionLeft: {
        flex: 1,
        marginRight: 16,
    },
    sessionCta: {
        width: 64,
        height: 64,
        borderRadius: 26,
        backgroundColor: Colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sessionCtaLabel: {
        fontSize: 9,
        fontWeight: '700',
        color: Colors.background,
        letterSpacing: 1,
        marginTop: 2,
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
