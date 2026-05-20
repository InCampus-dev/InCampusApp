import { Router } from "express";

import {
  createAdminAuthMiddleware,
  type AdminContextResolver
} from "../../../shared/src/middleware/adminAuth";
import {
  createStudentAuthMiddleware,
  type StudentContextResolver
} from "../../../shared/src/middleware/auth";
import { AdminReportController } from "../controllers/AdminReportController";
import { BlockManagementController } from "../controllers/BlockManagementController";
import { CommunityRulesController } from "../controllers/CommunityRulesController";
import { ReportController } from "../controllers/ReportController";
import { BlockManagementService } from "../services/BlockManagementService";
import { CommunityRulesContentProvider } from "../services/CommunityRulesContentProvider";
import { ReportReviewService } from "../services/ReportReviewService";
import { ReportSubmissionService } from "../services/ReportSubmissionService";

export interface CreateSafetyModerationRoutesArgs {
  resolveStudentContext: StudentContextResolver;
  resolveAdminContext: AdminContextResolver;
  blockManagementService: BlockManagementService;
  communityRulesContentProvider: CommunityRulesContentProvider;
  reportSubmissionService: ReportSubmissionService;
  reportReviewService: ReportReviewService;
}

export function createSafetyModerationRoutes(
  args: CreateSafetyModerationRoutesArgs
): Router {
  const router = Router();
  const studentAuthMiddleware = createStudentAuthMiddleware(args.resolveStudentContext);
  const adminAuthMiddleware = createAdminAuthMiddleware(args.resolveAdminContext);
  const adminReportController = new AdminReportController(args.reportReviewService);
  const blockManagementController = new BlockManagementController(args.blockManagementService);
  const communityRulesController = new CommunityRulesController(
    args.communityRulesContentProvider
  );
  const reportController = new ReportController(args.reportSubmissionService);

  router.post("/blocks", studentAuthMiddleware, blockManagementController.createBlock);
  router.get("/community-rules", studentAuthMiddleware, communityRulesController.getCommunityRules);
  router.post("/reports", studentAuthMiddleware, reportController.submitReport);

  router.use("/admin", adminAuthMiddleware);
  router.get("/admin/campuses/:campusId/reports", adminReportController.listReports);
  router.get(
    "/admin/campuses/:campusId/reports/:reportId",
    adminReportController.getReportDetail
  );
  router.patch(
    "/admin/campuses/:campusId/reports/:reportId/review",
    adminReportController.reviewReport
  );

  return router;
}
