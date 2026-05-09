import {
  ActivityStatus,
  CampusStructuredOptionType,
  GenderPreference,
  ModerationAction,
  NotificationType,
  ParticipationMode,
  ParticipationRecordType,
  ParticipationStatus,
  PlatformAccessStatus,
  TargetContextType,
  VerificationStatus
} from "./enums";

export type CampusId = string;
export type StudentAccountId = string;
export type ActivityId = string;
export type ParticipationId = string;
export type NotificationId = string;
export type ReportId = string;

export interface HealthResponseDto {
  status: "ok";
  service: "incampus-backend";
  architecture: "multi-tenant modular monolith";
}

export interface SignUpRequestDto {
  universityEmail: string;
  password: string;
  universityStudentId: string;
}

export interface SignInRequestDto {
  universityEmail: string;
  password: string;
}

export interface AuthenticatedResponseDto {
  accessToken: string;
  studentAccountId: StudentAccountId;
  selectedCampusId?: CampusId | null;
  platformAccessStatus: PlatformAccessStatus;
  verificationStatus: VerificationStatus;
}

export interface CampusSummaryDto {
  campusId: CampusId;
  universityName: string;
  campusName: string;
  activationStatus: boolean;
}

export interface CampusStructuredOptionDto {
  optionId: string;
  campusId: CampusId;
  optionType: CampusStructuredOptionType;
  name: string;
  description?: string | null;
  isActive: boolean;
}

export interface StudentProfileDto {
  profileId: string;
  studentAccountId: StudentAccountId;
  displayName: string;
  major?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  interests?: string[];
  languages?: string[];
  shortBio?: string | null;
}

export interface ActivitySummaryDto {
  activityId: ActivityId;
  campusId: CampusId;
  hostAccountId: StudentAccountId;
  title: string;
  categoryId: string;
  categoryLabel: string;
  scheduledDateTime: string;
  meetingPointId: string;
  meetingPointLabel: string;
  currentParticipantCount: number;
  maxParticipants: number;
  participationMode: ParticipationMode;
  genderPreference: GenderPreference;
  status: ActivityStatus;
}

export interface ActivityDetailDto extends ActivitySummaryDto {
  description?: string | null;
  scheduledEndDateTime?: string | null;
  maxRequests?: number | null;
  currentRequestCount: number;
  hostProfile?: StudentProfileDto;
}

export interface ParticipationDto {
  participationId: ParticipationId;
  activityId: ActivityId;
  studentAccountId: StudentAccountId;
  recordType: ParticipationRecordType;
  status: ParticipationStatus;
  createdAt: string;
}

export interface NotificationRecordDto {
  notificationId: NotificationId;
  recipientAccountId: StudentAccountId;
  notificationType: NotificationType;
  notificationTitle: string;
  notificationMessage: string;
  relatedActivityId?: ActivityId | null;
  relatedParticipationId?: ParticipationId | null;
  targetContextType: TargetContextType;
  targetContextId?: string | null;
  triggeringAccountId?: StudentAccountId | null;
  createdAt: string;
}

export interface ReportReviewCommandDto {
  reportId: ReportId;
  moderationAction: ModerationAction;
  reviewOutcome: string;
}
