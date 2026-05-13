// Task: AP07 | Path: backend/packages/access-profile/src/services/CampusAssociationService.ts

import { Repository } from "typeorm";

import { Campus } from "../../../campus-administration/src/entities/Campus";
import { CampusSummaryDto } from "../../../shared/src/domain/dtos";
import { AppError } from "../../../shared/src/errors/AppError";
import { IdentityRuleRepo } from "../repositories/IdentityRuleRepo";
import { StudentAccountRepo } from "../repositories/StudentAccountRepo";

export class CampusAssociationService {
  constructor(
    private readonly studentAccountRepo: StudentAccountRepo,
    private readonly campusRepo: Repository<Campus>,
    private readonly identityRuleRepo: IdentityRuleRepo
  ) {}

  /**
   * GET /campuses — list all active campuses associated with the student's university.
   * AP reads DS-CA-001 but never writes it (CA ownership).
   * FR-0105: students must be able to see available campuses.
   */
  public async getCampuses(universityEmail: string): Promise<CampusSummaryDto[]> {
    const universityName = await this.resolveUniversityName(universityEmail);
    const campuses = await this.campusRepo.find({
      where: {
        activationStatus: true,
        universityName
      }
    });

    if (campuses.length === 0) {
      throw AppError.notFound("Campus", `active campuses for ${universityName}`);
    }

    return campuses.map((c) => ({
      campusId: c.campusId,
      universityName: c.universityName,
      campusName: c.campusName,
      activationStatus: c.activationStatus,
    }));
  }

  /**
   * PATCH /accounts/me/campus — associate student with selected campus.
   * Validates campus exists and is active in DS-CA-001, then updates DS-AP-001.SelectedCampusID.
   * FR-1601: CampusID becomes the tenant boundary for all downstream content.
   */
  public async selectCampus(accountId: string, campusId: string): Promise<void> {
    const account = await this.studentAccountRepo.findById(accountId);
    if (!account) {
      throw AppError.notFound("StudentAccount", accountId);
    }

    const universityName = await this.resolveUniversityName(account.universityEmail);
    const campus = await this.campusRepo.findOne({
      where: {
        campusId,
        activationStatus: true,
        universityName
      }
    });
    if (!campus) {
      throw AppError.notFound("Campus", campusId);
    }

    account.selectedCampusId = campusId;
    await this.studentAccountRepo.save(account);
  }

  private async resolveUniversityName(universityEmail: string): Promise<string> {
    const emailDomain = universityEmail.split("@")[1]?.trim().toLowerCase();
    if (!emailDomain) {
      throw AppError.validation("Invalid university email", [
        {
          field: "universityEmail",
          message: "must contain a valid university email domain",
          code: "invalid_university_email"
        }
      ]);
    }

    const identityRule = await this.identityRuleRepo.findByDomain(emailDomain);
    if (!identityRule || identityRule.ruleStatus !== "Active") {
      throw AppError.notFound("Campus", `active campuses for ${emailDomain}`);
    }

    return identityRule.universityName;
  }
}
