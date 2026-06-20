import { View, Text, StyleSheet } from 'react-native'
import { INK_PRIMARY, INK_SECONDARY, GHOST_DIM_OPACITY } from '../../constants'

interface EmptyStateProps {
  icon?: string
  headline: string
  body: string
  cta?: React.ReactElement
}

export function EmptyState({ icon = '👻', headline, body, cta }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.headline}>{headline}</Text>
      <Text style={styles.body}>{body}</Text>
      {cta}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  icon: {
    fontSize: 64,
    opacity: GHOST_DIM_OPACITY,
    marginBottom: 16,
  },
  headline: {
    fontSize: 20,
    fontFamily: 'DMSans_600SemiBold',
    color: INK_PRIMARY,
    textAlign: 'center',
    marginBottom: 8,
  },
  body: {
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    color: INK_SECONDARY,
    textAlign: 'center',
    lineHeight: 22,
  },
})
