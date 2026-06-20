import { useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { SURFACE_OVERLAY, INK_SECONDARY, GHOST_ACCENT } from '../../constants'

interface UndoToastProps {
  visible: boolean
  onUndo: () => void
  onDismiss: () => void
  screenReaderEnabled?: boolean
}

export function UndoToast({ visible, onUndo, onDismiss, screenReaderEnabled = false }: UndoToastProps) {
  useEffect(() => {
    if (!visible) return
    const delay = screenReaderEnabled ? 8000 : 4000
    const t = setTimeout(onDismiss, delay)
    return () => clearTimeout(t)
  }, [visible, screenReaderEnabled, onDismiss])

  if (!visible) return null

  return (
    <View
      style={styles.container}
      accessibilityLiveRegion="polite"
      accessibilityLabel="Set deleted"
    >
      <Text style={styles.message}>Set deleted</Text>
      <TouchableOpacity
        onPress={onUndo}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel="Undo"
      >
        <Text style={styles.undoLink}>Undo</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: SURFACE_OVERLAY,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  message: {
    color: INK_SECONDARY,
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
  },
  undoLink: {
    color: GHOST_ACCENT,
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
  },
})
