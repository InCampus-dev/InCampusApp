import { Router } from "express";

import type { AdminContextResolver } from "../../../shared/src/middleware/adminAuth";
import { createAdminAuthMiddleware } from "../../../shared/src/middleware/adminAuth";
import type { StudentContextResolver } from "../../../shared/src/middleware/auth";
import { createStudentAuthMiddleware } from "../../../shared/src/middleware/auth";
import { AdminInsightController } from "../controllers/AdminInsightController";
import { CampusConfigController } from "../controllers/CampusConfigController";
import { CampusOptionsController } from "../controllers/CampusOptionsController";
import type { AdminInsightService } from "../services/AdminInsightService";
import { CampusConfigurationService } from "../services/CampusConfigurationService";
import { CampusOptionsService } from "../services/CampusOptionsService";

export interface CreateCampusAdministrationRoutesArgs {
  resolveAdminContext: AdminContextResolver;
  resolveStudentContext: StudentContextResolver;
  adminInsightService: AdminInsightService;
  campusConfigurationService: CampusConfigurationService;
  campusOptionsService: CampusOptionsService;
}

export function createCampusAdministrationRoutes(
  args: CreateCampusAdministrationRoutesArgs
): Router {
  const router = Router();
  const adminInsightController = new AdminInsightController(args.adminInsightService);
  const campusConfigController = new CampusConfigController(args.campusConfigurationService);
  const campusOptionsController = new CampusOptionsController(args.campusOptionsService);

  router.get(
    "/campuses/:campusId/structured-options",
    createStudentAuthMiddleware(args.resolveStudentContext),
    campusOptionsController.listStudentSelectableStructuredOptions
  );

  router.use("/admin", createAdminAuthMiddleware(args.resolveAdminContext));

  router.post("/admin/campuses", campusConfigController.createCampus);
  router.get(
    "/admin/campuses/:campusId/student-insights",
    adminInsightController.listStudentInsights
  );
  router.get(
    "/admin/campuses/:campusId/structured-options",
    campusOptionsController.listStructuredOptions
  );
  router.post(
    "/admin/campuses/:campusId/structured-options",
    campusOptionsController.createStructuredOption
  );
  router.patch(
    "/admin/campuses/:campusId/structured-options/:optionId",
    campusOptionsController.updateStructuredOption
  );
  router.delete(
    "/admin/campuses/:campusId/structured-options/:optionId",
    campusOptionsController.deleteStructuredOption
  );

  return router;
}
