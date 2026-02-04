import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';

export default function Weeks() {
  const { name, duration } = useLocalSearchParams<{
    name?: string;
    duration?: string;
  }>();

  const weeks = Array.from(
    { length: Number(duration ?? 0) },
    (_, i) => i + 1
  );

  const [activeWeek, setActiveWeek] = useState(1);

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.title}>{name}</Text>
      <Text style={styles.subtitle}>Build your program</Text>

      {/* Week Tabs */}
      <View style={styles.tabsWrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
      >
        {weeks.map((week) => {
          const isActive = week === activeWeek;

          return (
            <Pressable
              key={week}
              onPress={() => setActiveWeek(week)}
              style={[
                styles.weekTab,
                isActive && styles.weekTabActive,
              ]}
            >
              <Text
                style={[
                  styles.weekTabText,
                  isActive && styles.weekTabTextActive,
                ]}
              >
                Week {week}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      </View>


      {/* Week Content */}
      <View style={styles.weekContent}>
        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(
          (day) => (
            <View key={day} style={styles.dayCard}>
              <Text style={styles.dayText}>{day}</Text>
            </View>
          )
        )}
      </View>
    </View>
  );


}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },

  title: {
    fontSize: 26,
    fontWeight: '600',
    marginBottom: 4,
    marginTop: 20,
  },

  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 6,
  },

  tabsContainer: {
    marginTop: 10,
    paddingVertical: 0,
    paddingHorizontal: 0,
    gap: 8,
  },

  weekTab: {
  height: 32,
  paddingHorizontal: 14,
  borderRadius: 16,
  backgroundColor: '#eee',
  alignItems: 'center',
  justifyContent: 'center',
},

  weekTabActive: {
    backgroundColor: '#000',
  },

  weekTabText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },

  weekTabTextActive: {
    color: '#fff',
  },

  weekContent: {
    marginTop: 20,
  },

  weekTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },

  dayCard: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#f2f2f2',
    marginBottom: 10,
  },

  dayText: {
    fontSize: 16,
    fontWeight: '500',
  },

  tabsWrapper: {
  height: 50,
  justifyContent: 'center',
},
});