import { useState, useRef } from 'react'
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import {
  SURFACE_BASE,
  SURFACE_RAISED,
  INK_PRIMARY,
  INK_SECONDARY,
  GHOST_ACCENT,
  FEEDBACK_ERROR,
  DRAFT_STALE_THRESHOLD_S,
} from '../../constants'

interface DraftResumeModalProps {
  draft: { id: string; started_at: number }
  onResume: () => Promise<void>
  onStartFresh: () => Promise<void>
  onSaveAsComplete: () => Promise<void>
}

function formatSessionAge(started_at: number): string {
  const elapsedSeconds = Math.max(0, Math.floor(Date.now() / 1000) - started_at)
  if (elapsedSeconds < 60) return 'just now'
  const hours = Math.floor(elapsedSeconds / 3600)
  const minutes = Math.floor((elapsedSeconds % 3600) / 60)
  if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''} ago`
  }
  return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
}

export function DraftResumeModal({ draft, onResume, onStartFresh, onSaveAsComplete }: DraftResumeModalProps) {
  const [showDiscard, setShowDiscard] = useState(false)
  const [loading, setLoading] = useState(false)
  // Frozen at mount — prevents CTA layout from flipping if modal stays open across the 2h threshold
  const isStale = useRef(Math.floor(Date.now() / 1000) - draft.started_at >= DRAFT_STALE_THRESHOLD_S).current
  const sessionAge = formatSessionAge(draft.started_at)

  const handleAction = async (fn: () => Promise<void>) => {
    if (loading) return
    setLoading(true)
    try {
      await fn()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={true}
      accessibilityViewIsModal={true}
      onRequestClose={() => { /* intentional no-op — user must make an explicit choice */ }}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.heading}>Resume your session?</Text>
          <Text style={styles.subtext}>{sessionAge}</Text>

          {showDiscard ? (
            <View style={styles.buttonGroup}>
              <Text style={styles.confirmText}>Discard this session?</Text>
              <TouchableOpacity
                style={styles.touchTarget}
                onPress={() => handleAction(onStartFresh)}
                disabled={loading}
                accessibilityRole="button"
              >
                <Text style={styles.discardLabel}>Discard</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.touchTarget}
                onPress={() => setShowDiscard(false)}
                disabled={loading}
                accessibilityRole="button"
              >
                <Text style={styles.secondaryLabel}>Keep Draft</Text>
              </TouchableOpacity>
            </View>
          ) : isStale ? (
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.touchTarget, styles.pillPrimary, styles.pillFilled]}
                onPress={() => handleAction(onSaveAsComplete)}
                disabled={loading}
                accessibilityRole="button"
              >
                <Text style={styles.pillFilledLabel}>Save as Complete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.touchTarget}
                onPress={() => handleAction(onResume)}
                disabled={loading}
                accessibilityRole="button"
              >
                <Text style={styles.secondaryLabel}>Resume</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.touchTarget}
                onPress={() => setShowDiscard(true)}
                disabled={loading}
                accessibilityRole="button"
              >
                <Text style={styles.secondaryLabel}>Start Fresh</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.touchTarget, styles.pillPrimary, styles.pillOutlined]}
                onPress={() => handleAction(onResume)}
                disabled={loading}
                accessibilityRole="button"
              >
                <Text style={styles.pillOutlinedLabel}>Resume</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.touchTarget}
                onPress={() => setShowDiscard(true)}
                disabled={loading}
                accessibilityRole="button"
              >
                <Text style={styles.secondaryLabel}>Start Fresh</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: `rgba(13,13,15,0.90)`,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: SURFACE_RAISED,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    gap: 16,
  },
  heading: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 20,
    color: INK_PRIMARY,
  },
  subtext: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: INK_SECONDARY,
  },
  buttonGroup: {
    gap: 12,
    marginTop: 8,
  },
  touchTarget: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillPrimary: {
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  pillFilled: {
    backgroundColor: GHOST_ACCENT,
  },
  pillFilledLabel: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
    color: '#000000',
  },
  pillOutlined: {
    borderWidth: 1.5,
    borderColor: GHOST_ACCENT,
    backgroundColor: 'transparent',
  },
  pillOutlinedLabel: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
    color: INK_PRIMARY,
  },
  secondaryLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: INK_SECONDARY,
  },
  confirmText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: INK_PRIMARY,
    textAlign: 'center',
  },
  discardLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: FEEDBACK_ERROR,
  },
})
