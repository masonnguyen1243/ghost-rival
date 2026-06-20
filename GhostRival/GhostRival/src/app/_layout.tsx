import { useState, useEffect } from 'react'
import { View, Text } from 'react-native'
import { Stack } from 'expo-router'
import type { ErrorBoundaryProps } from 'expo-router'
import { useFonts } from 'expo-font'
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
  DMSans_800ExtraBold,
} from '@expo-google-fonts/dm-sans'
import * as SplashScreen from 'expo-splash-screen'
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator'
import { db } from '../db/client'
import migrations from '../db/migrations/migrations'
import { SURFACE_BASE, FEEDBACK_ERROR, INK_SECONDARY } from '../constants'

SplashScreen.preventAutoHideAsync()

export function ErrorBoundary({ error }: ErrorBoundaryProps) {
  return (
    <View style={{ flex: 1, backgroundColor: SURFACE_BASE, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <Text style={{ color: FEEDBACK_ERROR, fontSize: 18, fontWeight: '600', marginBottom: 12 }}>
        Failed to start
      </Text>
      <Text style={{ color: INK_SECONDARY, fontSize: 14, textAlign: 'center' }}>
        {error.message}
      </Text>
    </View>
  )
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    DMSans_800ExtraBold,
  })

  const { success: migrationsSuccess, error: migrationsError } = useMigrations(db, migrations)
  const [startupError, setStartupError] = useState<Error | null>(null)

  useEffect(() => {
    const err = fontError ?? migrationsError
    if (err) {
      SplashScreen.hideAsync()
      setStartupError(err as Error)
    }
  }, [fontError, migrationsError])

  useEffect(() => {
    if (fontsLoaded && migrationsSuccess) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded, migrationsSuccess])

  if (startupError) throw startupError

  if (!fontsLoaded || !migrationsSuccess) {
    return null
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="session/active"
        options={{ headerShown: false, presentation: 'fullScreenModal', gestureEnabled: false }}
      />
      <Stack.Screen
        name="session/summary"
        options={{ headerShown: false, presentation: 'fullScreenModal', gestureEnabled: false }}
      />
      <Stack.Screen name="+not-found" />
    </Stack>
  )
}
