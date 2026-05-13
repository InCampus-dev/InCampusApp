// Task: AP01 / AP04 / AP05 / AP06 / AP07 | Path: backend/packages/access-profile/src/routes/index.ts

import { Router } from "express";
import type { DataSource } from "typeorm";

import {
  createStudentAuthMiddleware,
  type StudentContextResolver
} from "../../../shared/src/middleware/auth";
import { ConsentController } from "../controllers/ConsentController";
import { ProfileController } from "../controllers/ProfileController";
import { IdentityRuleRepo } from "../repositories/IdentityRuleRepo";
import { StudentAccountRepo } from "../repositories/StudentAccountRepo";
import { StudentProfileRepo } from "../repositories/StudentProfileRepo";
import { AccountActivationService } from "../services/AccountActivationService";
import { CampusInsightConsentService } from "../services/CampusInsightConsentService";
import { CampusAssociationService } from "../services/CampusAssociationService";
import { DomainValidationService } from "../services/DomainValidationService";
import { EmailVerificationService } from "../services/EmailVerificationService";
import { StudentProfileService } from "../services/StudentProfileService";
import { AuthController } from "../controllers/AuthController";
import { CampusController } from "../controllers/CampusController";

export interface CreateAccessProfileRoutesArgs {
  dataSource: DataSource;
  resolveStudentContext: StudentContextResolver;
}

export function createAccessProfileRoutes(args: CreateAccessProfileRoutesArgs): Router {
  const studentAccountRepo = new StudentAccountRepo(args.dataSource);
  const studentProfileRepo = new StudentProfileRepo(args.dataSource);
  const identityRuleRepo = new IdentityRuleRepo(args.dataSource);

  const domainValidationService = new DomainValidationService(identityRuleRepo);
  const accountActivationService = new AccountActivationService(studentAccountRepo);
  const emailVerificationService = new EmailVerificationService();
  const campusAssociationService = new CampusAssociationService(studentAccountRepo);
  const studentProfileService = new StudentProfileService(studentProfileRepo);
  const campusInsightConsentService = new CampusInsightConsentService(studentAccountRepo);

  const authController = new AuthController(
    domainValidationService,
    accountActivationService,
    emailVerificationService,
    studentAccountRepo
  );
  const campusController = new CampusController(campusAssociationService);
  const profileController = new ProfileController(studentProfileService);
  const consentController = new ConsentController(campusInsightConsentService);

  const studentAuthMiddleware = createStudentAuthMiddleware(args.resolveStudentContext);

  const router = Router();

  // Fresh databases are not fully backed for AP profile/consent flows until the follow-up
  // AP persistence migration PR creates or aligns student_accounts, student_profiles,
  // and university_identity_rules.

  router.post("/auth/signup", authController.signUp);
  router.post("/auth/verify-email", authController.verifyEmail);
  router.post("/auth/signin", authController.signIn);

  router.get("/campuses", campusController.getCampuses);
  router.patch("/accounts/me/campus", studentAuthMiddleware, campusController.selectCampus);
  router.patch(
    "/accounts/me/consent",
    studentAuthMiddleware,
    consentController.updateOwnConsent
  );
  router.post("/profiles", studentAuthMiddleware, profileController.createProfile);
  router.get("/profiles/me", studentAuthMiddleware, profileController.getOwnProfile);
  router.patch("/profiles/me", studentAuthMiddleware, profileController.updateOwnProfile);

  return router;
}
