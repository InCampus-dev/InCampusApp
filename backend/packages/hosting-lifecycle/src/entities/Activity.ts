import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, OneToMany } from "typeorm";
import { ActivityStatus, ParticipationMode, GenderPreference } from "../../../shared/src/domain/enums";
import { Participation } from "./Participation";

@Entity("activities")
export class Activity {
  @PrimaryGeneratedColumn("uuid")
  activityId!: string;

  @Index()
  @Column({ type: "uuid" })
  campusId!: string;

  @Index()
  @Column({ type: "uuid" })
  hostAccountId!: string;

  @Column({ type: "varchar", length: 100 })
  title!: string;

  // Category snapshot (to protect the activity from future modifications by CampusAdmins)
  @Column({ type: "uuid" })
  categoryId!: string;

  @Column({ type: "varchar" })
  categoryLabel!: string;

  @Column({ type: "varchar", length: 300, nullable: true })
  description!: string | null;

  @Column({ type: "timestamp" })
  scheduledDateTime!: Date;

  @Column({ type: "timestamp", nullable: true })
  scheduledEndDateTime!: Date | null;

  // Meeting point snapshot
  @Column({ type: "uuid" })
  meetingPointId!: string;

  @Column({ type: "varchar" })
  meetingPointLabel!: string;

  @Column({ type: "enum", enum: ParticipationMode })
  participationMode!: ParticipationMode;

  @Column({ type: "int" })
  maxParticipants!: number;

  @Column({ type: "int", nullable: true })
  maxRequests!: number | null;

  @Column({ type: "int", default: 0 })
  currentParticipantCount!: number;

  @Column({ type: "int", default: 0 })
  currentRequestCount!: number;

  @Column({ type: "enum", enum: GenderPreference, default: GenderPreference.All })
  genderPreference!: GenderPreference;

  @Column({ type: "enum", enum: ActivityStatus, default: ActivityStatus.Open })
  status!: ActivityStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => Participation, (participation) => participation.activity)
  participations!: Participation[];
}