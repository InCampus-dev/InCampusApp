// Task: NSF09 | Path: backend/packages/notifications-system-flow/src/controllers/NotificationListController.ts

import type { Request, Response } from "express";

import { requireStudentContext } from "../../../shared/src/middleware/auth";
import { NotificationRepo } from "../repositories/NotificationRepo";

interface NotificationListItem {
  notificationId: string;
  notificationType: string;
  notificationTitle: string;
  notificationMessage: string;
  relatedActivityId: string | null;
  triggeringAccountId: string | null;
  targetContextType: string;
  createdAt: string;
}

interface NotificationListResponse {
  notifications: NotificationListItem[];
  page: number;
  limit: number;
  total: number;
}

export class NotificationListController {
  constructor(private readonly notificationRepo: NotificationRepo) {}

  public async list(req: Request, res: Response): Promise<void> {
    const studentContext = requireStudentContext(req);

    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit as string, 10) || 20)
    );
    const offset = (page - 1) * limit;

    const { records, total } = await this.notificationRepo.findByRecipientPaginated(
      studentContext.studentAccountId,
      { limit, offset }
    );

    const notifications: NotificationListItem[] = records.map((record) => ({
      notificationId: record.notificationId,
      notificationType: record.notificationType,
      notificationTitle: record.notificationTitle,
      notificationMessage: record.notificationMessage,
      relatedActivityId: record.relatedActivityId ?? null,
      triggeringAccountId: record.triggeringAccountId ?? null,
      targetContextType: record.targetContextType,
      createdAt:
        record.createdAt instanceof Date
          ? record.createdAt.toISOString()
          : record.createdAt
    }));

    const response: NotificationListResponse = {
      notifications,
      page,
      limit,
      total
    };

    res.status(200).json(response);
  }
}
