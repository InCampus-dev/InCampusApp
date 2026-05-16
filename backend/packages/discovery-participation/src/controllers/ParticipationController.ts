import { Request, Response, NextFunction } from "express";
import { JoinService } from "../services/JoinService";
import { WithdrawLeaveService } from "../services/WithdrawLeaveService";
import { PersonalListService } from "../services/PersonalListService";
import { AppError } from "../../../shared/src/errors/AppError";
import { requireStudentContext } from "../../../shared/src/middleware/auth";

export class ParticipationController {
  constructor(
    private joinService: JoinService,
    private withdrawLeaveService: WithdrawLeaveService,
    private personalListService: PersonalListService
  ) {}

  joinActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const studentContext = requireCampusSelectedStudentContext(req);

      const { id: activityId } = req.params;

      const participation = await this.joinService.joinActivity(
        studentContext.studentAccountId,
        studentContext.selectedCampusId,
        activityId
      );

      res.status(201).json({ message: "Successfully processed join action", data: participation });
    } catch (error) {
      next(error); // Pass to Express global error handler
    }
  };

  withdrawRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const studentContext = requireCampusSelectedStudentContext(req);

      const { id: activityId } = req.params;

      await this.withdrawLeaveService.withdrawRequest(
        studentContext.studentAccountId,
        studentContext.selectedCampusId,
        activityId
      );

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  leaveActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const studentContext = requireCampusSelectedStudentContext(req);

      const { id: activityId } = req.params;

      await this.withdrawLeaveService.leaveActivity(
        studentContext.studentAccountId,
        studentContext.selectedCampusId,
        activityId
      );

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  getPersonalActivities = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const studentContext = requireCampusSelectedStudentContext(req);

      const activities = await this.personalListService.getPersonalActivities(
        studentContext.studentAccountId,
        studentContext.selectedCampusId
      );

      res.status(200).json({ data: activities });
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
