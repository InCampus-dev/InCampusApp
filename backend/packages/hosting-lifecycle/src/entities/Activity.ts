import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { ActivityStatus, ParticipationMode } from "../../../shared/src/domain/enums";

@Entity("activities")
export class Activity {
  @PrimaryGeneratedColumn("uuid")
  activityId!: string;

  @Column()
  campusId!: string;

  @Column()
  hostAccountId!: string;

  @Column({ type: "varchar", default: ActivityStatus.Open })
  status!: ActivityStatus;

  @Column({ type: "varchar", default: ParticipationMode.Open })
  participationMode!: ParticipationMode;

  @Column({ type: "int" })
  maxParticipants!: number;

  @Column({ type: "int", default: 0 })
  currentParticipantCount!: number;

  @Column({ type: "int", nullable: true })
  maxRequests!: number | null;

  @Column({ type: "int", default: 0 })
  currentRequestCount!: number;

  @Column({ type: "timestamp", nullable: true })
  scheduledDateTime!: Date;

  @Column({ nullable: true })
  categoryId?: string;

  @Column({ nullable: true })
  meetingPointId?: string;
}