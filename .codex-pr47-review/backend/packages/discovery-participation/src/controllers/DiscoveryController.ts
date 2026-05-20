import { NextFunction, Request, Response } from "express";
import { AppError } from "../../../shared/src/errors/AppError";
import { requireStudentContext } from "../../../shared/src/middleware/auth";
import { FeedService } from "../services/FeedService";
import { ActivityDetailService } from "../services/ActivityDetailService";

export class DiscoveryController {
  constructor(
    private feedService: FeedService,
    private activityDetailService: ActivityDetailService
  ) {}

  getFeed = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const studentContext = requireCampusSelectedStudentContext(req);

      const { categoryId } = req.query;

      const activities = await this.feedService.getActivities(
        studentContext.studentAccountId,
        studentContext.selectedCampusId,
        { categoryId: categoryId as string }
      );

      res.status(200).json({ data: activities });
    } catch (error) {
      next(error);
    }
  };

  getActivityDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const studentContext = requireCampusSelectedStudentContext(req);

      const { id: activityId } = req.params;
      const activityDetails = await this.activityDetailService.getActivityDetails(
        studentContext.studentAccountId,
        studentContext.selectedCampusId,
        activityId
      );

      res.status(200).json({ data: activityDetails });
    } catch (error) {
      next(error);
    }
  };
}

function requireCampusSelectedStudentContext(request: Request): {
  studentAccountId: string;
  selectedCampusId: string;
} {
  const studentContext = requireStudentContext(request);

  if (!studentContext.selectedCampusId) {
    throw new AppError("AUTH_REQUIRED", "A selected campus is required", 401, {
      authReason: "missing_selected_campus"
    });
  }

  return {
    studentAccountId: studentContext.studentAccountId,
    selectedCampusId: studentContext.selectedCampusId
  };
}
