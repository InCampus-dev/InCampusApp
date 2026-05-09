export enum ActivityStatus {
  Open = "open",
  Full = "full",
  Completed = "completed",
  Cancelled = "cancelled"
}

export enum ParticipationRecordType {
  Request = "request",
  Participation = "participation"
}

export enum ParticipationStatus {
  Pending = "pending",
  Confirmed = "confirmed",
  Declined = "declined"
}

export enum PlatformAccessStatus {
  PendingVerification = "PendingVerification",
  Active = "Active",
  Suspended = "Suspended",
  Banned = "Banned"
}

export enum VerificationStatus {
  Pending = "Pending",
  Verified = "Verified"
}

export enum NotificationType {
  JoinEvent = "JoinEvent",
  ApplicationOutcome = "ApplicationOutcome",
  ActivityCancellation = "ActivityCancellation",
  LeaveEvent = "LeaveEvent",
  ActivityReminder = "ActivityReminder"
}

export enum TargetContextType {
  JoinRequestReview = "JoinRequestReview",
  ActivityDetails = "ActivityDetails",
  CancelledActivityContext = "CancelledActivityContext",
  PersonalActivityContext = "PersonalActivityContext",
  NotificationFallbackView = "NotificationFallbackView"
}

export enum ModerationAction {
  None = "none",
  WarnUser = "warn_user",
  SuspendUser = "suspend_user",
  BanUser = "ban_user",
  RemoveActivity = "remove_activity"
}

export enum GenderPreference {
  All = "all",
  MaleOnly = "male_only",
  FemaleOnly = "female_only"
}

export enum ParticipationMode {
  Open = "open",
  ApprovalBased = "approval_based"
}

export enum CampusStructuredOptionType {
  ActivityCategory = "activity_category",
  CampusLocation = "campus_location"
}
