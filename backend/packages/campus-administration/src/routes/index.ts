import { Router } from "express";

import type { AdminContextResolver } from "../../../shared/src/middleware/adminAuth";
import { createAdminAuthMiddleware } from "../../../shared/src/middleware/adminAuth";
import { CampusConfigController } from "../controllers/CampusConfigController";
import { CampusOptionsController } from "../controllers/CampusOptionsController";
import { CampusConfigurationService } from "../services/CampusConfigurationService";
import { CampusOptionsService } from "../services/CampusOptionsService";

export interface CreateCampusAdministrationRoutesArgs {
  resolveAdminContext: AdminContextResolver;
  campusConfigurationService: CampusConfigurationService;
  campusOptionsService: CampusOptionsService;
}

export function createCampusAdministrationRoutes(
  args: CreateCampusAdministrationRoutesArgs
): Router {
  const router = Router();
  const campusConfigController = new CampusConfigController(args.campusConfigurationService);
  const campusOptionsController = new CampusOptionsController(args.campusOptionsService);

  router.use("/admin", createAdminAuthMiddleware(args.resolveAdminContext));

  router.post("/admin/campuses", campusConfigController.createCampus);
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
