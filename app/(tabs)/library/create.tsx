import Slider from '@react-native-community/slider'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'

import { Colors } from '@/constants/theme'

const WEEKS_MIN = 4
const WEEKS_MAX = 20
const WEEKS_DEFAULT = 12
const DAYS_MIN = 3
const DAYS_MAX = 12
const DAYS_DEFAULT = 5
const DAYS_RANGE = Array.from({ length: DAYS_MAX - DAYS_MIN + 1 }, (_, i) => DAYS_MIN + i)

export default function CreateScreen() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [duration, setDuration] = useState(WEEKS_DEFAULT)
  const [daysPerWeek, setDaysPerWeek] = useState(DAYS_DEFAULT)
  const [error, setError] = useState('')

  useFocusEffect(
    useCallback(() => {
      setName('')
      setDuration(WEEKS_DEFAULT)
      setDaysPerWeek(DAYS_DEFAULT)
      setError('')
    }, [])
  )

  const handleNext = () => {
    if (!name.trim()) { setError('Program name is required.'); return }
    setError('')

    router.push({
      pathname: '/library/weeks',
      params: { name, duration, daysPerWeek },
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

        {/* Program Name */}
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

        {/* Weeks Slider */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>WEEKS</Text>
            <Text style={styles.sliderValue}>{duration}</Text>
          </View>
          <Slider
            minimumValue={WEEKS_MIN}
            maximumValue={WEEKS_MAX}
            step={1}
            value={duration}
            onValueChange={(v) => setDuration(Math.round(v))}
            minimumTrackTintColor={Colors.accent}
            maximumTrackTintColor={Colors.surfaceElevated}
            thumbTintColor={Colors.textPrimary}
            style={styles.slider}
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabelText}>{WEEKS_MIN}</Text>
            <Text style={styles.sliderLabelText}>{WEEKS_MAX}</Text>
          </View>
        </View>

        {/* Days/Week Pills */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>DAYS / WEEK</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsContainer}
          >
            {DAYS_RANGE.map((n) => {
              const isActive = n === daysPerWeek
              return (
                <Pressable
                  key={n}
                  style={[styles.pill, isActive && styles.pillActive]}
                  onPress={() => setDaysPerWeek(n)}
                >
                  <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                    {n}
                  </Text>
                </Pressable>
              )
            })}
          </ScrollView>
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
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: Colors.surfaceElevated,
    color: Colors.textPrimary,
  },

  // Slider
  slider: {
    height: 40,
    marginHorizontal: -8,
  },
  sliderValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
    paddingHorizontal: 2,
  },
  sliderLabelText: {
    fontSize: 12,
    color: Colors.textTertiary,
  },

  // Pills
  pillsContainer: {
    gap: 8,
  },
  pill: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  pillText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  pillTextActive: {
    color: Colors.textPrimary,
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
