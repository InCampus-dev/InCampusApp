import { CampusInsightConsentDto } from "../../../shared/src/domain/dtos";
import { AppError } from "../../../shared/src/errors/AppError";
import { StudentAccountRepo } from "../repositories/StudentAccountRepo";

export class CampusInsightConsentService {
  constructor(private readonly studentAccountRepo: StudentAccountRepo) {}

  public async updateOwnConsent(
    studentAccountId: string,
    campusInsightSharingConsent: boolean
  ): Promise<CampusInsightConsentDto> {
    const studentAccount = await this.studentAccountRepo.findById(studentAccountId);
    if (!studentAccount) {
      throw AppError.notFound("StudentAccount", studentAccountId);
    }

    studentAccount.campusInsightSharingConsent = campusInsightSharingConsent;
    const savedAccount = await this.studentAccountRepo.save(studentAccount);

    return {
      campusInsightSharingConsent: savedAccount.campusInsightSharingConsent
    };
  }
}
