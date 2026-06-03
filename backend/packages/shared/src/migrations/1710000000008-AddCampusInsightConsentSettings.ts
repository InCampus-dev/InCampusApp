import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCampusInsightConsentSettings1710000000008 implements MigrationInterface {
  public readonly name = "AddCampusInsightConsentSettings1710000000008";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "student_accounts"
      ADD COLUMN "campusInsightConsentSettings" jsonb NOT NULL DEFAULT '{"basicInsightsEnabled":false,"activityInsightsEnabled":false,"hiddenActivityCategoryIds":[],"excludeCoParticipants":true}'::jsonb
    `);
    await queryRunner.query(`
      UPDATE "student_accounts"
      SET "campusInsightConsentSettings" =
        CASE
          WHEN "campusInsightSharingConsent" = true THEN '{"basicInsightsEnabled":true,"activityInsightsEnabled":true,"hiddenActivityCategoryIds":[],"excludeCoParticipants":true}'::jsonb
          ELSE '{"basicInsightsEnabled":false,"activityInsightsEnabled":false,"hiddenActivityCategoryIds":[],"excludeCoParticipants":true}'::jsonb
        END
    `);
    await queryRunner.query(`
      UPDATE "student_accounts"
      SET "campusInsightSharingConsent" =
        (("campusInsightConsentSettings"->>'basicInsightsEnabled')::boolean OR
         ("campusInsightConsentSettings"->>'activityInsightsEnabled')::boolean)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "student_accounts"
      DROP COLUMN "campusInsightConsentSettings"
    `);
  }
}
