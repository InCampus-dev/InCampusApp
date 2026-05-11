import { NextFunction, Request, Response } from "express";
import { ActivityLifecycleService } from "../services/ActivityLifecycleService";
import { ActivityStatus, GenderPreference } from "../../../shared/src/domain/enums";
import { AppError } from "../../../shared/src/errors/AppError";

export class ActivityController {
  constructor(private activityLifecycleService: ActivityLifecycleService) {}

  createActivity = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = req.studentContext ?? (req as { user?: { studentAccountId?: string; selectedCampusId?: string } }).user;

      if (!user || !user.studentAccountId || !user.selectedCampusId) {
        throw new AppError("AUTH_REQUIRED", "Student authentication is required", 401, {
          authReason: "missing_student_context"
        });
      }

      const {
        title,
        categoryId,
        description,
        scheduledDateTime,
        scheduledEndDateTime,
        meetingPointId,
        participationMode,
        maxParticipants,
        maxRequests,
        genderPreference
      } = req.body;

      if (
        !title ||
        !categoryId ||
        !scheduledDateTime ||
        !meetingPointId ||
        !participationMode ||
        maxParticipants === undefined
      ) {
        throw AppError.validation("Request validation failed", [
          {
            field: "body",
            message:
              "title, categoryId, scheduledDateTime, meetingPointId, participationMode, and maxParticipants are required",
            code: "missing_required_fields"
          }
        ]);
      }

      const activity = await this.activityLifecycleService.createActivity(
        user.studentAccountId,
        user.selectedCampusId,
        {
          title,
          categoryId,
          description,
          scheduledDateTime: new Date(scheduledDateTime),
          scheduledEndDateTime: scheduledEndDateTime ? new Date(scheduledEndDateTime) : undefined,
          meetingPointId,
          participationMode,
          maxParticipants,
          maxRequests,
          genderPreference: genderPreference || GenderPreference.All
        }
      );

      res.status(201).json({ message: "Activity created successfully", data: activity });
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = req.studentContext ?? (req as { user?: { studentAccountId?: string; selectedCampusId?: string } }).user;
      if (!user || !user.studentAccountId || !user.selectedCampusId) {
        throw new AppError("AUTH_REQUIRED", "Student authentication is required", 401, { authReason: "missing_student_context" });
      }

      const { id } = req.params;
      const { status } = req.body;

      const activity = await this.activityLifecycleService.updateActivityStatus(
        user.studentAccountId,
        user.selectedCampusId,
        id,
        status as ActivityStatus
      );

      res.status(200).json({ message: "Status updated successfully", data: activity });
    } catch (error) {
      next(error);
    }
  };

  deleteActivity = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = req.studentContext ?? (req as { user?: { studentAccountId?: string; selectedCampusId?: string } }).user;
      if (!user || !user.studentAccountId || !user.selectedCampusId) {
        throw new AppError("AUTH_REQUIRED", "Student authentication is required", 401, { authReason: "missing_student_context" });
      }

      const { id } = req.params;
      await this.activityLifecycleService.deleteActivity(user.studentAccountId, user.selectedCampusId, id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
