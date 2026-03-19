import { useCallback, useRef, useState } from 'react';
import {
    Keyboard,
    Pressable,
    StyleSheet,
    View,
} from 'react-native';
import { Text, TextInput } from '@/components/StyledText';
import type { StyleProp, TextStyle } from 'react-native';

import { Colors } from '@/constants/theme';
import { searchExerciseLibrary } from '@/services/database';

type ExerciseAutocompleteProps = {
    value: string;
    onChangeText: (text: string) => void;
    style?: StyleProp<TextStyle>;
};

export function ExerciseAutocomplete({
    value,
    onChangeText,
    style,
}: ExerciseAutocompleteProps) {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isFocused, setIsFocused] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const justSelectedRef = useRef(false);

    const fetchSuggestions = useCallback((query: string) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (!query.trim()) {
            setSuggestions([]);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            try {
                const results = await searchExerciseLibrary(query);
                // Don't show if the only result is an exact match
                if (results.length === 1 && results[0].toLowerCase() === query.toLowerCase()) {
                    setSuggestions([]);
                } else {
                    setSuggestions(results);
                }
            } catch {
                setSuggestions([]);
            }
        }, 250);
    }, []);

    const handleChangeText = (text: string) => {
        justSelectedRef.current = false;
        onChangeText(text);
        fetchSuggestions(text);
    };

    const handleSelect = (name: string) => {
        justSelectedRef.current = true;
        onChangeText(name);
        setSuggestions([]);
        Keyboard.dismiss();
    };

    const handleFocus = () => {
        setIsFocused(true);
        if (value.trim() && !justSelectedRef.current) {
            fetchSuggestions(value);
        }
    };

    const handleBlur = () => {
        // Delay clearing so tap on suggestion can register first
        setTimeout(() => {
            setIsFocused(false);
            setSuggestions([]);
        }, 150);
    };

    const showDropdown = isFocused && suggestions.length > 0;

    return (
        <View style={styles.container}>
            <TextInput
                placeholder="Exercise Name"
                placeholderTextColor={Colors.textTertiary}
                value={value}
                onChangeText={handleChangeText}
                onFocus={handleFocus}
                onBlur={handleBlur}
                style={[styles.input, style]}
            />
            {showDropdown && (
                <View style={styles.dropdown}>
                    {suggestions.map((item) => (
                        <Pressable
                            key={item}
                            style={styles.suggestionRow}
                            onPress={() => handleSelect(item)}
                        >
                            <Text style={styles.suggestionText}>{item}</Text>
                        </Pressable>
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        zIndex: 10,
    },
    input: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.textPrimary,
        padding: 0,
    },
    dropdown: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: Colors.surfaceElevated,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.border,
        maxHeight: 200,
        marginTop: 4,
        zIndex: 999,
        elevation: 8,
    },
    suggestionRow: {
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.border,
    },
    suggestionText: {
        fontSize: 14,
        color: Colors.textPrimary,
    },
});
