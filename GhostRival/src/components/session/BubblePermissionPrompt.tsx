import { View, Text, TouchableOpacity, Modal, StyleSheet, Platform } from 'react-native'
import { SURFACE_OVERLAY, INK_PRIMARY, INK_SECONDARY, GHOST_ACCENT } from '../../constants'

interface BubblePermissionPromptProps {
  visible: boolean
  onEnable: () => void
  onSkip: () => void
}

export function BubblePermissionPrompt({ visible, onEnable, onSkip }: BubblePermissionPromptProps) {
  if (Platform.OS !== 'android') return null

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onSkip}
      accessibilityViewIsModal
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.heading}>Stay in your flow</Text>
          <Text style={styles.body}>
            The Ghost Bubble lets you log sets without leaving Instagram, Spotify, or wherever you
            are. Tap 'Enable' to go to settings.
          </Text>

          <TouchableOpacity
            style={styles.enableButton}
            onPress={onEnable}
            accessibilityRole="button"
            accessibilityLabel="Enable Ghost Bubble overlay permission"
          >
            <Text style={styles.enableButtonText}>Enable (Recommended)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={onSkip}
            accessibilityRole="button"
            accessibilityLabel="Skip for now, use notification fallback"
          >
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    backgroundColor: SURFACE_OVERLAY,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  heading: {
    color: INK_PRIMARY,
    fontFamily: 'DMSans_700Bold',
    fontSize: 20,
    marginBottom: 12,
  },
  body: {
    color: INK_SECONDARY,
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  enableButton: {
    height: 48,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: GHOST_ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    minHeight: 44,
  },
  enableButtonText: {
    color: GHOST_ACCENT,
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
  },
  skipButton: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  skipButtonText: {
    color: INK_SECONDARY,
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
  },
})
