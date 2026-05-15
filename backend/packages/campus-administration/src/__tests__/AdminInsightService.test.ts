import { describe, expect, it, vi } from "vitest";

import type { StudentAccount } from "../../../access-profile/src/entities/StudentAccount";
import type { StudentProfile } from "../../../access-profile/src/entities/StudentProfile";
import { StudentAccountRepo } from "../../../access-profile/src/repositories/StudentAccountRepo";
import { StudentProfileRepo } from "../../../access-profile/src/repositories/StudentProfileRepo";
import type { Activity } from "../../../hosting-lifecycle/src/entities/Activity";
import type { Participation } from "../../../hosting-lifecycle/src/entities/Participation";
import { ActivityRepo } from "../../../hosting-lifecycle/src/repositories/ActivityRepo";
import { ParticipationRepo } from "../../../hosting-lifecycle/src/repositories/ParticipationRepo";
import type { AuthenticatedAdminContext } from "../../../shared/src/auth/AuthenticatedAdminContext";
import {
  ActivityStatus,
  GenderPreference,
  ParticipationMode,
  ParticipationRecordType,
  ParticipationStatus,
  PlatformAccessStatus,
  VerificationStatus
} from "../../../shared/src/domain/enums";
import { CampusAuthorizationService } from "../services/CampusAuthorizationService";
import { AdminInsightService } from "../services/AdminInsightService";

describe("AdminInsightService", () => {
  it("rejects a campus scope mismatch before reading any AP or H&L store", async () => {
    const harness = createHarness();

    await expect(
      harness.service.listCampusStudentInsights(
        createAdminContext({
          selectedCampusId: "campus-002",
          authorizedCampusIds: ["campus-001", "campus-002"]
        }),
        "campus-001"
      )
    ).rejects.toMatchObject({
      code: "AUTH_FORBIDDEN",
      details: {
        authReason: "campus_scope_mismatch"
      }
    });

    expect(harness.studentAccountFind).not.toHaveBeenCalled();
    expect(harness.studentProfileFind).not.toHaveBeenCalled();
    expect(harness.activityFind).not.toHaveBeenCalled();
    expect(harness.participationCreateQueryBuilder).not.toHaveBeenCalled();
  });

  it("rejects an admin who is not authorized for the requested campus", async () => {
    const harness = createHarness();

    await expect(
      harness.service.listCampusStudentInsights(
        createAdminContext({
          authorizedCampusIds: ["campus-002"]
        }),
        "campus-001"
      )
    ).rejects.toMatchObject({
      code: "AUTH_FORBIDDEN",
      details: {
        authReason: "campus_not_authorized"
      }
    });

    expect(harness.studentAccountFind).not.toHaveBeenCalled();
  });

  it("returns an empty result when no consent-eligible students exist", async () => {
    const harness = createHarness({
      accounts: [
        createAccount({
          studentAccountId: "student-001",
          selectedCampusId: "campus-001",
          campusInsightSharingConsent: false
        }),
        createAccount({
          studentAccountId: "student-002",
          selectedCampusId: "campus-002",
          campusInsightSharingConsent: true
        })
      ]
    });

    await expect(
      harness.service.listCampusStudentInsights(createAdminContext(), "campus-001")
    ).resolves.toEqual({
      campusId: "campus-001",
      students: []
    });
  });

  it("returns the limited insight payload for consent-eligible students only", async () => {
    const harness = createHarness({
      accounts: [
        createAccount({
          studentAccountId: "student-001",
          selectedCampusId: "campus-001",
          campusInsightSharingConsent: true
        }),
        createAccount({
          studentAccountId: "student-002",
          selectedCampusId: "campus-001",
          campusInsightSharingConsent: false
        }),
        createAccount({
          studentAccountId: "student-003",
          selectedCampusId: "campus-002",
          campusInsightSharingConsent: true
        })
      ],
      profiles: [
        createProfile({
          studentAccountId: "student-001",
          displayName: "Ada",
          major: "Computer Science",
          interests: ["Robotics", "Running"],
          shortBio: "This should not leak",
          languages: ["en", "it"]
        }),
        createProfile({
          studentAccountId: "student-002",
          displayName: "Grace",
          major: "Math",
          interests: ["Chess"]
        })
      ],
      activities: [
        createActivity({
          activityId: "activity-001",
          campusId: "campus-001",
          hostAccountId: "student-001",
          title: "AI Study Group",
          categoryLabel: "Study",
          status: ActivityStatus.Open,
          scheduledDateTime: new Date("2026-05-18T10:00:00.000Z")
        }),
        createActivity({
          activityId: "activity-002",
          campusId: "campus-002",
          hostAccountId: "student-001",
          title: "Other Campus Event"
        })
      ],
      participations: [
        createParticipation({
          participationId: "participation-001",
          studentAccountId: "student-001",
          activityId: "activity-003",
          recordType: ParticipationRecordType.Request,
          status: ParticipationStatus.Pending,
          createdAt: new Date("2026-05-17T09:00:00.000Z"),
          activity: createActivity({
            activityId: "activity-003",
            campusId: "campus-001",
            title: "Board Games Night"
          })
        })
      ]
    });

    await expect(
      harness.service.listCampusStudentInsights(createAdminContext(), "campus-001", {
        futureFilter: "ignored"
      })
    ).resolves.toEqual({
      campusId: "campus-001",
      students: [
        {
          studentAccountId: "student-001",
          profile: {
            displayName: "Ada",
            major: "Computer Science",
            interests: ["Robotics", "Running"]
          },
          hostedActivities: [
            {
              activityId: "activity-001",
              title: "AI Study Group",
              categoryLabel: "Study",
              scheduledDateTime: "2026-05-18T10:00:00.000Z",
              status: ActivityStatus.Open
            }
          ],
          participations: [
            {
              participationId: "participation-001",
              activityId: "activity-003",
              activityTitle: "Board Games Night",
              recordType: ParticipationRecordType.Request,
              status: ParticipationStatus.Pending,
              createdAt: "2026-05-17T09:00:00.000Z"
            }
          ]
        }
      ]
    });
  });

  it("returns profile null when an eligible student has no profile", async () => {
    const harness = createHarness({
      accounts: [
        createAccount({
          studentAccountId: "student-001",
          selectedCampusId: "campus-001",
          campusInsightSharingConsent: true
        })
      ]
    });

    await expect(
      harness.service.listCampusStudentInsights(createAdminContext(), "campus-001")
    ).resolves.toEqual({
      campusId: "campus-001",
      students: [
        {
          studentAccountId: "student-001",
          profile: null,
          hostedActivities: [],
          participations: []
        }
      ]
    });
  });

  it("excludes participations tied to activities from another campus", async () => {
    const harness = createHarness({
      accounts: [
        createAccount({
          studentAccountId: "student-001",
          selectedCampusId: "campus-001",
          campusInsightSharingConsent: true
        })
      ],
      participations: [
        createParticipation({
          participationId: "participation-001",
          studentAccountId: "student-001",
          activityId: "activity-001",
          activity: createActivity({
            activityId: "activity-001",
            campusId: "campus-001",
            title: "Campus Lunch"
          })
        }),
        createParticipation({
          participationId: "participation-002",
          studentAccountId: "student-001",
          activityId: "activity-002",
          activity: createActivity({
            activityId: "activity-002",
            campusId: "campus-002",
            title: "Remote Campus Event"
          })
        })
      ]
    });

    const result = await harness.service.listCampusStudentInsights(
      createAdminContext(),
      "campus-001"
    );

    expect(result.students[0]?.participations).toEqual([
      {
        participationId: "participation-001",
        activityId: "activity-001",
        activityTitle: "Campus Lunch",
        recordType: ParticipationRecordType.Participation,
        status: ParticipationStatus.Confirmed,
        createdAt: "2026-05-16T10:00:00.000Z"
      }
    ]);
  });
});

function createHarness(storeOverrides: Partial<InsightStore> = {}) {
  const store: InsightStore = {
    accounts: [],
    profiles: [],
    activities: [],
    participations: [],
    ...storeOverrides
  };

  const studentAccountFind = vi.fn(async (args?: { where?: Partial<StudentAccount> }) => {
    return store.accounts
      .filter((account) =>
        args?.where?.selectedCampusId === undefined
          ? true
          : account.selectedCampusId === args.where.selectedCampusId
      )
      .filter((account) =>
        args?.where?.campusInsightSharingConsent === undefined
          ? true
          : account.campusInsightSharingConsent === args.where.campusInsightSharingConsent
      )
      .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
  });
  const studentProfileFind = vi.fn(async () => store.profiles);
  const activityFind = vi.fn(async (args?: { where?: { campusId?: string } }) =>
    store.activities.filter((activity) =>
      args?.where?.campusId === undefined ? true : activity.campusId === args.where.campusId
    )
  );
  const participationGetMany = vi.fn(async () => store.participations);
  const participationQueryBuilder = {
    leftJoinAndSelect: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    andWhere: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    getMany: participationGetMany
  };
  const participationCreateQueryBuilder = vi.fn(() => participationQueryBuilder);

  const service = new AdminInsightService(
    { find: studentAccountFind } as unknown as StudentAccountRepo,
    { find: studentProfileFind } as unknown as StudentProfileRepo,
    { find: activityFind } as unknown as ActivityRepo,
    {
      createQueryBuilder: participationCreateQueryBuilder
    } as unknown as ParticipationRepo,
    new CampusAuthorizationService()
  );

  return {
    service,
    studentAccountFind,
    studentProfileFind,
    activityFind,
    participationCreateQueryBuilder
  };
}

function createAdminContext(
  overrides: Partial<AuthenticatedAdminContext> = {}
): AuthenticatedAdminContext {
  return {
    adminId: "admin-001",
    email: "admin@incampus.test",
    role: "campus_admin",
    selectedCampusId: "campus-001",
    authorizedCampusIds: ["campus-001"],
    ...overrides
  };
}

function createAccount(overrides: Partial<StudentAccount> = {}): StudentAccount {
  return {
    studentAccountId: "student-default",
    passwordHash: "hash",
    universityStudentId: "S1234567",
    universityEmail: "student@incampus.test",
    verificationStatus: VerificationStatus.Verified,
    platformAccessStatus: PlatformAccessStatus.Active,
    selectedCampusId: "campus-001",
    campusInsightSharingConsent: true,
    verificationToken: null,
    createdAt: new Date("2026-05-10T00:00:00.000Z"),
    ...overrides
  } as StudentAccount;
}

function createProfile(overrides: Partial<StudentProfile> = {}): StudentProfile {
  return {
    profileId: "profile-001",
    studentAccountId: "student-default",
    displayName: "Student",
    major: "Computer Science",
    dateOfBirth: "2000-01-01",
    gender: null,
    interests: ["Study"],
    languages: ["en"],
    shortBio: null,
    createdAt: new Date("2026-05-10T00:00:00.000Z"),
    updatedAt: new Date("2026-05-10T01:00:00.000Z"),
    ...overrides
  } as StudentProfile;
}

function createActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    activityId: "activity-default",
    campusId: "campus-001",
    hostAccountId: "student-default",
    title: "Default Activity",
    categoryId: "category-001",
    categoryLabel: "General",
    description: "hidden from insights",
    scheduledDateTime: new Date("2026-05-15T10:00:00.000Z"),
    scheduledEndDateTime: null,
    meetingPointId: "meeting-point-001",
    meetingPointLabel: "Main Gate",
    participationMode: ParticipationMode.Open,
    maxParticipants: 10,
    maxRequests: null,
    currentParticipantCount: 0,
    currentRequestCount: 0,
    genderPreference: GenderPreference.All,
    status: ActivityStatus.Open,
    createdAt: new Date("2026-05-10T00:00:00.000Z"),
    participations: [],
    ...overrides
  } as Activity;
}

function createParticipation(overrides: Partial<Participation> = {}): Participation {
  return {
    participationId: "participation-default",
    activityId: "activity-default",
    studentAccountId: "student-default",
    recordType: ParticipationRecordType.Participation,
    status: ParticipationStatus.Confirmed,
    createdAt: new Date("2026-05-16T10:00:00.000Z"),
    activity: createActivity(),
    ...overrides
  } as Participation;
}

interface InsightStore {
  accounts: StudentAccount[];
  profiles: StudentProfile[];
  activities: Activity[];
  participations: Participation[];
}
