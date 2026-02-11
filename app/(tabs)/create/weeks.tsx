import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { Colors } from '@/constants/theme';

// ---------------- Types ----------------
type Exercise = {
    id: string;
    name: string;
    sets: number;
    reps: string;
    rir?: number;
    technique?: string;
};

type Day = {
    id: string;
    name: string;
    exercises: Exercise[];
    
};

type Week = {
    id: string;
    name: string;
    days: Day[];
};

// ---------------- Component ----------------
export default function Weeks() {
    const { name, duration, daysPerWeek } = useLocalSearchParams<{
        name?: string;
        duration?: string;
        daysPerWeek?: string;
    }>();

    const totalWeeks = Number(duration ?? 1); // default to 1 week if missing
    const totalDays = Number(daysPerWeek ?? 7); // default to 7 days if missing

    // ---------------- State ----------------
    const [activeWeek, setActiveWeek] = useState(1);

    const [weekData, setWeekData] = useState<Week[]>(
        Array.from({ length: totalWeeks }, (_, w) => ({
            id: `week-${w + 1}`,
            name: `Week ${w + 1}`,
            days: Array.from({ length: totalDays }, (_, d) => ({
                id: `day-${d + 1}`,
                name: `Day ${d + 1}`,
                exercises: [] as Exercise[], // important for TS
            })),
        }))
    );

    const activeWeekObj = weekData[activeWeek - 1];

    // ---------------- Handlers ----------------
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
                                            sets: 0,
                                            reps: '',
                                            rir: undefined,
                                            technique: '',
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

    const updateExercise = (
        dayId: string,
        exId: string,
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
                                        ex.id === exId ? { ...ex, ...changes } : ex
                                    ),
                                }
                                : d
                        ),
                    }
                    : w
            )
        );
    };

    // ---------------- Render ----------------
    return (
        <View style={styles.container}>
            {/* Header */}
            <Text style={styles.title}>{name}</Text>
            <Text style={styles.subtitle}>Build your program</Text>


            {/* Week Tabs */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tabsContainer}
            >
                {weekData.map((week, i) => {
                    const isActive = i + 1 === activeWeek;
                    return (
                        <Pressable
                            key={week.id}
                            onPress={() => setActiveWeek(i + 1)}
                            style={[styles.weekTab, isActive && styles.weekTabActive]}
                        >
                            <Text
                                style={[styles.weekTabText, isActive && styles.weekTabTextActive]}
                            >
                                {week.name}
                            </Text>
                        </Pressable>
                    );
                })}
            </ScrollView>

            {/* Days and Exercises */}
            <ScrollView style={styles.daysContainer}>
                {activeWeekObj.days.map((day) => (
                    <View key={day.id} style={styles.daySection}>
                        <Text style={styles.dayTitle}>{day.name}</Text>

                        {day.exercises.map((ex, index) => (
                            <View key={ex.id} style={styles.exerciseCard}>
                                <Text style={styles.exerciseNumber}>#{index + 1}</Text>
                                <TextInput
                                    placeholder="Exercise Name"
                                    placeholderTextColor={Colors.textTertiary}
                                    value={ex.name}
                                    onChangeText={(text) =>
                                        updateExercise(day.id, ex.id, { name: text })
                                    }
                                    style={styles.input}
                                />
                                <TextInput
                                    placeholder="Sets"
                                    placeholderTextColor={Colors.textTertiary}
                                    value={ex.sets.toString()}
                                    keyboardType="number-pad"
                                    onChangeText={(text) =>
                                        updateExercise(day.id, ex.id, { sets: Number(text) })
                                    }
                                    style={styles.input}
                                />
                                <TextInput
                                    placeholder="Reps"
                                    placeholderTextColor={Colors.textTertiary}
                                    value={ex.reps}
                                    onChangeText={(text) =>
                                        updateExercise(day.id, ex.id, { reps: text })
                                    }
                                    style={styles.input}
                                />
                                <TextInput
                                    placeholder="RIR"
                                    placeholderTextColor={Colors.textTertiary}
                                    value={ex.rir?.toString() ?? ''}
                                    keyboardType="number-pad"
                                    onChangeText={(text) =>
                                        updateExercise(day.id, ex.id, { rir: Number(text) })
                                    }
                                    style={styles.input}
                                />
                                <TextInput
                                    placeholder="Technique"
                                    placeholderTextColor={Colors.textTertiary}
                                    value={ex.technique}
                                    onChangeText={(text) =>
                                        updateExercise(day.id, ex.id, { technique: text })
                                    }
                                    style={styles.input}
                                />
                            </View>
                        ))}

                        <Pressable
                            onPress={() => addExercise(day.id)}
                            style={styles.addExerciseButton}
                        >
                            <Text style={styles.addExerciseButtonText}>+ Add Exercise</Text>
                        </Pressable>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

// ---------------- Styles ----------------
const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: Colors.background },

    title: { fontSize: 26, fontWeight: '600', marginBottom: 4, marginTop: 20, color: Colors.textPrimary },
    subtitle: { fontSize: 16, color: Colors.textSecondary, marginBottom: 6 },

    tabsContainer: { gap: 8, paddingHorizontal: 0, paddingVertical: 0 },
    weekTab: {
        height: 32,
        paddingHorizontal: 14,
        borderRadius: 16,
        backgroundColor: Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabsWrapper: {
        flexShrink: 0,
        marginTop: 10,
        paddingVertical: 6,
    },
    weekTabActive: { backgroundColor: Colors.accent },
    weekTabText: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
    weekTabTextActive: { color: Colors.textPrimary },

    daysContainer: { marginTop: 8 },

    daySection: { marginBottom: 30, paddingVertical: 4 },
    dayTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8, color: Colors.textPrimary },

    exerciseCard: { backgroundColor: Colors.surface, padding: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
    input: { borderWidth: 1, borderColor: Colors.border, padding: 8, borderRadius: 6, marginBottom: 6, backgroundColor: Colors.surfaceElevated, color: Colors.textPrimary },

    addExerciseButton: { backgroundColor: Colors.accent, padding: 10, borderRadius: 8, alignItems: 'center' },
    addExerciseButtonText: { color: Colors.textPrimary, fontWeight: '500' },
    exerciseNumber: {
        fontWeight: '600',
        fontSize: 14,
        marginBottom: 4,
        color: Colors.textSecondary,
    },

});
