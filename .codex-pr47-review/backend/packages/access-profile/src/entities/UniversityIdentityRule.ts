// Task: AP03 | Path: backend/packages/access-profile/src/entities/UniversityIdentityRule.ts

import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("university_identity_rules")
export class UniversityIdentityRule {
  @PrimaryGeneratedColumn("uuid")
  domainRuleId!: string;

  @Index()
  @Column({ type: "varchar", unique: true })
  emailDomain!: string;

  @Column({ type: "varchar" })
  universityName!: string;

  @Column({ type: "varchar", nullable: true })
  studentIdFormatRule!: string | null;

  @Column({ type: "varchar", default: "Active" })
  ruleStatus!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
