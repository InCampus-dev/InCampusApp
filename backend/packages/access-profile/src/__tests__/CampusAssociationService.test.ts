import { describe, expect, it } from "vitest";

import { createDefaultCampusInsightConsentSettings } from "../../../shared/src/domain/campusInsightConsent";
import {
  PlatformAccessStatus,
  VerificationStatus
} from "../../../shared/src/domain/enums";
import { StudentAccount } from "../entities/StudentAccount";
import { IdentityRuleRepo } from "../repositories/IdentityRuleRepo";
import { StudentAccountRepo } from "../repositories/StudentAccountRepo";
import { CampusAssociationService } from "../services/CampusAssociationService";

describe("CampusAssociationService", () => {
  it("filters active campuses to the student's derived university", async () => {
    const service = new CampusAssociationService(
      createStudentAccountRepo([]),
      createCampusRepo([
        {
          campusId: "campus-tongji-1",
          universityName: "Tongji University",
          campusName: "Jiading Campus",
          activationStatus: true
        },
        {
          campusId: "campus-tongji-2",
          universityName: "Tongji University",
          campusName: "Siping Campus",
          activationStatus: false
        },
        {
          campusId: "campus-polimi-1",
          universityName: "Politecnico di Milano",
          campusName: "Leonardo Campus",
          activationStatus: true
        }
      ]),
      createIdentityRuleRepo([
        {
          emailDomain: "tongji.edu.cn",
          universityName: "Tongji University",
          ruleStatus: "Active"
        },
        {
          emailDomain: "polimi.it",
          universityName: "Politecnico di Milano",
          ruleStatus: "Active"
        }
      ])
    );

    await expect(service.getCampuses("student@tongji.edu.cn")).resolves.toEqual([
      {
        campusId: "campus-tongji-1",
        universityName: "Tongji University",
        campusName: "Jiading Campus",
        activationStatus: true
      }
    ]);
  });

  it("updates the selected campus and returns the saved account", async () => {
    const studentAccount = createStudentAccount({
      studentAccountId: "student-001",
      universityEmail: "student@tongji.edu.cn",
      selectedCampusId: null
    });
    const service = new CampusAssociationService(
      createStudentAccountRepo([studentAccount]),
      createCampusRepo([
        {
          campusId: "campus-tongji-1",
          universityName: "Tongji University",
          campusName: "Jiading Campus",
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

    const updatedAccount = await service.selectCampus("student-001", "campus-tongji-1");

    expect(updatedAccount.selectedCampusId).toBe("campus-tongji-1");
    expect(studentAccount.selectedCampusId).toBe("campus-tongji-1");
  });
});

function createCampusRepo(
  campuses: Array<{
    campusId: string;
    universityName: string;
    campusName: string;
    activationStatus: boolean;
  }>
) {
  return {
    async find(options: any) {
      const where = options?.where ?? {};
      return campuses.filter(
        (campus) =>
          (where.activationStatus === undefined ||
            campus.activationStatus === where.activationStatus) &&
          (where.universityName === undefined || campus.universityName === where.universityName)
      );
    },
    async findOne(options: any) {
      const where = options?.where ?? {};
      return (
        campuses.find(
          (campus) =>
            (where.campusId === undefined || campus.campusId === where.campusId) &&
            (where.activationStatus === undefined ||
              campus.activationStatus === where.activationStatus) &&
            (where.universityName === undefined || campus.universityName === where.universityName)
        ) ?? null
      );
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
      return studentAccount;
    }
  } as unknown as StudentAccountRepo;
}

function createStudentAccount(overrides?: Partial<StudentAccount>): StudentAccount {
  return {
    studentAccountId: overrides?.studentAccountId ?? "student-001",
    passwordHash: overrides?.passwordHash ?? "hashed-password",
    universityStudentId: overrides?.universityStudentId ?? "u1234567",
    universityEmail: overrides?.universityEmail ?? "student@tongji.edu.cn",
    verificationStatus: overrides?.verificationStatus ?? VerificationStatus.Verified,
    platformAccessStatus: overrides?.platformAccessStatus ?? PlatformAccessStatus.Active,
    selectedCampusId: overrides?.selectedCampusId ?? null,
    campusInsightSharingConsent: overrides?.campusInsightSharingConsent ?? false,
    campusInsightConsentSettings:
      overrides?.campusInsightConsentSettings ?? createDefaultCampusInsightConsentSettings(),
    verificationToken: overrides?.verificationToken ?? null,
    createdAt: overrides?.createdAt ?? new Date("2026-05-15T00:00:00.000Z")
  } as StudentAccount;
}
