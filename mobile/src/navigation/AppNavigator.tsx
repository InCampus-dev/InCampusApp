import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';

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
import MineScreen from '../screens/MineScreen';
import PersonalActivityListScreen from '../screens/PersonalActivityListScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import ReportSubmissionScreen from '../screens/ReportSubmissionScreen';
import SignInScreen from '../screens/SignInScreen';
import SignUpScreen from '../screens/SignUpScreen';
import StudentProfileScreen from '../screens/StudentProfileScreen';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminInsightsScreen from '../screens/admin/AdminInsightsScreen';
import AdminReportDetailScreen from '../screens/admin/AdminReportDetailScreen';
import AdminReportsScreen from '../screens/admin/AdminReportsScreen';
import AdminStructuredOptionsScreen from '../screens/admin/AdminStructuredOptionsScreen';
import type { AdminReportListItem } from '../services/adminApi';
import { navigationRef } from './rootNavigation';

export type RootStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  CampusSelection: undefined;
  ProfileSetup: { mode?: 'create' | 'edit' } | undefined;
  ConsentSettings: undefined;
  ActivityFeed: { refreshAfterCreate?: number; refreshAfterJoin?: number; createdActivityId?: string } | undefined;
  ActivityDetails: { activityId: string; canManageRequests?: boolean };
  CreateActivity: undefined;
  ManageRequests: { activityId?: string } | undefined;
  NotificationList: undefined;
  NotificationFallback: { reason?: string } | undefined;
  Mine: undefined;
  PersonalActivityList: { activityId?: string; source?: string } | undefined;
  CommunityRules: undefined;
  ReportSubmission:
    | {
        targetType?: 'student' | 'activity';
        targetActivityId?: string;
        targetAccountId?: string;
        activityTitle?: string;
        categoryLabel?: string;
      }
    | undefined;
  BlockUser: { targetAccountId?: string; returnToActivityId?: string } | undefined;
  StudentProfile: { studentAccountId: string; contextActivityId: string };
  AdminDashboard: undefined;
  AdminStructuredOptions: undefined;
  AdminReports: undefined;
  AdminReportDetail: { reportId: string; reportSummary?: AdminReportListItem };
  AdminInsights: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer ref={navigationRef}>
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
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ActivityDetails"
          component={ActivityDetailsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CreateActivity"
          component={CreateActivityScreen}
          options={{ headerShown: false }}
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
          name="Mine"
          component={MineScreen}
          options={{ headerShown: false }}
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
        <Stack.Screen
          name="StudentProfile"
          component={StudentProfileScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AdminDashboard"
          component={AdminDashboardScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AdminStructuredOptions"
          component={AdminStructuredOptionsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AdminReports"
          component={AdminReportsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AdminReportDetail"
          component={AdminReportDetailScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AdminInsights"
          component={AdminInsightsScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    backgroundColor: '#fff',
  },
});
