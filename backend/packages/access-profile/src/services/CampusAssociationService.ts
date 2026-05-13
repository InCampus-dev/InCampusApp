// Task: AP07 | Path: backend/packages/access-profile/src/services/CampusAssociationService.ts

import { Repository } from "typeorm";

import { Campus } from "../../../campus-administration/src/entities/Campus";
import { CampusSummaryDto } from "../../../shared/src/domain/dtos";
import { AppError } from "../../../shared/src/errors/AppError";
import { StudentAccountRepo } from "../repositories/StudentAccountRepo";

export class CampusAssociationService {
  constructor(
    private readonly studentAccountRepo: StudentAccountRepo,
    private readonly campusRepo: Repository<Campus>
  ) {}

  /**
   * GET /campuses — list all active campuses from DS-CA-001.
   * AP reads DS-CA-001 but never writes it (CA ownership).
   * FR-0105: students must be able to see available campuses.
   */
  public async getCampuses(): Promise<CampusSummaryDto[]> {
    const campuses = await this.campusRepo.find({
      where: { activationStatus: true },
    });

    if (campuses.length === 0) {
      throw AppError.notFound("Campus", "active campuses");
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
    const campus = await this.campusRepo.findOne({
      where: { campusId, activationStatus: true },
    });
    if (!campus) {
      throw AppError.notFound("Campus", campusId);
    }

    const account = await this.studentAccountRepo.findById(accountId);
    if (!account) {
      throw AppError.notFound("StudentAccount", accountId);
    }

    account.selectedCampusId = campusId;
    await this.studentAccountRepo.save(account);
  }
}
