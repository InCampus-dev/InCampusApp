import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn
} from "typeorm";

import { StudentProfileGender } from "../../../shared/src/domain/enums";

@Entity("student_profiles")
@Index("uq_student_profiles_student_account_id", ["studentAccountId"], { unique: true })
export class StudentProfile {
  @PrimaryGeneratedColumn("uuid")
  profileId!: string;

  @Column({ type: "uuid" })
  studentAccountId!: string;

  @Column({ type: "varchar", length: 255 })
  displayName!: string;

  @Column({ type: "varchar", length: 255 })
  major!: string;

  @Column({ type: "date", nullable: true })
  dateOfBirth!: string | null;

  @Column({ type: "enum", enum: StudentProfileGender, nullable: true })
  gender!: StudentProfileGender | null;

  @Column({ type: "text", array: true, default: () => "'{}'" })
  interests!: string[];

  @Column({ type: "text", array: true, default: () => "'{}'" })
  languages!: string[];

  @Column({ type: "text", nullable: true })
  shortBio!: string | null;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @Column({ type: "timestamp", nullable: true })
  updatedAt!: Date | null;
}
