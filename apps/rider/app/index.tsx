import { useEffect, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { router } from 'expo-router'
import { getSocket } from '../utils/socket'

export default function LoginScreen() {
  const [userId, setUserId] = useState('')
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const socket = getSocket()
    socket.connect()

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))

    if (socket.connected) setConnected(true)

    return () => {
      socket.off('connect')
      socket.off('disconnect')
    }
  }, [])

  function handleEnter() {
    if (!userId.trim() || !connected) return
    const socket = getSocket()
    socket.emit('USER_ONLINE', { userId: userId.trim() })
    router.push({ pathname: '/home', params: { userId: userId.trim() } })
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>TruDrive</Text>
          <Text style={styles.subtitle}>Passageiro</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>ID do Passageiro</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite seu ID"
            placeholderTextColor="#555"
            value={userId}
            onChangeText={setUserId}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={styles.statusRow}>
            <View style={[styles.dot, { backgroundColor: connected ? '#22c55e' : '#ef4444' }]} />
            <Text style={styles.statusText}>{connected ? 'Conectado' : 'Sem conexão'}</Text>
          </View>

          <TouchableOpacity
            style={[styles.button, (!connected || !userId.trim()) && styles.buttonDisabled]}
            onPress={handleEnter}
            disabled={!connected || !userId.trim()}
          >
            <Text style={styles.buttonText}>Entrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f1e',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontSize: 42,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: '#4b7bec',
    marginTop: 4,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  form: {
    gap: 12,
  },
  label: {
    color: '#aaa',
    fontSize: 13,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1e3a5f',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    color: '#666',
    fontSize: 13,
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#0d1f3c',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
})
