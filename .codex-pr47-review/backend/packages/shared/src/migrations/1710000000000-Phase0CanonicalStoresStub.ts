import { MigrationInterface, QueryRunner } from "typeorm";

export class Phase0CanonicalStoresStub1710000000000 implements MigrationInterface {
  public readonly name = "Phase0CanonicalStoresStub1710000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("SELECT 1");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("SELECT 1");
  }
}

export const phase0CanonicalStoreNotes = [
  "DS-CA-001 Campus Configuration",
  "DS-CA-002 Campus Structured Options as one physical table: campus_structured_options",
  "DS-AP-001 Student Account",
  "DS-AP-002 Student Profile",
  "DS-AP-003 University Identity Rules",
  "DS-HL-001 Activities",
  "DS-HL-002 Activity Participations",
  "DS-SM-001 Block Relationships",
  "DS-SM-002 Report Records",
  "DS-NS-001 Notification Records"
];

export const campusStructuredOptionsRequiredFields = [
  "optionId",
  "campusId",
  "optionType: activity_category | campus_location",
  "name",
  "description",
  "isActive",
  "createdAt",
  "updatedAt"
];
