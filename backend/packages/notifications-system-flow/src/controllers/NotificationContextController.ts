// Task: NSF07 | Path: backend/packages/notifications-system-flow/src/controllers/NotificationContextController.ts

import type { Request, Response } from "express";
import type { Repository } from "typeorm";

import { Activity } from "../../../hosting-lifecycle/src/entities/Activity";
import { AppError } from "../../../shared/src/errors/AppError";
import { requireStudentContext } from "../../../shared/src/middleware/auth";
import { TargetContextType } from "../../../shared/src/domain/enums";
import { NotificationRepo } from "../repositories/NotificationRepo";
import { BlockSuppressionService } from "../services/BlockSuppressionService";

interface NotificationContextResponse {
  notificationId: string;
  contextType: string;
  contextId: string | null;
  accessible: boolean;
  fallbackReason?: string;
}

export class NotificationContextController {
  constructor(
    private readonly notificationRepo: NotificationRepo,
    private readonly activityRepo: Repository<Activity>,
    private readonly blockSuppressionService: BlockSuppressionService
  ) {}

  public async getContext(req: Request, res: Response): Promise<void> {
    const studentContext = requireStudentContext(req);
    const { notificationId } = req.params;

    const notification = await this.notificationRepo.findById(notificationId);
    if (!notification) {
      throw AppError.notFound("Notification", notificationId);
    }

    if (notification.recipientAccountId !== studentContext.studentAccountId) {
      throw new AppError(
        "AUTH_FORBIDDEN",
        "Notification does not belong to the authenticated student",
        403,
        { authReason: "notification_not_owned" }
      );
    }

    const { targetContextType, targetContextId, relatedActivityId, triggeringAccountId } =
      notification;

    if (relatedActivityId) {
      const activity = await this.activityRepo.findOne({
        where: { activityId: relatedActivityId }
      });

      if (!activity) {
        res.status(200).json(
          createFallbackContextResponse(notificationId, "TargetActivityUnavailable")
        );
        return;
      }

      const blockCheckTargetId = triggeringAccountId ?? activity.hostAccountId;
      if (
        blockCheckTargetId &&
        blockCheckTargetId !== studentContext.studentAccountId &&
        (await this.blockSuppressionService.shouldSuppress(
          studentContext.studentAccountId,
          blockCheckTargetId
        ))
      ) {
        res
          .status(200)
          .json(createFallbackContextResponse(notificationId, "BlockRelationshipExists"));
        return;
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

function createFallbackContextResponse(
  notificationId: string,
  fallbackReason: string
): NotificationContextResponse {
  return {
    notificationId,
    contextType: TargetContextType.NotificationFallbackView,
    contextId: null,
    accessible: false,
    fallbackReason
  };
}
