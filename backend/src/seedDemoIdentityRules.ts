import { IdentityRuleRepo } from "../packages/access-profile/src/repositories/IdentityRuleRepo";
import { seedUniversityIdentityRules } from "../packages/access-profile/src/seed/seedUniversityIdentityRules";
import { AppDataSource } from "../packages/shared/src/config/database";

async function bootstrap(): Promise<void> {
  await AppDataSource.initialize();

  try {
    const identityRuleRepo = new IdentityRuleRepo(AppDataSource);
    const result = await seedUniversityIdentityRules(identityRuleRepo);

    console.log(
      `[AP03 Seed] University identity rules synced: ` +
        `created=${result.created}, skipped=${result.skipped}, total=${result.total}, ` +
        `domains=${result.supportedDomains.join(", ")}`
    );
  } finally {
    await AppDataSource.destroy();
  }
}

void bootstrap().catch((error) => {
  console.error("Failed to seed demo university identity rules", error);
  process.exit(1);
});
