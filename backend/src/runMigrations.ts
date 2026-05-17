import { AppDataSource } from "../packages/shared/src/config/database";

async function main(): Promise<void> {
  await AppDataSource.initialize();

  try {
    const migrations = await AppDataSource.runMigrations();
    console.log(`[Migrations] Applied ${migrations.length} migration(s).`);
    for (const migration of migrations) {
      console.log(`[Migrations] ${migration.name}`);
    }
  } finally {
    await AppDataSource.destroy();
  }
}

void main().catch((error) => {
  console.error("[Migrations] Failed to apply migrations", error);
  process.exit(1);
});
