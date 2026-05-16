import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ActivityDetailsScreen } from '../screens/ActivityDetailsScreen';
import { ActivityFeedScreen } from '../screens/ActivityFeedScreen';
import BlockUserScreen from '../screens/BlockUserScreen';
import CampusSelectionScreen from '../screens/CampusSelectionScreen';
import CommunityRulesScreen from '../screens/CommunityRulesScreen';
import ConsentSettingsScreen from '../screens/ConsentSettingsScreen';
import { CreateActivityScreen } from '../screens/CreateActivityScreen';
import { ManageRequestsScreen } from '../screens/ManageRequestsScreen';
import NotificationFallbackScreen from '../screens/NotificationFallbackScreen';
import NotificationListScreen from '../screens/NotificationListScreen';
import PersonalActivityListScreen from '../screens/PersonalActivityListPlaceholderScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import ReportSubmissionScreen from '../screens/ReportSubmissionScreen';
import SignInScreen from '../screens/SignInScreen';
import SignUpScreen from '../screens/SignUpScreen';

export type RootStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  CampusSelection: undefined;
  ProfileSetup: undefined;
  ConsentSettings: undefined;
  ActivityFeed: { refreshAfterCreate?: number; refreshAfterJoin?: number; createdActivityId?: string } | undefined;
  ActivityDetails: { activityId: string; canManageRequests?: boolean };
  CreateActivity: undefined;
  ManageRequests: { activityId?: string } | undefined;
  NotificationList: undefined;
  NotificationFallback: { reason?: string } | undefined;
  PersonalActivityList: { activityId?: string; source?: string } | undefined;
  CommunityRules: undefined;
  ReportSubmission:
    | { targetType?: 'student' | 'activity'; targetActivityId?: string; targetAccountId?: string }
    | undefined;
  BlockUser: { targetAccountId?: string } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function FeedHeaderActions({ navigation }: { navigation: any }) {
  return (
    <View style={styles.headerActions}>
      <Pressable onPress={() => navigation.navigate('NotificationList')}>
        <Text style={styles.headerActionText}>Alerts</Text>
      </Pressable>
      <Pressable onPress={() => navigation.navigate('PersonalActivityList')}>
        <Text style={styles.headerActionText}>Mine</Text>
      </Pressable>
      <Pressable onPress={() => navigation.navigate('CommunityRules')}>
        <Text style={styles.headerActionText}>Rules</Text>
      </Pressable>
      <Pressable onPress={() => navigation.navigate('CreateActivity')}>
        <Text style={styles.headerActionText}>Create</Text>
      </Pressable>
    </View>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="SignIn"
        screenOptions={{
          headerBackTitleVisible: false,
          contentStyle: styles.screenContent,
        }}
      >
        <Stack.Screen name="SignIn" component={SignInScreen} options={{ title: 'Sign In' }} />
        <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: 'Sign Up' }} />
        <Stack.Screen
          name="CampusSelection"
          component={CampusSelectionScreen}
          options={{ title: 'Select Campus' }}
        />
        <Stack.Screen
          name="ProfileSetup"
          component={ProfileSetupScreen}
          options={{ title: 'Profile Setup' }}
        />
        <Stack.Screen
          name="ConsentSettings"
          component={ConsentSettingsScreen}
          options={{ title: 'Consent Settings' }}
        />
        <Stack.Screen
          name="ActivityFeed"
          component={ActivityFeedScreen}
          options={({ navigation }) => ({
            title: 'Activity Feed',
            headerRight: () => <FeedHeaderActions navigation={navigation} />,
          })}
        />
        <Stack.Screen
          name="ActivityDetails"
          component={ActivityDetailsScreen}
          options={() => ({
            title: 'Activity Details',
          })}
        />
        <Stack.Screen
          name="CreateActivity"
          component={CreateActivityScreen}
          options={{ title: 'Create Activity' }}
        />
        <Stack.Screen
          name="ManageRequests"
          component={ManageRequestsScreen}
          options={{ title: 'Pending Join Requests' }}
        />
        <Stack.Screen
          name="NotificationList"
          component={NotificationListScreen}
          options={{ title: 'Notifications' }}
        />
        <Stack.Screen
          name="NotificationFallback"
          component={NotificationFallbackScreen}
          options={{ title: 'Unavailable Content' }}
        />
        <Stack.Screen
          name="PersonalActivityList"
          component={PersonalActivityListScreen}
          options={{ title: 'Personal Activity List' }}
        />
        <Stack.Screen
          name="CommunityRules"
          component={CommunityRulesScreen}
          options={{ title: 'Community Rules' }}
        />
        <Stack.Screen
          name="ReportSubmission"
          component={ReportSubmissionScreen}
          options={{ title: 'Report' }}
        />
        <Stack.Screen
          name="BlockUser"
          component={BlockUserScreen}
          options={{ title: 'Block Student' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    backgroundColor: '#fff',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerActionText: {
    color: '#1976d2',
    fontSize: 14,
    fontWeight: '600',
  },
});
