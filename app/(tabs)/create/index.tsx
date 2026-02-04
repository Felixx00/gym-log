import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

export default function CreateScreen() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [duration, setDuration] = useState('')

  const handleNext = () => {
    if (!name || !duration) return

    router.push({
      pathname: '/create/weeks',
      params: {
        name,
        duration: Number(duration),
      },
    })
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create a Program</Text>

      <TextInput
        placeholder="Program name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />

      <TextInput
        placeholder="Duration (weeks)"
        value={duration}
        onChangeText={setDuration}
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
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 24,
    marginTop: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
