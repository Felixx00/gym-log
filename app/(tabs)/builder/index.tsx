import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

import { Colors } from '@/constants/theme'

export default function CreateScreen() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [duration, setDuration] = useState('')
  const [daysPerWeek, setDaysPerWeek] = useState('')
  const [error, setError] = useState('')

  useFocusEffect(
    useCallback(() => {
      setName('')
      setDuration('')
      setDaysPerWeek('')
      setError('')
    }, [])
  )

  const handleNext = () => {
    if (!name.trim()) { setError('Program name is required.'); return }
    if (!duration) { setError('Number of weeks is required.'); return }
    if (!daysPerWeek) { setError('Days per week is required.'); return }
    setError('')

    router.push({
      pathname: '/builder/weeks',
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
        {/* Header with watermark */}
        <View style={styles.header}>
          <Ionicons
            name="construct-outline"
            size={240}
            color={Colors.surfaceElevated}
            style={styles.watermark}
          />
          <View style={styles.titleRow}>
            <Text style={styles.title}>Build a </Text>
            <Text style={[styles.title, styles.titleAccent]}>Program</Text>
          </View>
          <Text style={styles.subtitle}>
            Design your structured workout{'\n'}plan and track your evolution.
          </Text>
          <View style={styles.separator} />
        </View>

        {/* Inputs */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>PROGRAM NAME</Text>
          <TextInput
            placeholder="Push Pull Legs System"
            placeholderTextColor={Colors.textTertiary}
            value={name}
            onChangeText={setName}
            style={styles.input}
          />
        </View>

        <View style={styles.row}>
          <View style={styles.inputGroupHalf}>
            <Text style={styles.label}>WEEKS</Text>
            <TextInput
              placeholder="12"
              placeholderTextColor={Colors.textTertiary}
              value={duration}
              onChangeText={(t) => {
                const digits = t.replace(/[^0-9]/g, '')
                const n = parseInt(digits, 10)
                if (digits === '') { setDuration(''); setError(''); return }
                if (n > 24) { setError('Maximum 24 weeks allowed.'); return }
                setDuration(digits)
                setError('')
              }}
              keyboardType="number-pad"
              maxLength={2}
              style={styles.input}
            />
          </View>

          <View style={styles.inputGroupHalf}>
            <Text style={styles.label}>DAYS / WEEK</Text>
            <TextInput
              placeholder="5"
              placeholderTextColor={Colors.textTertiary}
              value={daysPerWeek}
              onChangeText={(t) => {
                const digits = t.replace(/[^0-9]/g, '')
                const n = parseInt(digits, 10)
                if (digits === '') { setDaysPerWeek(''); setError(''); return }
                if (n > 20) { setError('Maximum 20 days per week allowed.'); return }
                setDaysPerWeek(digits)
                setError('')
              }}
              keyboardType="number-pad"
              maxLength={2}
              style={styles.input}
            />
          </View>
        </View>

        {/* Error */}
        {error !== '' && <Text style={styles.errorText}>{error}</Text>}

        {/* Button */}
        <Pressable onPress={handleNext} style={styles.button}>
          <Text style={styles.buttonText}>Next</Text>
          <Ionicons name="arrow-forward" size={18} color={Colors.textPrimary} />
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 24,
    justifyContent: 'center',
  },
  content: {
    width: '100%',
  },

  // Header
  header: {
    marginBottom: 48,
  },
  watermark: {
    position: 'absolute',
    top: -60,
    left: -30,
    opacity: 0.3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  titleAccent: {
    color: Colors.accent,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  separator: {
    width: 40,
    height: 3,
    backgroundColor: Colors.accentHover,
    marginTop: 20,
    borderRadius: 2,
  },

  // Inputs
  inputGroup: {
    marginBottom: 20,
  },
  inputGroupHalf: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: Colors.surfaceElevated,
    color: Colors.textPrimary,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },

  // Error
  errorText: {
    fontSize: 13,
    color: Colors.accent,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: -8,
  },

  // Button
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 22,
    paddingHorizontal: 18,
    borderRadius: 14,
    gap: 8,
    backgroundColor: Colors.accent,
    marginTop: 16,
  },
  buttonText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
})
