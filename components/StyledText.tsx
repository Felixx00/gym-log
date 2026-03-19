import { Text as RNText, TextInput as RNTextInput, StyleSheet, type TextProps, type TextInputProps } from 'react-native';
import { forwardRef, useMemo } from 'react';

const weightToFamily: Record<string, string> = {
  '300': 'SpaceGrotesk_300Light',
  '400': 'SpaceGrotesk_400Regular',
  'normal': 'SpaceGrotesk_400Regular',
  '500': 'SpaceGrotesk_500Medium',
  '600': 'SpaceGrotesk_600SemiBold',
  '700': 'SpaceGrotesk_700Bold',
  'bold': 'SpaceGrotesk_700Bold',
  '800': 'SpaceGrotesk_700Bold',
  '900': 'SpaceGrotesk_700Bold',
};

function resolveFont(style: any) {
  const flat = StyleSheet.flatten(style);
  const weight = flat?.fontWeight;
  const fontFamily = weight && weightToFamily[String(weight)]
    ? weightToFamily[String(weight)]
    : 'SpaceGrotesk_400Regular';
  // Strip fontWeight — the weight is baked into the fontFamily file.
  // Keeping fontWeight causes Android to fail finding a bold variant of
  // the already-specific font file name and fall back to system font.
  const { fontWeight: _removed, ...rest } = flat || {};
  return { ...rest, fontFamily };
}

export function Text({ style, ...props }: TextProps) {
  const resolved = useMemo(() => resolveFont(style), [style]);
  return <RNText style={resolved} {...props} />;
}

export const TextInput = forwardRef<RNTextInput, TextInputProps>(({ style, ...props }, ref) => {
  const resolved = useMemo(() => resolveFont(style), [style]);
  return <RNTextInput ref={ref} style={resolved} {...props} />;
});
