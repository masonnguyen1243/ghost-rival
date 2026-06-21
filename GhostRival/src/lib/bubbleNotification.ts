import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

export async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return
  await Notifications.setNotificationChannelAsync('session', {
    name: 'Active Session',
    importance: Notifications.AndroidImportance.LOW,
    vibrationPattern: [],
    enableVibrate: false,
    showBadge: false,
  })
}

export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync()
  return status === 'granted'
}

export async function showSessionNotification(
  exerciseName: string,
  timerSeconds: number
): Promise<void> {
  await Notifications.dismissAllNotificationsAsync()
  const safeSecs = Math.max(0, timerSeconds)
  const body =
    safeSecs > 0
      ? `Rest: ${Math.floor(safeSecs / 60)}:${String(safeSecs % 60).padStart(2, '0')}`
      : 'Ready to log'
  const title = exerciseName
    ? `Session active — ${exerciseName} in progress.`
    : 'Session active.'
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { screen: 'session' },
      sticky: true,
      autoDismiss: false,
    } as Notifications.NotificationContentInput,
    trigger: null,
  })
}

export async function dismissSessionNotification(): Promise<void> {
  await Notifications.dismissAllNotificationsAsync()
}
