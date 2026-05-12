import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { ParticipationRecordType, ParticipationStatus } from "../../../shared/src/domain/enums";

@Entity("participations")
export class Participation {
  @PrimaryGeneratedColumn("uuid")
  participationId!: string;

  @Column()
  activityId!: string;

  @Column()
  studentAccountId!: string;

  @Column({ type: "varchar" })
  recordType!: ParticipationRecordType;

  @Column({ type: "varchar" })
  status!: ParticipationStatus;
}