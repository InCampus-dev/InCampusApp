import {
  createDefaultCampusInsightConsentSettings,
  createLegacyEnabledCampusInsightConsentSettings,
  deriveCampusInsightSharingConsent,
  normalizeCampusInsightConsentSettings,
  normalizeStringArray
} from "../../../shared/src/domain/campusInsightConsent";
import type {
  CampusInsightConsentDto,
  CampusInsightConsentSettingsDto
} from "../../../shared/src/domain/dtos";
import { AppError } from "../../../shared/src/errors/AppError";
import { StudentAccountRepo } from "../repositories/StudentAccountRepo";

export class CampusInsightConsentService {
  constructor(private readonly studentAccountRepo: StudentAccountRepo) {}

  public async getOwnConsent(studentAccountId: string): Promise<CampusInsightConsentDto> {
    const studentAccount = await this.getStudentAccount(studentAccountId);

    return toCampusInsightConsentDto(studentAccount);
  }

  public async updateOwnConsent(
    studentAccountId: string,
    campusInsightSharingConsent: boolean
  ): Promise<CampusInsightConsentDto> {
    const settings = campusInsightSharingConsent
      ? createLegacyEnabledCampusInsightConsentSettings()
      : createDefaultCampusInsightConsentSettings();

    return this.updateOwnInsightConsent(studentAccountId, settings);
  }

  public async updateOwnInsightConsent(
    studentAccountId: string,
    request: unknown
  ): Promise<CampusInsightConsentDto> {
    const studentAccount = await this.getStudentAccount(studentAccountId);
    const settings = validateCampusInsightConsentSettingsRequest(request);

    studentAccount.campusInsightConsentSettings = settings;
    studentAccount.campusInsightSharingConsent = deriveCampusInsightSharingConsent(settings);

    const savedAccount = await this.studentAccountRepo.save(studentAccount);

    return toCampusInsightConsentDto(savedAccount);
  }

  private async getStudentAccount(studentAccountId: string) {
    const studentAccount = await this.studentAccountRepo.findById(studentAccountId);
    if (!studentAccount) {
      throw AppError.notFound("StudentAccount", studentAccountId);
    }

    return studentAccount;
  }
}

function validateCampusInsightConsentSettingsRequest(
  request: unknown
): CampusInsightConsentSettingsDto {
  const payload = unwrapSettingsPayload(request);
  const issues = [];

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw AppError.validation("Request validation failed", [
      {
        field: "body",
        message: "must be an object",
        code: "invalid_type"
      }
    ]);
  }

  if (typeof payload.basicInsightsEnabled !== "boolean") {
    issues.push({
      field: "basicInsightsEnabled",
      message: "basicInsightsEnabled must be a boolean",
      code: "invalid_field_type"
    });
  }

  if (typeof payload.activityInsightsEnabled !== "boolean") {
    issues.push({
      field: "activityInsightsEnabled",
      message: "activityInsightsEnabled must be a boolean",
      code: "invalid_field_type"
    });
  }

  if (!Array.isArray(payload.hiddenActivityCategoryIds)) {
    issues.push({
      field: "hiddenActivityCategoryIds",
      message: "hiddenActivityCategoryIds must be an array of strings",
      code: "invalid_field_type"
    });
  } else if (payload.hiddenActivityCategoryIds.some((item) => typeof item !== "string")) {
    issues.push({
      field: "hiddenActivityCategoryIds",
      message: "hiddenActivityCategoryIds must be an array of strings",
      code: "invalid_field_type"
    });
  }

  if (typeof payload.excludeCoParticipants !== "boolean") {
    issues.push({
      field: "excludeCoParticipants",
      message: "excludeCoParticipants must be a boolean",
      code: "invalid_field_type"
    });
  }

  if (issues.length > 0) {
    throw AppError.validation("Request validation failed", issues);
  }

  return {
    basicInsightsEnabled: payload.basicInsightsEnabled as boolean,
    activityInsightsEnabled: payload.activityInsightsEnabled as boolean,
    hiddenActivityCategoryIds: normalizeStringArray(
      payload.hiddenActivityCategoryIds as unknown[]
    ),
    excludeCoParticipants: payload.excludeCoParticipants as boolean
  };
}

function unwrapSettingsPayload(request: unknown): Record<string, unknown> | null {
  if (!request || typeof request !== "object" || Array.isArray(request)) {
    return null;
  }

  const requestRecord = request as Record<string, unknown>;
  const wrappedSettings = requestRecord.campusInsightConsentSettings;

  if (
    wrappedSettings &&
    typeof wrappedSettings === "object" &&
    !Array.isArray(wrappedSettings)
  ) {
    return wrappedSettings as Record<string, unknown>;
  }

  return requestRecord;
}

function toCampusInsightConsentDto(studentAccount: {
  campusInsightSharingConsent: boolean;
  campusInsightConsentSettings?: unknown;
}): CampusInsightConsentDto {
  const settings = normalizeCampusInsightConsentSettings(
    studentAccount.campusInsightConsentSettings,
    studentAccount.campusInsightSharingConsent
  );

  return {
    campusInsightSharingConsent: deriveCampusInsightSharingConsent(settings),
    campusInsightConsentSettings: settings
  };
}
