import { useCallback } from 'react'
import { useSessionStore } from '../stores/useSessionStore'
import * as SessionsQueries from '../db/queries/sessions.queries'
import { showToast } from '../lib/toast'

export function useSessions() {
  const startSession = useCallback(async (): Promise<boolean> => {
    try {
      const { id, started_at } = await SessionsQueries.startSession()
      useSessionStore.setState({
        activeSessionId: id,
        sessionStartedAt: started_at,
        phase: 'active',
      })
      return true
    } catch (e) {
      console.error('[Sessions] startSession failed:', e)
      showToast('Could not start session. Try again.', 'error')
      return false
    }
  }, [])

  // endSession does NOT reset the store — summary screen needs sessionExerciseIds
  // and sessionStartedAt until the user taps Done.
  const endSession = useCallback(async (): Promise<boolean> => {
    const activeSessionId = useSessionStore.getState().activeSessionId
    if (!activeSessionId) return false
    try {
      await SessionsQueries.endSession(activeSessionId)
      useSessionStore.setState({ phase: 'idle' })
      return true
    } catch (e) {
      console.error('[Sessions] endSession failed:', e)
      showToast('Could not end session. Try again.', 'error')
      return false
    }
  }, [])

  const discardSession = useCallback(async (): Promise<boolean> => {
    const activeSessionId = useSessionStore.getState().activeSessionId
    if (!activeSessionId) return false
    try {
      await SessionsQueries.discardSession(activeSessionId)
      useSessionStore.getState().reset()
      return true
    } catch (e) {
      console.error('[Sessions] discardSession failed:', e)
      showToast('Could not discard session. Try again.', 'error')
      return false
    }
  }, [])

  // Returns the set count, or `null` to signal an error (caller must distinguish
  // from a real 0 to avoid silently discarding a populated session).
  const getSetCount = useCallback(async (): Promise<number | null> => {
    const activeSessionId = useSessionStore.getState().activeSessionId
    if (!activeSessionId) return null
    try {
      return await SessionsQueries.getSessionSetCount(activeSessionId)
    } catch (e) {
      console.error('[Sessions] getSetCount failed:', e)
      showToast('Could not check set count. Try again.', 'error')
      return null
    }
  }, [])

  return { startSession, endSession, discardSession, getSetCount }
}
