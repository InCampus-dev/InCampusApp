import { describe, expect, it, vi } from "vitest";

import type { StudentProfile } from "../../../access-profile/src/entities/StudentProfile";
import type { Activity } from "../../../hosting-lifecycle/src/entities/Activity";
import type { BlockRelationship } from "../../../safety-moderation/src/entities/BlockRelationship";
import { ActivityStatus, GenderPreference, ParticipationMode } from "../../../shared/src/domain/enums";
import { ActivityDetailService } from "../services/ActivityDetailService";
import { APHostProfileLookupAdapter } from "../services/APHostProfileLookupAdapter";
import { SMBlockLookupAdapter } from "../services/SMBlockLookupAdapter";

describe("ActivityDetailService", () => {
  it("returns real AP profile data instead of the placeholder host profile", async () => {
    const activityRepository = {
      findOne: vi.fn().mockResolvedValue(
        createActivity({
          activityId: "activity-001",
          campusId: "campus-001",
          hostAccountId: "host-001"
        })
      )
    };
    const service = createActivityDetailService({
      activityRepository,
      blockRelationships: [],
      profiles: [
        createProfile({
          studentAccountId: "host-001",
          displayName: "Ada Lovelace",
          major: "Computer Science",
          interests: ["Robotics", "Running"]
        })
      ]
    });

    const result = await service.getActivityDetails(
      "student-001",
      "campus-001",
      "activity-001"
    );

    expect(result.hostProfile).toMatchObject({
      studentAccountId: "host-001",
      displayName: "Ada Lovelace",
      major: "Computer Science",
      interests: ["Robotics", "Running"]
    });
    expect(result.hostProfile?.displayName).not.toBe("Host Student");
  });

  it("rejects activity detail access when a reciprocal block exists", async () => {
    const service = createActivityDetailService({
      activityRepository: {
        findOne: vi.fn().mockResolvedValue(
          createActivity({
            activityId: "activity-001",
            campusId: "campus-001",
            hostAccountId: "host-001"
          })
        )
      },
      blockRelationships: [
        createBlockRelationship({
          initiatorAccountId: "host-001",
          blockedAccountId: "student-001"
        })
      ],
      profiles: []
    });

    await expect(
      service.getActivityDetails("student-001", "campus-001", "activity-001")
    ).rejects.toMatchObject({
      code: "NOT_FOUND"
    });
  });

  it("preserves the existing undefined fallback when the host profile is missing", async () => {
    const service = createActivityDetailService({
      activityRepository: {
        findOne: vi.fn().mockResolvedValue(
          createActivity({
            activityId: "activity-001",
            campusId: "campus-001",
            hostAccountId: "host-001"
          })
        )
      },
      blockRelationships: [],
      profiles: []
    });

    const result = await service.getActivityDetails(
      "student-001",
      "campus-001",
      "activity-001"
    );

    expect(result.hostProfile).toBeUndefined();
  });

  it("marks approval-based activity details as manageable when the requester is the host", async () => {
    const service = createActivityDetailService({
      activityRepository: {
        findOne: vi.fn().mockResolvedValue(
          createActivity({
            activityId: "activity-001",
            campusId: "campus-001",
            hostAccountId: "student-001",
            participationMode: ParticipationMode.ApprovalBased
          })
        )
      },
      blockRelationships: [],
      profiles: []
    });

    const result = await service.getActivityDetails(
      "student-001",
      "campus-001",
      "activity-001"
    );

    expect(result.canManageRequests).toBe(true);
  });

  it("does not mark open activity details as request-manageable for the host", async () => {
    const service = createActivityDetailService({
      activityRepository: {
        findOne: vi.fn().mockResolvedValue(
          createActivity({
            activityId: "activity-001",
            campusId: "campus-001",
            hostAccountId: "student-001",
            participationMode: ParticipationMode.Open
          })
        )
      },
      blockRelationships: [],
      profiles: []
    });

    const result = await service.getActivityDetails(
      "student-001",
      "campus-001",
      "activity-001"
    );

    expect(result.canManageRequests).toBe(false);
  });
});

function createActivityDetailService(args: {
  activityRepository: {
    findOne: (query: { where: { activityId: string } }) => Promise<Activity | null>;
  };
  blockRelationships: BlockRelationship[];
  profiles: StudentProfile[];
}): ActivityDetailService {
  const blockLookup = new SMBlockLookupAdapter({
    find: vi.fn().mockResolvedValue(args.blockRelationships)
  } as any);
  const hostProfileLookup = new APHostProfileLookupAdapter({
    findByStudentAccountId: vi.fn(async (studentAccountId: string) => {
      return args.profiles.find((profile) => profile.studentAccountId === studentAccountId) ?? null;
    })
  } as any);

  return new ActivityDetailService(
    {
      getRepository: vi.fn().mockReturnValue(args.activityRepository)
    } as any,
    blockLookup,
    hostProfileLookup
  );
}

function createActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    activityId: "activity-default",
    campusId: "campus-001",
    hostAccountId: "host-default",
    title: "Default Activity",
    categoryId: "category-001",
    categoryLabel: "General",
    description: null,
    scheduledDateTime: new Date("2026-05-20T10:00:00.000Z"),
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

function createProfile(overrides: Partial<StudentProfile> = {}): StudentProfile {
  return {
    profileId: "profile-001",
    studentAccountId: "host-default",
    displayName: "Host Student",
    major: "Undeclared",
    dateOfBirth: null,
    gender: null,
    interests: [],
    languages: [],
    shortBio: null,
    createdAt: new Date("2026-05-10T00:00:00.000Z"),
    updatedAt: new Date("2026-05-10T01:00:00.000Z"),
    ...overrides
  } as StudentProfile;
}

function createBlockRelationship(
  overrides: Partial<BlockRelationship> = {}
): BlockRelationship {
  return {
    blockId: "block-001",
    initiatorAccountId: "student-001",
    blockedAccountId: "host-001",
    createdAt: new Date("2026-05-10T00:00:00.000Z"),
    ...overrides
  } as BlockRelationship;
}
