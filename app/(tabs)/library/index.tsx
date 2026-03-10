import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
    Animated,
    FlatList,
    GestureResponderEvent,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import type { ProgramSummary } from '@/components/builder';
import { OverlayModal } from '@/components/OverlayModal';
import { Colors } from '@/constants/theme';
import { deleteProgram, loadProgramList } from '@/services/database';

export default function LibraryScreen() {
    const router = useRouter();
    const [programs, setPrograms] = useState<ProgramSummary[]>([]);
    const [menuTarget, setMenuTarget] = useState<ProgramSummary | null>(null);
    const [menuPos, setMenuPos] = useState({ top: 0 });
    const [deleteTarget, setDeleteTarget] = useState<ProgramSummary | null>(null);

    const menuAnim = useRef(new Animated.Value(0)).current;

    useFocusEffect(
        useCallback(() => {
            menuAnim.setValue(0);
            setMenuTarget(null);
            loadProgramList().then(setPrograms).catch(console.error);
        }, [])
    );

    const openMenu = (item: ProgramSummary, event: GestureResponderEvent) => {
        if (menuTarget?.id === item.id) {
            closeMenu();
            return;
        }
        const { pageY } = event.nativeEvent;
        setMenuPos({ top: pageY });
        setMenuTarget(item);
        menuAnim.setValue(0);
        Animated.spring(menuAnim, {
            toValue: 1,
            useNativeDriver: true,
            damping: 18,
            stiffness: 320,
        }).start();
    };

    const closeMenu = () => {
        Animated.timing(menuAnim, {
            toValue: 0,
            duration: 120,
            useNativeDriver: true,
        }).start(() => setMenuTarget(null));
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        const targetId = deleteTarget.id;
        setDeleteTarget(null);
        try {
            await deleteProgram(targetId);
            setPrograms((prev) => prev.filter((p) => p.id !== targetId));
        } catch (err) {
            console.error(err);
        }
    };

    const handleEdit = (program: ProgramSummary) => {
        setMenuTarget(null);
        router.push({
            pathname: '/library/edit',
            params: { programId: program.id },
        });
    };

    const renderProgram = ({ item }: { item: ProgramSummary }) => (
        <View style={styles.card}>
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
                        <Text style={styles.metaText}>{item.daysPerWeek} Days/Week</Text>
                    </View>
                </View>
            </View>
            <Pressable
                style={styles.menuButton}
                hitSlop={8}
                onPress={(e) => openMenu(item, e)}
            >
                <Ionicons
                    name="ellipsis-vertical"
                    size={20}
                    color={menuTarget?.id === item.id ? Colors.textPrimary : Colors.textTertiary}
                />
            </Pressable>
        </View>
    );

    const dropdownScale = menuAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.9, 1],
    });
    const dropdownTranslateY = menuAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-8, 0],
    });

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.title}>
                            Your <Text style={styles.titleAccent}>Library</Text>
                        </Text>
                        <Text style={styles.subtitle}>Manage your routines</Text>
                    </View>
                    <Pressable
                        style={styles.newButton}
                        onPress={() => router.push('/library/create')}
                        hitSlop={6}
                    >
                        <Ionicons name="add" size={20} color={Colors.textPrimary} />
                        <Text style={styles.newButtonText}>New Routine</Text>
                    </Pressable>
                </View>
            </View>

            {programs.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="barbell-outline" size={64} color={Colors.textTertiary} />
                    <Text style={styles.emptyTitle}>No programs yet</Text>
                    <Text style={styles.emptySubtitle}>
                        Tap + New Routine to create your first program.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={programs}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={renderProgram}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    onScrollBeginDrag={() => menuTarget && closeMenu()}
                />
            )}

            {menuTarget && (
                <>
                    <Pressable
                        style={styles.backdrop}
                        onPress={closeMenu}
                    />
                    <Animated.View
                        style={[
                            styles.dropdown,
                            {
                                top: menuPos.top,
                                opacity: menuAnim,
                                transform: [
                                    { scale: dropdownScale },
                                    { translateY: dropdownTranslateY },
                                ],
                            },
                        ]}
                    >
                        <Pressable
                            style={styles.dropdownItem}
                            onPress={() => handleEdit(menuTarget)}
                        >
                            <Ionicons name="create-outline" size={18} color={Colors.textPrimary} />
                            <Text style={styles.dropdownText}>Edit</Text>
                        </Pressable>
                        <View style={styles.dropdownDivider} />
                        <Pressable
                            style={styles.dropdownItem}
                            onPress={() => {
                                const t = menuTarget;
                                setMenuTarget(null);
                                setDeleteTarget(t);
                            }}
                        >
                            <Ionicons name="trash-outline" size={18} color={Colors.accent} />
                            <Text style={[styles.dropdownText, { color: Colors.accent }]}>Delete</Text>
                        </Pressable>
                    </Animated.View>
                </>
            )}

            <OverlayModal
                visible={!!deleteTarget}
                title="Delete Program"
                message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
                onClose={() => setDeleteTarget(null)}
                buttons={[
                    { label: 'Cancel', onPress: () => setDeleteTarget(null), variant: 'cancel' },
                    { label: 'Delete', onPress: confirmDelete, variant: 'confirm' },
                ]}
            />
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
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    newButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: Colors.accent,
        marginTop: 4,
    },
    newButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textPrimary,
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
    menuButton: {
        padding: 8,
        alignSelf: 'flex-start',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 50,
    },
    dropdown: {
        position: 'absolute',
        right: 20,
        zIndex: 51,
        backgroundColor: Colors.surfaceElevated,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.border,
        minWidth: 150,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    dropdownText: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.textPrimary,
    },
    dropdownDivider: {
        height: 1,
        backgroundColor: Colors.border,
        marginHorizontal: 10,
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
