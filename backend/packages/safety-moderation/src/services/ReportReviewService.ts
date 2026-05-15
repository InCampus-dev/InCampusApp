import type { AuthenticatedAdminContext } from "../../../shared/src/auth/AuthenticatedAdminContext";
import type {
  ActivityReportTargetContextDto,
  ReportDetailDto,
  ReportListDto,
  ReportReviewedDto,
  ReviewReportRequestDto,
  UserReportTargetContextDto
} from "../../../shared/src/domain/dtos";
import {
  ModerationAction,
  ReportStatus,
  ReportTargetType,
  ReviewOutcome
} from "../../../shared/src/domain/enums";
import { AppError } from "../../../shared/src/errors/AppError";
import { StudentAccountRepo } from "../../../access-profile/src/repositories/StudentAccountRepo";
import { CampusAuthorizationService } from "../../../campus-administration/src/services/CampusAuthorizationService";
import { ActivityRepo } from "../../../hosting-lifecycle/src/repositories/ActivityRepo";
import { ReportRecord } from "../entities/ReportRecord";
import { ReportRepo } from "../repositories/ReportRepo";
import {
  ModerationActionDispatcher,
  type DispatchModerationActionResult
} from "./ModerationActionDispatcher";

export class ReportReviewService {
  constructor(
    private readonly reportRepo: Pick<
      ReportRepo,
      "findByCampus" | "findByCampusAndReportId" | "persist"
    >,
    private readonly studentAccountRepo: Pick<StudentAccountRepo, "findById">,
    private readonly activityRepo: Pick<ActivityRepo, "findOne">,
    private readonly campusAuthorizationService: CampusAuthorizationService,
    private readonly moderationActionDispatcher: Pick<ModerationActionDispatcher, "dispatch">
  ) {}

  public async listReports(
    adminContext: AuthenticatedAdminContext,
    campusId: string
  ): Promise<ReportListDto[]> {
    this.campusAuthorizationService.assertCanManageCampus(adminContext, campusId);

    const reports = await this.reportRepo.findByCampus(campusId);

    return reports.map(toReportListDto);
  }

  public async getReportDetail(
    adminContext: AuthenticatedAdminContext,
    campusId: string,
    reportId: string
  ): Promise<ReportDetailDto> {
    this.campusAuthorizationService.assertCanManageCampus(adminContext, campusId);

    const reportRecord = await this.getScopedReportRecord(campusId, reportId);
    const targetContext = await this.resolveTargetContext(reportRecord);

    if (!targetContext) {
      throw AppError.targetUnavailable(
        reportRecord.targetType === ReportTargetType.Student ? "StudentAccount" : "Activity",
        reportRecord.targetType === ReportTargetType.Student
          ? reportRecord.targetAccountId ?? undefined
          : reportRecord.targetActivityId ?? undefined
      );
    }

    return toReportDetailDto(reportRecord, targetContext);
  }

  public async reviewReport(
    adminContext: AuthenticatedAdminContext,
    campusId: string,
    reportId: string,
    request: ReviewReportRequestDto
  ): Promise<ReportReviewedDto> {
    this.campusAuthorizationService.assertCanManageCampus(adminContext, campusId);

    const reportRecord = await this.getScopedReportRecord(campusId, reportId);
    const validatedReview = validateReviewRequest(request, reportRecord);
    const dispatchResult = await this.dispatchReviewAction(adminContext, reportRecord, validatedReview);

    reportRecord.status = ReportStatus.Reviewed;
    reportRecord.reviewOutcome = validatedReview.reviewOutcome;
    reportRecord.moderationAction = validatedReview.moderationAction;
    reportRecord.reviewNotes = validatedReview.reviewNotes;
    reportRecord.reviewedAt = new Date();
    reportRecord.reviewedByAdminId = adminContext.adminId;
    reportRecord.commandDispatchPending = dispatchResult.commandDispatchPending;

    const savedReportRecord = await this.reportRepo.persist(reportRecord);

    return toReportReviewedDto(savedReportRecord);
  }

  private async getScopedReportRecord(
    campusId: string,
    reportId: string
  ): Promise<ReportRecord> {
    const reportRecord = await this.reportRepo.findByCampusAndReportId(campusId, reportId);

    if (!reportRecord) {
      throw AppError.notFound("ReportRecord", reportId);
    }

    return reportRecord;
  }

  private async resolveTargetContext(
    reportRecord: ReportRecord
  ): Promise<UserReportTargetContextDto | ActivityReportTargetContextDto | null> {
    if (reportRecord.targetType === ReportTargetType.Student) {
      if (!reportRecord.targetAccountId) {
        return null;
      }

      const targetAccount = await this.studentAccountRepo.findById(reportRecord.targetAccountId);

      if (!targetAccount || targetAccount.selectedCampusId !== reportRecord.campusId) {
        return null;
      }

      return {
        studentAccountId: targetAccount.studentAccountId,
        selectedCampusId: targetAccount.selectedCampusId
      };
    }

    if (!reportRecord.targetActivityId) {
      return null;
    }

    const targetActivity = await this.activityRepo.findOne({
      where: {
        activityId: reportRecord.targetActivityId
      }
    });

    if (!targetActivity || targetActivity.campusId !== reportRecord.campusId) {
      return null;
    }

    return {
      activityId: targetActivity.activityId,
      campusId: targetActivity.campusId,
      hostAccountId: targetActivity.hostAccountId,
      title: targetActivity.title,
      scheduledDateTime: targetActivity.scheduledDateTime.toISOString(),
      status: targetActivity.status
    };
  }

  private async dispatchReviewAction(
    adminContext: AuthenticatedAdminContext,
    reportRecord: ReportRecord,
    validatedReview: ValidatedReviewRequest
  ): Promise<DispatchModerationActionResult> {
    return await this.moderationActionDispatcher.dispatch({
      reportId: reportRecord.reportId,
      campusId: reportRecord.campusId,
      targetType: reportRecord.targetType,
      targetAccountId: reportRecord.targetAccountId,
      targetActivityId: reportRecord.targetActivityId,
      moderationAction: validatedReview.moderationAction,
      reviewOutcome: validatedReview.reviewOutcome,
      reviewedByAdminId: adminContext.adminId
    });
  }
}

interface ValidatedReviewRequest {
  reviewOutcome: ReviewOutcome;
  moderationAction: ModerationAction;
  reviewNotes: string | null;
}

function validateReviewRequest(
  request: ReviewReportRequestDto,
  reportRecord: ReportRecord
): ValidatedReviewRequest {
  const issues = [];

  if (reportRecord.status !== ReportStatus.PendingReview) {
    throw AppError.validation("Request validation failed", [
      {
        field: "status",
        message: "must be pending_review before it can be reviewed",
        code: "report_already_reviewed"
      }
    ]);
  }

  if (!request || typeof request !== "object") {
    throw AppError.validation("Request validation failed", [
      {
        field: "body",
        message: "must be an object",
        code: "invalid_type"
      }
    ]);
  }

  const reviewOutcome = parseReviewOutcome(request.reviewOutcome);
  const moderationAction = parseModerationAction(request.moderationAction);
  const reviewNotes = normalizeNullableString(request.reviewNotes);

  if (!reviewOutcome) {
    issues.push({
      field: "reviewOutcome",
      message: "must be one of: no_action, action_taken, dismissed",
      code: "invalid_enum"
    });
  }

  if (!moderationAction) {
    issues.push({
      field: "moderationAction",
      message: "must be a supported moderation action",
      code: "invalid_enum"
    });
  }

  if (request.reviewNotes !== undefined && request.reviewNotes !== null && reviewNotes === null) {
    issues.push({
      field: "reviewNotes",
      message: "must be a string",
      code: "invalid_type"
    });
  }

  if (
    reviewOutcome &&
    moderationAction &&
    (reviewOutcome === ReviewOutcome.NoAction || reviewOutcome === ReviewOutcome.Dismissed) &&
    moderationAction !== ModerationAction.None
  ) {
    issues.push({
      field: "moderationAction",
      message: "must be none when reviewOutcome is no_action or dismissed",
      code: "invalid_moderation_action"
    });
  }

  if (
    reviewOutcome &&
    moderationAction &&
    reviewOutcome === ReviewOutcome.ActionTaken &&
    moderationAction === ModerationAction.None
  ) {
    issues.push({
      field: "moderationAction",
      message: "must not be none when reviewOutcome is action_taken",
      code: "invalid_moderation_action"
    });
  }

  if (
    reportRecord.targetType === ReportTargetType.Student &&
    moderationAction === ModerationAction.RemoveActivity
  ) {
    issues.push({
      field: "moderationAction",
      message: "remove_activity is not valid for student reports",
      code: "invalid_moderation_action"
    });
  }

  if (
    reportRecord.targetType === ReportTargetType.Activity &&
    moderationAction &&
    [
      ModerationAction.WarnUser,
      ModerationAction.SuspendUser,
      ModerationAction.BanUser
    ].includes(moderationAction)
  ) {
    issues.push({
      field: "moderationAction",
      message: "user moderation actions are not valid for activity reports",
      code: "invalid_moderation_action"
    });
  }

  if (issues.length > 0) {
    throw AppError.validation("Request validation failed", issues);
  }

  return {
    reviewOutcome: reviewOutcome as ReviewOutcome,
    moderationAction: moderationAction as ModerationAction,
    reviewNotes
  };
}

function parseReviewOutcome(value: unknown): ReviewOutcome | null {
  return value === ReviewOutcome.NoAction ||
    value === ReviewOutcome.ActionTaken ||
    value === ReviewOutcome.Dismissed
    ? value
    : null;
}

function parseModerationAction(value: unknown): ModerationAction | null {
  return value === ModerationAction.None ||
    value === ModerationAction.WarnUser ||
    value === ModerationAction.SuspendUser ||
    value === ModerationAction.BanUser ||
    value === ModerationAction.RemoveActivity
    ? value
    : null;
}

function normalizeNullableString(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();

  return normalizedValue.length > 0 ? normalizedValue : null;
}

function toReportListDto(reportRecord: ReportRecord): ReportListDto {
  return {
    reportId: reportRecord.reportId,
    campusId: reportRecord.campusId,
    targetType: reportRecord.targetType,
    targetAccountId: reportRecord.targetAccountId,
    targetActivityId: reportRecord.targetActivityId,
    reasonCode: reportRecord.reasonCode,
    status: reportRecord.status,
    submittedAt: reportRecord.submittedAt.toISOString(),
    reviewedAt: reportRecord.reviewedAt?.toISOString() ?? null,
    moderationAction: reportRecord.moderationAction,
    reviewOutcome: reportRecord.reviewOutcome,
    commandDispatchPending: reportRecord.commandDispatchPending
  };
}

function toReportDetailDto(
  reportRecord: ReportRecord,
  targetContext: UserReportTargetContextDto | ActivityReportTargetContextDto
): ReportDetailDto {
  return {
    ...toReportListDto(reportRecord),
    reporterAccountId: reportRecord.reporterAccountId,
    reviewedByAdminId: reportRecord.reviewedByAdminId,
    reviewNotes: reportRecord.reviewNotes,
    targetContext
  };
}

function toReportReviewedDto(reportRecord: ReportRecord): ReportReviewedDto {
  return {
    reportId: reportRecord.reportId,
    campusId: reportRecord.campusId,
    status: reportRecord.status,
    reviewOutcome: reportRecord.reviewOutcome as ReviewOutcome,
    moderationAction: reportRecord.moderationAction,
    reviewedAt: (reportRecord.reviewedAt as Date).toISOString(),
    reviewedByAdminId: reportRecord.reviewedByAdminId as string,
    commandDispatchPending: reportRecord.commandDispatchPending
  };
}
