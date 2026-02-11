import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

import { Colors } from '@/constants/theme'

export default function CreateScreen() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [duration, setDuration] = useState('')
  const [daysPerWeek, setDaysPerWeek] = useState('')

  const handleNext = () => {
    if (!name || !duration || !daysPerWeek) return

    router.push({
      pathname: '/create/weeks',
      params: {
        name,
        duration: Number(duration),
        daysPerWeek: Number(daysPerWeek),
      },
    })
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create a Program</Text>

      <TextInput
        placeholder="Program name"
        placeholderTextColor={Colors.textTertiary}
        value={name}
        onChangeText={setName}
        style={styles.input}
      />

      <TextInput
        placeholder="Duration (weeks)"
        placeholderTextColor={Colors.textTertiary}
        value={duration}
        onChangeText={setDuration}
        keyboardType="number-pad"
        style={styles.input}
      />

      <TextInput
        placeholder="Days per week"
        placeholderTextColor={Colors.textTertiary}
        value={daysPerWeek}
        onChangeText={setDaysPerWeek}
        keyboardType="number-pad"
        style={styles.input}
      />

      <Pressable style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>Next</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 24,
    marginTop: 20,
    color: Colors.textPrimary,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: Colors.surface,
    color: Colors.textPrimary,
  },
  button: {
    backgroundColor: Colors.accent,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
})
