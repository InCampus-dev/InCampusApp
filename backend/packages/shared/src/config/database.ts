import "reflect-metadata";

import dotenv from "dotenv";
import { DataSource, type DataSourceOptions } from "typeorm";

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
  entities: [],
  migrations: ["dist/packages/shared/src/migrations/*.js"]
};

export const AppDataSource = new DataSource(databaseConfig);
