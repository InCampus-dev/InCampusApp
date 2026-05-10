// Task: NSF01 | Path: backend/packages/notifications-system-flow/src/entities/NotificationRecord.ts

import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

import { NotificationType, TargetContextType } from "../../../shared/src/domain/enums";

@Entity("notification_records")
export class NotificationRecord {
  @PrimaryGeneratedColumn("uuid")
  notificationId!: string;

  @Index()
  @Column({ type: "uuid" })
  recipientAccountId!: string;

  @Column({ type: "enum", enum: NotificationType })
  notificationType!: NotificationType;

  @Column({ type: "varchar", default: "PushAndInApp" })
  notificationChannels!: string;

  @Column({ type: "varchar" })
  notificationTitle!: string;

  @Column({ type: "text" })
  notificationMessage!: string;

  @Column({ type: "uuid", nullable: true })
  relatedActivityId!: string | null;

  @Column({ type: "uuid", nullable: true })
  relatedParticipationId!: string | null;

  @Column({ type: "enum", enum: TargetContextType })
  targetContextType!: TargetContextType;

  @Column({ type: "uuid", nullable: true })
  targetContextId!: string | null;

  @Column({ type: "uuid", nullable: true })
  triggeringAccountId!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
