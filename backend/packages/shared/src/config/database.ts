import "reflect-metadata";

import dotenv from "dotenv";
import { DataSource, type DataSourceOptions } from "typeorm";

import { StudentAccount } from "../../../access-profile/src/entities/StudentAccount";
import { StudentProfile } from "../../../access-profile/src/entities/StudentProfile";
import { UniversityIdentityRule } from "../../../access-profile/src/entities/UniversityIdentityRule";
import { Campus } from "../../../campus-administration/src/entities/Campus";
import { CampusStructuredOption } from "../../../campus-administration/src/entities/CampusStructuredOption";
import { Activity } from "../../../hosting-lifecycle/src/entities/Activity";
import { Participation } from "../../../hosting-lifecycle/src/entities/Participation";
import { NotificationRecord } from "../../../notifications-system-flow/src/entities/NotificationRecord";
import { BlockRelationship } from "../../../safety-moderation/src/entities/BlockRelationship";
import { ReportRecord } from "../../../safety-moderation/src/entities/ReportRecord";
import { appMigrations } from "../migrations";

dotenv.config();

const databasePort = Number(process.env.DB_PORT ?? 5432);

export const databaseConfig: DataSourceOptions = {
  type: "postgres",
  host: process.env.DB_HOST ?? "localhost",
  port: databasePort,
  username: process.env.DB_USERNAME ?? "incampus",
  password: process.env.DB_PASSWORD ?? "incampus",
  database: process.env.DB_DATABASE ?? "incampus",
  synchronize: false,
  logging: process.env.TYPEORM_LOGGING === "true",
  entities: [
    StudentAccount,
    StudentProfile,
    UniversityIdentityRule,
    Campus,
    CampusStructuredOption,
    Activity,
    Participation,
    NotificationRecord,
    BlockRelationship,
    ReportRecord
  ],
  migrations: appMigrations
};

export const AppDataSource = new DataSource(databaseConfig);
