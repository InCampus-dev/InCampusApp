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
  ReportStatus,
  ReportTargetType,
  ReviewOutcome,
  StudentProfileGender,
  TargetContextType,
  VerificationStatus
} from "./enums";

export type CampusId = string;
export type StudentAccountId = string;
export type ActivityId = string;
export type ParticipationId = string;
export type NotificationId = string;
export type BlockId = string;
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

export interface CreateStudentProfileRequestDto {
  displayName: string;
  major: string;
  dateOfBirth?: string | null;
  gender?: StudentProfileGender | null;
  interests?: string[];
  languages?: string[];
  shortBio?: string | null;
}

export interface UpdateStudentProfileRequestDto {
  displayName?: string;
  major?: string;
  dateOfBirth?: string | null;
  gender?: StudentProfileGender | null;
  interests?: string[];
  languages?: string[];
  shortBio?: string | null;
}

export interface UpdateCampusInsightConsentRequestDto {
  campusInsightSharingConsent: boolean;
}

export interface CampusInsightConsentDto {
  campusInsightSharingConsent: boolean;
}

export interface ConsentBasedStudentInsightDto {
  campusId: CampusId;
  students: ConsentBasedStudentInsightStudentDto[];
}

export interface ConsentBasedStudentInsightStudentDto {
  studentAccountId: StudentAccountId;
  profile: ConsentBasedStudentInsightProfileDto | null;
  hostedActivities: ConsentBasedStudentHostedActivityDto[];
  participations: ConsentBasedStudentParticipationDto[];
}

export interface ConsentBasedStudentInsightProfileDto {
  displayName: string;
  major: string;
  interests: string[];
}

export interface ConsentBasedStudentHostedActivityDto {
  activityId: ActivityId;
  title: string;
  categoryLabel: string;
  scheduledDateTime: string;
  status: ActivityStatus;
}

export interface ConsentBasedStudentParticipationDto {
  participationId: ParticipationId;
  activityId: ActivityId;
  activityTitle: string;
  recordType: ParticipationRecordType;
  status: ParticipationStatus;
  createdAt: string;
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

export interface CampusConfigurationDto {
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
  createdAt: string;
  updatedAt: string;
}

export interface CreateStructuredOptionRequestDto {
  optionType: CampusStructuredOptionType;
  name: string;
  description?: string | null;
  isActive?: boolean;
}

export interface UpdateStructuredOptionRequestDto {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export interface CreateCampusRequestDto {
  campusId?: CampusId;
  universityName: string;
  campusName: string;
  activationStatus?: boolean;
  initialStructuredOptions?: CreateStructuredOptionRequestDto[];
}

export interface CampusCreatedDto {
  campusId: CampusId;
  universityName: string;
  campusName: string;
  activationStatus: boolean;
  structuredOptions: CampusStructuredOptionDto[];
}

export interface DeletionConfirmationDto {
  deactivated: boolean;
  resourceType: string;
  resourceId: string;
}

export interface CreateBlockRequestDto {
  targetAccountId: StudentAccountId;
}

export interface BlockCreatedDto {
  blockId: BlockId;
  initiatorAccountId: StudentAccountId;
  blockedAccountId: StudentAccountId;
  createdAt: string;
  alreadyExisted: boolean;
}

export interface CommunityRuleSectionDto {
  sectionId: string;
  title: string;
  body: string;
}

export interface CommunityRulesDto {
  locale: string;
  title: string;
  sections: CommunityRuleSectionDto[];
}

export interface SubmitReportRequestDto {
  campusId: CampusId;
  targetType: ReportTargetType;
  targetAccountId?: StudentAccountId | null;
  targetActivityId?: ActivityId | null;
  reasonCode: string;
  description?: string | null;
}

export interface ReportSubmittedDto {
  reportId: ReportId;
  campusId: CampusId;
  reporterAccountId: StudentAccountId;
  targetType: ReportTargetType;
  targetAccountId?: StudentAccountId | null;
  targetActivityId?: ActivityId | null;
  reasonCode: string;
  description?: string | null;
  status: ReportStatus;
  submittedAt: string;
}

export interface ReportListDto {
  reportId: ReportId;
  campusId: CampusId;
  targetType: ReportTargetType;
  targetAccountId?: StudentAccountId | null;
  targetActivityId?: ActivityId | null;
  reasonCode: string;
  status: ReportStatus;
  submittedAt: string;
  reviewedAt?: string | null;
  moderationAction: ModerationAction;
  reviewOutcome?: ReviewOutcome | null;
  commandDispatchPending: boolean;
}

export interface UserReportTargetContextDto {
  studentAccountId: StudentAccountId;
  selectedCampusId?: CampusId | null;
}

export interface ActivityReportTargetContextDto {
  activityId: ActivityId;
  campusId: CampusId;
  hostAccountId: StudentAccountId;
  title: string;
  scheduledDateTime: string;
  status: ActivityStatus;
}

export interface ReportDetailDto extends ReportListDto {
  reporterAccountId: StudentAccountId;
  reviewedByAdminId?: string | null;
  reviewNotes?: string | null;
  targetContext?: UserReportTargetContextDto | ActivityReportTargetContextDto;
}

export interface ReviewReportRequestDto {
  reviewOutcome: ReviewOutcome;
  moderationAction: ModerationAction;
  reviewNotes?: string | null;
}

export interface ReportReviewedDto {
  reportId: ReportId;
  campusId: CampusId;
  status: ReportStatus;
  reviewOutcome: ReviewOutcome;
  moderationAction: ModerationAction;
  reviewedAt: string;
  reviewedByAdminId: string;
  commandDispatchPending: boolean;
}

export interface StudentProfileDto {
  profileId: string;
  studentAccountId: StudentAccountId;
  displayName: string;
  major: string;
  dateOfBirth: string | null;
  gender: StudentProfileGender | null;
  interests: string[];
  languages: string[];
  shortBio: string | null;
  createdAt: string;
  updatedAt: string | null;
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
  canManageRequests?: boolean;
}

export interface ParticipationDto {
  participationId: ParticipationId;
  activityId: ActivityId;
  studentAccountId: StudentAccountId;
  recordType: ParticipationRecordType;
  status: ParticipationStatus;
  createdAt: string;
}

export type PersonalActivityRelationship =
  | "host"
  | "pending_request"
  | "confirmed_participant";

export interface PersonalActivityListItemDto extends ActivityDetailDto {
  personalActivityStatus: PersonalActivityRelationship;
  participationId?: ParticipationId;
  participationRecordType?: ParticipationRecordType;
  participationStatus?: ParticipationStatus;
}

export type PersonalActivityListDto = PersonalActivityListItemDto[];

export interface JoinRequestApplicantProfileDto {
  applicantId: StudentAccountId;
  displayName: string;
  major: string;
  shortBio: string | null;
}

export interface JoinRequestListItemDto {
  requestId: ParticipationId;
  activityId: ActivityId;
  applicantId: StudentAccountId;
  status: ParticipationStatus;
  createdAt: string;
  applicant: JoinRequestApplicantProfileDto;
}

export type JoinRequestListDto = JoinRequestListItemDto[];

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
  reviewOutcome: ReviewOutcome;
}
