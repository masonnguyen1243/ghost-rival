import { View, Text, StyleSheet } from 'react-native'
import { SURFACE_BASE, INK_SECONDARY } from '../../constants'

export default function HallOfFameScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hall of Fame</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SURFACE_BASE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: INK_SECONDARY,
  },
})
