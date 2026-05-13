import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSafetyModerationReportRecords1710000000003
  implements MigrationInterface
{
  public readonly name = "CreateSafetyModerationReportRecords1710000000003";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."report_records_targettype_enum" AS ENUM('student', 'activity')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."report_records_status_enum" AS ENUM('pending_review', 'reviewed')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."report_records_moderationaction_enum" AS ENUM(
        'none',
        'warn_user',
        'suspend_user',
        'ban_user',
        'remove_activity'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."report_records_reviewoutcome_enum" AS ENUM(
        'no_action',
        'action_taken',
        'dismissed'
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "report_records" (
        "reportId" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "campusId" uuid NOT NULL,
        "reporterAccountId" uuid NOT NULL,
        "targetType" "public"."report_records_targettype_enum" NOT NULL,
        "targetAccountId" uuid,
        "targetActivityId" uuid,
        "reasonCode" character varying(100) NOT NULL,
        "description" text,
        "status" "public"."report_records_status_enum" NOT NULL DEFAULT 'pending_review',
        "submittedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "reviewedAt" TIMESTAMP,
        "reviewedByAdminId" character varying(255),
        "moderationAction" "public"."report_records_moderationaction_enum" NOT NULL DEFAULT 'none',
        "reviewOutcome" "public"."report_records_reviewoutcome_enum",
        "reviewNotes" text,
        "commandDispatchPending" boolean NOT NULL DEFAULT false,
        CONSTRAINT "CHK_report_records_target_consistency" CHECK (
          (
            "targetType" = 'student'
            AND "targetAccountId" IS NOT NULL
            AND "targetActivityId" IS NULL
          )
          OR
          (
            "targetType" = 'activity'
            AND "targetActivityId" IS NOT NULL
            AND "targetAccountId" IS NULL
          )
        ),
        CONSTRAINT "PK_report_records_reportId" PRIMARY KEY ("reportId")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_report_records_campusId" ON "report_records" ("campusId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_report_records_reporterAccountId" ON "report_records" ("reporterAccountId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_report_records_targetAccountId" ON "report_records" ("targetAccountId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_report_records_targetActivityId" ON "report_records" ("targetActivityId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_report_records_status" ON "report_records" ("status")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_report_records_submittedAt" ON "report_records" ("submittedAt")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "public"."IDX_report_records_submittedAt"
    `);
    await queryRunner.query(`
      DROP INDEX "public"."IDX_report_records_status"
    `);
    await queryRunner.query(`
      DROP INDEX "public"."IDX_report_records_targetActivityId"
    `);
    await queryRunner.query(`
      DROP INDEX "public"."IDX_report_records_targetAccountId"
    `);
    await queryRunner.query(`
      DROP INDEX "public"."IDX_report_records_reporterAccountId"
    `);
    await queryRunner.query(`
      DROP INDEX "public"."IDX_report_records_campusId"
    `);
    await queryRunner.query(`
      DROP TABLE "report_records"
    `);
    await queryRunner.query(`
      DROP TYPE "public"."report_records_reviewoutcome_enum"
    `);
    await queryRunner.query(`
      DROP TYPE "public"."report_records_moderationaction_enum"
    `);
    await queryRunner.query(`
      DROP TYPE "public"."report_records_status_enum"
    `);
    await queryRunner.query(`
      DROP TYPE "public"."report_records_targettype_enum"
    `);
  }
}
