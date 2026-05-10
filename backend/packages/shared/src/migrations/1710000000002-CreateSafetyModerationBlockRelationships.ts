import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSafetyModerationBlockRelationships1710000000002
  implements MigrationInterface
{
  public readonly name = "CreateSafetyModerationBlockRelationships1710000000002";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
    `);
    await queryRunner.query(`
      CREATE TABLE "block_relationships" (
        "blockId" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "initiatorAccountId" uuid NOT NULL,
        "blockedAccountId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_block_relationships_not_self" CHECK ("initiatorAccountId" <> "blockedAccountId"),
        CONSTRAINT "PK_block_relationships_blockId" PRIMARY KEY ("blockId"),
        CONSTRAINT "uq_block_relationships_initiator_blocked" UNIQUE ("initiatorAccountId", "blockedAccountId")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_block_relationships_initiatorAccountId" ON "block_relationships" ("initiatorAccountId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_block_relationships_blockedAccountId" ON "block_relationships" ("blockedAccountId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "public"."IDX_block_relationships_blockedAccountId"
    `);
    await queryRunner.query(`
      DROP INDEX "public"."IDX_block_relationships_initiatorAccountId"
    `);
    await queryRunner.query(`
      DROP TABLE "block_relationships"
    `);
  }
}
