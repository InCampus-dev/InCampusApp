import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateHostingLifecycleActivities1710000000005 implements MigrationInterface {
  public readonly name = "CreateHostingLifecycleActivities1710000000005";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."activities_participationmode_enum" AS ENUM('open', 'approval_based')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."activities_genderpreference_enum" AS ENUM('all', 'male_only', 'female_only')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."activities_status_enum" AS ENUM('open', 'full', 'completed', 'cancelled')
    `);
    await queryRunner.query(`
      CREATE TABLE "activities" (
        "activityId" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "campusId" uuid NOT NULL,
        "hostAccountId" uuid NOT NULL,
        "title" character varying(100) NOT NULL,
        "categoryId" uuid NOT NULL,
        "categoryLabel" character varying NOT NULL,
        "description" character varying(300),
        "scheduledDateTime" TIMESTAMP NOT NULL,
        "scheduledEndDateTime" TIMESTAMP,
        "meetingPointId" uuid NOT NULL,
        "meetingPointLabel" character varying NOT NULL,
        "participationMode" "public"."activities_participationmode_enum" NOT NULL,
        "maxParticipants" integer NOT NULL,
        "maxRequests" integer,
        "currentParticipantCount" integer NOT NULL DEFAULT 0,
        "currentRequestCount" integer NOT NULL DEFAULT 0,
        "genderPreference" "public"."activities_genderpreference_enum" NOT NULL DEFAULT 'all',
        "status" "public"."activities_status_enum" NOT NULL DEFAULT 'open',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_activities_activityId" PRIMARY KEY ("activityId")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_activities_campusId" ON "activities" ("campusId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_activities_hostAccountId" ON "activities" ("hostAccountId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_activities_campusId_status_scheduledDateTime"
      ON "activities" ("campusId", "status", "scheduledDateTime")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_activities_campusId_categoryId_status_scheduledDateTime"
      ON "activities" ("campusId", "categoryId", "status", "scheduledDateTime")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "public"."IDX_activities_campusId_categoryId_status_scheduledDateTime"
    `);
    await queryRunner.query(`
      DROP INDEX "public"."IDX_activities_campusId_status_scheduledDateTime"
    `);
    await queryRunner.query(`
      DROP INDEX "public"."IDX_activities_hostAccountId"
    `);
    await queryRunner.query(`
      DROP INDEX "public"."IDX_activities_campusId"
    `);
    await queryRunner.query(`
      DROP TABLE "activities"
    `);
    await queryRunner.query(`
      DROP TYPE "public"."activities_status_enum"
    `);
    await queryRunner.query(`
      DROP TYPE "public"."activities_genderpreference_enum"
    `);
    await queryRunner.query(`
      DROP TYPE "public"."activities_participationmode_enum"
    `);
  }
}
