import { Request, Response } from "express";
import { FeedService } from "../services/FeedService";
import { ActivityDetailService } from "../services/ActivityDetailService";

export class DiscoveryController {
  constructor(
    private feedService: FeedService,
    private activityDetailService: ActivityDetailService
  ) {}

  getFeed = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      
      // Ensure the user is authenticated and has selected a campus
      if (!user || !user.studentAccountId || !user.selectedCampusId) {
        res.status(401).json({ error: "Unauthorized: Missing authenticated context or campus selection" });
        return;
      }

      const { categoryId } = req.query;

      const activities = await this.feedService.getActivities(
        user.studentAccountId,
        user.selectedCampusId,
        { categoryId: categoryId as string }
      );

      res.status(200).json({ data: activities });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "An error occurred while fetching the feed" });
    }
  };

  getActivityDetails = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      
      if (!user || !user.studentAccountId || !user.selectedCampusId) {
        res.status(401).json({ error: "Unauthorized: Missing authenticated context or campus selection" });
        return;
      }

      const { id: activityId } = req.params;
      const activityDetails = await this.activityDetailService.getActivityDetails(
        user.studentAccountId,
        user.selectedCampusId,
        activityId
      );

      res.status(200).json({ data: activityDetails });
    } catch (error: any) {
      res.status(error.statusCode || 400).json({ error: error.message || "An error occurred while fetching activity details" });
    }
  };
}