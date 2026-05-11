// Task: AP07 | Path: backend/packages/access-profile/src/services/CampusAssociationService.ts
// STATUS: PARTIAL — AWAITING S08 SEED FROM FRANCESCO
// getCampuses returns hardcoded data until DS-CA-001 is seeded (task AP07 completion on Day 3).

import { AppError } from "../../../shared/src/errors/AppError";
import { StudentAccountRepo } from "../repositories/StudentAccountRepo";

export interface CampusSummary {
  campusId: string;
  campusName: string;
  universityName: string;
}

export class CampusAssociationService {
  private readonly mockCampuses: CampusSummary[] = [
    { campusId: "campus-001", campusName: "Jiading Campus", universityName: "Tongji University" },
    { campusId: "campus-002", campusName: "Siping Campus", universityName: "Tongji University" }
  ];

  constructor(private readonly studentAccountRepo: StudentAccountRepo) {}

  public async getCampuses(): Promise<CampusSummary[]> {
    return this.mockCampuses;
  }

  public async selectCampus(accountId: string, campusId: string): Promise<void> {
    const campus = this.mockCampuses.find((c) => c.campusId === campusId);
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
