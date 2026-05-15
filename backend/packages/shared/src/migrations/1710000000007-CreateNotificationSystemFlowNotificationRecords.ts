import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateNotificationSystemFlowNotificationRecords1710000000007
  implements MigrationInterface
{
  public readonly name = "CreateNotificationSystemFlowNotificationRecords1710000000007";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."notification_records_notificationtype_enum" AS ENUM(
        'JoinEvent',
        'ApplicationOutcome',
        'ActivityCancellation',
        'LeaveEvent',
        'ActivityReminder'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."notification_records_targetcontexttype_enum" AS ENUM(
        'JoinRequestReview',
        'ActivityDetails',
        'CancelledActivityContext',
        'PersonalActivityContext',
        'NotificationFallbackView'
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "notification_records" (
        "notificationId" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "recipientAccountId" uuid NOT NULL,
        "notificationType" "public"."notification_records_notificationtype_enum" NOT NULL,
        "notificationChannels" character varying NOT NULL DEFAULT 'PushAndInApp',
        "notificationTitle" character varying NOT NULL,
        "notificationMessage" text NOT NULL,
        "relatedActivityId" uuid,
        "relatedParticipationId" uuid,
        "targetContextType" "public"."notification_records_targetcontexttype_enum" NOT NULL,
        "targetContextId" uuid,
        "triggeringAccountId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notification_records_notificationId" PRIMARY KEY ("notificationId")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_notification_records_recipientAccountId"
      ON "notification_records" ("recipientAccountId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_notification_records_recipientAccountId_createdAt"
      ON "notification_records" ("recipientAccountId", "createdAt")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "public"."IDX_notification_records_recipientAccountId_createdAt"
    `);
    await queryRunner.query(`
      DROP INDEX "public"."IDX_notification_records_recipientAccountId"
    `);
    await queryRunner.query(`
      DROP TABLE "notification_records"
    `);
    await queryRunner.query(`
      DROP TYPE "public"."notification_records_targetcontexttype_enum"
    `);
    await queryRunner.query(`
      DROP TYPE "public"."notification_records_notificationtype_enum"
    `);
  }
}
