import { Request, Response, NextFunction } from "express";
import { JoinService } from "../services/JoinService";
import { WithdrawLeaveService } from "../services/WithdrawLeaveService";
import { PersonalListService } from "../services/PersonalListService";
import { AppError } from "../../../shared/src/errors/AppError";

export class ParticipationController {
  constructor(
    private joinService: JoinService,
    private withdrawLeaveService: WithdrawLeaveService,
    private personalListService: PersonalListService
  ) {}

  joinActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      if (!user || !user.studentAccountId || !user.selectedCampusId) {
        throw new AppError("AUTH_REQUIRED", "Unauthorized: Missing authenticated context or campus selection", 401);
      }

      const { id: activityId } = req.params;

      const participation = await this.joinService.joinActivity(
        user.studentAccountId,
        user.selectedCampusId,
        activityId
      );

      res.status(201).json({ message: "Successfully processed join action", data: participation });
    } catch (error) {
      next(error); // Pass to Express global error handler
    }
  };

  withdrawRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      if (!user || !user.studentAccountId || !user.selectedCampusId) {
        throw new AppError("AUTH_REQUIRED", "Unauthorized: Missing authenticated context or campus selection", 401);
      }

      const { id: activityId } = req.params;

      await this.withdrawLeaveService.withdrawRequest(
        user.studentAccountId,
        activityId
      );

      res.status(204).send(); // 204 No Content è lo standard per una DELETE andata a buon fine
    } catch (error) {
      next(error);
    }
  };

  leaveActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      if (!user || !user.studentAccountId || !user.selectedCampusId) {
        throw new AppError("AUTH_REQUIRED", "Unauthorized: Missing authenticated context or campus selection", 401);
      }

      const { id: activityId } = req.params;

      await this.withdrawLeaveService.leaveActivity(
        user.studentAccountId,
        activityId
      );

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  getPersonalActivities = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      if (!user || !user.studentAccountId || !user.selectedCampusId) {
        throw new AppError("AUTH_REQUIRED", "Unauthorized: Missing authenticated context or campus selection", 401);
      }

      const activities = await this.personalListService.getPersonalActivities(
        user.studentAccountId,
        user.selectedCampusId
      );

      res.status(200).json({ data: activities });
    } catch (error) {
      next(error);
    }
  };
}