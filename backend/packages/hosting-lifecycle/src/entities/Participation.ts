import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, ManyToOne, JoinColumn } from "typeorm";
import { ParticipationRecordType, ParticipationStatus } from "../../../shared/src/domain/enums";
import { Activity } from "./Activity";

@Entity("participations")
// This partial index guarantees the rule: "A uniqueness constraint must prevent duplicate active records..."
// However, it allows keeping old "declined" records without causing database conflicts.
@Index("IDX_ACTIVE_PARTICIPATION", ["activityId", "studentAccountId"], { 
  unique: true, 
  where: "status IN ('pending', 'confirmed')" 
})
export class Participation {
  @PrimaryGeneratedColumn("uuid")
  participationId!: string;

  @Column({ type: "uuid" })
  activityId!: string;

  @Index()
  @Column({ type: "uuid" })
  studentAccountId!: string;

  @Column({ type: "enum", enum: ParticipationRecordType })
  recordType!: ParticipationRecordType;

  @Column({ type: "enum", enum: ParticipationStatus })
  status!: ParticipationStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Activity, (activity) => activity.participations, { onDelete: "CASCADE" })
  @JoinColumn({ name: "activityId" })
  activity!: Activity;
}