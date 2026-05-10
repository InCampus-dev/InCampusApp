import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCampusAdministrationStores1710000000001 implements MigrationInterface {
  public readonly name = "CreateCampusAdministrationStores1710000000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."campus_structured_options_optiontype_enum" AS ENUM('activity_category', 'campus_location')
    `);
    await queryRunner.query(`
      CREATE TABLE "campuses" (
        "campusId" uuid NOT NULL,
        "universityName" character varying(255) NOT NULL,
        "campusName" character varying(255) NOT NULL,
        "activationStatus" boolean NOT NULL DEFAULT false,
        CONSTRAINT "PK_campuses_campusId" PRIMARY KEY ("campusId")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "campus_structured_options" (
        "optionId" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "campusId" uuid NOT NULL,
        "optionType" "public"."campus_structured_options_optiontype_enum" NOT NULL,
        "name" character varying(255) NOT NULL,
        "description" text,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_campus_structured_options_optionId" PRIMARY KEY ("optionId"),
        CONSTRAINT "FK_campus_structured_options_campusId" FOREIGN KEY ("campusId") REFERENCES "campuses"("campusId") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "uq_campus_structured_options_campus_type_name" UNIQUE ("campusId", "optionType", "name")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_campus_structured_options_campusId" ON "campus_structured_options" ("campusId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "public"."IDX_campus_structured_options_campusId"
    `);
    await queryRunner.query(`
      DROP TABLE "campus_structured_options"
    `);
    await queryRunner.query(`
      DROP TABLE "campuses"
    `);
    await queryRunner.query(`
      DROP TYPE "public"."campus_structured_options_optiontype_enum"
    `);
  }
}
