import { useEffect, useState } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { router } from 'expo-router'
import 'react-native-reanimated'
import { getToken, getStoredUser } from '../utils/storage'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      try {
        const [token, user] = await Promise.all([getToken(), getStoredUser()])
        if (token && user) {
          router.replace('/(tabs)')
        }
      } finally {
        setReady(true)
        SplashScreen.hideAsync()
      }
    }
    checkAuth()
  }, [])

  if (!ready) return null

  return (
    <>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="home" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="light" />
    </>
  )
}
