import { Ionicons } from '@expo/vector-icons'
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
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="barbell" size={48} color={Colors.accent} />
          <Text style={styles.title}>Build a Program</Text>
          <Text style={styles.subtitle}>Design your workout plan</Text>
          <View style={styles.separator} />
        </View>

        <TextInput
          placeholder="Program name"
          placeholderTextColor={Colors.textTertiary}
          value={name}
          onChangeText={setName}
          style={styles.input}
        />

        <View style={styles.row}>
          <TextInput
            placeholder="Weeks"
            placeholderTextColor={Colors.textTertiary}
            value={duration}
            onChangeText={setDuration}
            keyboardType="number-pad"
            style={[styles.input, styles.inputHalf]}
          />

          <TextInput
            placeholder="Days/Week"
            placeholderTextColor={Colors.textTertiary}
            value={daysPerWeek}
            onChangeText={setDaysPerWeek}
            keyboardType="number-pad"
            style={[styles.input, styles.inputHalf]}
          />
        </View>

        <Pressable style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>Next</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  separator: {
    width: '40%',
    maxWidth: 180,
    height: 2,
    backgroundColor: Colors.accent,
    marginTop: 20,
    opacity: 0.6,
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  inputHalf: {
    flex: 1,
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
