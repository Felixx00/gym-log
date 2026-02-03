import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function DaysScreen() {
  const { name, duration } = useLocalSearchParams<{
    name: string
    duration: string
  }>()

  const router = useRouter()
  const days = Array.from({ length: Number(duration) }, (_, i) => i + 1)

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{name}</Text>
      <Text style={styles.subtitle}>Build your program</Text>

    </View>
  )
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
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  weekCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f2f2f2',
    marginBottom: 12,
  },
  weekText: {
    fontSize: 18,
    fontWeight: '500',
  },
})
