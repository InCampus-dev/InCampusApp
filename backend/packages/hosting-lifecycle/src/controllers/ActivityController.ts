import { Request, Response } from "express";
import { ActivityLifecycleService } from "../services/ActivityLifecycleService";
import { GenderPreference } from "../../../shared/src/domain/enums";

export class ActivityController {
  constructor(private activityLifecycleService: ActivityLifecycleService) {}

  createActivity = async (req: Request, res: Response): Promise<void> => {
    try {
      // In a real app, the JWT middleware injects this into req.user
      // Fallback used here to keep it safe for alpha skeleton testing
      const user = (req as any).user;
      if (!user || !user.studentAccountId || !user.selectedCampusId) {
        res.status(401).json({ error: "Unauthorized: Missing authenticated context or campus selection" });
        return;
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

      // Basic input validation
      if (!title || !categoryId || !scheduledDateTime || !meetingPointId || !participationMode || !maxParticipants) {
        res.status(400).json({ error: "Missing required fields to create an activity" });
        return;
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
          genderPreference: genderPreference || GenderPreference.All,
        }
      );

      res.status(201).json({ message: "Activity created successfully", data: activity });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "An error occurred while creating the activity" });
    }
  };
}