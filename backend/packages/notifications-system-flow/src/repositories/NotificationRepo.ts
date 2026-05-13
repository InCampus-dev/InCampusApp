// Task: NSF01 | Path: backend/packages/notifications-system-flow/src/repositories/NotificationRepo.ts

import { DataSource, Repository } from "typeorm";

import { NotificationRecord } from "../entities/NotificationRecord";

export class NotificationRepo extends Repository<NotificationRecord> {
  constructor(dataSource: DataSource) {
    super(NotificationRecord, dataSource.createEntityManager());
  }

  public async findByRecipient(
    recipientId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<NotificationRecord[]> {
    return this.find({
      where: { recipientAccountId: recipientId },
      order: { createdAt: "DESC" },
      take: options?.limit,
      skip: options?.offset
    });
  }

  public async findByRecipientPaginated(
    recipientId: string,
    options: { limit: number; offset: number }
  ): Promise<{ records: NotificationRecord[]; total: number }> {
    const [records, total] = await this.findAndCount({
      where: { recipientAccountId: recipientId },
      order: { createdAt: "DESC" },
      take: options.limit,
      skip: options.offset
    });
    return { records, total };
  }

  public async findById(id: string): Promise<NotificationRecord | null> {
    return this.findOne({ where: { notificationId: id } });
  }
}
