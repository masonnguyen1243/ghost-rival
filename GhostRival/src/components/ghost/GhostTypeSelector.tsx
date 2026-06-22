import { View, Text, Modal, TouchableOpacity, StyleSheet, Pressable } from 'react-native'
import {
  SURFACE_OVERLAY,
  SURFACE_BASE,
  INK_PRIMARY,
  INK_SECONDARY,
  INK_DISABLED,
  GHOST_ACCENT,
  GHOST_DIM,
  BORDER_SUBTLE,
} from '../../constants'
import type { GhostType } from '../../types'
import type { DisplayGhost } from '../../db/mappers/ghost.mapper'
import { setActiveGhostType } from '../../db/queries/ghost.queries'

const GHOST_TYPE_ORDER: GhostType[] = ['last_session', 'last_week', 'last_month', 'all_time_pr']

const LABEL_MAP: Record<GhostType, string> = {
  last_session: 'Last Session',
  last_week: 'Last Week',
  last_month: 'Last Month',
  all_time_pr: 'All-Time PR',
}

interface GhostTypeSelectorProps {
  exerciseId: string
  currentType: GhostType
  allGhosts: Array<{ type: GhostType; ghost: DisplayGhost | null }>
  onSelect: (type: GhostType) => void
  onClose: () => void
}

export function GhostTypeSelector({
  exerciseId,
  currentType,
  allGhosts,
  onSelect,
  onClose,
}: GhostTypeSelectorProps) {
  const handleSelect = async (type: GhostType) => {
    await setActiveGhostType(exerciseId, type)
    onSelect(type)
    onClose()
  }

  const ghostByType = Object.fromEntries(allGhosts.map((g) => [g.type, g.ghost])) as Record<GhostType, DisplayGhost | null>

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <Text style={styles.title}>Choose Your Ghost</Text>
        {GHOST_TYPE_ORDER.map((type) => {
          const ghost = ghostByType[type] ?? null
          const isSelected = type === currentType
          const hasData = ghost !== null

          return (
            <TouchableOpacity
              key={type}
              style={styles.option}
              onPress={() => handleSelect(type)}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={`${LABEL_MAP[type]}${ghost ? `, ${ghost.narrativeCopy}, ${ghost.valueDisplay}` : ', No session in this range'}`}
            >
              <View style={styles.optionLeft}>
                <Text style={[styles.optionLabel, !hasData && styles.optionLabelDisabled]}>
                  {LABEL_MAP[type]}
                </Text>
                {hasData ? (
                  <>
                    <Text style={styles.optionValue}>{ghost!.valueDisplay}</Text>
                    <Text style={styles.optionTimeRef}>{ghost!.narrativeCopy}</Text>
                  </>
                ) : (
                  <Text style={styles.noDataNote}>No session in this range</Text>
                )}
              </View>
              {isSelected && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          )
        })}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: SURFACE_OVERLAY,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    color: INK_PRIMARY,
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
    marginBottom: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_SUBTLE,
    minHeight: 44,
  },
  optionLeft: {
    flex: 1,
  },
  optionLabel: {
    color: INK_PRIMARY,
    fontFamily: 'DMSans_500Medium',
    fontSize: 15,
  },
  optionLabelDisabled: {
    color: INK_DISABLED,
  },
  optionValue: {
    color: GHOST_DIM,
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    marginTop: 2,
  },
  optionTimeRef: {
    color: GHOST_DIM,
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    marginTop: 1,
    opacity: 0.7,
  },
  noDataNote: {
    color: INK_DISABLED,
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    marginTop: 2,
  },
  checkmark: {
    color: GHOST_ACCENT,
    fontFamily: 'DMSans_700Bold',
    fontSize: 18,
    marginLeft: 12,
  },
})
