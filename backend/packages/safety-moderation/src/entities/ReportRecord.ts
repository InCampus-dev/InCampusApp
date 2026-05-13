import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn
} from "typeorm";

import {
  ModerationAction,
  ReportStatus,
  ReportTargetType,
  ReviewOutcome
} from "../../../shared/src/domain/enums";

@Entity("report_records")
export class ReportRecord {
  @PrimaryGeneratedColumn("uuid")
  reportId!: string;

  @Index()
  @Column({ type: "uuid" })
  campusId!: string;

  @Index()
  @Column({ type: "uuid" })
  reporterAccountId!: string;

  @Column({ type: "enum", enum: ReportTargetType })
  targetType!: ReportTargetType;

  @Index()
  @Column({ type: "uuid", nullable: true })
  targetAccountId!: string | null;

  @Index()
  @Column({ type: "uuid", nullable: true })
  targetActivityId!: string | null;

  @Column({ type: "varchar", length: 100 })
  reasonCode!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Index()
  @Column({ type: "enum", enum: ReportStatus, default: ReportStatus.PendingReview })
  status!: ReportStatus;

  @Index()
  @CreateDateColumn({ type: "timestamp" })
  submittedAt!: Date;

  @Column({ type: "timestamp", nullable: true })
  reviewedAt!: Date | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  reviewedByAdminId!: string | null;

  @Column({ type: "enum", enum: ModerationAction, default: ModerationAction.None })
  moderationAction!: ModerationAction;

  @Column({ type: "enum", enum: ReviewOutcome, nullable: true })
  reviewOutcome!: ReviewOutcome | null;

  @Column({ type: "text", nullable: true })
  reviewNotes!: string | null;

  @Column({ type: "boolean", default: false })
  commandDispatchPending!: boolean;
}
