import api from './api';

export type CampusStructuredOptionType = 'activity_category' | 'campus_location';
export type ParticipationMode = 'open' | 'approval_based';
export type GenderPreference = 'all' | 'male_only' | 'female_only';
export type ActivityStatus = 'open' | 'full' | 'completed' | 'cancelled';
export type PersonalActivityStatus = 'host' | 'pending_request' | 'confirmed_participant';
export type ParticipationRecordType = 'request' | 'participation';
export type ParticipationStatus = 'pending' | 'confirmed' | 'declined';
export type ReportTargetType = 'student' | 'activity';

export interface CampusStructuredOption {
  optionId: string;
  campusId: string;
  optionType: CampusStructuredOptionType;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PublicStudentProfile {
  studentAccountId: string;
  displayName: string;
  major: string;
  interests: string[];
  languages: string[];
  shortBio: string | null;
}

export interface ActivityDetailsViewModel {
  activityId: string;
  title: string;
  description?: string | null;
  scheduledDateTime: string;
  scheduledEndDateTime?: string | null;
  meetingPointLabel: string;
  categoryLabel: string;
  currentParticipantCount: number;
  maxParticipants: number;
  hostAccountId: string;
  status: ActivityStatus;
  canManageRequests?: boolean;
  hostProfile?: PublicStudentProfile;
  genderPreference: GenderPreference;
  participationMode: ParticipationMode;
  maxRequests?: number | null;
  currentRequestCount: number;
  personalActivityStatus?: PersonalActivityStatus;
  participationId?: string;
  participationRecordType?: ParticipationRecordType;
  participationStatus?: ParticipationStatus;
}

export interface SubmitReportPayload {
  campusId: string;
  targetType: ReportTargetType;
  targetAccountId?: string;
  targetActivityId?: string;
  reasonCode: string;
  description?: string;
}

export interface CreateBlockPayload {
  targetAccountId: string;
}

interface ApiClientLike {
  get<T>(path: string, options?: { params?: Record<string, string | number | boolean | null | undefined> }): Promise<{ data: T }>;
  post<T>(path: string, body?: unknown): Promise<{ data: T }>;
  delete<T>(path: string): Promise<{ data: T }>;
}

export async function listCampusStructuredOptions(
  campusId: string,
  filters?: { optionType?: CampusStructuredOptionType },
  client: ApiClientLike = api
): Promise<CampusStructuredOption[]> {
  const response = await client.get<CampusStructuredOption[]>(
    `/campuses/${campusId}/structured-options`,
    {
      params: {
        optionType: filters?.optionType
      }
    }
  );

  return response.data;
}

export async function getActivityDetails(
  activityId: string,
  client: ApiClientLike = api
): Promise<ActivityDetailsViewModel> {
  const response = await client.get<ActivityDetailsViewModel>(`/activities/${activityId}`);
  return response.data;
}

export async function joinActivity(activityId: string, client: ApiClientLike = api): Promise<void> {
  await client.post(`/activities/${activityId}/join`);
}

export async function withdrawActivityRequest(
  activityId: string,
  client: ApiClientLike = api
): Promise<void> {
  await client.delete(`/activities/${activityId}/requests/me`);
}

export async function leaveActivity(activityId: string, client: ApiClientLike = api): Promise<void> {
  await client.delete(`/activities/${activityId}/participants/me`);
}

export async function deleteHostedActivity(
  activityId: string,
  client: ApiClientLike = api
): Promise<void> {
  await client.delete(`/activities/${activityId}`);
}

export async function getPublicStudentProfile(
  contextActivityId: string,
  studentAccountId: string,
  client: ApiClientLike = api
): Promise<PublicStudentProfile> {
  const response = await client.get<PublicStudentProfile>(
    `/activities/${contextActivityId}/profiles/${studentAccountId}`
  );
  return response.data;
}

export function buildSubmitReportPayload(args: {
  campusId: string;
  targetType: ReportTargetType;
  targetActivityId?: string;
  targetAccountId?: string;
  reasonCode: string;
  description?: string;
}): SubmitReportPayload {
  const description = args.description?.trim();

  return {
    campusId: args.campusId,
    targetType: args.targetType,
    targetActivityId: args.targetType === 'activity' ? args.targetActivityId : undefined,
    targetAccountId: args.targetType === 'student' ? args.targetAccountId : undefined,
    reasonCode: args.reasonCode,
    description: description ? description : undefined
  };
}

export async function submitReport(
  payload: SubmitReportPayload,
  client: ApiClientLike = api
): Promise<void> {
  await client.post('/reports', payload);
}

export function buildCreateBlockPayload(targetAccountId: string): CreateBlockPayload {
  return { targetAccountId };
}

export async function blockStudent(
  targetAccountId: string,
  client: ApiClientLike = api
): Promise<void> {
  await client.post('/blocks', buildCreateBlockPayload(targetAccountId));
}
