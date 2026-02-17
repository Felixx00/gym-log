import { Stack } from 'expo-router';
import { enableFreeze } from 'react-native-screens';

enableFreeze(true);

export default function DashboardLayout() {
    return (
        <Stack screenOptions={{
            headerShown: false,
            animation: 'fade',
            animationDuration: 200,
        }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="program" />
            <Stack.Screen name="day" />
            <Stack.Screen name="edit" />
        </Stack>
    );
}
