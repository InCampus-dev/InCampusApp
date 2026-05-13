import {
  CreateStudentProfileRequestDto,
  StudentProfileDto,
  UpdateStudentProfileRequestDto
} from "../../../shared/src/domain/dtos";
import { StudentProfileGender } from "../../../shared/src/domain/enums";
import { AppError } from "../../../shared/src/errors/AppError";
import { StudentProfile } from "../entities/StudentProfile";
import { StudentProfileRepo } from "../repositories/StudentProfileRepo";

interface NormalizedStudentProfileFields {
  displayName?: string;
  major?: string;
  dateOfBirth?: string | null;
  gender?: StudentProfileGender | null;
  interests?: string[];
  languages?: string[];
  shortBio?: string | null;
}

type StudentProfileEditableField =
  | "displayName"
  | "major"
  | "dateOfBirth"
  | "gender"
  | "interests"
  | "languages"
  | "shortBio";

export class StudentProfileService {
  constructor(private readonly studentProfileRepo: StudentProfileRepo) {}

  public async createOwnProfile(
    studentAccountId: string,
    payload: CreateStudentProfileRequestDto
  ): Promise<StudentProfileDto> {
    const existingProfile = await this.studentProfileRepo.findByStudentAccountId(studentAccountId);
    if (existingProfile) {
      throw new AppError("CONFLICT", "Student profile already exists", 409, {
        conflictResource: "StudentProfile"
      });
    }

    const normalizedFields = normalizeStudentProfilePayload(payload, {
      requireCoreFields: true
    });

    const savedProfile = await this.studentProfileRepo.save(
      this.studentProfileRepo.create({
        studentAccountId,
        displayName: normalizedFields.displayName!,
        major: normalizedFields.major!,
        dateOfBirth: normalizedFields.dateOfBirth ?? null,
        gender: normalizedFields.gender ?? null,
        interests: normalizedFields.interests ?? [],
        languages: normalizedFields.languages ?? [],
        shortBio: normalizedFields.shortBio ?? null,
        updatedAt: null
      })
    );

    return mapStudentProfileToDto(savedProfile);
  }

  public async getOwnProfile(studentAccountId: string): Promise<StudentProfileDto> {
    const studentProfile = await this.studentProfileRepo.findByStudentAccountId(studentAccountId);
    if (!studentProfile) {
      throw AppError.notFound("StudentProfile", studentAccountId);
    }

    return mapStudentProfileToDto(studentProfile);
  }

  public async updateOwnProfile(
    studentAccountId: string,
    payload: UpdateStudentProfileRequestDto
  ): Promise<StudentProfileDto> {
    const studentProfile = await this.studentProfileRepo.findByStudentAccountId(studentAccountId);
    if (!studentProfile) {
      throw AppError.notFound("StudentProfile", studentAccountId);
    }

    const normalizedFields = normalizeStudentProfilePayload(payload, {
      requireCoreFields: false
    });

    applyNormalizedProfileFields(studentProfile, normalizedFields);
    assertCoreProfileFields(studentProfile.displayName, studentProfile.major);
    studentProfile.updatedAt = new Date();

    const savedProfile = await this.studentProfileRepo.save(studentProfile);
    return mapStudentProfileToDto(savedProfile);
  }
}

function normalizeStudentProfilePayload(
  payload: CreateStudentProfileRequestDto | UpdateStudentProfileRequestDto,
  options: { requireCoreFields: boolean }
): NormalizedStudentProfileFields {
  const validationIssues: Array<{ field: string; message: string; code: string }> = [];
  const normalizedFields: NormalizedStudentProfileFields = {};
  const hasOwn = (field: StudentProfileEditableField): boolean =>
    Object.prototype.hasOwnProperty.call(payload, field);
  let providedFieldCount = 0;

  if (options.requireCoreFields && !hasOwn("displayName")) {
    validationIssues.push({
      field: "displayName",
      message: "displayName is required",
      code: "missing_required_field"
    });
  }
  if (options.requireCoreFields && !hasOwn("major")) {
    validationIssues.push({
      field: "major",
      message: "major is required",
      code: "missing_required_field"
    });
  }

  if (hasOwn("displayName")) {
    providedFieldCount += 1;
    normalizedFields.displayName = normalizeRequiredString(
      payload.displayName,
      "displayName",
      validationIssues
    );
  }

  if (hasOwn("major")) {
    providedFieldCount += 1;
    normalizedFields.major = normalizeRequiredString(payload.major, "major", validationIssues);
  }

  if (hasOwn("dateOfBirth")) {
    providedFieldCount += 1;
    normalizedFields.dateOfBirth = normalizeDateOfBirth(payload.dateOfBirth, validationIssues);
  }

  if (hasOwn("gender")) {
    providedFieldCount += 1;
    normalizedFields.gender = normalizeStudentProfileGender(payload.gender, validationIssues);
  }

  if (hasOwn("interests")) {
    providedFieldCount += 1;
    normalizedFields.interests = normalizeStringList(
      payload.interests,
      "interests",
      validationIssues
    );
  }

  if (hasOwn("languages")) {
    providedFieldCount += 1;
    normalizedFields.languages = normalizeStringList(
      payload.languages,
      "languages",
      validationIssues
    );
  }

  if (hasOwn("shortBio")) {
    providedFieldCount += 1;
    normalizedFields.shortBio = normalizeShortBio(payload.shortBio, validationIssues);
  }

  if (!options.requireCoreFields && providedFieldCount === 0) {
    validationIssues.push({
      field: "body",
      message: "At least one updatable profile field is required",
      code: "empty_update_payload"
    });
  }

  if (validationIssues.length > 0) {
    throw AppError.validation("Request validation failed", validationIssues);
  }

  if (options.requireCoreFields) {
    return {
      displayName: normalizedFields.displayName!,
      major: normalizedFields.major!,
      dateOfBirth: normalizedFields.dateOfBirth ?? null,
      gender: normalizedFields.gender ?? null,
      interests: normalizedFields.interests ?? [],
      languages: normalizedFields.languages ?? [],
      shortBio: normalizedFields.shortBio ?? null
    };
  }

  return normalizedFields;
}

function normalizeRequiredString(
  value: unknown,
  field: string,
  validationIssues: Array<{ field: string; message: string; code: string }>
): string | undefined {
  if (typeof value !== "string") {
    validationIssues.push({
      field,
      message: `${field} must be a string`,
      code: "invalid_field_type"
    });
    return undefined;
  }

  const trimmedValue = value.trim();
  if (trimmedValue.length === 0) {
    validationIssues.push({
      field,
      message: `${field} must not be empty`,
      code: "empty_string"
    });
    return undefined;
  }

  return trimmedValue;
}

function normalizeDateOfBirth(
  value: unknown,
  validationIssues: Array<{ field: string; message: string; code: string }>
): string | null | undefined {
  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    validationIssues.push({
      field: "dateOfBirth",
      message: "dateOfBirth must be an ISO date string or null",
      code: "invalid_field_type"
    });
    return undefined;
  }

  const trimmedValue = value.trim();
  if (trimmedValue.length === 0) {
    validationIssues.push({
      field: "dateOfBirth",
      message: "dateOfBirth must not be empty",
      code: "empty_string"
    });
    return undefined;
  }

  const parsedDate = new Date(trimmedValue);
  if (Number.isNaN(parsedDate.getTime())) {
    validationIssues.push({
      field: "dateOfBirth",
      message: "dateOfBirth must be a valid ISO date string",
      code: "invalid_date"
    });
    return undefined;
  }

  return parsedDate.toISOString().slice(0, 10);
}

function normalizeStudentProfileGender(
  value: unknown,
  validationIssues: Array<{ field: string; message: string; code: string }>
): StudentProfileGender | null | undefined {
  if (value === null) {
    return null;
  }

  if (
    value !== StudentProfileGender.Male &&
    value !== StudentProfileGender.Female &&
    value !== StudentProfileGender.Other &&
    value !== StudentProfileGender.PreferNotToSay
  ) {
    validationIssues.push({
      field: "gender",
      message: "gender must be a supported student profile gender value or null",
      code: "invalid_enum_value"
    });
    return undefined;
  }

  return value;
}

function normalizeStringList(
  value: unknown,
  field: string,
  validationIssues: Array<{ field: string; message: string; code: string }>
): string[] | undefined {
  if (!Array.isArray(value)) {
    validationIssues.push({
      field,
      message: `${field} must be an array of non-empty strings`,
      code: "invalid_field_type"
    });
    return undefined;
  }

  const normalizedValues: string[] = [];

  value.forEach((entry, index) => {
    if (typeof entry !== "string") {
      validationIssues.push({
        field: `${field}[${index}]`,
        message: `${field} entries must be strings`,
        code: "invalid_field_type"
      });
      return;
    }

    const trimmedEntry = entry.trim();
    if (trimmedEntry.length === 0) {
      validationIssues.push({
        field: `${field}[${index}]`,
        message: `${field} entries must not be empty`,
        code: "empty_string"
      });
      return;
    }

    normalizedValues.push(trimmedEntry);
  });

  return normalizedValues;
}

function normalizeShortBio(
  value: unknown,
  validationIssues: Array<{ field: string; message: string; code: string }>
): string | null | undefined {
  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    validationIssues.push({
      field: "shortBio",
      message: "shortBio must be a string or null",
      code: "invalid_field_type"
    });
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length === 0 ? null : trimmedValue;
}

function applyNormalizedProfileFields(
  studentProfile: StudentProfile,
  normalizedFields: NormalizedStudentProfileFields
): void {
  if (normalizedFields.displayName !== undefined) {
    studentProfile.displayName = normalizedFields.displayName;
  }
  if (normalizedFields.major !== undefined) {
    studentProfile.major = normalizedFields.major;
  }
  if (normalizedFields.dateOfBirth !== undefined) {
    studentProfile.dateOfBirth = normalizedFields.dateOfBirth;
  }
  if (normalizedFields.gender !== undefined) {
    studentProfile.gender = normalizedFields.gender;
  }
  if (normalizedFields.interests !== undefined) {
    studentProfile.interests = normalizedFields.interests;
  }
  if (normalizedFields.languages !== undefined) {
    studentProfile.languages = normalizedFields.languages;
  }
  if (normalizedFields.shortBio !== undefined) {
    studentProfile.shortBio = normalizedFields.shortBio;
  }
}

function assertCoreProfileFields(displayName: string, major: string): void {
  const validationIssues: Array<{ field: string; message: string; code: string }> = [];

  if (displayName.trim().length === 0) {
    validationIssues.push({
      field: "displayName",
      message: "displayName must not be empty",
      code: "empty_string"
    });
  }

  if (major.trim().length === 0) {
    validationIssues.push({
      field: "major",
      message: "major must not be empty",
      code: "empty_string"
    });
  }

  if (validationIssues.length > 0) {
    throw AppError.validation("Request validation failed", validationIssues);
  }
}

function mapStudentProfileToDto(studentProfile: StudentProfile): StudentProfileDto {
  return {
    profileId: studentProfile.profileId,
    studentAccountId: studentProfile.studentAccountId,
    displayName: studentProfile.displayName,
    major: studentProfile.major,
    dateOfBirth: studentProfile.dateOfBirth ?? null,
    gender: studentProfile.gender ?? null,
    interests: [...studentProfile.interests],
    languages: [...studentProfile.languages],
    shortBio: studentProfile.shortBio ?? null,
    createdAt: studentProfile.createdAt.toISOString(),
    updatedAt: studentProfile.updatedAt ? studentProfile.updatedAt.toISOString() : null
  };
}
