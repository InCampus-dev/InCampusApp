import { createApp } from "./app";
import { AppDataSource } from "../packages/shared/src/config/database";

const port = Number(process.env.PORT ?? 3000);

async function bootstrap(): Promise<void> {
  await AppDataSource.initialize();

  const app = createApp({ dataSource: AppDataSource });

  app.listen(port, () => {
    console.log(`InCampus backend listening on port ${port}`);
  });
}

void bootstrap().catch((error) => {
  console.error("Failed to start InCampus backend", error);
  process.exit(1);
});
