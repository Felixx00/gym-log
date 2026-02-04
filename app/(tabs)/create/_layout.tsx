import { Stack } from 'expo-router';

export default function CreateLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="weeks" options={{ headerShown: false }} />
      <Stack.Screen name="[week]" options={{ title: 'Week' }} />
    </Stack>
  );
}