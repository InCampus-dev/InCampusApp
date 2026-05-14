import { describe, expect, it, vi } from "vitest";
import type { DataSource } from "typeorm";

import type { AuthenticatedAdminContext } from "../../../shared/src/auth/AuthenticatedAdminContext";
import type { StudentAccountRepo } from "../../../access-profile/src/repositories/StudentAccountRepo";
import {
  ActivityStatus,
  GenderPreference,
  ModerationAction,
  ParticipationMode,
  PlatformAccessStatus,
  ReportStatus,
  ReportTargetType,
  ReviewOutcome,
  VerificationStatus
} from "../../../shared/src/domain/enums";
import { StudentAccount } from "../../../access-profile/src/entities/StudentAccount";
import { AccountModerationCommandHandler } from "../../../access-profile/src/services/AccountModerationCommandHandler";
import { CampusAuthorizationService } from "../../../campus-administration/src/services/CampusAuthorizationService";
import { Activity } from "../../../hosting-lifecycle/src/entities/Activity";
import { ActivityModerationCommandHandler } from "../../../hosting-lifecycle/src/services/ActivityModerationCommandHandler";
import type { ActivityRepo } from "../../../hosting-lifecycle/src/repositories/ActivityRepo";
import { ReportRecord } from "../entities/ReportRecord";
import { ReportReviewService } from "../services/ReportReviewService";
import { ModerationActionDispatcher } from "../services/ModerationActionDispatcher";

describe("ReportReviewService", () => {
  it("lists campus reports", async () => {
    const service = createReportReviewService({
      reportStore: [
        createReportRecord({ reportId: "report-001", campusId: "campus-001" }),
        createReportRecord({ reportId: "report-002", campusId: "campus-001" }),
        createReportRecord({ reportId: "report-003", campusId: "campus-002" })
      ],
      studentAccounts: [],
      activities: []
    });

    const reports = await service.listReports(createAdminContext(), "campus-001");

    expect(reports).toHaveLength(2);
    expect(reports.map((report) => report.reportId)).toEqual(["report-001", "report-002"]);
  });

  it("fetches report detail by campus", async () => {
    const service = createReportReviewService({
      reportStore: [
        createReportRecord({
          reportId: "report-001",
          campusId: "campus-001",
          targetType: ReportTargetType.Student,
          targetAccountId: "target-student-id",
          targetActivityId: null
        })
      ],
      studentAccounts: [
        createStudentAccount({
          studentAccountId: "target-student-id",
          selectedCampusId: "campus-001"
        })
      ],
      activities: []
    });

    const report = await service.getReportDetail(createAdminContext(), "campus-001", "report-001");

    expect(report.targetContext).toEqual({
      studentAccountId: "target-student-id",
      selectedCampusId: "campus-001"
    });
    expect(report.reporterAccountId).toBe("reporter-student-id");
  });

  it("returns TARGET_UNAVAILABLE 410 for missing live detail context", async () => {
    const service = createReportReviewService({
      reportStore: [
        createReportRecord({
          reportId: "report-activity-001",
          campusId: "campus-001",
          targetType: ReportTargetType.Activity,
          targetAccountId: null,
          targetActivityId: "missing-activity"
        })
      ],
      studentAccounts: [],
      activities: []
    });

    await expect(
      service.getReportDetail(createAdminContext(), "campus-001", "report-activity-001")
    ).rejects.toMatchObject({
      code: "TARGET_UNAVAILABLE",
      statusCode: 410
    });
  });

  it("reviews pending report", async () => {
    const reportStore = [
      createReportRecord({
        reportId: "report-001",
        campusId: "campus-001",
        targetType: ReportTargetType.Student,
        targetAccountId: "target-student-id",
        targetActivityId: null
      })
    ];
    const service = createReportReviewService({
      reportStore,
      studentAccounts: [],
      activities: []
    });

    const result = await service.reviewReport(createAdminContext(), "campus-001", "report-001", {
      reviewOutcome: ReviewOutcome.ActionTaken,
      moderationAction: ModerationAction.WarnUser,
      reviewNotes: "First warning"
    });

    expect(result).toEqual({
      reportId: "report-001",
      campusId: "campus-001",
      status: ReportStatus.Reviewed,
      reviewOutcome: ReviewOutcome.ActionTaken,
      moderationAction: ModerationAction.WarnUser,
      reviewedAt: reportStore[0]?.reviewedAt?.toISOString(),
      reviewedByAdminId: "admin-001",
      commandDispatchPending: false
    });
    expect(reportStore[0]?.status).toBe(ReportStatus.Reviewed);
  });

  it("rejects cross-campus review", async () => {
    const service = createReportReviewService({
      reportStore: [createReportRecord({ reportId: "report-001", campusId: "campus-001" })],
      studentAccounts: [],
      activities: []
    });

    await expect(
      service.reviewReport(
        createAdminContext({
          selectedCampusId: "campus-002",
          authorizedCampusIds: ["campus-001", "campus-002"]
        }),
        "campus-001",
        "report-001",
        {
          reviewOutcome: ReviewOutcome.Dismissed,
          moderationAction: ModerationAction.None
        }
      )
    ).rejects.toMatchObject({
      code: "AUTH_FORBIDDEN"
    });
  });

  it("sets commandDispatchPending to true when native moderation handlers are unavailable", async () => {
    const reportStore = [
      createReportRecord({
        reportId: "report-001",
        campusId: "campus-001",
        targetType: ReportTargetType.Student,
        targetAccountId: "target-student-id",
        targetActivityId: null
      })
    ];
    const service = createReportReviewService({
      reportStore,
      studentAccounts: [],
      activities: []
    });

    const result = await service.reviewReport(createAdminContext(), "campus-001", "report-001", {
      reviewOutcome: ReviewOutcome.ActionTaken,
      moderationAction: ModerationAction.SuspendUser
    });

    expect(result.commandDispatchPending).toBe(true);
    expect(reportStore[0]?.commandDispatchPending).toBe(true);
  });

  it("updates PlatformAccessStatus to Suspended and clears commandDispatchPending", async () => {
    const reportStore = [
      createReportRecord({
        reportId: "report-001",
        targetAccountId: "target-student-id"
      })
    ];
    const studentAccounts = [createStudentAccount({ studentAccountId: "target-student-id" })];
    const studentAccountRepo = createStudentAccountRepoStub(studentAccounts);
    const service = createReportReviewService({
      reportStore,
      studentAccounts,
      activities: [],
      studentAccountRepo,
      moderationActionDispatcher: new ModerationActionDispatcher(
        new AccountModerationCommandHandler(studentAccountRepo as unknown as StudentAccountRepo)
      )
    });

    const result = await service.reviewReport(createAdminContext(), "campus-001", "report-001", {
      reviewOutcome: ReviewOutcome.ActionTaken,
      moderationAction: ModerationAction.SuspendUser
    });

    expect(result.commandDispatchPending).toBe(false);
    expect(reportStore[0]?.commandDispatchPending).toBe(false);
    expect(studentAccounts[0]?.platformAccessStatus).toBe(PlatformAccessStatus.Suspended);
  });

  it("updates PlatformAccessStatus to Banned and clears commandDispatchPending", async () => {
    const reportStore = [
      createReportRecord({
        reportId: "report-001",
        targetAccountId: "target-student-id"
      })
    ];
    const studentAccounts = [createStudentAccount({ studentAccountId: "target-student-id" })];
    const studentAccountRepo = createStudentAccountRepoStub(studentAccounts);
    const service = createReportReviewService({
      reportStore,
      studentAccounts,
      activities: [],
      studentAccountRepo,
      moderationActionDispatcher: new ModerationActionDispatcher(
        new AccountModerationCommandHandler(studentAccountRepo as unknown as StudentAccountRepo)
      )
    });

    const result = await service.reviewReport(createAdminContext(), "campus-001", "report-001", {
      reviewOutcome: ReviewOutcome.ActionTaken,
      moderationAction: ModerationAction.BanUser
    });

    expect(result.commandDispatchPending).toBe(false);
    expect(reportStore[0]?.commandDispatchPending).toBe(false);
    expect(studentAccounts[0]?.platformAccessStatus).toBe(PlatformAccessStatus.Banned);
  });

  it("removes the activity through the H&L-native handler and clears commandDispatchPending", async () => {
    const reportStore = [
      createReportRecord({
        reportId: "report-activity-001",
        targetType: ReportTargetType.Activity,
        targetAccountId: null,
        targetActivityId: "activity-001"
      })
    ];
    const activities = [createActivity({ activityId: "activity-001", campusId: "campus-001" })];
    const service = createReportReviewService({
      reportStore,
      studentAccounts: [],
      activities,
      moderationActionDispatcher: new ModerationActionDispatcher(
        undefined,
        new ActivityModerationCommandHandler(
          createActivityModerationDataSource(activities) as unknown as DataSource
        )
      )
    });

    const result = await service.reviewReport(
      createAdminContext(),
      "campus-001",
      "report-activity-001",
      {
        reviewOutcome: ReviewOutcome.ActionTaken,
        moderationAction: ModerationAction.RemoveActivity
      }
    );

    expect(result.commandDispatchPending).toBe(false);
    expect(reportStore[0]?.commandDispatchPending).toBe(false);
    expect(activities).toHaveLength(0);
  });

  it("delegates moderation consequences through the dispatcher and only persists report state", async () => {
    const reportStore = [createReportRecord({ reportId: "report-001" })];
    const studentAccounts = [createStudentAccount({ studentAccountId: "target-student-id" })];
    const dispatch = vi.fn().mockResolvedValue({ commandDispatchPending: false });
    const service = createReportReviewService({
      reportStore,
      studentAccounts,
      activities: [],
      moderationActionDispatcher: {
        dispatch
      }
    });

    await service.reviewReport(createAdminContext(), "campus-001", "report-001", {
      reviewOutcome: ReviewOutcome.ActionTaken,
      moderationAction: ModerationAction.SuspendUser,
      reviewNotes: "Escalated after review"
    });

    expect(dispatch).toHaveBeenCalledWith({
      reportId: "report-001",
      campusId: "campus-001",
      targetType: ReportTargetType.Student,
      targetAccountId: "target-student-id",
      targetActivityId: null,
      moderationAction: ModerationAction.SuspendUser,
      reviewOutcome: ReviewOutcome.ActionTaken,
      reviewedByAdminId: "admin-001"
    });
    expect(reportStore[0]).toMatchObject({
      status: ReportStatus.Reviewed,
      reviewOutcome: ReviewOutcome.ActionTaken,
      moderationAction: ModerationAction.SuspendUser,
      reviewNotes: "Escalated after review",
      reviewedByAdminId: "admin-001",
      commandDispatchPending: false
    });
    expect(studentAccounts[0]?.platformAccessStatus).toBe(PlatformAccessStatus.Active);
  });

  it("keeps none and warn_user as record-only review outcomes", async () => {
    const accountHandler = { handle: vi.fn(async () => undefined) };
    const activityHandler = { handle: vi.fn(async () => undefined) };
    const service = createReportReviewService({
      reportStore: [
        createReportRecord({ reportId: "report-001" }),
        createReportRecord({ reportId: "report-002" })
      ],
      studentAccounts: [],
      activities: [],
      moderationActionDispatcher: new ModerationActionDispatcher(accountHandler, activityHandler)
    });

    const warnResult = await service.reviewReport(
      createAdminContext(),
      "campus-001",
      "report-001",
      {
        reviewOutcome: ReviewOutcome.ActionTaken,
        moderationAction: ModerationAction.WarnUser
      }
    );
    const noneResult = await service.reviewReport(
      createAdminContext(),
      "campus-001",
      "report-002",
      {
        reviewOutcome: ReviewOutcome.Dismissed,
        moderationAction: ModerationAction.None
      }
    );

    expect(warnResult.commandDispatchPending).toBe(false);
    expect(noneResult.commandDispatchPending).toBe(false);
    expect(accountHandler.handle).not.toHaveBeenCalled();
    expect(activityHandler.handle).not.toHaveBeenCalled();
  });

  it("does not require live activity or user reads during review mutation", async () => {
    const reportStore = [
      createReportRecord({
        reportId: "report-activity-001",
        campusId: "campus-001",
        targetType: ReportTargetType.Activity,
        targetAccountId: null,
        targetActivityId: "activity-001"
      })
    ];
    const service = new ReportReviewService(
      createReportRepoStub(reportStore),
      {
        async findById() {
          throw new Error("Student lookup should not be used during review mutation");
        }
      },
      {
        async findOne() {
          throw new Error("Activity lookup should not be used during review mutation");
        }
      },
      new CampusAuthorizationService(),
      new ModerationActionDispatcher()
    );

    const result = await service.reviewReport(
      createAdminContext(),
      "campus-001",
      "report-activity-001",
      {
        reviewOutcome: ReviewOutcome.ActionTaken,
        moderationAction: ModerationAction.RemoveActivity
      }
    );

    expect(result.commandDispatchPending).toBe(true);
  });
});

function createReportReviewService(options: {
  reportStore: ReportRecord[];
  studentAccounts: StudentAccount[];
  activities: Activity[];
  moderationActionDispatcher?: Pick<ModerationActionDispatcher, "dispatch">;
  studentAccountRepo?: StudentAccountRepoStub;
  activityRepo?: Pick<ActivityRepo, "findOne">;
}) {
  const studentAccountRepo =
    options.studentAccountRepo ?? createStudentAccountRepoStub(options.studentAccounts);
  const activityRepo = options.activityRepo ?? createActivityRepoLookupStub(options.activities);

  return new ReportReviewService(
    createReportRepoStub(options.reportStore),
    studentAccountRepo,
    activityRepo,
    new CampusAuthorizationService(),
    options.moderationActionDispatcher ?? new ModerationActionDispatcher()
  );
}

function createReportRepoStub(reportStore: ReportRecord[]) {
  return {
    async findByCampus(campusId: string) {
      return reportStore.filter((reportRecord) => reportRecord.campusId === campusId);
    },
    async findByCampusAndReportId(campusId: string, reportId: string) {
      return (
        reportStore.find(
          (reportRecord) =>
            reportRecord.campusId === campusId && reportRecord.reportId === reportId
        ) ?? null
      );
    },
    async persist(reportRecord: ReportRecord) {
      const existingIndex = reportStore.findIndex(
        (existingReportRecord) => existingReportRecord.reportId === reportRecord.reportId
      );

      if (existingIndex >= 0) {
        reportStore[existingIndex] = reportRecord;
        return reportRecord;
      }

      reportStore.push(reportRecord);
      return reportRecord;
    }
  };
}

type StudentAccountRepoStub = Pick<StudentAccountRepo, "findById"> & {
  save(studentAccount: StudentAccount): Promise<StudentAccount>;
};

function createStudentAccountRepoStub(studentAccounts: StudentAccount[]): StudentAccountRepoStub {
  return {
    async findById(studentAccountId: string) {
      return (
        studentAccounts.find(
          (studentAccount) => studentAccount.studentAccountId === studentAccountId
        ) ?? null
      );
    },
    async save(studentAccount: StudentAccount) {
      const existingIndex = studentAccounts.findIndex(
        (existingAccount) => existingAccount.studentAccountId === studentAccount.studentAccountId
      );

      if (existingIndex >= 0) {
        studentAccounts[existingIndex] = studentAccount;
      } else {
        studentAccounts.push(studentAccount);
      }

      return studentAccount;
    }
  };
}

function createActivityRepoLookupStub(activities: Activity[]): Pick<ActivityRepo, "findOne"> {
  return {
    async findOne(optionsArg: { where: { activityId: string } }) {
      return (
        activities.find((activity) => activity.activityId === optionsArg.where.activityId) ?? null
      );
    }
  };
}

function createActivityModerationDataSource(activities: Activity[]) {
  return {
    async transaction<T>(
      work: (manager: {
        findOne(
          entityClass: typeof Activity,
          options: { where: { activityId: string }; lock?: { mode: string } }
        ): Promise<Activity | null>;
        remove(entityClass: typeof Activity, activity: Activity): Promise<Activity>;
      }) => Promise<T>
    ): Promise<T> {
      return await work({
        async findOne(
          entityClass: typeof Activity,
          options: { where: { activityId: string } }
        ) {
          if (entityClass !== Activity) {
            return null;
          }

          return (
            activities.find((activity) => activity.activityId === options.where.activityId) ?? null
          );
        },
        async remove(entityClass: typeof Activity, activity: Activity) {
          if (entityClass === Activity) {
            const activityIndex = activities.findIndex(
              (existingActivity) => existingActivity.activityId === activity.activityId
            );

            if (activityIndex >= 0) {
              activities.splice(activityIndex, 1);
            }
          }

          return activity;
        }
      });
    }
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

function createReportRecord(overrides: Partial<ReportRecord> = {}): ReportRecord {
  return {
    reportId: "report-001",
    campusId: "campus-001",
    reporterAccountId: "reporter-student-id",
    targetType: ReportTargetType.Student,
    targetAccountId: "target-student-id",
    targetActivityId: null,
    reasonCode: "harassment",
    description: "Reported details",
    status: ReportStatus.PendingReview,
    submittedAt: new Date("2026-05-13T00:00:00.000Z"),
    reviewedAt: null,
    reviewedByAdminId: null,
    moderationAction: ModerationAction.None,
    reviewOutcome: null,
    reviewNotes: null,
    commandDispatchPending: false,
    ...overrides
  };
}

function createStudentAccount(overrides: Partial<StudentAccount> = {}): StudentAccount {
  return {
    studentAccountId: "target-student-id",
    passwordHash: "hashed-password",
    universityStudentId: "S123456",
    universityEmail: "target@incampus.test",
    verificationStatus: VerificationStatus.Verified,
    platformAccessStatus: PlatformAccessStatus.Active,
    selectedCampusId: "campus-001",
    campusInsightSharingConsent: false,
    verificationToken: null,
    createdAt: new Date("2026-05-13T00:00:00.000Z"),
    ...overrides
  };
}

function createActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    activityId: "activity-001",
    campusId: "campus-001",
    hostAccountId: "host-account-001",
    title: "Study Group",
    categoryId: "category-001",
    categoryLabel: "Study",
    description: "Bring notes",
    scheduledDateTime: new Date("2026-05-15T10:00:00.000Z"),
    scheduledEndDateTime: null,
    meetingPointId: "meeting-point-001",
    meetingPointLabel: "Library",
    participationMode: ParticipationMode.ApprovalBased,
    maxParticipants: 10,
    maxRequests: null,
    currentParticipantCount: 0,
    currentRequestCount: 0,
    genderPreference: GenderPreference.All,
    status: ActivityStatus.Open,
    createdAt: new Date("2026-05-13T00:00:00.000Z"),
    participations: [],
    ...overrides
  };
}
