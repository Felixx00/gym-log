import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    PanResponder,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { Text } from '@/components/StyledText';

import { Colors } from '@/constants/theme';
import { type HistoryWeek, loadExerciseHistory } from '@/services/database';

type Props = {
    visible: boolean;
    exerciseId: string;
    exerciseName: string;
    onClose: () => void;
};

export function ExerciseHistorySheet({ visible, exerciseId, exerciseName, onClose }: Props) {
    const [showSheet, setShowSheet] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [weeks, setWeeks] = useState<HistoryWeek[]>([]);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(300)).current;
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, g) => g.dy > 8,
            onPanResponderMove: (_, g) => {
                if (g.dy > 0) slideAnim.setValue(g.dy);
            },
            onPanResponderRelease: (_, g) => {
                if (g.dy > 100 || g.vy > 0.5) {
                    onCloseRef.current();
                } else {
                    Animated.spring(slideAnim, {
                        toValue: 0,
                        useNativeDriver: true,
                        bounciness: 8,
                    }).start();
                }
            },
        })
    ).current;

    useEffect(() => {
        if (visible) {
            setShowSheet(true);
            setIsLoading(true);
            loadExerciseHistory(Number(exerciseId))
                .then(setWeeks)
                .catch(() => setWeeks([]))
                .finally(() => setIsLoading(false));

            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 300,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start(() => setShowSheet(false));
        }
    }, [visible]);

    if (!showSheet) return null;

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
            <Pressable style={styles.backdrop} onPress={onClose} />
            <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
                {/* Drag handle + Header */}
                <View {...panResponder.panHandlers}>
                    <View style={styles.handle} />
                    <View style={styles.header}>
                        <View style={styles.headerText}>
                            <Text style={styles.title}>Weekly History</Text>
                            <Text style={styles.subtitle} numberOfLines={1}>{exerciseName}</Text>
                        </View>
                        <Pressable style={styles.closeButton} onPress={onClose} hitSlop={8}>
                            <Ionicons name="close" size={20} color={Colors.textSecondary} />
                        </Pressable>
                    </View>
                </View>

                {/* Content */}
                {isLoading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="small" color={Colors.accent} />
                    </View>
                ) : weeks.length === 0 ? (
                    <View style={styles.centered}>
                        <Ionicons name="time-outline" size={32} color={Colors.textTertiary} />
                        <Text style={styles.emptyText}>No history yet</Text>
                        <Text style={styles.emptySubtext}>Complete a workout to see your progress</Text>
                    </View>
                ) : (
                    <ScrollView
                        style={styles.scroll}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {weeks.map((week, i) => (
                            <View key={`${week.weekPosition}-${i}`} style={styles.weekCard}>
                                <View style={styles.weekHeader}>
                                    <Text style={styles.weekName}>{week.weekName.toUpperCase()}</Text>
                                    <Text style={styles.weekDate}>{formatDate(week.completedAt)}</Text>
                                </View>

                                {/* Column headers */}
                                <View style={styles.colHeaders}>
                                    <Text style={[styles.colLabel, styles.setCol]}>SET</Text>
                                    <Text style={[styles.colLabel, styles.weightHistCol]}>WEIGHT</Text>
                                    <Text style={[styles.colLabel, styles.repsHistCol]}>REPS</Text>
                                    <Text style={[styles.colLabel, styles.rirHistCol, styles.textRight]}>RIR</Text>
                                </View>

                                {week.sets.map((set, si) => (
                                    <View key={si} style={styles.setRow}>
                                        <Text style={[styles.setNum, styles.setCol]}>{si + 1}</Text>
                                        <Text style={[styles.setValue, styles.weightHistCol]}>
                                            {set.weight != null ? `${set.weight}kg` : '-'}
                                        </Text>
                                        <Text style={[styles.setValue, styles.repsHistCol]}>
                                            {set.repsDone != null ? set.repsDone : '-'}
                                        </Text>
                                        <View style={[styles.rirCell, styles.rirHistCol]}>
                                            {set.rir != null && (
                                                <Text style={styles.rirValue}>{set.rir}</Text>
                                            )}
                                            <View
                                                style={[
                                                    styles.rirDot,
                                                    set.rirAchieved && styles.rirDotActive,
                                                ]}
                                            />
                                        </View>
                                    </View>
                                ))}

                                {week.notes ? (
                                    <>
                                        <View style={styles.notesDivider} />
                                        <Text style={styles.notesText} numberOfLines={2}>{week.notes}</Text>
                                    </>
                                ) : null}
                            </View>
                        ))}
                    </ScrollView>
                )}
            </Animated.View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'flex-end',
        zIndex: 100,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    sheet: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        flex: 1,
        maxHeight: '70%',
        paddingBottom: 40,
    },
    handle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.textTertiary,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 16,
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 24,
        marginBottom: 20,
    },
    headerText: {
        flex: 1,
        marginRight: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    subtitle: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textSecondary,
        marginTop: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.surfaceElevated,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Loading / Empty
    centered: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
    },
    emptyText: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.textSecondary,
        marginTop: 12,
    },
    emptySubtext: {
        fontSize: 13,
        color: Colors.textTertiary,
        marginTop: 4,
    },

    // Scroll
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 20,
        gap: 12,
    },

    // Week Card
    weekCard: {
        backgroundColor: Colors.surfaceElevated,
        borderRadius: 16,
        padding: 16,
    },
    weekHeader: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 10,
        marginBottom: 12,
    },
    weekName: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.accent,
        letterSpacing: 0.5,
    },
    weekDate: {
        fontSize: 12,
        color: Colors.textTertiary,
    },

    // Column headers
    colHeaders: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        marginBottom: 4,
    },
    colLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: Colors.textTertiary,
        letterSpacing: 0.5,
    },

    // Column widths
    setCol: {
        flex: 1,
    },
    weightHistCol: {
        flex: 1,
    },
    repsHistCol: {
        flex: 1,
        textAlign: 'center',
    },
    rirHistCol: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },

    textRight: {
        textAlign: 'right',
    },

    // Set Row
    setRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    setNum: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textTertiary,
    },
    setValue: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textPrimary,
    },

    // RIR cell
    rirCell: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 6,
    },
    rirValue: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    rirDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Colors.textTertiary,
    },
    rirDotActive: {
        backgroundColor: Colors.accent,
    },

    // Notes
    notesDivider: {
        height: 1,
        backgroundColor: Colors.border,
        marginTop: 4,
        marginBottom: 6,
    },
    notesText: {
        fontSize: 12,
        color: Colors.textTertiary,
        fontStyle: 'italic',
    },
});
