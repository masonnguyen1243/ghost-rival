import AsyncStorage from '@react-native-async-storage/async-storage'

const LOCAL_USER_ID_KEY = '@ghostrival/local_user_id'

export async function getOrCreateLocalUserId(): Promise<string> {
  const existing = await AsyncStorage.getItem(LOCAL_USER_ID_KEY)
  if (existing) return existing
  const newId = crypto.randomUUID()
  await AsyncStorage.setItem(LOCAL_USER_ID_KEY, newId)
  return newId
}

export async function getLocalUserId(): Promise<string | null> {
  return AsyncStorage.getItem(LOCAL_USER_ID_KEY)
}
