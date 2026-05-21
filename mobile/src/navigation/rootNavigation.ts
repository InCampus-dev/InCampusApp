import { createNavigationContainerRef } from '@react-navigation/native';

import type { RootStackParamList } from './AppNavigator';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function resetToSignIn(): void {
  if (!navigationRef.isReady()) {
    return;
  }

  navigationRef.reset({
    index: 0,
    routes: [{ name: 'SignIn' }],
  });
}
