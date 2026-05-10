import { Request, Response } from "express";
import { JoinRequestManagementService } from "../services/JoinRequestManagementService";

export class JoinRequestController {
  constructor(private joinRequestService: JoinRequestManagementService) {}

  getRequests = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      if (!user || !user.studentAccountId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { id: activityId } = req.params;
      const requests = await this.joinRequestService.getPendingRequests(user.studentAccountId, activityId);
      
      res.status(200).json({ data: requests });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  reviewRequest = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      if (!user || !user.studentAccountId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { id: activityId, requestId: participationId } = req.params;
      const { decision } = req.body; // 'approve' | 'decline'

      if (decision !== "approve" && decision !== "decline") {
        res.status(400).json({ error: "Invalid decision. Use 'approve' or 'decline'" });
        return;
      }

      const participation = await this.joinRequestService.reviewJoinRequest(
        user.studentAccountId,
        activityId,
        participationId,
        decision
      );
      res.status(200).json({ message: `Request ${decision}d successfully`, data: participation });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}