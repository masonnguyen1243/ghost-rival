import { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, AccessibilityInfo } from 'react-native'
import {
  SURFACE_RAISED,
  INK_PRIMARY,
  INK_SECONDARY,
  INK_DISABLED,
  GHOST_ACCENT,
  GHOST_DIM,
} from '../../constants'
import type { DisplayExercise } from '../../types'
import type { DisplayGhost } from '../../db/mappers/ghost.mapper'

interface GhostRowProps {
  exercise: DisplayExercise
  ghost: DisplayGhost | null
  isFallback?: boolean
  onPress: () => void
}

export function GhostRow({ exercise, ghost, isFallback = false, onPress }: GhostRowProps) {
  const [isHighContrast, setIsHighContrast] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ai = AccessibilityInfo as any
    // P7: add .catch to suppress unhandled rejection if the API exists but rejects
    ai.isHighContrastEnabled?.()?.then(setIsHighContrast).catch(() => {})
    const subscription = AccessibilityInfo.addEventListener(
      // @ts-expect-error highContrastChanged is a valid event on some RN versions
      'highContrastChanged',
      setIsHighContrast,
    )
    return () => subscription.remove()
  }, [])

  const ghostValueColor = isHighContrast ? GHOST_ACCENT : GHOST_DIM

  const accessibilityLabel = ghost
    ? `${exercise.name}. Ghost: ${ghost.narrativeCopy}. ${ghost.badgeLabel} ${ghost.valueDisplay}.`
    : `${exercise.name}. No ghost yet.`

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Text style={styles.exerciseName}>{exercise.name}</Text>

      {ghost !== null ? (
        <>
          <Text style={styles.narrativeCopy}>{ghost.narrativeCopy}</Text>
          <View style={styles.bottomRow}>
            <Text style={[styles.ghostValue, { color: ghostValueColor }]}>
              {ghost.valueDisplay}
            </Text>
            <Text style={styles.badge}>{ghost.badgeLabel}</Text>
          </View>
          {/* P4 (AC4): show fallback note when user's selected type had no data */}
          {isFallback && (
            <Text style={styles.fallbackNote}>
              Showing your most recent session instead.
            </Text>
          )}
        </>
      ) : (
        <Text style={styles.noGhostCopy}>
          No ghost yet — come back after your first session.
        </Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: SURFACE_RAISED,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    minHeight: 44,
  },
  exerciseName: {
    color: INK_PRIMARY,
    fontFamily: 'DMSans_700Bold',
    fontSize: 18,
    marginBottom: 2,
  },
  narrativeCopy: {
    color: INK_SECONDARY,
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    marginBottom: 6,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ghostValue: {
    fontFamily: 'DMSans_800ExtraBold',
    fontSize: 40,
  },
  badge: {
    color: GHOST_ACCENT,
    fontFamily: 'DMSans_500Medium',
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  noGhostCopy: {
    color: INK_SECONDARY,
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    marginTop: 4,
  },
  fallbackNote: {
    color: INK_DISABLED,
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    marginTop: 6,
  },
})
