import AsyncStorage from '@react-native-async-storage/async-storage';

export const STUDENT_AUTH_STORAGE_KEYS = ['authToken', 'studentAccountId', 'selectedCampusId'] as const;

export async function clearStudentAuthSession(): Promise<void> {
  await AsyncStorage.multiRemove([...STUDENT_AUTH_STORAGE_KEYS]);
}
