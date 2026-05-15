import type { NextFunction, Request, Response } from "express";

import { requireAdminContext } from "../../../shared/src/middleware/adminAuth";
import { ReportReviewService } from "../services/ReportReviewService";

export class AdminReportController {
  constructor(private readonly reportReviewService: ReportReviewService) {}

  public listReports = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const adminContext = requireAdminContext(request);
      const reports = await this.reportReviewService.listReports(
        adminContext,
        request.params.campusId
      );

      response.status(200).json(reports);
    } catch (error) {
      next(error);
    }
  };

  public getReportDetail = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const adminContext = requireAdminContext(request);
      const report = await this.reportReviewService.getReportDetail(
        adminContext,
        request.params.campusId,
        request.params.reportId
      );

      response.status(200).json(report);
    } catch (error) {
      next(error);
    }
  };

  public reviewReport = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const adminContext = requireAdminContext(request);
      const report = await this.reportReviewService.reviewReport(
        adminContext,
        request.params.campusId,
        request.params.reportId,
        request.body
      );

      response.status(200).json(report);
    } catch (error) {
      next(error);
    }
  };
}
