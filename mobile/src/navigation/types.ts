export type RootStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  CampusSelection: { email?: string; password?: string } | undefined;
  ProfileSetup: undefined;
  ConsentSettings: undefined;
  ActivityFeed: undefined;
  ActivityDetails: { activityId: string };
  CreateActivity: undefined;
  ManageRequests: { activityId: string };
  NotificationList: undefined;
  NotificationFallback: undefined;
  PersonalActivityList: undefined;
};
