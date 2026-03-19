import { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Pressable,
    StyleSheet,
    View,
} from 'react-native';
import { Text } from '@/components/StyledText';

import { Colors } from '@/constants/theme';

export type OverlayButton = {
    label: string;
    onPress: () => void;
    variant?: 'cancel' | 'confirm';
};

type OverlayModalProps = {
    visible: boolean;
    title: string;
    message: string;
    buttons: OverlayButton[];
    onClose: () => void;
};

export function OverlayModal({ visible, title, message, buttons, onClose }: OverlayModalProps) {
    const [showOverlay, setShowOverlay] = useState(false);
    const [frozenContent, setFrozenContent] = useState({ title, message, buttons });
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            setFrozenContent({ title, message, buttons });
            setShowOverlay(true);
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }).start(() => setShowOverlay(false));
        }
    }, [visible]);

    if (!showOverlay) return null;

    const isSingleButton = frozenContent.buttons.length === 1;

    return (
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
            <Pressable style={styles.backdrop} onPress={onClose} />
            <View style={styles.content}>
                <Text style={styles.title}>{frozenContent.title}</Text>
                <Text style={styles.message}>{frozenContent.message}</Text>
                <View style={isSingleButton ? undefined : styles.buttonRow}>
                    {frozenContent.buttons.map((btn) => (
                        <Pressable
                            key={btn.label}
                            style={
                                isSingleButton
                                    ? styles.singleButton
                                    : btn.variant === 'cancel'
                                        ? styles.cancelButton
                                        : styles.confirmButton
                            }
                            onPress={btn.onPress}
                        >
                            <Text style={btn.variant === 'cancel' ? styles.cancelText : styles.confirmText}>
                                {btn.label}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        zIndex: 100,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    content: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 320,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginBottom: 12,
    },
    message: {
        fontSize: 14,
        color: Colors.textSecondary,
        lineHeight: 20,
        marginBottom: 24,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
    },
    cancelText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    confirmButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: Colors.accent,
        alignItems: 'center',
    },
    confirmText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    singleButton: {
        width: '100%',
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: Colors.accent,
        alignItems: 'center',
    },
});
