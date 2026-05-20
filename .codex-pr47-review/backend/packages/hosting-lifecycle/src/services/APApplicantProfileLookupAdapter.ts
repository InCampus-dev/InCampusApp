import type { StudentProfile } from "../../../access-profile/src/entities/StudentProfile";
import type { StudentProfileRepo } from "../../../access-profile/src/repositories/StudentProfileRepo";
import type { JoinRequestApplicantProfileDto } from "../../../shared/src/domain/dtos";
import type { JoinRequestApplicantProfileLookupPort } from "./JoinRequestManagementService";

export class APApplicantProfileLookupAdapter implements JoinRequestApplicantProfileLookupPort {
  constructor(
    private readonly studentProfileRepo: Pick<StudentProfileRepo, "findByStudentAccountId">
  ) {}

  public async getApplicantProfile(
    applicantId: string
  ): Promise<JoinRequestApplicantProfileDto | null> {
    const studentProfile = await this.studentProfileRepo.findByStudentAccountId(applicantId);

    if (!studentProfile) {
      return null;
    }

    return mapStudentProfileToApplicantDto(studentProfile);
  }
}

function mapStudentProfileToApplicantDto(
  studentProfile: StudentProfile
): JoinRequestApplicantProfileDto {
  return {
    applicantId: studentProfile.studentAccountId,
    displayName: studentProfile.displayName,
    major: studentProfile.major,
    shortBio: studentProfile.shortBio ?? null
  };
}
