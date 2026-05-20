import type { StudentProfile } from "../../../access-profile/src/entities/StudentProfile";
import type { StudentProfileRepo } from "../../../access-profile/src/repositories/StudentProfileRepo";
import type { PublicStudentProfileDto } from "../../../shared/src/domain/dtos";
import type { HostProfileLookupPort } from "./ActivityDetailService";

export class APHostProfileLookupAdapter implements HostProfileLookupPort {
  constructor(
    private readonly studentProfileRepo: Pick<StudentProfileRepo, "findByStudentAccountId">
  ) {}

  public async getProfile(studentAccountId: string): Promise<PublicStudentProfileDto | null> {
    const studentProfile = await this.studentProfileRepo.findByStudentAccountId(studentAccountId);

    if (!studentProfile) {
      return null;
    }

    return mapStudentProfileToPublicDto(studentProfile);
  }
}

export function mapStudentProfileToPublicDto(
  studentProfile: StudentProfile
): PublicStudentProfileDto {
  return {
    studentAccountId: studentProfile.studentAccountId,
    displayName: studentProfile.displayName,
    major: studentProfile.major,
    interests: [...studentProfile.interests],
    languages: [...studentProfile.languages],
    shortBio: studentProfile.shortBio ?? null
  };
}
