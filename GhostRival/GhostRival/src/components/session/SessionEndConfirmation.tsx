import { Modal, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native'
import {
  SURFACE_OVERLAY,
  INK_PRIMARY,
  INK_SECONDARY,
  PR_BURST,
  BORDER_SUBTLE,
} from '../../constants'

interface SessionEndConfirmationProps {
  visible: boolean
  setCount: number
  exerciseCount: number
  onConfirm: () => void
  onDiscard: () => void
  onCancel: () => void
}

export function SessionEndConfirmation({
  visible,
  setCount,
  exerciseCount,
  onConfirm,
  onDiscard,
  onCancel,
}: SessionEndConfirmationProps) {
  const hasSets = setCount > 0

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.modal} onPress={() => {}}>
          <Text style={styles.heading}>End this session?</Text>

          <Text style={styles.body}>
            {hasSets
              ? `${exerciseCount} ${exerciseCount === 1 ? 'exercise' : 'exercises'} · ${setCount} ${setCount === 1 ? 'set' : 'sets'} logged`
              : 'No sets logged yet.'}
          </Text>

          <TouchableOpacity
            style={styles.primaryCta}
            onPress={hasSets ? onConfirm : onDiscard}
            accessibilityRole="button"
            accessibilityLabel={hasSets ? 'End Workout' : 'End Anyway'}
            hitSlop={{ top: 0, bottom: 0, left: 0, right: 0 }}
          >
            <Text style={styles.primaryCtaText}>{hasSets ? 'End Workout' : 'End Anyway'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryCta}
            onPress={onCancel}
            accessibilityRole="button"
            accessibilityLabel="Keep Going"
          >
            <Text style={styles.secondaryCtaText}>Keep Going</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modal: {
    width: '100%',
    backgroundColor: SURFACE_OVERLAY,
    borderRadius: 16,
    padding: 24,
  },
  heading: {
    color: INK_PRIMARY,
    fontFamily: 'DMSans_700Bold',
    fontSize: 20,
    marginBottom: 8,
  },
  body: {
    color: INK_SECONDARY,
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    marginBottom: 24,
  },
  primaryCta: {
    height: 52,
    borderRadius: 999,
    backgroundColor: PR_BURST,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    minHeight: 44,
  },
  primaryCtaText: {
    color: INK_PRIMARY,
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
  },
  secondaryCta: {
    height: 52,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: BORDER_SUBTLE,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  secondaryCtaText: {
    color: INK_SECONDARY,
    fontFamily: 'DMSans_500Medium',
    fontSize: 16,
  },
})
