import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAccessProfileStores1710000000004 implements MigrationInterface {
  public readonly name = "CreateAccessProfileStores1710000000004";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."student_accounts_verificationstatus_enum" AS ENUM(
        'Pending',
        'Verified',
        'Rejected',
        'Expired'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."student_accounts_platformaccessstatus_enum" AS ENUM(
        'PendingVerification',
        'Active',
        'Suspended',
        'Banned'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."student_profiles_gender_enum" AS ENUM(
        'male',
        'female',
        'other',
        'prefer_not_to_say'
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "student_accounts" (
        "studentAccountId" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "passwordHash" character varying NOT NULL,
        "universityStudentId" character varying NOT NULL,
        "universityEmail" character varying NOT NULL,
        "verificationStatus" "public"."student_accounts_verificationstatus_enum" NOT NULL DEFAULT 'Pending',
        "platformAccessStatus" "public"."student_accounts_platformaccessstatus_enum" NOT NULL DEFAULT 'PendingVerification',
        "selectedCampusId" uuid,
        "campusInsightSharingConsent" boolean NOT NULL DEFAULT false,
        "verificationToken" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_student_accounts_studentAccountId" PRIMARY KEY ("studentAccountId"),
        CONSTRAINT "uq_student_accounts_university_email" UNIQUE ("universityEmail")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "university_identity_rules" (
        "domainRuleId" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "emailDomain" character varying NOT NULL,
        "universityName" character varying NOT NULL,
        "studentIdFormatRule" character varying,
        "ruleStatus" character varying NOT NULL DEFAULT 'Active',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_university_identity_rules_domainRuleId" PRIMARY KEY ("domainRuleId"),
        CONSTRAINT "uq_university_identity_rules_email_domain" UNIQUE ("emailDomain")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "student_profiles" (
        "profileId" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "studentAccountId" uuid NOT NULL,
        "displayName" character varying(255) NOT NULL,
        "major" character varying(255) NOT NULL,
        "dateOfBirth" date,
        "gender" "public"."student_profiles_gender_enum",
        "interests" text[] NOT NULL DEFAULT '{}',
        "languages" text[] NOT NULL DEFAULT '{}',
        "shortBio" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP,
        CONSTRAINT "PK_student_profiles_profileId" PRIMARY KEY ("profileId"),
        CONSTRAINT "uq_student_profiles_student_account_id" UNIQUE ("studentAccountId")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_student_accounts_selectedCampusId" ON "student_accounts" ("selectedCampusId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "public"."IDX_student_accounts_selectedCampusId"
    `);
    await queryRunner.query(`
      DROP TABLE "student_profiles"
    `);
    await queryRunner.query(`
      DROP TABLE "university_identity_rules"
    `);
    await queryRunner.query(`
      DROP TABLE "student_accounts"
    `);
    await queryRunner.query(`
      DROP TYPE "public"."student_profiles_gender_enum"
    `);
    await queryRunner.query(`
      DROP TYPE "public"."student_accounts_platformaccessstatus_enum"
    `);
    await queryRunner.query(`
      DROP TYPE "public"."student_accounts_verificationstatus_enum"
    `);
  }
}
