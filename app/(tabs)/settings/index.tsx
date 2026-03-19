import { Ionicons } from '@expo/vector-icons';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { Text } from '@/components/StyledText';

import { OverlayModal } from '@/components/OverlayModal';
import { Colors } from '@/constants/theme';
import { exportAllPrograms, importPrograms } from '@/services/database';
import { validateExportFile } from '@/services/exportValidator';

export default function SettingsScreen() {
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalMessage, setModalMessage] = useState('');

    const showModal = (title: string, message: string) => {
        setModalTitle(title);
        setModalMessage(message);
        setModalVisible(true);
    };

    const handleExport = async () => {
        setLoading(true);
        try {
            const data = await exportAllPrograms();

            if (data.programs.length === 0) {
                showModal('Nothing to Export', 'You have no programs to export yet.');
                return;
            }

            const json = JSON.stringify(data, null, 2);
            const fileName = `gymlog-backup-${new Date().toISOString().slice(0, 10)}.json`;
            const file = new File(Paths.cache, fileName);

            file.write(json);

            await Sharing.shareAsync(file.uri, {
                mimeType: 'application/json',
                dialogTitle: 'Export GymLog Programs',
                UTI: 'public.json',
            });
        } catch (err) {
            console.error('Export failed:', err);
            showModal('Export Failed', 'Something went wrong while exporting your programs.');
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        try {
            let picked;
            try {
                picked = await File.pickFileAsync(undefined, 'application/json');
            } catch {
                return; // user cancelled the picker
            }

            const file = Array.isArray(picked) ? picked[0] : picked;
            if (!file) return;

            setLoading(true);

            const content = await file.text();

            let parsed: unknown;
            try {
                parsed = JSON.parse(content);
            } catch {
                showModal('Invalid File', 'The selected file is not valid JSON.');
                return;
            }

            if (!validateExportFile(parsed)) {
                showModal('Invalid Format', 'The file does not match the GymLog export format.');
                return;
            }

            const { imported, skipped } = await importPrograms(parsed);

            const lines: string[] = [];
            if (imported.length > 0) {
                lines.push(`Imported ${imported.length} program${imported.length > 1 ? 's' : ''}:`);
                imported.forEach((name) => lines.push(`  + ${name}`));
            }
            if (skipped.length > 0) {
                if (lines.length > 0) lines.push('');
                lines.push(`Skipped ${skipped.length} (already exists):`);
                skipped.forEach((name) => lines.push(`  - ${name}`));
            }
            if (imported.length === 0 && skipped.length === 0) {
                lines.push('The file contained no programs.');
            }

            showModal(
                imported.length > 0 ? 'Import Complete' : 'Nothing Imported',
                lines.join('\n')
            );
        } catch (err) {
            console.error('Import failed:', err);
            showModal('Import Failed', 'Something went wrong while importing programs.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Settings</Text>
                <Text style={styles.subtitle}>Manage your data and preferences</Text>
            </View>

            <ScrollView contentContainerStyle={styles.list}>
                <Text style={styles.sectionLabel}>DATA</Text>

                <Pressable
                    style={styles.actionRow}
                    onPress={handleExport}
                    disabled={loading}
                >
                    <View style={styles.actionIcon}>
                        <Ionicons name="download-outline" size={20} color={Colors.accent} />
                    </View>
                    <View style={styles.actionContent}>
                        <Text style={styles.actionTitle}>Export All Programs</Text>
                        <Text style={styles.actionDescription}>
                            Save all programs to a JSON file
                        </Text>
                    </View>
                    {loading ? (
                        <ActivityIndicator color={Colors.textTertiary} />
                    ) : (
                        <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
                    )}
                </Pressable>

                <Pressable
                    style={styles.actionRow}
                    onPress={handleImport}
                    disabled={loading}
                >
                    <View style={styles.actionIcon}>
                        <Ionicons name="push-outline" size={20} color={Colors.accent} />
                    </View>
                    <View style={styles.actionContent}>
                        <Text style={styles.actionTitle}>Import Programs</Text>
                        <Text style={styles.actionDescription}>
                            Load programs from a backup file
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
                </Pressable>
            </ScrollView>

            <OverlayModal
                visible={modalVisible}
                title={modalTitle}
                message={modalMessage}
                onClose={() => setModalVisible(false)}
                buttons={[{ label: 'OK', onPress: () => setModalVisible(false) }]}
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
    sectionLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.textTertiary,
        letterSpacing: 1.2,
        marginBottom: 12,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 14,
        padding: 16,
        marginBottom: 10,
    },
    actionIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: Colors.surfaceElevated,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    actionContent: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.textPrimary,
        marginBottom: 2,
    },
    actionDescription: {
        fontSize: 13,
        color: Colors.textSecondary,
    },
});
