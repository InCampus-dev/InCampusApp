import {
  type CreateStructuredOptionRequestDto,
  type UpdateStructuredOptionRequestDto
} from "../../../shared/src/domain/dtos";
import { CampusStructuredOptionType } from "../../../shared/src/domain/enums";
import { AppError } from "../../../shared/src/errors/AppError";
import type { ValidationIssue } from "../../../shared/src/errors/ErrorContract";

export interface ValidatedStructuredOptionInput {
  optionType: CampusStructuredOptionType;
  name: string;
  description: string | null;
  isActive: boolean;
}

export interface ValidatedStructuredOptionUpdate {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export function parseCampusStructuredOptionType(
  value: unknown,
  field = "optionType"
): CampusStructuredOptionType {
  if (value === CampusStructuredOptionType.ActivityCategory) {
    return CampusStructuredOptionType.ActivityCategory;
  }

  if (value === CampusStructuredOptionType.CampusLocation) {
    return CampusStructuredOptionType.CampusLocation;
  }

  throw AppError.validation("Request validation failed", [
    {
      field,
      message: "must be one of activity_category or campus_location",
      code: "invalid_option_type"
    }
  ]);
}

export function validateStructuredOptionCreate(
  request: CreateStructuredOptionRequestDto
): ValidatedStructuredOptionInput {
  const issues: ValidationIssue[] = [];
  const optionType = parseCampusStructuredOptionType(request.optionType);
  const name = normalizeRequiredString(request.name, "name", issues);
  const description = normalizeOptionalString(request.description, "description", issues);
  const isActive = normalizeOptionalBoolean(request.isActive, "isActive", issues) ?? true;

  if (issues.length > 0) {
    throw AppError.validation("Request validation failed", issues);
  }

  return {
    optionType,
    name,
    description,
    isActive
  };
}

export function validateStructuredOptionUpdate(
  request: UpdateStructuredOptionRequestDto
): ValidatedStructuredOptionUpdate {
  const issues: ValidationIssue[] = [];

  const name =
    request.name === undefined ? undefined : normalizeRequiredString(request.name, "name", issues);
  const description =
    request.description === undefined
      ? undefined
      : normalizeOptionalString(request.description, "description", issues);
  const isActive =
    request.isActive === undefined
      ? undefined
      : normalizeOptionalBoolean(request.isActive, "isActive", issues);

  if (name === undefined && description === undefined && isActive === undefined) {
    issues.push({
      field: "body",
      message: "must include at least one updatable field",
      code: "empty_patch"
    });
  }

  if (issues.length > 0) {
    throw AppError.validation("Request validation failed", issues);
  }

  return {
    name,
    description,
    isActive
  };
}

export function validateInitialStructuredOptions(
  initialStructuredOptions: CreateStructuredOptionRequestDto[] | undefined
): ValidatedStructuredOptionInput[] {
  if (initialStructuredOptions === undefined) {
    return [];
  }

  if (!Array.isArray(initialStructuredOptions)) {
    throw AppError.validation("Request validation failed", [
      {
        field: "initialStructuredOptions",
        message: "must be an array when provided",
        code: "invalid_array"
      }
    ]);
  }

  const validatedOptions = initialStructuredOptions.map((option) =>
    validateStructuredOptionCreate(option)
  );

  const duplicates = new Set<string>();

  validatedOptions.forEach((option) => {
    const key = `${option.optionType}:${option.name}`;

    if (duplicates.has(key)) {
      throw AppError.conflict(
        "Initial structured options contain duplicates for the same campus and option type",
        "CampusStructuredOption"
      );
    }

    duplicates.add(key);
  });

  return validatedOptions;
}

export function parseIncludeInactive(value: unknown): boolean {
  if (value === undefined) {
    return false;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  throw AppError.validation("Request validation failed", [
    {
      field: "includeInactive",
      message: "must be true or false when provided",
      code: "invalid_boolean"
    }
  ]);
}

function normalizeRequiredString(
  value: unknown,
  field: string,
  issues: ValidationIssue[]
): string {
  if (typeof value !== "string") {
    issues.push({
      field,
      message: "must be a string",
      code: "invalid_type"
    });
    return "";
  }

  const normalizedValue = value.trim();

  if (normalizedValue.length === 0) {
    issues.push({
      field,
      message: "must not be empty",
      code: "empty_string"
    });
  }

  return normalizedValue;
}

function normalizeOptionalString(
  value: unknown,
  field: string,
  issues: ValidationIssue[]
): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    issues.push({
      field,
      message: "must be a string or null",
      code: "invalid_type"
    });
    return null;
  }

  const normalizedValue = value.trim();

  return normalizedValue.length === 0 ? null : normalizedValue;
}

function normalizeOptionalBoolean(
  value: unknown,
  field: string,
  issues: ValidationIssue[]
): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "boolean") {
    issues.push({
      field,
      message: "must be a boolean",
      code: "invalid_type"
    });
    return undefined;
  }

  return value;
}
