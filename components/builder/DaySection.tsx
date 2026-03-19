import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '@/components/StyledText';

import { Colors } from '@/constants/theme';
import { ExerciseCard } from './ExerciseCard';
import { Day, Exercise, Set } from './types';

type DaySectionProps = {
    day: Day;
    onToggle: () => void;
    onUpdateName: (name: string) => void;
    onAddExercise: () => void;
    onUpdateExercise: (exerciseId: string, changes: Partial<Exercise>) => void;
    onDeleteExercise: (exerciseId: string) => void;
    onAddSet: (exerciseId: string) => void;
    onUpdateSet: (exerciseId: string, setId: string, changes: Partial<Set>) => void;
    onDeleteSet: (exerciseId: string, setId: string) => void;
};

export function DaySection({
    day,
    onToggle,
    onUpdateName,
    onAddExercise,
    onUpdateExercise,
    onDeleteExercise,
    onAddSet,
    onUpdateSet,
    onDeleteSet,
}: DaySectionProps) {
    const exerciseCount = day.exercises.length;

    return (
        <View style={[styles.daySection, day.isOpen && styles.daySectionOpen]}>
            {/* Day Header */}
            <Pressable
                style={[styles.dayHeader, day.isOpen && styles.dayHeaderOpen]}
                onPress={onToggle}
            >
                <View style={styles.dayHeaderContent}>
                    <Text style={styles.dayNumber}>{day.defaultName}</Text>
                    {day.isOpen ? (
                        <TextInput
                            placeholder="Name this day"
                            placeholderTextColor={Colors.textTertiary}
                            value={day.customName}
                            onChangeText={onUpdateName}
                            style={styles.dayNameInputOpen}
                            onPressIn={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <Text style={styles.dayName}>
                            {day.customName || 'Tap to name'}
                        </Text>
                    )}
                    {!day.isOpen && exerciseCount > 0 && (
                        <Text style={styles.exerciseCount}>
                            {exerciseCount} {exerciseCount === 1 ? 'exercise' : 'exercises'}
                        </Text>
                    )}
                    {day.isOpen && (
                        <Text style={styles.exerciseCountOpen}>
                            {exerciseCount} {exerciseCount === 1 ? 'exercise' : 'exercises'}
                        </Text>
                    )}
                </View>
                <Ionicons
                    name={day.isOpen ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={Colors.textSecondary}
                />
            </Pressable>

            {/* Day Content (Exercises) */}
            {day.isOpen && (<>
                <View style={styles.dayDivider} />
                <View style={styles.dayContent}>

                    {day.exercises.map((exercise, index) => (
                        <View key={exercise.id} style={{ zIndex: day.exercises.length - index }}>
                            <ExerciseCard
                                exercise={exercise}
                                onUpdate={(changes) => onUpdateExercise(exercise.id, changes)}
                                onDelete={() => onDeleteExercise(exercise.id)}
                                onAddSet={() => onAddSet(exercise.id)}
                                onUpdateSet={(setId, changes) =>
                                    onUpdateSet(exercise.id, setId, changes)
                                }
                                onDeleteSet={(setId) => onDeleteSet(exercise.id, setId)}
                            />
                        </View>
                    ))}

                    {/* Add Exercise Button */}
                    <Pressable style={styles.addExerciseButton} onPress={onAddExercise}>
                        <Ionicons
                            name="add-circle-outline"
                            size={20}
                            color={Colors.textPrimary}
                        />
                        <Text style={styles.addExerciseButtonText}>Add Exercise</Text>
                    </Pressable>
                </View>
            </>)}
        </View>
    );
}

const styles = StyleSheet.create({
    daySection: {
        marginBottom: 10,
        borderRadius: 14,
        backgroundColor: Colors.surface,
    },
    daySectionOpen: {},
    dayHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: Colors.surface,
        borderRadius: 14,
    },
    dayHeaderOpen: {
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
    },
    dayHeaderContent: {
        flex: 1,
    },
    dayNumber: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.accent,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    dayName: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    dayNameInputOpen: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.textPrimary,
        padding: 0,
    },
    exerciseCount: {
        fontSize: 12,
        color: Colors.textTertiary,
        marginTop: 2,
    },
    exerciseCountOpen: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    dayDivider: {
        height: 1,
        backgroundColor: Colors.border,
        marginHorizontal: 16,
    },
    dayContent: {
        backgroundColor: Colors.surface,
        padding: 14,
        gap: 12,
    },
    addExerciseButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        backgroundColor: Colors.accent,
        borderRadius: 12,
    },
    addExerciseButtonText: {
        fontSize: 14,
        color: Colors.textPrimary,
        fontWeight: '600',
    },
});
