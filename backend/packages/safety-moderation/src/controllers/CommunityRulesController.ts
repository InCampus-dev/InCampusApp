import type { NextFunction, Request, Response } from "express";

import { requireStudentContext } from "../../../shared/src/middleware/auth";
import { CommunityRulesContentProvider } from "../services/CommunityRulesContentProvider";

export class CommunityRulesController {
  constructor(private readonly communityRulesContentProvider: CommunityRulesContentProvider) {}

  public getCommunityRules = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      requireStudentContext(request);

      const rules = this.communityRulesContentProvider.getCommunityRules(request.query.locale);

      response.status(200).json(rules);
    } catch (error) {
      next(error);
    }
  };
}
