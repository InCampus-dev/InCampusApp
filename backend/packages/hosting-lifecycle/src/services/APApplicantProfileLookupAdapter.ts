import type { StudentProfileRepo } from "../../../access-profile/src/repositories/StudentProfileRepo";
import type {
  JoinRequestApplicantLookupPort,
  JoinRequestApplicantSummary
} from "./JoinRequestManagementService";

export class APApplicantProfileLookupAdapter implements JoinRequestApplicantLookupPort {
  constructor(
    private readonly studentProfileRepo: Pick<StudentProfileRepo, "findByStudentAccountId">
  ) {}

  public async getApplicantSummary(
    studentAccountId: string
  ): Promise<JoinRequestApplicantSummary | null> {
    const studentProfile = await this.studentProfileRepo.findByStudentAccountId(studentAccountId);

    if (!studentProfile) {
      return null;
    }

    return {
      studentAccountId,
      studentDisplayName: studentProfile.displayName
    };
  }
}
