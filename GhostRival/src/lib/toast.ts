import { Alert } from 'react-native'

// Single entry point for user-facing messages. Never call Alert directly in components. [ARCH-13]
export function showToast(message: string, type: 'error' | 'info'): void {
  if (type === 'error') {
    Alert.alert('Error', message)
  }
  // info toasts: future upgrade to a non-blocking toast library when added
}
