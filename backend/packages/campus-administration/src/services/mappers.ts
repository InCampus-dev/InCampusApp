import {
  type CampusCreatedDto,
  type CampusStructuredOptionDto
} from "../../../shared/src/domain/dtos";
import { Campus } from "../entities/Campus";
import { CampusStructuredOption } from "../entities/CampusStructuredOption";

export function toCampusCreatedDto(
  campus: Campus,
  structuredOptions: CampusStructuredOption[]
): CampusCreatedDto {
  return {
    campusId: campus.campusId,
    universityName: campus.universityName,
    campusName: campus.campusName,
    activationStatus: campus.activationStatus,
    structuredOptions: structuredOptions.map(toCampusStructuredOptionDto)
  };
}

export function toCampusStructuredOptionDto(
  option: CampusStructuredOption
): CampusStructuredOptionDto {
  return {
    optionId: option.optionId,
    campusId: option.campusId,
    optionType: option.optionType,
    name: option.name,
    description: option.description,
    isActive: option.isActive,
    createdAt: option.createdAt.toISOString(),
    updatedAt: option.updatedAt.toISOString()
  };
}
