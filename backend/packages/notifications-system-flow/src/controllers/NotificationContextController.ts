// Task: NSF07 | Path: backend/packages/notifications-system-flow/src/controllers/NotificationContextController.ts

import type { Request, Response } from "express";

import { requireStudentContext } from "../../../shared/src/middleware/auth";
import { TargetContextType } from "../../../shared/src/domain/enums";
import { AppDataSource } from "../../../shared/src/config/database";
import { NotificationRepo } from "../repositories/NotificationRepo";

interface NotificationContextResponse {
  notificationId: string;
  contextType: string;
  contextId: string | null;
  accessible: boolean;
  fallbackReason?: string;
}

export class NotificationContextController {
  constructor(private readonly notificationRepo: NotificationRepo) {}

  public async getContext(req: Request, res: Response): Promise<void> {
    const studentContext = requireStudentContext(req);
    const { notificationId } = req.params;

    const notification = await this.notificationRepo.findById(notificationId);
    if (!notification) {
      res.status(404).json({ error: "NotificationNotFound" });
      return;
    }

    if (notification.recipientAccountId !== studentContext.studentAccountId) {
      res.status(403).json({ error: "NotificationNotOwnedByStudent" });
      return;
    }

    const { targetContextType, targetContextId, relatedActivityId, triggeringAccountId } =
      notification;

    if (relatedActivityId) {
      const activityRepo = AppDataSource.getRepository("Activity");
      const activity = await activityRepo.findOne({
        where: { activityId: relatedActivityId }
      });

      if (!activity) {
        const response: NotificationContextResponse = {
          notificationId,
          contextType: TargetContextType.NotificationFallbackView,
          contextId: null,
          accessible: false,
          fallbackReason: "TargetActivityUnavailable"
        };
        res.status(200).json(response);
        return;
      }

      const blockCheckTargetId =
        triggeringAccountId ?? (activity as any).hostAccountId;
      if (
        blockCheckTargetId &&
        blockCheckTargetId !== studentContext.studentAccountId
      ) {
        const blockRepo = AppDataSource.getRepository("BlockRelationship");
        const blockCount = await blockRepo
          .createQueryBuilder("block")
          .where(
            "(block.initiatorAccountId = :a AND block.targetAccountId = :b) OR " +
              "(block.initiatorAccountId = :b AND block.targetAccountId = :a)",
            { a: studentContext.studentAccountId, b: blockCheckTargetId }
          )
          .getCount();

        if (blockCount > 0) {
          const response: NotificationContextResponse = {
            notificationId,
            contextType: TargetContextType.NotificationFallbackView,
            contextId: null,
            accessible: false,
            fallbackReason: "BlockRelationshipExists"
          };
          res.status(200).json(response);
          return;
        }
      }
    }

    const response: NotificationContextResponse = {
      notificationId,
      contextType: targetContextType,
      contextId: targetContextId ?? null,
      accessible: true
    };
    res.status(200).json(response);
  }
}
