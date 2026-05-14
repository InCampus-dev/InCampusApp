import type { NextFunction, Request, Response } from "express";

import { requireAdminContext } from "../../../shared/src/middleware/adminAuth";
import type { AdminInsightService } from "../services/AdminInsightService";

export class AdminInsightController {
  constructor(private readonly adminInsightService: AdminInsightService) {}

  public listStudentInsights = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const adminContext = requireAdminContext(request);
      const insights = await this.adminInsightService.listCampusStudentInsights(
        adminContext,
        request.params.campusId,
        request.query
      );

      response.status(200).json(insights);
    } catch (error) {
      next(error);
    }
  };
}
