import { Router } from "express";

import {
  createStudentAuthMiddleware,
  type StudentContextResolver
} from "../../../shared/src/middleware/auth";
import { BlockManagementController } from "../controllers/BlockManagementController";
import { CommunityRulesController } from "../controllers/CommunityRulesController";
import { BlockManagementService } from "../services/BlockManagementService";
import { CommunityRulesContentProvider } from "../services/CommunityRulesContentProvider";

export interface CreateSafetyModerationRoutesArgs {
  resolveStudentContext: StudentContextResolver;
  blockManagementService: BlockManagementService;
  communityRulesContentProvider: CommunityRulesContentProvider;
}

export function createSafetyModerationRoutes(
  args: CreateSafetyModerationRoutesArgs
): Router {
  const router = Router();
  const blockManagementController = new BlockManagementController(args.blockManagementService);
  const communityRulesController = new CommunityRulesController(
    args.communityRulesContentProvider
  );

  router.use(createStudentAuthMiddleware(args.resolveStudentContext));

  router.post("/blocks", blockManagementController.createBlock);
  router.get("/community-rules", communityRulesController.getCommunityRules);

  return router;
}
