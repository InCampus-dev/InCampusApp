import { describe, expect, it } from "vitest";

import {
  createDefaultCampusInsightConsentSettings,
  createLegacyEnabledCampusInsightConsentSettings,
  deriveCampusInsightSharingConsent
} from "../../../shared/src/domain/campusInsightConsent";
import { PlatformAccessStatus, VerificationStatus } from "../../../shared/src/domain/enums";
import { StudentAccount } from "../entities/StudentAccount";
import { StudentAccountRepo } from "../repositories/StudentAccountRepo";
import { CampusInsightConsentService } from "../services/CampusInsightConsentService";
import { CampusAssociationService } from "../services/CampusAssociationService";
import { IdentityRuleRepo } from "../repositories/IdentityRuleRepo";

describe("CampusInsightConsentService", () => {
  it("returns disabled granular consent defaults for a new account", async () => {
    const studentAccountStore = [createStudentAccount({ studentAccountId: "student-001" })];
    const service = new CampusInsightConsentService(createStudentAccountRepo(studentAccountStore));

    await expect(service.getOwnConsent("student-001")).resolves.toEqual({
      campusInsightSharingConsent: false,
      campusInsightConsentSettings: createDefaultCampusInsightConsentSettings()
    });
  });

  it.each([
    {
      label: "basic enabled only",
      settings: {
        basicInsightsEnabled: true,
        activityInsightsEnabled: false,
        hiddenActivityCategoryIds: [],
        excludeCoParticipants: true
      },
      expectedLegacyConsent: true
    },
    {
      label: "activity enabled only",
      settings: {
        basicInsightsEnabled: false,
        activityInsightsEnabled: true,
        hiddenActivityCategoryIds: ["category-001"],
        excludeCoParticipants: true
      },
      expectedLegacyConsent: true
    },
    {
      label: "both enabled",
      settings: {
        basicInsightsEnabled: true,
        activityInsightsEnabled: true,
        hiddenActivityCategoryIds: ["category-001", "category-002"],
        excludeCoParticipants: false
      },
      expectedLegacyConsent: true
    },
    {
      label: "both disabled",
      settings: createDefaultCampusInsightConsentSettings(),
      expectedLegacyConsent: false
    }
  ])("saves granular campus insight consent: $label", async ({ settings, expectedLegacyConsent }) => {
    const studentAccountStore = [createStudentAccount({ studentAccountId: "student-001" })];
    const service = new CampusInsightConsentService(createStudentAccountRepo(studentAccountStore));

    await expect(service.updateOwnInsightConsent("student-001", settings)).resolves.toEqual({
      campusInsightSharingConsent: expectedLegacyConsent,
      campusInsightConsentSettings: settings
    });

    expect(studentAccountStore[0]?.campusInsightSharingConsent).toBe(expectedLegacyConsent);
    expect(studentAccountStore[0]?.campusInsightConsentSettings).toEqual(settings);
  });

  it("sanitizes hidden category IDs and ignores unknown fields", async () => {
    const studentAccountStore = [createStudentAccount({ studentAccountId: "student-001" })];
    const service = new CampusInsightConsentService(createStudentAccountRepo(studentAccountStore));

    await expect(
      service.updateOwnInsightConsent("student-001", {
        basicInsightsEnabled: false,
        activityInsightsEnabled: true,
        hiddenActivityCategoryIds: [" category-001 ", "category-001", ""],
        excludeCoParticipants: true,
        unknownField: "ignored"
      })
    ).resolves.toEqual({
      campusInsightSharingConsent: true,
      campusInsightConsentSettings: {
        basicInsightsEnabled: false,
        activityInsightsEnabled: true,
        hiddenActivityCategoryIds: ["category-001"],
        excludeCoParticipants: true
      }
    });
  });

  it("maps the legacy consent endpoint to enabled granular settings", async () => {
    const studentAccountStore = [createStudentAccount({ studentAccountId: "student-001" })];
    const service = new CampusInsightConsentService(createStudentAccountRepo(studentAccountStore));

    await expect(service.updateOwnConsent("student-001", true)).resolves.toEqual({
      campusInsightSharingConsent: true,
      campusInsightConsentSettings: createLegacyEnabledCampusInsightConsentSettings()
    });
    expect(studentAccountStore[0]?.campusInsightSharingConsent).toBe(true);
    expect(studentAccountStore[0]?.campusInsightConsentSettings).toEqual(
      createLegacyEnabledCampusInsightConsentSettings()
    );
  });

  it("maps the legacy consent endpoint to disabled granular settings", async () => {
    const studentAccountStore = [
      createStudentAccount({
        studentAccountId: "student-001",
        campusInsightSharingConsent: true,
        campusInsightConsentSettings: createLegacyEnabledCampusInsightConsentSettings()
      })
    ];
    const service = new CampusInsightConsentService(createStudentAccountRepo(studentAccountStore));

    await expect(service.updateOwnConsent("student-001", false)).resolves.toEqual({
      campusInsightSharingConsent: false,
      campusInsightConsentSettings: createDefaultCampusInsightConsentSettings()
    });
    expect(studentAccountStore[0]?.campusInsightSharingConsent).toBe(false);
    expect(studentAccountStore[0]?.campusInsightConsentSettings).toEqual(
      createDefaultCampusInsightConsentSettings()
    );
  });

  it("rejects missing account updates", async () => {
    const service = new CampusInsightConsentService(createStudentAccountRepo([]));

    await expect(service.updateOwnConsent("missing-student", true)).rejects.toMatchObject({
      code: "NOT_FOUND"
    });
  });

  it("does not block normal account usage when consent is refused or revoked", async () => {
    const studentAccountStore = [createStudentAccount({ studentAccountId: "student-001" })];
    const studentAccountRepo = createStudentAccountRepo(studentAccountStore);
    const consentService = new CampusInsightConsentService(studentAccountRepo);
    const campusAssociationService = new CampusAssociationService(
      studentAccountRepo,
      createCampusRepo([
        {
          campusId: "campus-001",
          universityName: "Tongji University",
          activationStatus: true
        }
      ]),
      createIdentityRuleRepo([
        {
          emailDomain: "tongji.edu.cn",
          universityName: "Tongji University",
          ruleStatus: "Active"
        }
      ])
    );

    await consentService.updateOwnConsent("student-001", false);
    await campusAssociationService.selectCampus("student-001", "campus-001");

    expect(studentAccountStore[0]?.campusInsightSharingConsent).toBe(false);
    expect(studentAccountStore[0]?.selectedCampusId).toBe("campus-001");
  });
});

function createCampusRepo(
  campuses: Array<{ campusId: string; universityName: string; activationStatus: boolean }>
) {
  return {
    async findOne(
      options: any
    ): Promise<{ campusId: string; universityName: string; activationStatus: boolean } | null> {
      const where = options?.where ?? {};
      return (
        campuses.find(
          (c) =>
            (where.campusId === undefined || c.campusId === where.campusId) &&
            (where.universityName === undefined || c.universityName === where.universityName) &&
            (where.activationStatus === undefined || c.activationStatus === where.activationStatus)
        ) ?? null
      );
    },
    async find(): Promise<typeof campuses> {
      return campuses.filter((c) => c.activationStatus);
    }
  } as any;
}

function createIdentityRuleRepo(
  identityRules: Array<{ emailDomain: string; universityName: string; ruleStatus: string }>
) {
  return {
    async findByDomain(emailDomain: string) {
      return (
        identityRules.find((identityRule) => identityRule.emailDomain === emailDomain) ?? null
      );
    }
  } as unknown as IdentityRuleRepo;
}

function createStudentAccountRepo(studentAccountStore: StudentAccount[]): StudentAccountRepo {
  return {
    async findById(studentAccountId: string): Promise<StudentAccount | null> {
      return (
        studentAccountStore.find(
          (candidateAccount) => candidateAccount.studentAccountId === studentAccountId
        ) ?? null
      );
    },
    async save(studentAccount: StudentAccount): Promise<StudentAccount> {
      const existingIndex = studentAccountStore.findIndex(
        (candidateAccount) => candidateAccount.studentAccountId === studentAccount.studentAccountId
      );

      if (existingIndex >= 0) {
        studentAccountStore[existingIndex] = studentAccount;
      } else {
        studentAccountStore.push(studentAccount);
      }

      return studentAccount;
    }
  } as unknown as StudentAccountRepo;
}

function createStudentAccount(overrides: Partial<StudentAccount>): StudentAccount {
  const campusInsightConsentSettings =
    overrides.campusInsightConsentSettings ??
    (overrides.campusInsightSharingConsent
      ? createLegacyEnabledCampusInsightConsentSettings()
      : createDefaultCampusInsightConsentSettings());

  return {
    studentAccountId: overrides.studentAccountId ?? "student-001",
    passwordHash: overrides.passwordHash ?? "hashed-password",
    universityStudentId: overrides.universityStudentId ?? "u123456",
    universityEmail: overrides.universityEmail ?? "student@tongji.edu.cn",
    verificationStatus: overrides.verificationStatus ?? VerificationStatus.Verified,
    platformAccessStatus: overrides.platformAccessStatus ?? PlatformAccessStatus.Active,
    selectedCampusId: overrides.selectedCampusId ?? null,
    campusInsightSharingConsent:
      overrides.campusInsightSharingConsent ??
      deriveCampusInsightSharingConsent(campusInsightConsentSettings),
    campusInsightConsentSettings,
    verificationToken: overrides.verificationToken ?? null,
    createdAt: overrides.createdAt ?? new Date("2026-05-13T00:00:00.000Z")
  };
}
