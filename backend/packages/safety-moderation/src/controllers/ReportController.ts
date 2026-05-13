import type { NextFunction, Request, Response } from "express";

import { requireStudentContext } from "../../../shared/src/middleware/auth";
import { ReportSubmissionService } from "../services/ReportSubmissionService";

export class ReportController {
  constructor(private readonly reportSubmissionService: ReportSubmissionService) {}

  public submitReport = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const studentContext = requireStudentContext(request);
      const report = await this.reportSubmissionService.submitReport(
        studentContext,
        request.body
      );

      response.status(201).json(report);
    } catch (error) {
      next(error);
    }
  };
}
