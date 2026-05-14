import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ActivityDetailsScreen } from '../screens/ActivityDetailsScreen';
import { ActivityFeedScreen } from '../screens/ActivityFeedScreen';
import CampusSelectionScreen from '../screens/CampusSelectionScreen';
import ConsentSettingsScreen from '../screens/ConsentSettingsScreen';
import { CreateActivityScreen } from '../screens/CreateActivityScreen';
import { ManageRequestsScreen } from '../screens/ManageRequestsScreen';
import NotificationFallbackScreen from '../screens/NotificationFallbackScreen';
import NotificationListScreen from '../screens/NotificationListScreen';
import PersonalActivityListPlaceholderScreen from '../screens/PersonalActivityListPlaceholderScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import SignInScreen from '../screens/SignInScreen';
import SignUpScreen from '../screens/SignUpScreen';

export type RootStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  CampusSelection: undefined;
  ProfileSetup: undefined;
  ConsentSettings: undefined;
  ActivityFeed: undefined;
  Home: undefined;
  ActivityDetails: { activityId: string; canManageRequests?: boolean };
  CreateActivity: undefined;
  ManageRequests: { activityId?: string } | undefined;
  ManageJoinRequests: { activityId?: string } | undefined;
  NotificationList: undefined;
  NotificationFallback: undefined;
  PersonalActivityList: { activityId?: string } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function FeedHeaderActions({ navigation }: { navigation: any }) {
  return (
    <View style={styles.headerActions}>
      <Pressable onPress={() => navigation.navigate('NotificationList')}>
        <Text style={styles.headerActionText}>Alerts</Text>
      </Pressable>
      <Pressable onPress={() => navigation.navigate('CreateActivity')}>
        <Text style={styles.headerActionText}>Create</Text>
      </Pressable>
    </View>
  );
}

function ActivityDetailsHeaderAction({
  activityId,
  navigation,
}: {
  activityId: string;
  navigation: any;
}) {
  return (
    <Pressable onPress={() => navigation.navigate('ManageRequests', { activityId })}>
      <Text style={styles.headerActionText}>Requests</Text>
    </Pressable>
  );
}

function renderActivityDetailsHeaderRight(
  route: { params?: RootStackParamList['ActivityDetails'] },
  navigation: any,
) {
  if (route.params?.canManageRequests !== true || !route.params.activityId) {
    return undefined;
  }

  return () => (
    <ActivityDetailsHeaderAction
      activityId={route.params.activityId}
      navigation={navigation}
    />
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
          name="Home"
          component={ActivityFeedScreen}
          options={({ navigation }) => ({
            title: 'Activity Feed',
            headerRight: () => <FeedHeaderActions navigation={navigation} />,
          })}
        />
        <Stack.Screen
          name="ActivityDetails"
          component={ActivityDetailsScreen}
          options={({ navigation, route }) => ({
            title: 'Activity Details',
            headerRight: renderActivityDetailsHeaderRight(route, navigation),
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
          name="ManageJoinRequests"
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
          component={PersonalActivityListPlaceholderScreen}
          options={{ title: 'Personal Activity List' }}
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
