// Task: AP04 / AP05 | Path: backend/packages/access-profile/src/services/AccountActivationService.ts

import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

import { AppError } from "../../../shared/src/errors/AppError";
import { PlatformAccessStatus, VerificationStatus } from "../../../shared/src/domain/enums";
import { StudentAccount } from "../entities/StudentAccount";
import { StudentAccountRepo } from "../repositories/StudentAccountRepo";

export class AccountActivationService {
  constructor(private readonly studentAccountRepo: StudentAccountRepo) {}

  public async signUp(
    email: string,
    password: string,
    studentId: string
  ): Promise<StudentAccount> {
    const existing = await this.studentAccountRepo.findByEmail(email);
    if (existing) {
      throw new AppError("CONFLICT", "Email already registered", 409, {
        conflictResource: "StudentAccount"
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = randomBytes(32).toString("hex");

    const entity = this.studentAccountRepo.create({
      universityEmail: email,
      passwordHash,
      universityStudentId: studentId,
      verificationStatus: VerificationStatus.Pending,
      platformAccessStatus: PlatformAccessStatus.PendingVerification,
      verificationToken,
      selectedCampusId: null,
      campusInsightSharingConsent: false
    });

    return this.studentAccountRepo.save(entity);
  }

  public async verifyEmail(email: string, token: string): Promise<StudentAccount> {
    const account = await this.studentAccountRepo.findByEmail(email);
    if (!account) {
      throw AppError.notFound("StudentAccount", email);
    }
    if (account.verificationToken !== token) {
      throw new AppError("INVALID_VERIFICATION_TOKEN", "Invalid or expired verification token", 400);
    }

    account.verificationToken = null;
    account.verificationStatus = VerificationStatus.Verified;
    account.platformAccessStatus = PlatformAccessStatus.Active;
    return this.studentAccountRepo.save(account);
  }
}
