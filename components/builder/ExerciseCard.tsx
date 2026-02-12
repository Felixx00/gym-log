import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { Exercise, Set } from './types';

type ExerciseCardProps = {
    exercise: Exercise;
    onUpdate: (changes: Partial<Exercise>) => void;
    onDelete: () => void;
    onAddSet: () => void;
    onUpdateSet: (setId: string, changes: Partial<Set>) => void;
    onDeleteSet: (setId: string) => void;
};

export function ExerciseCard({
    exercise,
    onUpdate,
    onDelete,
    onAddSet,
    onUpdateSet,
    onDeleteSet,
}: ExerciseCardProps) {
    return (
        <View style={styles.exerciseCard}>
            {/* Exercise Header Row */}
            <View style={styles.exerciseHeaderRow}>
                <View style={styles.exerciseBullet} />
                <TextInput
                    placeholder="Exercise Name"
                    placeholderTextColor={Colors.textTertiary}
                    value={exercise.name}
                    onChangeText={(text) => onUpdate({ name: text })}
                    style={styles.exerciseNameInput}
                />
                <View style={styles.targetRepsContainer}>
                    <Text style={styles.targetRepsLabel}>REPS</Text>
                    <TextInput
                        placeholder="8-12"
                        placeholderTextColor={Colors.textTertiary}
                        value={exercise.repRange}
                        onChangeText={(text) => onUpdate({ repRange: text })}
                        style={styles.targetRepsInput}
                    />
                </View>
                <Pressable
                    onPress={onDelete}
                    hitSlop={8}
                    style={styles.deleteExerciseButton}
                >
                    <Ionicons
                        name="trash-outline"
                        size={18}
                        color="#465468"
                    />
                </Pressable>
            </View>

            {/* Sets Header */}
            <View style={styles.setsHeader}>
                <Text style={styles.setsHeaderText}>#</Text>
                <Text style={[styles.setsHeaderText, styles.setsHeaderRir]}>RIR</Text>
                <Text style={[styles.setsHeaderText, styles.setsHeaderTechnique]}>TECHNIQUE/NOTES</Text>
                <View style={styles.setsHeaderSpacer} />
            </View>

            {/* Sets */}
            {exercise.sets.map((set, setIndex) => (
                <View key={set.id} style={styles.setRow}>
                    <Text style={styles.setNumber}>{setIndex + 1}</Text>
                    <TextInput
                        placeholder="-"
                        placeholderTextColor={Colors.textTertiary}
                        value={set.rir?.toString() ?? ''}
                        onChangeText={(text) =>
                            onUpdateSet(set.id, {
                                rir: text ? Number(text) : undefined,
                            })
                        }
                        keyboardType="number-pad"
                        style={styles.setRirInput}
                    />
                    <TextInput
                        placeholder="Add notes..."
                        placeholderTextColor={Colors.textTertiary}
                        value={set.technique}
                        onChangeText={(text) =>
                            onUpdateSet(set.id, { technique: text })
                        }
                        style={styles.setTechniqueInput}
                    />
                    {exercise.sets.length > 1 && (
                        <Pressable
                            onPress={() => onDeleteSet(set.id)}
                            hitSlop={8}
                            style={styles.deleteSetButton}
                        >
                            <Ionicons
                                name="close"
                                size={18}
                                color={Colors.textTertiary}
                            />
                        </Pressable>
                    )}
                    {exercise.sets.length === 1 && (
                        <View style={styles.deleteSetPlaceholder} />
                    )}
                </View>
            ))}

            {/* Add Set Button */}
            <Pressable style={styles.addSetButton} onPress={onAddSet}>
                <Ionicons name="add" size={16} color={Colors.accent} />
                <Text style={styles.addSetButtonText}>ADD SET</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    exerciseCard: {
        backgroundColor: Colors.surfaceElevated,
        borderRadius: 10,
        padding: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    exerciseHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
    },
    exerciseBullet: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.accent,
    },
    exerciseNameInput: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: Colors.textPrimary,
        padding: 0,
    },
    targetRepsContainer: {
        alignItems: 'center',
    },
    targetRepsLabel: {
        fontSize: 9,
        fontWeight: '600',
        color: Colors.textTertiary,
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    targetRepsInput: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textPrimary,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        minWidth: 60,
        textAlign: 'center',
    },
    deleteExerciseButton: {
        padding: 4,
        marginTop: 12,
    },
    setsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 6,
        marginBottom: 6,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    setsHeaderText: {
        fontSize: 10,
        fontWeight: '600',
        color: Colors.textTertiary,
        letterSpacing: 0.5,
    },
    setsHeaderRir: {
        width: 50,
        textAlign: 'left',
        marginLeft: 24,
    },
    setsHeaderTechnique: {
        flex: 1,
        marginLeft: 8,
    },
    setsHeaderSpacer: {
        width: 26,
    },
    setRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    setNumber: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textSecondary,
        width: 24,
    },
    setRirInput: {
        width: 50,
        fontSize: 14,
        color: Colors.textPrimary,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 8,
        textAlign: 'center',
    },
    setTechniqueInput: {
        flex: 1,
        fontSize: 14,
        color: Colors.textPrimary,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 8,
        marginLeft: 8,
    },
    deleteSetButton: {
        padding: 4,
        marginLeft: 4,
    },
    deleteSetPlaceholder: {
        width: 26,
    },
    addSetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 8,
        marginTop: 4,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: Colors.border,
        borderRadius: 6,
    },
    addSetButtonText: {
        fontSize: 12,
        color: Colors.accent,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
});
