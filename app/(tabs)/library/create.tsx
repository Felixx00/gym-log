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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleColumn}>
            <Text style={styles.titleLight}>Build a</Text>
            <Text style={styles.titleAccent}>Program</Text>
          </View>
          <Text style={styles.subtitle}>
            Design your structured workout plan and track your evolution.
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
            maximumTrackTintColor={Colors.border}
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
      </ScrollView>

      {/* Button pinned to bottom */}
      <Pressable onPress={handleNext} style={styles.button}>
        <Text style={styles.buttonText}>Next</Text>
        <Ionicons name="arrow-forward" size={20} color={Colors.background} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: 48,
    gap: 24,
  },

  // Header
  header: {
    gap: 12,
  },
  titleColumn: {
    gap: 2,
  },
  titleLight: {
    fontSize: 40,
    fontWeight: '300',
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  titleAccent: {
    fontSize: 48,
    fontWeight: '900',
    color: Colors.accent,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  separator: {
    width: 40,
    height: 3,
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },

  // Inputs
  inputGroup: {
    gap: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 2,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  input: {
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 20,
    fontSize: 15,
    backgroundColor: Colors.surface,
    color: Colors.textPrimary,
  },

  // Slider
  slider: {
    height: 36,
    marginHorizontal: -8,
  },
  sliderValue: {
    fontSize: 36,
    fontWeight: '300',
    color: Colors.textPrimary,
    letterSpacing: -1,
    lineHeight: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  sliderLabelText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },

  // Pills
  pillsContainer: {
    gap: 10,
  },
  pill: {
    width: 48,
    height: 48,
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
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  pillTextActive: {
    fontWeight: '900',
    color: Colors.background,
  },

  // Error
  errorText: {
    fontSize: 13,
    color: Colors.error,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Button
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    borderRadius: 16,
    gap: 10,
    backgroundColor: Colors.accent,
    marginTop: 16,
  },
  buttonText: {
    color: Colors.background,
    fontSize: 18,
    fontWeight: '700',
  },
})
