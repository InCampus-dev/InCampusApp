import type { AuthenticatedAdminContext } from "../../../shared/src/auth/AuthenticatedAdminContext";
import type {
  CreateStructuredOptionRequestDto,
  DeletionConfirmationDto,
  UpdateStructuredOptionRequestDto
} from "../../../shared/src/domain/dtos";
import { type CampusStructuredOptionType } from "../../../shared/src/domain/enums";
import { AppError } from "../../../shared/src/errors/AppError";
import { CampusRepo } from "../repositories/CampusRepo";
import { type CampusOptionsRepo } from "../repositories/CampusOptionsRepo";
import { CampusAuthorizationService } from "./CampusAuthorizationService";
import { toCampusStructuredOptionDto } from "./mappers";
import {
  parseCampusStructuredOptionType,
  parseIncludeInactive,
  validateStructuredOptionCreate,
  validateStructuredOptionUpdate
} from "./structuredOptionValidation";

export interface CampusStructuredOptionLookup {
  findSelectableOption(
    campusId: string,
    optionId: string,
    optionType: CampusStructuredOptionType
  ): Promise<ReturnType<typeof toCampusStructuredOptionDto> | null>;
}

export class CampusOptionsService implements CampusStructuredOptionLookup {
  constructor(
    private readonly campusRepo: Pick<CampusRepo, "findByCampusId">,
    private readonly campusOptionsRepo: Pick<
      CampusOptionsRepo,
      | "findByCampus"
      | "findByCampusAndOptionId"
      | "findByCampusTypeAndName"
      | "findSelectableOption"
      | "instantiate"
      | "persist"
    >,
    private readonly campusAuthorizationService: CampusAuthorizationService
  ) {}

  public async listStructuredOptions(
    adminContext: AuthenticatedAdminContext,
    campusId: string,
    filters: {
      optionType?: unknown;
      includeInactive?: unknown;
    }
  ) {
    this.campusAuthorizationService.assertCanManageCampus(adminContext, campusId);
    await this.assertCampusExists(campusId);

    const optionType =
      filters.optionType === undefined
        ? undefined
        : parseCampusStructuredOptionType(filters.optionType);
    const includeInactive = parseIncludeInactive(filters.includeInactive);

    const options = await this.campusOptionsRepo.findByCampus({
      campusId,
      optionType,
      includeInactive
    });

    return options.map(toCampusStructuredOptionDto);
  }

  public async listSelectableStructuredOptionsForStudent(
    studentContext: { selectedCampusId?: string | null },
    campusId: string,
    filters: {
      optionType?: unknown;
    }
  ) {
    if (!studentContext.selectedCampusId || studentContext.selectedCampusId !== campusId) {
      throw new AppError("AUTH_FORBIDDEN", "Student is not authorized for this campus", 403, {
        authReason: "campus_not_selected"
      });
    }

    await this.assertCampusExists(campusId);

    const optionType =
      filters.optionType === undefined
        ? undefined
        : parseCampusStructuredOptionType(filters.optionType);

    const options = await this.campusOptionsRepo.findByCampus({
      campusId,
      optionType,
      includeInactive: false
    });

    return options.map(toCampusStructuredOptionDto);
  }

  public async createStructuredOption(
    adminContext: AuthenticatedAdminContext,
    campusId: string,
    request: CreateStructuredOptionRequestDto
  ) {
    this.campusAuthorizationService.assertCanManageCampus(adminContext, campusId);
    await this.assertCampusExists(campusId);

    const validatedOption = validateStructuredOptionCreate(request);
    await this.assertOptionNameAvailable(campusId, validatedOption.optionType, validatedOption.name);

    const option = this.campusOptionsRepo.instantiate({
      campusId,
      optionType: validatedOption.optionType,
      name: validatedOption.name,
      description: validatedOption.description,
      isActive: validatedOption.isActive
    });

    try {
      const savedOption = await this.campusOptionsRepo.persist(option);

      return toCampusStructuredOptionDto(savedOption);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw AppError.conflict(
          "Structured option already exists for this campus and option type",
          "CampusStructuredOption"
        );
      }

      throw error;
    }
  }

  public async updateStructuredOption(
    adminContext: AuthenticatedAdminContext,
    campusId: string,
    optionId: string,
    request: UpdateStructuredOptionRequestDto
  ) {
    this.campusAuthorizationService.assertCanManageCampus(adminContext, campusId);
    await this.assertCampusExists(campusId);

    const option = await this.campusOptionsRepo.findByCampusAndOptionId(campusId, optionId);

    if (!option) {
      throw AppError.notFound("CampusStructuredOption", optionId);
    }

    const validatedUpdate = validateStructuredOptionUpdate(request);

    if (validatedUpdate.name && validatedUpdate.name !== option.name) {
      await this.assertOptionNameAvailable(campusId, option.optionType, validatedUpdate.name, optionId);
      option.name = validatedUpdate.name;
    }

    if (validatedUpdate.description !== undefined) {
      option.description = validatedUpdate.description;
    }

    if (validatedUpdate.isActive !== undefined) {
      option.isActive = validatedUpdate.isActive;
    }

    try {
      const savedOption = await this.campusOptionsRepo.persist(option);

      return toCampusStructuredOptionDto(savedOption);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw AppError.conflict(
          "Structured option already exists for this campus and option type",
          "CampusStructuredOption"
        );
      }

      throw error;
    }
  }

  public async deactivateStructuredOption(
    adminContext: AuthenticatedAdminContext,
    campusId: string,
    optionId: string
  ): Promise<DeletionConfirmationDto> {
    this.campusAuthorizationService.assertCanManageCampus(adminContext, campusId);
    await this.assertCampusExists(campusId);

    const option = await this.campusOptionsRepo.findByCampusAndOptionId(campusId, optionId);

    if (!option) {
      throw AppError.notFound("CampusStructuredOption", optionId);
    }

    if (option.isActive) {
      option.isActive = false;
      await this.campusOptionsRepo.persist(option);
    }

    return {
      deactivated: true,
      resourceType: "CampusStructuredOption",
      resourceId: optionId
    };
  }

  public async findSelectableOption(
    campusId: string,
    optionId: string,
    optionType: CampusStructuredOptionType
  ) {
    const option = await this.campusOptionsRepo.findSelectableOption(campusId, optionId, optionType);

    return option ? toCampusStructuredOptionDto(option) : null;
  }

  private async assertCampusExists(campusId: string): Promise<void> {
    const campus = await this.campusRepo.findByCampusId(campusId);

    if (!campus) {
      throw AppError.notFound("Campus", campusId);
    }
  }

  private async assertOptionNameAvailable(
    campusId: string,
    optionType: CampusStructuredOptionType,
    name: string,
    currentOptionId?: string
  ): Promise<void> {
    const existingOption = await this.campusOptionsRepo.findByCampusTypeAndName(
      campusId,
      optionType,
      name
    );

    if (existingOption && existingOption.optionId !== currentOptionId) {
      throw AppError.conflict(
        "Structured option already exists for this campus and option type",
        "CampusStructuredOption"
      );
    }
  }
}

function isUniqueViolation(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "23505"
  );
}
