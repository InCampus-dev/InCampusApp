import { describe, expect, it } from "vitest";

import { StudentProfile } from "../entities/StudentProfile";
import { StudentProfileRepo } from "../repositories/StudentProfileRepo";
import { StudentProfileService } from "../services/StudentProfileService";
import { StudentProfileGender } from "../../../shared/src/domain/enums";

describe("StudentProfileService", () => {
  it("creates a student profile successfully and leaves updatedAt null", async () => {
    const profileStore: StudentProfile[] = [];
    const service = new StudentProfileService(createStudentProfileRepo(profileStore));

    const profile = await service.createOwnProfile("student-001", {
      displayName: "  Ada Lovelace  ",
      major: "  Computer Science  ",
      dateOfBirth: "2000-05-01T09:30:00.000Z",
      gender: StudentProfileGender.Female,
      interests: [" chess ", " study groups "],
      languages: [" English ", " Italian "],
      shortBio: "  Loves algorithms.  "
    });

    expect(profile).toEqual({
      profileId: "profile-1",
      studentAccountId: "student-001",
      displayName: "Ada Lovelace",
      major: "Computer Science",
      dateOfBirth: "2000-05-01",
      gender: StudentProfileGender.Female,
      interests: ["chess", "study groups"],
      languages: ["English", "Italian"],
      shortBio: "Loves algorithms.",
      createdAt: "2026-05-13T00:00:00.000Z",
      updatedAt: null
    });
    expect(profileStore[0]?.updatedAt).toBeNull();
  });

  it("rejects duplicate student profile creation", async () => {
    const service = new StudentProfileService(
      createStudentProfileRepo([
        createStoredProfile({
          profileId: "profile-1",
          studentAccountId: "student-001"
        })
      ])
    );

    await expect(
      service.createOwnProfile("student-001", {
        displayName: "Ada Lovelace",
        major: "Computer Science"
      })
    ).rejects.toMatchObject({
      code: "CONFLICT"
    });
  });

  it("returns the authenticated student's profile", async () => {
    const service = new StudentProfileService(
      createStudentProfileRepo([
        createStoredProfile({
          profileId: "profile-1",
          studentAccountId: "student-001",
          displayName: "Ada Lovelace",
          major: "Computer Science",
          interests: ["chess"],
          languages: ["English"]
        })
      ])
    );

    await expect(service.getOwnProfile("student-001")).resolves.toEqual({
      profileId: "profile-1",
      studentAccountId: "student-001",
      displayName: "Ada Lovelace",
      major: "Computer Science",
      dateOfBirth: null,
      gender: null,
      interests: ["chess"],
      languages: ["English"],
      shortBio: null,
      createdAt: "2026-05-13T00:00:00.000Z",
      updatedAt: null
    });
  });

  it("updates the authenticated student's profile and sets updatedAt", async () => {
    const profileStore = [
      createStoredProfile({
        profileId: "profile-1",
        studentAccountId: "student-001",
        displayName: "Ada Lovelace",
        major: "Computer Science",
        shortBio: "Original bio"
      })
    ];
    const service = new StudentProfileService(createStudentProfileRepo(profileStore));

    const updatedProfile = await service.updateOwnProfile("student-001", {
      displayName: "  Ada L.  ",
      interests: [" math ", " analysis "],
      languages: [" English "],
      shortBio: "   "
    });

    expect(updatedProfile).toMatchObject({
      profileId: "profile-1",
      studentAccountId: "student-001",
      displayName: "Ada L.",
      major: "Computer Science",
      dateOfBirth: null,
      gender: null,
      interests: ["math", "analysis"],
      languages: ["English"],
      shortBio: null,
      createdAt: "2026-05-13T00:00:00.000Z",
      updatedAt: expect.any(String)
    });
    expect(profileStore[0]?.updatedAt).toBeInstanceOf(Date);
  });

  it("rejects missing own profile on get", async () => {
    const service = new StudentProfileService(createStudentProfileRepo([]));

    await expect(service.getOwnProfile("missing-student")).rejects.toMatchObject({
      code: "NOT_FOUND"
    });
  });

  it("rejects missing own profile on update", async () => {
    const service = new StudentProfileService(createStudentProfileRepo([]));

    await expect(
      service.updateOwnProfile("missing-student", {
        shortBio: "Updated bio"
      })
    ).rejects.toMatchObject({
      code: "NOT_FOUND"
    });
  });

  it("rejects create when displayName or major is missing or blank", async () => {
    const service = new StudentProfileService(createStudentProfileRepo([]));

    await expect(
      service.createOwnProfile("student-001", {
        displayName: "  ",
        major: ""
      })
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR"
    });
  });

  it("rejects patch when supplied displayName or major is blank", async () => {
    const service = new StudentProfileService(
      createStudentProfileRepo([createStoredProfile({ studentAccountId: "student-001" })])
    );

    await expect(
      service.updateOwnProfile("student-001", {
        displayName: "   "
      })
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR"
    });
  });

  it("rejects patch when the merged result would leave invalid core fields", async () => {
    const service = new StudentProfileService(
      createStudentProfileRepo([
        createStoredProfile({
          studentAccountId: "student-001",
          major: ""
        })
      ])
    );

    await expect(
      service.updateOwnProfile("student-001", {
        shortBio: "Still editing"
      })
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR"
    });
  });

  it("normalizes trimmed strings, shortBio, interests, and languages", async () => {
    const service = new StudentProfileService(
      createStudentProfileRepo([createStoredProfile({ studentAccountId: "student-001" })])
    );

    const updatedProfile = await service.updateOwnProfile("student-001", {
      major: "  Applied Mathematics  ",
      interests: [" tutoring ", " campus events "],
      languages: [" English ", " Chinese "],
      shortBio: "  Enjoys helping classmates.  "
    });

    expect(updatedProfile.major).toBe("Applied Mathematics");
    expect(updatedProfile.interests).toEqual(["tutoring", "campus events"]);
    expect(updatedProfile.languages).toEqual(["English", "Chinese"]);
    expect(updatedProfile.shortBio).toBe("Enjoys helping classmates.");
  });

  it("rejects an empty patch body", async () => {
    const service = new StudentProfileService(
      createStudentProfileRepo([createStoredProfile({ studentAccountId: "student-001" })])
    );

    await expect(service.updateOwnProfile("student-001", {})).rejects.toMatchObject({
      code: "VALIDATION_ERROR"
    });
  });
});

function createStudentProfileRepo(profileStore: StudentProfile[]): StudentProfileRepo {
  return {
    create(payload: Partial<StudentProfile>): StudentProfile {
      return createStoredProfile(payload);
    },
    async save(studentProfile: StudentProfile): Promise<StudentProfile> {
      const existingIndex = profileStore.findIndex(
        (candidateProfile) => candidateProfile.studentAccountId === studentProfile.studentAccountId
      );

      if (existingIndex >= 0) {
        profileStore[existingIndex] = studentProfile;
      } else {
        profileStore.push(studentProfile);
      }

      return studentProfile;
    },
    async findByStudentAccountId(studentAccountId: string): Promise<StudentProfile | null> {
      return (
        profileStore.find((candidateProfile) => candidateProfile.studentAccountId === studentAccountId) ??
        null
      );
    }
  } as unknown as StudentProfileRepo;
}

function createStoredProfile(overrides: Partial<StudentProfile>): StudentProfile {
  return {
    profileId: overrides.profileId ?? "profile-1",
    studentAccountId: overrides.studentAccountId ?? "student-001",
    displayName: overrides.displayName ?? "Ada Lovelace",
    major: overrides.major ?? "Computer Science",
    dateOfBirth: overrides.dateOfBirth ?? null,
    gender: overrides.gender ?? null,
    interests: overrides.interests ?? [],
    languages: overrides.languages ?? [],
    shortBio: overrides.shortBio ?? null,
    createdAt: overrides.createdAt ?? new Date("2026-05-13T00:00:00.000Z"),
    updatedAt: overrides.updatedAt ?? null
  };
}
