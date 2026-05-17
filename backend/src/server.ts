import { createApp } from "./app";
import { AppDataSource } from "../packages/shared/src/config/database";

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST;

async function bootstrap(): Promise<void> {
  await AppDataSource.initialize();

  const app = createApp({ dataSource: AppDataSource });

  if (host) {
    app.listen(port, host, () => {
      console.log(`InCampus backend listening on ${host}:${port}`);
    });
    return;
  }

  app.listen(port, () => {
    console.log(`InCampus backend listening on port ${port}`);
  });
}

void bootstrap().catch((error) => {
  console.error("Failed to start InCampus backend", error);
  process.exit(1);
});
