import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateHostingLifecycleParticipations1710000000006 implements MigrationInterface {
  public readonly name = "CreateHostingLifecycleParticipations1710000000006";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."participations_recordtype_enum" AS ENUM('request', 'participation')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."participations_status_enum" AS ENUM('pending', 'confirmed', 'declined')
    `);
    await queryRunner.query(`
      CREATE TABLE "participations" (
        "participationId" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "activityId" uuid NOT NULL,
        "studentAccountId" uuid NOT NULL,
        "recordType" "public"."participations_recordtype_enum" NOT NULL,
        "status" "public"."participations_status_enum" NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_participations_participationId" PRIMARY KEY ("participationId"),
        CONSTRAINT "FK_participations_activityId" FOREIGN KEY ("activityId") REFERENCES "activities"("activityId") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_participations_studentAccountId" FOREIGN KEY ("studentAccountId") REFERENCES "student_accounts"("studentAccountId") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_participations_studentAccountId" ON "participations" ("studentAccountId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_participations_activityId_studentAccountId"
      ON "participations" ("activityId", "studentAccountId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_participations_activityId_status"
      ON "participations" ("activityId", "status")
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_ACTIVE_PARTICIPATION"
      ON "participations" ("activityId", "studentAccountId")
      WHERE "status" IN ('pending', 'confirmed')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "public"."IDX_ACTIVE_PARTICIPATION"
    `);
    await queryRunner.query(`
      DROP INDEX "public"."IDX_participations_activityId_status"
    `);
    await queryRunner.query(`
      DROP INDEX "public"."IDX_participations_activityId_studentAccountId"
    `);
    await queryRunner.query(`
      DROP INDEX "public"."IDX_participations_studentAccountId"
    `);
    await queryRunner.query(`
      DROP TABLE "participations"
    `);
    await queryRunner.query(`
      DROP TYPE "public"."participations_status_enum"
    `);
    await queryRunner.query(`
      DROP TYPE "public"."participations_recordtype_enum"
    `);
  }
}
