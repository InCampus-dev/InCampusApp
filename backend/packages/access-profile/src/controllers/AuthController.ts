// Task: AP04 / AP05 / AP06 | Path: backend/packages/access-profile/src/controllers/AuthController.ts

import type { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";

import { AppError } from "../../../shared/src/errors/AppError";
import { PlatformAccessStatus, VerificationStatus } from "../../../shared/src/domain/enums";
import { AccountActivationService } from "../services/AccountActivationService";
import { buildAuthenticatedResponse } from "../services/authSession";
import { DomainValidationService } from "../services/DomainValidationService";
import { EmailVerificationService } from "../services/EmailVerificationService";
import { StudentAccountRepo } from "../repositories/StudentAccountRepo";

export class AuthController {
  constructor(
    private readonly domainValidationService: DomainValidationService,
    private readonly accountActivationService: AccountActivationService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly studentAccountRepo: StudentAccountRepo
  ) {}

  // POST /auth/signup
  public signUp = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const { universityEmail, password, universityStudentId } = request.body;

      if (!universityEmail || !password || !universityStudentId) {
        throw AppError.validation("Missing required fields", [
          {
            field: "body",
            message: "universityEmail, password, and universityStudentId are required",
            code: "missing_required_fields"
          }
        ]);
      }

      const domain = (universityEmail as string).split("@")[1];
      if (!domain || !(await this.domainValidationService.validateDomain(domain))) {
        throw new AppError("UNSUPPORTED_EMAIL_DOMAIN", "Email domain is not supported by any active university", 400);
      }

      const account = await this.accountActivationService.signUp(
        universityEmail,
        password,
        universityStudentId
      );

      await this.emailVerificationService.sendVerificationEmail(
        account.universityEmail,
        account.verificationToken
      );

      response.status(201).json({
        message: "Account created. Please verify your email.",
        studentAccountId: account.studentAccountId
      });
    } catch (error) {
      next(error);
    }
  };

  // POST /auth/verify-email
  public verifyEmail = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, token } = request.body;

      if (!email || !token) {
        throw AppError.validation("Missing required fields", [
          { field: "body", message: "email and token are required", code: "missing_required_fields" }
        ]);
      }

      await this.accountActivationService.verifyEmail(email, token);
      response.json({ message: "Email verified successfully" });
    } catch (error) {
      next(error);
    }
  };

  // POST /auth/signin
  public signIn = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const { universityEmail, password } = request.body;

      if (!universityEmail || !password) {
        throw AppError.validation("Missing required fields", [
          {
            field: "body",
            message: "universityEmail and password are required",
            code: "missing_required_fields"
          }
        ]);
      }

      const account = await this.studentAccountRepo.findByEmail(universityEmail);
      if (!account) {
        throw new AppError("INVALID_CREDENTIALS", "Invalid email or password", 401);
      }

      const passwordValid = await bcrypt.compare(password, account.passwordHash);
      if (!passwordValid) {
        throw new AppError("INVALID_CREDENTIALS", "Invalid email or password", 401);
      }

      if (account.verificationStatus !== VerificationStatus.Verified) {
        throw new AppError("ACCOUNT_NOT_VERIFIED", "Account email has not been verified", 403);
      }
      if (account.platformAccessStatus === PlatformAccessStatus.Suspended) {
        throw new AppError("ACCOUNT_SUSPENDED", "Account has been suspended", 403);
      }
      if (account.platformAccessStatus === PlatformAccessStatus.Banned) {
        throw new AppError("ACCOUNT_BANNED", "Account has been banned", 403);
      }

      const responseBody = buildAuthenticatedResponse(account);
      response.json(responseBody);
    } catch (error) {
      next(error);
    }
  };
}
