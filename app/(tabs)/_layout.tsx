import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { View } from 'react-native';

import { Colors } from '@/constants/theme';

function TabIcon({ name, nameOutline, color, focused }: { name: string; nameOutline: string; color: string; focused: boolean }) {
  return (
    <Ionicons name={(focused ? name : nameOutline) as any} size={focused ? 26 : 22} color={color} />
  );
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopWidth: 0,
        },
        tabBarActiveTintColor: Colors.tabIconSelected,
        tabBarInactiveTintColor: Colors.tabIconDefault,
      }}>
      <Tabs.Screen name="(dashboard)" options={{ title: 'Dashboard', tabBarIcon: ({ color, focused }) => <TabIcon name="grid" nameOutline="grid-outline" color={color} focused={focused} /> }} />
      <Tabs.Screen name="library" options={{ title: 'Library', tabBarIcon: ({ color, focused }) => <TabIcon name="library" nameOutline="library-outline" color={color} focused={focused} /> }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ color, focused }) => <TabIcon name="settings" nameOutline="settings-outline" color={color} focused={focused} /> }} />
    </Tabs>
  );
}
