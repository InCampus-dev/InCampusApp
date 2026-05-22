import { describe, expect, it } from "vitest";

import type { AuthenticatedStudentContext } from "../../../shared/src/auth/AuthenticatedStudentContext";
import {
  PlatformAccessStatus,
  ReportStatus,
  ReportTargetType,
  VerificationStatus
} from "../../../shared/src/domain/enums";
import { StudentAccount } from "../../../access-profile/src/entities/StudentAccount";
import { ReportRecord } from "../entities/ReportRecord";
import { ReportSubmissionService } from "../services/ReportSubmissionService";

describe("ReportSubmissionService", () => {
  it("creates student report", async () => {
    const reportStore = createReportStore();
    const studentLookupCalls: string[] = [];
    const service = createReportSubmissionService(reportStore, {
      studentAccounts: [
        createStudentAccount({
          studentAccountId: "target-student-id",
          selectedCampusId: "campus-001"
        })
      ],
      studentLookupCalls
    });

    const report = await service.submitReport(createStudentContext(), {
      campusId: "campus-001",
      targetType: ReportTargetType.Student,
      targetAccountId: "target-student-id",
      reasonCode: "harassment",
      description: "Repeated unsafe messages"
    });

    expect(report).toEqual({
      reportId: "report-001",
      campusId: "campus-001",
      reporterAccountId: "reporter-student-id",
      targetType: ReportTargetType.Student,
      targetAccountId: "target-student-id",
      targetActivityId: null,
      reasonCode: "harassment",
      description: "Repeated unsafe messages",
      status: ReportStatus.PendingReview,
      submittedAt: "2026-05-13T00:00:00.000Z"
    });
    expect(studentLookupCalls).toEqual(["target-student-id"]);
    expect(reportStore).toHaveLength(1);
  });

  it("creates activity report without any activity lookup", async () => {
    const reportStore = createReportStore();
    const studentLookupCalls: string[] = [];
    const service = createReportSubmissionService(reportStore, {
      studentAccounts: [],
      studentLookupCalls
    });

    const report = await service.submitReport(createStudentContext(), {
      campusId: "campus-001",
      targetType: ReportTargetType.Activity,
      targetActivityId: "activity-001",
      reasonCode: "unsafe_activity"
    });

    expect(report.targetActivityId).toBe("activity-001");
    expect(studentLookupCalls).toHaveLength(0);
    expect(reportStore[0]?.targetActivityId).toBe("activity-001");
  });

  it("rejects missing target", async () => {
    const service = createReportSubmissionService(createReportStore(), {
      studentAccounts: []
    });

    await expect(
      service.submitReport(createStudentContext(), {
        campusId: "campus-001",
        targetType: ReportTargetType.Student,
        reasonCode: "harassment"
      })
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR"
    });
  });

  it("rejects self-report", async () => {
    const service = createReportSubmissionService(createReportStore(), {
      studentAccounts: [
        createStudentAccount({
          studentAccountId: "reporter-student-id",
          selectedCampusId: "campus-001"
        })
      ]
    });

    await expect(
      service.submitReport(createStudentContext(), {
        campusId: "campus-001",
        targetType: ReportTargetType.Student,
        targetAccountId: "reporter-student-id",
        reasonCode: "self"
      })
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR"
    });
  });

  it("rejects campus mismatch", async () => {
    const service = createReportSubmissionService(createReportStore(), {
      studentAccounts: []
    });

    await expect(
      service.submitReport(createStudentContext(), {
        campusId: "campus-999",
        targetType: ReportTargetType.Activity,
        targetActivityId: "activity-001",
        reasonCode: "unsafe_activity"
      })
    ).rejects.toMatchObject({
      code: "CAMPUS_SCOPE_VIOLATION"
    });
  });

  it("rejects student target with null selected campus", async () => {
    const service = createReportSubmissionService(createReportStore(), {
      studentAccounts: [
        createStudentAccount({
          studentAccountId: "target-student-id",
          selectedCampusId: null
        })
      ]
    });

    await expect(
      service.submitReport(createStudentContext(), {
        campusId: "campus-001",
        targetType: ReportTargetType.Student,
        targetAccountId: "target-student-id",
        reasonCode: "harassment"
      })
    ).rejects.toMatchObject({
      code: "CAMPUS_SCOPE_VIOLATION"
    });
  });

  it("rejects student target with different selected campus", async () => {
    const service = createReportSubmissionService(createReportStore(), {
      studentAccounts: [
        createStudentAccount({
          studentAccountId: "target-student-id",
          selectedCampusId: "campus-002"
        })
      ]
    });

    await expect(
      service.submitReport(createStudentContext(), {
        campusId: "campus-001",
        targetType: ReportTargetType.Student,
        targetAccountId: "target-student-id",
        reasonCode: "harassment"
      })
    ).rejects.toMatchObject({
      code: "CAMPUS_SCOPE_VIOLATION"
    });
  });
  it("rejects duplicate reports", async () => {
    const reportStore = createReportStore(
      createReportRecord({
        reporterAccountId: "reporter-student-id",
        targetType: ReportTargetType.Student,
        targetAccountId: "target-student-id",
      })
    );
    const service = createReportSubmissionService(reportStore, {
      studentAccounts: [
        createStudentAccount({
          studentAccountId: "target-student-id",
          selectedCampusId: "campus-001"
        })
      ]
    });

    await expect(
      service.submitReport(createStudentContext(), {
        campusId: "campus-001",
        targetType: ReportTargetType.Student,
        targetAccountId: "target-student-id",
        reasonCode: "harassment"
      })
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR"
    });
  });
});

function createReportSubmissionService(
  reportStore: ReportRecord[],
  options: {
    studentAccounts: StudentAccount[];
    studentLookupCalls?: string[];
  }
) {
  return new ReportSubmissionService(
    {
      instantiate(payload: Partial<ReportRecord>) {
        return createReportRecord(payload);
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
      },
      async hasExistingReport(
        reporterAccountId: string,
        targetType: ReportTargetType,
        targetAccountId: string | null,
        targetActivityId: string | null
      ) {
        return reportStore.some(
          (report) =>
            report.reporterAccountId === reporterAccountId &&
            report.targetType === targetType &&
            report.targetAccountId === targetAccountId &&
            report.targetActivityId === targetActivityId
        );
      }
    },
    {
      async findById(studentAccountId: string) {
        options.studentLookupCalls?.push(studentAccountId);

        return (
          options.studentAccounts.find(
            (studentAccount) => studentAccount.studentAccountId === studentAccountId
          ) ?? null
        );
      }
    }
  );
}

function createStudentContext(
  overrides: Partial<AuthenticatedStudentContext> = {}
): AuthenticatedStudentContext {
  return {
    studentAccountId: "reporter-student-id",
    universityEmail: "reporter@incampus.test",
    selectedCampusId: "campus-001",
    platformAccessStatus: PlatformAccessStatus.Active,
    verificationStatus: VerificationStatus.Verified,
    ...overrides
  };
}

function createReportStore(...reportRecords: ReportRecord[]): ReportRecord[] {
  return [...reportRecords];
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
    description: null,
    status: ReportStatus.PendingReview,
    submittedAt: new Date("2026-05-13T00:00:00.000Z"),
    reviewedAt: null,
    reviewedByAdminId: null,
    moderationAction: "none",
    reviewOutcome: null,
    reviewNotes: null,
    commandDispatchPending: false,
    ...overrides
  } as ReportRecord;
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
