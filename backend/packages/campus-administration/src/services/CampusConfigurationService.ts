import type { AuthenticatedAdminContext } from "../../../shared/src/auth/AuthenticatedAdminContext";
import { type CampusCreatedDto, type CreateCampusRequestDto } from "../../../shared/src/domain/dtos";
import { AppError } from "../../../shared/src/errors/AppError";
import { Campus } from "../entities/Campus";
import { CampusStructuredOption } from "../entities/CampusStructuredOption";
import { CampusAuthorizationService } from "./CampusAuthorizationService";
import { toCampusCreatedDto } from "./mappers";
import { validateInitialStructuredOptions } from "./structuredOptionValidation";

export interface CampusConfigurationTransactionExecutor {
  transaction<T>(
    runInTransaction: (manager: {
      getRepository(entity: typeof Campus): {
        findOne(args: { where: { campusId: string } }): Promise<Campus | null>;
        create(payload: Partial<Campus>): Campus;
        save(campus: Campus): Promise<Campus>;
      };
      getRepository(entity: typeof CampusStructuredOption): {
        create(payload: Partial<CampusStructuredOption>): CampusStructuredOption;
        save(options: CampusStructuredOption[]): Promise<CampusStructuredOption[]>;
      };
    }) => Promise<T>
  ): Promise<T>;
}

export class CampusConfigurationService {
  constructor(
    private readonly dataSource: CampusConfigurationTransactionExecutor,
    private readonly campusAuthorizationService: CampusAuthorizationService
  ) {}

  public async createCampus(
    adminContext: AuthenticatedAdminContext,
    request: CreateCampusRequestDto
  ): Promise<CampusCreatedDto> {
    const campusId = this.campusAuthorizationService.assertCanConfigureSelectedCampus(
      adminContext,
      request.campusId
    );
    const validatedCampus = validateCreateCampusRequest(request);
    const initialStructuredOptions = validateInitialStructuredOptions(
      request.initialStructuredOptions
    );

    try {
      return await this.dataSource.transaction(async (manager) => {
        const campusRepository = manager.getRepository(Campus);
        const campusOptionsRepository = manager.getRepository(CampusStructuredOption);

        const existingCampus = await campusRepository.findOne({ where: { campusId } });

        if (existingCampus) {
          throw AppError.conflict("Campus has already been configured", "Campus");
        }

        const campus = campusRepository.create({
          campusId,
          universityName: validatedCampus.universityName,
          campusName: validatedCampus.campusName,
          activationStatus: validatedCampus.activationStatus
        });

        await campusRepository.save(campus);

        const structuredOptions = initialStructuredOptions.map((option) =>
          campusOptionsRepository.create({
            campusId,
            optionType: option.optionType,
            name: option.name,
            description: option.description,
            isActive: option.isActive
          })
        );

        const savedStructuredOptions =
          structuredOptions.length > 0 ? await campusOptionsRepository.save(structuredOptions) : [];

        return toCampusCreatedDto(campus, savedStructuredOptions);
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw AppError.conflict("Campus configuration conflicts with an existing record", "Campus");
      }

      throw error;
    }
  }
}

function validateCreateCampusRequest(request: CreateCampusRequestDto): {
  universityName: string;
  campusName: string;
  activationStatus: boolean;
} {
  const issues = [];
  const universityName = normalizeCampusString(request.universityName, "universityName", issues);
  const campusName = normalizeCampusString(request.campusName, "campusName", issues);

  if (
    request.activationStatus !== undefined &&
    typeof request.activationStatus !== "boolean"
  ) {
    issues.push({
      field: "activationStatus",
      message: "must be a boolean when provided",
      code: "invalid_type"
    });
  }

  if (issues.length > 0) {
    throw AppError.validation("Request validation failed", issues);
  }

  return {
    universityName,
    campusName,
    activationStatus: request.activationStatus ?? false
  };
}

function normalizeCampusString(
  value: unknown,
  field: string,
  issues: Array<{ field: string; message: string; code: string }>
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

function isUniqueViolation(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "23505"
  );
}
