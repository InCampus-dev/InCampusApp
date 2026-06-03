// Task: AP02 | Path: backend/packages/access-profile/src/entities/StudentAccount.ts

import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

import type { CampusInsightConsentSettingsDto } from "../../../shared/src/domain/dtos";
import { PlatformAccessStatus, VerificationStatus } from "../../../shared/src/domain/enums";

@Entity("student_accounts")
export class StudentAccount {
  @PrimaryGeneratedColumn("uuid")
  studentAccountId!: string;

  @Column({ type: "varchar" })
  passwordHash!: string;

  @Column({ type: "varchar" })
  universityStudentId!: string;

  @Index()
  @Column({ type: "varchar", unique: true })
  universityEmail!: string;

  @Column({ type: "enum", enum: VerificationStatus, default: VerificationStatus.Pending })
  verificationStatus!: VerificationStatus;

  @Column({
    type: "enum",
    enum: PlatformAccessStatus,
    default: PlatformAccessStatus.PendingVerification
  })
  platformAccessStatus!: PlatformAccessStatus;

  @Index()
  @Column({ type: "uuid", nullable: true })
  selectedCampusId!: string | null;

  @Column({ type: "boolean", default: false })
  campusInsightSharingConsent!: boolean;

  @Column({
    type: "jsonb",
    default: () =>
      `'{"basicInsightsEnabled":false,"activityInsightsEnabled":false,"hiddenActivityCategoryIds":[],"excludeCoParticipants":true}'::jsonb`
  })
  campusInsightConsentSettings!: CampusInsightConsentSettingsDto;

  // ⚠️ NOT in Entities & Attributes v1.2 catalog — approved implementation detail.
  // Realises the abstract token exchange in UCR-A&P v1.2 DUC-AP-01 (verify email step).
  // Cleared to null upon successful verification.
  @Column({ type: "varchar", nullable: true })
  verificationToken!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
