import { describe, expect, it } from "vitest";

import type { AuthenticatedAdminContext } from "../../../shared/src/auth/AuthenticatedAdminContext";
import {
  ModerationAction,
  PlatformAccessStatus,
  ReportStatus,
  ReportTargetType,
  ReviewOutcome,
  VerificationStatus
} from "../../../shared/src/domain/enums";
import { StudentAccount } from "../../../access-profile/src/entities/StudentAccount";
import { CampusAuthorizationService } from "../../../campus-administration/src/services/CampusAuthorizationService";
import { Activity } from "../../../hosting-lifecycle/src/entities/Activity";
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
}) {
  return new ReportReviewService(
    createReportRepoStub(options.reportStore),
    {
      async findById(studentAccountId: string) {
        return (
          options.studentAccounts.find(
            (studentAccount) => studentAccount.studentAccountId === studentAccountId
          ) ?? null
        );
      }
    },
    {
      async findOne(optionsArg: { where: { activityId: string } }) {
        return (
          options.activities.find(
            (activity) => activity.activityId === optionsArg.where.activityId
          ) ?? null
        );
      }
    },
    new CampusAuthorizationService(),
    new ModerationActionDispatcher()
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

function createStudentAccount(
  overrides: Partial<StudentAccount> = {}
): StudentAccount {
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
