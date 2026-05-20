import api from './api';
import { getAdminHeaders, requireAdminContext } from './adminSession';

export type CampusStructuredOptionType = 'activity_category' | 'campus_location';
export type ReportTargetType = 'student' | 'activity';
export type ReportStatus = 'pending_review' | 'reviewed';
export type ReviewOutcome = 'no_action' | 'dismissed' | 'action_taken';
export type ModerationAction =
  | 'none'
  | 'warn_user'
  | 'suspend_user'
  | 'ban_user'
  | 'remove_activity';
export type ActivityStatus = 'open' | 'full' | 'completed' | 'cancelled';
export type ParticipationRecordType = 'request' | 'participation';
export type ParticipationStatus = 'pending' | 'confirmed' | 'declined';

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

export interface CreateStructuredOptionPayload {
  optionType: CampusStructuredOptionType;
  name: string;
  description?: string | null;
  isActive?: boolean;
}

export interface UpdateStructuredOptionPayload {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export interface StructuredOptionFilters {
  optionType?: CampusStructuredOptionType;
  includeInactive?: boolean;
}

export interface DeletionConfirmation {
  deactivated: boolean;
  resourceType: string;
  resourceId: string;
}

export interface AdminReportListItem {
  reportId: string;
  campusId: string;
  targetType: ReportTargetType;
  targetAccountId?: string | null;
  targetActivityId?: string | null;
  reasonCode: string;
  status: ReportStatus;
  submittedAt: string;
  reviewedAt?: string | null;
  moderationAction: ModerationAction;
  reviewOutcome?: ReviewOutcome | null;
  commandDispatchPending: boolean;
}

export interface UserReportTargetContext {
  studentAccountId: string;
  selectedCampusId?: string | null;
}

export interface ActivityReportTargetContext {
  activityId: string;
  campusId: string;
  hostAccountId: string;
  title: string;
  scheduledDateTime: string;
  status: ActivityStatus;
}

export interface AdminReportDetail extends AdminReportListItem {
  reporterAccountId: string;
  reviewedByAdminId?: string | null;
  reviewNotes?: string | null;
  targetContext?: UserReportTargetContext | ActivityReportTargetContext;
}

export interface ReviewAdminReportPayload {
  reviewOutcome: ReviewOutcome;
  moderationAction: ModerationAction;
  reviewNotes?: string | null;
}

export interface AdminReportReviewed {
  reportId: string;
  campusId: string;
  status: ReportStatus;
  reviewOutcome: ReviewOutcome;
  moderationAction: ModerationAction;
  reviewedAt: string;
  reviewedByAdminId: string;
  commandDispatchPending: boolean;
}

export interface StudentInsights {
  campusId: string;
  students: StudentInsight[];
}

export interface StudentInsight {
  studentAccountId: string;
  profile: StudentInsightProfile | null;
  hostedActivities: StudentHostedActivity[];
  participations: StudentParticipation[];
}

export interface StudentInsightProfile {
  displayName: string;
  major: string;
  interests: string[];
}

export interface StudentHostedActivity {
  activityId: string;
  title: string;
  categoryLabel: string;
  scheduledDateTime: string;
  status: ActivityStatus;
}

export interface StudentParticipation {
  participationId: string;
  activityId: string;
  activityTitle: string;
  recordType: ParticipationRecordType;
  status: ParticipationStatus;
  createdAt: string;
}

export interface AdminReportFilters {
  status?: ReportStatus;
}

export interface StudentInsightFilters {
  search?: string;
}

export async function listStructuredOptions(
  campusId: string,
  filters?: StructuredOptionFilters
): Promise<CampusStructuredOption[]> {
  const response = await api.get<CampusStructuredOption[]>(
    `/admin/campuses/${campusId}/structured-options`,
    {
      params: {
        optionType: filters?.optionType,
        includeInactive: filters?.includeInactive,
      },
      headers: await adminHeaders(),
    }
  );
  return response.data;
}

export async function createStructuredOption(
  campusId: string,
  payload: CreateStructuredOptionPayload
): Promise<CampusStructuredOption> {
  const response = await api.post<CampusStructuredOption>(
    `/admin/campuses/${campusId}/structured-options`,
    payload,
    { headers: await adminHeaders() }
  );
  return response.data;
}

export async function updateStructuredOption(
  campusId: string,
  optionId: string,
  payload: UpdateStructuredOptionPayload
): Promise<CampusStructuredOption> {
  const response = await api.patch<CampusStructuredOption>(
    `/admin/campuses/${campusId}/structured-options/${optionId}`,
    payload,
    { headers: await adminHeaders() }
  );
  return response.data;
}

export async function deactivateStructuredOption(
  campusId: string,
  optionId: string
): Promise<DeletionConfirmation> {
  const response = await api.delete<DeletionConfirmation>(
    `/admin/campuses/${campusId}/structured-options/${optionId}`,
    { headers: await adminHeaders() }
  );
  return response.data;
}

export async function listAdminReports(
  campusId: string,
  _filters?: AdminReportFilters
): Promise<AdminReportListItem[]> {
  const response = await api.get<AdminReportListItem[]>(
    `/admin/campuses/${campusId}/reports`,
    { headers: await adminHeaders() }
  );
  return response.data;
}

export async function getAdminReportDetail(
  campusId: string,
  reportId: string
): Promise<AdminReportDetail> {
  const response = await api.get<AdminReportDetail>(
    `/admin/campuses/${campusId}/reports/${reportId}`,
    { headers: await adminHeaders() }
  );
  return response.data;
}

export async function reviewAdminReport(
  campusId: string,
  reportId: string,
  payload: ReviewAdminReportPayload
): Promise<AdminReportReviewed> {
  const response = await api.patch<AdminReportReviewed>(
    `/admin/campuses/${campusId}/reports/${reportId}/review`,
    payload,
    { headers: await adminHeaders() }
  );
  return response.data;
}

export async function listStudentInsights(
  campusId: string,
  filters?: StudentInsightFilters
): Promise<StudentInsights> {
  const response = await api.get<StudentInsights>(
    `/admin/campuses/${campusId}/student-insights`,
    {
      params: {
        search: filters?.search,
      },
      headers: await adminHeaders(),
    }
  );
  return response.data;
}

async function adminHeaders(): Promise<Record<string, string>> {
  return getAdminHeaders(await requireAdminContext());
}
