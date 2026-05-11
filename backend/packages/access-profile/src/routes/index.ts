// Task: AP01 / AP04 / AP05 / AP06 / AP07 | Path: backend/packages/access-profile/src/routes/index.ts

import { Router } from "express";
import type { DataSource } from "typeorm";

import {
  createStudentAuthMiddleware,
  type StudentContextResolver
} from "../../../shared/src/middleware/auth";
import { IdentityRuleRepo } from "../repositories/IdentityRuleRepo";
import { StudentAccountRepo } from "../repositories/StudentAccountRepo";
import { AccountActivationService } from "../services/AccountActivationService";
import { CampusAssociationService } from "../services/CampusAssociationService";
import { DomainValidationService } from "../services/DomainValidationService";
import { EmailVerificationService } from "../services/EmailVerificationService";
import { AuthController } from "../controllers/AuthController";
import { CampusController } from "../controllers/CampusController";

export interface CreateAccessProfileRoutesArgs {
  dataSource: DataSource;
  resolveStudentContext: StudentContextResolver;
}

export function createAccessProfileRoutes(args: CreateAccessProfileRoutesArgs): Router {
  const studentAccountRepo = new StudentAccountRepo(args.dataSource);
  const identityRuleRepo = new IdentityRuleRepo(args.dataSource);

  const domainValidationService = new DomainValidationService(identityRuleRepo);
  const accountActivationService = new AccountActivationService(studentAccountRepo);
  const emailVerificationService = new EmailVerificationService();
  const campusAssociationService = new CampusAssociationService(studentAccountRepo);

  const authController = new AuthController(
    domainValidationService,
    accountActivationService,
    emailVerificationService,
    studentAccountRepo
  );
  const campusController = new CampusController(campusAssociationService);

  const studentAuthMiddleware = createStudentAuthMiddleware(args.resolveStudentContext);

  const router = Router();

  router.post("/auth/signup", authController.signUp);
  router.post("/auth/verify-email", authController.verifyEmail);
  router.post("/auth/signin", authController.signIn);

  router.get("/campuses", campusController.getCampuses);
  // PATCH /accounts/me/campus requires authentication
  router.patch("/accounts/me/campus", studentAuthMiddleware, campusController.selectCampus);

  return router;
}
