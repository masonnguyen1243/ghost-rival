import { useMemo, useState } from 'react'
import {
  Modal,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native'
import {
  SURFACE_OVERLAY,
  INK_PRIMARY,
  INK_SECONDARY,
  INK_DISABLED,
  GHOST_ACCENT,
  BORDER_SUBTLE,
} from '../../constants'
import { useExercises } from '../../hooks/useExercises'
import type { DisplayExercise } from '../../types'

interface ExercisePickerProps {
  visible: boolean
  onDismiss: () => void
  onSelect: (exercise: DisplayExercise) => void
  onCreateNew: () => void
  excludeIds?: string[]
}

// Normalize for case + diacritic-insensitive matching across locales.
function normalize(s: string): string {
  return s.normalize('NFC').toLocaleLowerCase()
}

export function ExercisePicker({
  visible,
  onDismiss,
  onSelect,
  onCreateNew,
  excludeIds = [],
}: ExercisePickerProps) {
  const [query, setQuery] = useState('')
  const [selectingId, setSelectingId] = useState<string | null>(null)
  const { exercises } = useExercises()

  const availableExercises = useMemo(
    () => exercises.filter((ex) => !excludeIds.includes(ex.id)),
    [exercises, excludeIds],
  )

  const filtered = useMemo(() => {
    if (!query.trim()) return availableExercises
    const q = normalize(query)
    return availableExercises.filter((ex) => normalize(ex.name).includes(q))
  }, [availableExercises, query])

  const handleDismiss = () => {
    setQuery('')
    setSelectingId(null)
    onDismiss()
  }

  const handleSelect = (exercise: DisplayExercise) => {
    if (selectingId) return // ignore subsequent taps
    setSelectingId(exercise.id)
    setQuery('')
    onSelect(exercise)
  }

  const handleCreateNew = () => {
    if (selectingId) return
    setQuery('')
    onCreateNew()
  }

  const hasNoExercisesAtAll = availableExercises.length === 0
  const hasNoMatches = !hasNoExercisesAtAll && filtered.length === 0

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleDismiss}
    >
      <Pressable style={styles.backdrop} onPress={handleDismiss}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />

          <Text style={styles.title}>Add Exercise</Text>

          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises..."
            placeholderTextColor={INK_DISABLED}
            value={query}
            onChangeText={setQuery}
            autoFocus={false}
            returnKeyType="search"
            accessibilityLabel="Search exercises"
          />

          {hasNoExercisesAtAll ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Create a new exercise to get started</Text>
              <TouchableOpacity
                style={styles.createPill}
                onPress={handleCreateNew}
                accessibilityRole="button"
                accessibilityLabel="New Exercise"
              >
                <Text style={styles.createPillText}>New Exercise</Text>
              </TouchableOpacity>
            </View>
          ) : hasNoMatches ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No exercises match "{query.trim()}".</Text>
              <TouchableOpacity
                style={styles.createPill}
                onPress={handleCreateNew}
                accessibilityRole="button"
                accessibilityLabel="Create new exercise"
              >
                <Text style={styles.createPillText}>+ Create new exercise</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              style={styles.list}
              renderItem={({ item }) => {
                const isDisabled = selectingId !== null && selectingId !== item.id
                return (
                  <TouchableOpacity
                    style={[styles.exerciseRow, isDisabled && styles.exerciseRowDisabled]}
                    onPress={() => handleSelect(item)}
                    disabled={isDisabled || selectingId === item.id}
                    accessibilityRole="button"
                    accessibilityLabel={item.name}
                    accessibilityState={{ disabled: isDisabled }}
                  >
                    <Text style={styles.exerciseName}>{item.name}</Text>
                    <Text style={styles.typeTag}>{item.type.toUpperCase()}</Text>
                  </TouchableOpacity>
                )
              }}
              ListFooterComponent={
                <TouchableOpacity
                  style={styles.createRow}
                  onPress={handleCreateNew}
                  disabled={selectingId !== null}
                  accessibilityRole="button"
                  accessibilityLabel="Create new exercise"
                >
                  <Text style={styles.createRowText}>+ Create new exercise</Text>
                </TouchableOpacity>
              }
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: SURFACE_OVERLAY,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: BORDER_SUBTLE,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    color: INK_PRIMARY,
    fontFamily: 'DMSans_700Bold',
    fontSize: 20,
    marginBottom: 16,
  },
  searchInput: {
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    paddingHorizontal: 16,
    color: INK_PRIMARY,
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
    marginBottom: 12,
  },
  list: {
    flexGrow: 0,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_SUBTLE,
    minHeight: 44,
  },
  exerciseRowDisabled: {
    opacity: 0.4,
  },
  exerciseName: {
    flex: 1,
    color: INK_PRIMARY,
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
  },
  typeTag: {
    color: INK_DISABLED,
    fontFamily: 'DMSans_500Medium',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  createRow: {
    paddingVertical: 16,
    minHeight: 44,
    alignItems: 'center',
  },
  createRowText: {
    color: GHOST_ACCENT,
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    color: INK_SECONDARY,
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    marginBottom: 20,
    textAlign: 'center',
  },
  createPill: {
    height: 44,
    paddingHorizontal: 24,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: GHOST_ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createPillText: {
    color: GHOST_ACCENT,
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
  },
})
