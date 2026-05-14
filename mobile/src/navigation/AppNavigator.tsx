import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';

import SignInScreen from '../screens/SignInScreen';
import SignUpScreen from '../screens/SignUpScreen';
import CampusSelectionScreen from '../screens/CampusSelectionScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import ConsentSettingsScreen from '../screens/ConsentSettingsScreen';
import { ActivityFeedScreen } from '../screens/ActivityFeedScreen';
import { ActivityDetailsScreen } from '../screens/ActivityDetailsScreen';
import { CreateActivityScreen } from '../screens/CreateActivityScreen';
import { ManageRequestsScreen } from '../screens/ManageRequestsScreen';
import NotificationListScreen from '../screens/NotificationListScreen';
import NotificationFallbackScreen from '../screens/NotificationFallbackScreen';
import PersonalActivityListScreen from '../screens/PersonalActivityListScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="SignIn" screenOptions={{ headerShown: false }}>
      {/* Auth */}
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />

      {/* Onboarding */}
      <Stack.Screen name="CampusSelection" component={CampusSelectionScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      <Stack.Screen name="ConsentSettings" component={ConsentSettingsScreen} />

      {/* Main app */}
      <Stack.Screen name="ActivityFeed" component={ActivityFeedScreen} />
      <Stack.Screen name="ActivityDetails" component={ActivityDetailsScreen} />
      <Stack.Screen name="CreateActivity" component={CreateActivityScreen} />
      <Stack.Screen name="ManageRequests" component={ManageRequestsScreen} />
      <Stack.Screen name="NotificationList" component={NotificationListScreen} />
      <Stack.Screen name="NotificationFallback" component={NotificationFallbackScreen} />
      <Stack.Screen name="PersonalActivityList" component={PersonalActivityListScreen} />

    </Stack.Navigator>
  );
}
