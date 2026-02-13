import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    Alert,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import type { ProgramSummary } from '@/components/builder';
import { Colors } from '@/constants/theme';
import { deleteProgram, loadProgramList } from '@/services/database';

export default function DashboardScreen() {
    const router = useRouter();
    const [programs, setPrograms] = useState<ProgramSummary[]>([]);

    useFocusEffect(
        useCallback(() => {
            loadProgramList().then(setPrograms).catch(console.error);
        }, [])
    );

    const handleDelete = (program: ProgramSummary) => {
        Alert.alert(
            'Delete Program',
            `Are you sure you want to delete "${program.name}"? This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteProgram(program.id);
                            setPrograms((prev) => prev.filter((p) => p.id !== program.id));
                        } catch (err) {
                            console.error(err);
                            Alert.alert('Error', 'Failed to delete program.');
                        }
                    },
                },
            ]
        );
    };

    const handleOpen = (program: ProgramSummary) => {
        router.push({
            pathname: '/builder/weeks',
            params: { programId: program.id },
        });
    };

    const renderProgram = ({ item }: { item: ProgramSummary }) => (
        <Pressable style={styles.card} onPress={() => handleOpen(item)}>
            <View style={styles.accentBarWrapper}>
                <View style={styles.accentBar} />
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                        <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
                        <Text style={styles.metaText}>{item.duration} Weeks</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Ionicons name="barbell-outline" size={14} color={Colors.textSecondary} />
                        <Text style={styles.metaText}>{item.daysPerWeek} Days / Wk</Text>
                    </View>
                </View>
            </View>
            <Pressable
                style={styles.deleteButton}
                hitSlop={8}
                onPress={() => handleDelete(item)}
            >
                <Ionicons name="trash-outline" size={20} color={Colors.textTertiary} />
            </Pressable>
        </Pressable>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>
                    Your <Text style={styles.titleAccent}>Programs</Text>
                </Text>
                <Text style={styles.subtitle}>Select a routine to begin</Text>
            </View>

            {programs.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="barbell-outline" size={64} color={Colors.textTertiary} />
                    <Text style={styles.emptyTitle}>No programs yet</Text>
                    <Text style={styles.emptySubtitle}>
                        Head to the Builder tab to create your first workout program.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={programs}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={renderProgram}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 80,
        paddingBottom: 36,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    titleAccent: {
        color: Colors.accent,
    },
    subtitle: {
        fontSize: 15,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    list: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 14,
        paddingVertical: 24,
        paddingLeft: 20,
        paddingRight: 18,
        marginBottom: 14,
        overflow: 'hidden',
    },
    accentBarWrapper: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        justifyContent: 'flex-start',
        paddingTop: 18,
    },
    accentBar: {
        width: 3,
        height: 32,
        backgroundColor: Colors.accent,
        borderRadius: 2,
    },
    cardContent: {
        flex: 1,
    },
    cardName: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginBottom: 20,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    metaText: {
        fontSize: 13,
        color: Colors.textSecondary,
    },
    deleteButton: {
        padding: 8,
        alignSelf: 'flex-start',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.textSecondary,
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: Colors.textTertiary,
        textAlign: 'center',
        lineHeight: 20,
    },
});
