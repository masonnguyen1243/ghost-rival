import { useState, useEffect } from 'react'
import { View, Text, Platform, Linking } from 'react-native'
import { Stack, router } from 'expo-router'
import { addNotificationResponseReceivedListener } from 'expo-notifications'
import { setupNotificationChannel } from '../lib/bubbleNotification'
import { getOrCreateLocalUserId } from '../lib/localUser'
import { sql } from 'drizzle-orm'
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
import { DraftResumeModal } from '../components/common/DraftResumeModal'
import * as SessionsQueries from '../db/queries/sessions.queries'
import { useSessionStore } from '../stores/useSessionStore'
import { showToast } from '../lib/toast'

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
  const [draftSession, setDraftSession] = useState<{ id: string; started_at: number } | null | 'checking'>('checking')

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

      // AC-0: generate/retrieve local user identity and backfill existing rows.
      // Each table is independently guarded — a failure on one does not abort the others (AC-0).
      getOrCreateLocalUserId().then((localUserId) => {
        const backfills = [
          sql`UPDATE exercises SET user_id = ${localUserId} WHERE user_id IS NULL`,
          sql`UPDATE sessions SET user_id = ${localUserId} WHERE user_id IS NULL`,
          sql`UPDATE ghosts SET user_id = ${localUserId} WHERE user_id IS NULL`,
          sql`UPDATE hall_of_fame SET user_id = ${localUserId} WHERE user_id IS NULL`,
        ]
        for (const stmt of backfills) {
          try {
            db.run(stmt)
          } catch (e) {
            console.error('[localUser] backfill error', e)
          }
        }
      }).catch((e) => {
        console.error('[localUser] init error', e)
      })

      SessionsQueries.getDraftSession()
        .then(setDraftSession)
        .catch(() => setDraftSession(null))

      // Android notification channel + tap handler for session fallback notifications
      if (Platform.OS === 'android') {
        let sub: ReturnType<typeof addNotificationResponseReceivedListener> | null = null
        setupNotificationChannel().catch(() => {})
        try {
          sub = addNotificationResponseReceivedListener((response) => {
            const data = response.notification.request.content.data
            if (data?.screen === 'session') {
              router.push('/session/active')
            }
          })
        } catch {}
        return () => { sub?.remove() }
      }

      // iOS deep-link handler for Live Activity tap (AC4)
      if (Platform.OS === 'ios') {
        const sub = Linking.addEventListener('url', (event) => {
          if (event.url === 'ghostrival://session') {
            router.replace('/session/active')
          }
        })
        // Handle cold-start URL (app was not running when Live Activity was tapped)
        Linking.getInitialURL().then((url) => {
          if (url === 'ghostrival://session') {
            router.replace('/session/active')
          }
        }).catch(() => {})
        return () => sub.remove()
      }
    }
  }, [fontsLoaded, migrationsSuccess])

  if (startupError) throw startupError

  if (!fontsLoaded || !migrationsSuccess || draftSession === 'checking') {
    return null
  }

  const handleDraftResume = async () => {
    if (!draftSession || draftSession === 'checking') return
    try {
      const exerciseIds = await SessionsQueries.getExerciseIdsForSession(draftSession.id)
      useSessionStore.getState().reset()
      useSessionStore.setState({
        activeSessionId: draftSession.id,
        sessionStartedAt: draftSession.started_at,
        phase: 'active',
        sessionExerciseIds: exerciseIds,
      })
      setDraftSession(null)
      router.push('/session/active')
    } catch {
      showToast('Could not resume session. Try again.', 'error')
    }
  }

  const handleDraftStartFresh = async () => {
    if (!draftSession || draftSession === 'checking') return
    const id = draftSession.id
    try {
      await SessionsQueries.discardSession(id)
      setDraftSession(null)
    } catch {
      showToast('Could not discard session. Try again.', 'error')
    }
  }

  const handleDraftSaveAsComplete = async () => {
    if (!draftSession || draftSession === 'checking') return
    const id = draftSession.id
    try {
      await SessionsQueries.saveSessionAsComplete(id)
      setDraftSession(null)
    } catch {
      showToast('Could not save session. Try again.', 'error')
    }
  }

  return (
    <>
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
      {draftSession && draftSession !== 'checking' && (
        <DraftResumeModal
          draft={draftSession}
          onResume={handleDraftResume}
          onStartFresh={handleDraftStartFresh}
          onSaveAsComplete={handleDraftSaveAsComplete}
        />
      )}
    </>
  )
}
