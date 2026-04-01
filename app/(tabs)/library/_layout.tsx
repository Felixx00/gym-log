import { Stack } from 'expo-router';

export default function LibraryLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="create" />
      <Stack.Screen name="weeks" />
      <Stack.Screen name="edit" />
      <Stack.Screen name="program" />
      <Stack.Screen name="day" />
    </Stack>
  );
}
