import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { Colors } from '@/constants/theme';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
        },
        tabBarActiveTintColor: Colors.tabIconSelected,
        tabBarInactiveTintColor: Colors.tabIconDefault,
      }}>
      <Tabs.Screen name="(dashboard)" options={{ title: 'Dashboard', tabBarIcon: ({ color }) => <Ionicons name="grid" size={24} color={color} /> }} />
      <Tabs.Screen name="library" options={{ title: 'Library', tabBarIcon: ({ color }) => <Ionicons name="library" size={24} color={color} /> }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ color }) => <Ionicons name="settings-outline" size={24} color={color} /> }} />
    </Tabs>
  );
}
