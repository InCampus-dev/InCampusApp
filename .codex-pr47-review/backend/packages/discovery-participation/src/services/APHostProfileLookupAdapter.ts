import type { StudentProfile } from "../../../access-profile/src/entities/StudentProfile";
import type { StudentProfileRepo } from "../../../access-profile/src/repositories/StudentProfileRepo";
import type { StudentProfileDto } from "../../../shared/src/domain/dtos";
import type { HostProfileLookupPort } from "./ActivityDetailService";

export class APHostProfileLookupAdapter implements HostProfileLookupPort {
  constructor(
    private readonly studentProfileRepo: Pick<StudentProfileRepo, "findByStudentAccountId">
  ) {}

  public async getProfile(studentAccountId: string): Promise<StudentProfileDto | null> {
    const studentProfile = await this.studentProfileRepo.findByStudentAccountId(studentAccountId);

    if (!studentProfile) {
      return null;
    }

    return mapStudentProfileToDto(studentProfile);
  }
}

function mapStudentProfileToDto(studentProfile: StudentProfile): StudentProfileDto {
  return {
    profileId: studentProfile.profileId,
    studentAccountId: studentProfile.studentAccountId,
    displayName: studentProfile.displayName,
    major: studentProfile.major,
    dateOfBirth: studentProfile.dateOfBirth ?? null,
    gender: studentProfile.gender ?? null,
    interests: [...studentProfile.interests],
    languages: [...studentProfile.languages],
    shortBio: studentProfile.shortBio ?? null,
    createdAt: studentProfile.createdAt.toISOString(),
    updatedAt: studentProfile.updatedAt ? studentProfile.updatedAt.toISOString() : null
  };
}
