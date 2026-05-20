import type { AuthenticatedStudentContext } from "../../../shared/src/auth/AuthenticatedStudentContext";
import type {
  ReportSubmittedDto,
  SubmitReportRequestDto
} from "../../../shared/src/domain/dtos";
import {
  ModerationAction,
  ReportStatus,
  ReportTargetType
} from "../../../shared/src/domain/enums";
import { AppError } from "../../../shared/src/errors/AppError";
import { StudentAccount } from "../../../access-profile/src/entities/StudentAccount";
import { StudentAccountRepo } from "../../../access-profile/src/repositories/StudentAccountRepo";
import { ReportRecord } from "../entities/ReportRecord";
import { ReportRepo } from "../repositories/ReportRepo";

export class ReportSubmissionService {
  constructor(
    private readonly reportRepo: Pick<ReportRepo, "instantiate" | "persist">,
    private readonly studentAccountRepo: Pick<StudentAccountRepo, "findById">
  ) {}

  public async submitReport(
    studentContext: AuthenticatedStudentContext,
    request: SubmitReportRequestDto
  ): Promise<ReportSubmittedDto> {
    const validatedRequest = validateSubmitReportRequest(request);
    const selectedCampusId = normalizeOptionalString(studentContext.selectedCampusId);

    if (!selectedCampusId || selectedCampusId !== validatedRequest.campusId) {
      throw new AppError(
        "CAMPUS_SCOPE_VIOLATION",
        "Report campus must match the authenticated student selected campus",
        403,
        {
          authReason: "campus_scope_mismatch"
        }
      );
    }

    if (validatedRequest.targetType === ReportTargetType.Student) {
      if (studentContext.studentAccountId === validatedRequest.targetAccountId) {
        throw AppError.validation("Request validation failed", [
          {
            field: "targetAccountId",
            message: "must not match the authenticated student account",
            code: "self_report_not_allowed"
          }
        ]);
      }

      const targetAccount = await this.studentAccountRepo.findById(
        validatedRequest.targetAccountId
      );

      if (!targetAccount) {
        throw AppError.validation("Request validation failed", [
          {
            field: "targetAccountId",
            message: "must reference an existing student account",
            code: "target_not_found"
          }
        ]);
      }

      assertTargetAccountWithinCampusScope(targetAccount, validatedRequest.campusId);
    }

    const reportRecord = this.reportRepo.instantiate({
      campusId: validatedRequest.campusId,
      reporterAccountId: studentContext.studentAccountId,
      targetType: validatedRequest.targetType,
      targetAccountId: validatedRequest.targetAccountId ?? null,
      targetActivityId: validatedRequest.targetActivityId ?? null,
      reasonCode: validatedRequest.reasonCode,
      description: validatedRequest.description,
      status: ReportStatus.PendingReview,
      reviewedAt: null,
      reviewedByAdminId: null,
      moderationAction: ModerationAction.None,
      reviewOutcome: null,
      reviewNotes: null,
      commandDispatchPending: false
    });
    const savedReportRecord = await this.reportRepo.persist(reportRecord);

    return toReportSubmittedDto(savedReportRecord);
  }
}

interface ValidatedSubmitReportRequest {
  campusId: string;
  targetType: ReportTargetType;
  targetAccountId: string | null;
  targetActivityId: string | null;
  reasonCode: string;
  description: string | null;
}

function validateSubmitReportRequest(
  request: SubmitReportRequestDto
): ValidatedSubmitReportRequest {
  const issues = [];

  if (!request || typeof request !== "object") {
    throw AppError.validation("Request validation failed", [
      {
        field: "body",
        message: "must be an object",
        code: "invalid_type"
      }
    ]);
  }

  const campusId = normalizeOptionalString(request.campusId);
  const targetType = parseReportTargetType(request.targetType);
  const targetAccountId = normalizeOptionalString(request.targetAccountId);
  const targetActivityId = normalizeOptionalString(request.targetActivityId);
  const reasonCode = normalizeOptionalString(request.reasonCode);
  const description = normalizeNullableString(request.description);

  if (!campusId) {
    issues.push({
      field: "campusId",
      message: "must be a non-empty string",
      code: "invalid_type"
    });
  }

  if (!targetType) {
    issues.push({
      field: "targetType",
      message: "must be one of: student, activity",
      code: "invalid_enum"
    });
  }

  if (!reasonCode) {
    issues.push({
      field: "reasonCode",
      message: "must be a non-empty string",
      code: "invalid_type"
    });
  }

  if (request.description !== undefined && request.description !== null && description === null) {
    issues.push({
      field: "description",
      message: "must be a string",
      code: "invalid_type"
    });
  }

  if (targetType === ReportTargetType.Student) {
    if (!targetAccountId) {
      issues.push({
        field: "targetAccountId",
        message: "is required when targetType is student",
        code: "missing_required_field"
      });
    }

    if (targetActivityId) {
      issues.push({
        field: "targetActivityId",
        message: "must be absent when targetType is student",
        code: "unexpected_field"
      });
    }
  }

  if (targetType === ReportTargetType.Activity) {
    if (!targetActivityId) {
      issues.push({
        field: "targetActivityId",
        message: "is required when targetType is activity",
        code: "missing_required_field"
      });
    }

    if (targetAccountId) {
      issues.push({
        field: "targetAccountId",
        message: "must be absent when targetType is activity",
        code: "unexpected_field"
      });
    }
  }

  if (issues.length > 0) {
    throw AppError.validation("Request validation failed", issues);
  }

  return {
    campusId: campusId as string,
    targetType: targetType as ReportTargetType,
    targetAccountId,
    targetActivityId,
    reasonCode: reasonCode as string,
    description
  };
}

function assertTargetAccountWithinCampusScope(
  targetAccount: StudentAccount,
  campusId: string
): void {
  if (!targetAccount.selectedCampusId || targetAccount.selectedCampusId !== campusId) {
    throw new AppError(
      "CAMPUS_SCOPE_VIOLATION",
      "Report target is outside the selected campus scope",
      403,
      {
        authReason: "campus_scope_mismatch"
      }
    );
  }
}

function parseReportTargetType(value: unknown): ReportTargetType | null {
  return value === ReportTargetType.Student || value === ReportTargetType.Activity ? value : null;
}

function normalizeOptionalString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();

  return normalizedValue.length > 0 ? normalizedValue : null;
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

function toReportSubmittedDto(reportRecord: ReportRecord): ReportSubmittedDto {
  return {
    reportId: reportRecord.reportId,
    campusId: reportRecord.campusId,
    reporterAccountId: reportRecord.reporterAccountId,
    targetType: reportRecord.targetType,
    targetAccountId: reportRecord.targetAccountId,
    targetActivityId: reportRecord.targetActivityId,
    reasonCode: reportRecord.reasonCode,
    description: reportRecord.description,
    status: reportRecord.status,
    submittedAt: reportRecord.submittedAt.toISOString()
  };
}
