import { DataSource, EntityManager, In } from "typeorm";

import { StudentAccount } from "../packages/access-profile/src/entities/StudentAccount";
import { Campus } from "../packages/campus-administration/src/entities/Campus";
import { CampusStructuredOption } from "../packages/campus-administration/src/entities/CampusStructuredOption";
import { Activity } from "../packages/hosting-lifecycle/src/entities/Activity";
import { Participation } from "../packages/hosting-lifecycle/src/entities/Participation";
import {
  ActivityStatus,
  CampusStructuredOptionType,
  ParticipationRecordType,
  ParticipationStatus
} from "../packages/shared/src/domain/enums";
import { AppDataSource } from "../packages/shared/src/config/database";
import {
  demoMockActivities,
  type DemoMockActivitySeed
} from "../packages/shared/src/seed/demoMockActivities";
import { assertLocalDemoEnvironment } from "./demoSeedEnvironment";

export interface DemoMockActivitiesSeedSummary {
  requested: number;
  inserted: number;
  updated: number;
  duplicateNaturalKeys: number;
}

const advisoryLockKey = "incampus-demo-mock-activities";

export async function seedMockActivities(
  dataSource: DataSource
): Promise<DemoMockActivitiesSeedSummary> {
  assertLocalDemoEnvironment();
  assertMockActivitySeeds(demoMockActivities);

  return await dataSource.transaction(async (manager) => {
    await manager.query("SELECT pg_advisory_xact_lock(hashtext($1))", [advisoryLockKey]);
    return await seedMockActivitiesInTransaction(manager, demoMockActivities);
  });
}

async function seedMockActivitiesInTransaction(
  manager: EntityManager,
  seeds: DemoMockActivitySeed[]
): Promise<DemoMockActivitiesSeedSummary> {
  const summary: DemoMockActivitiesSeedSummary = {
    requested: seeds.length,
    inserted: 0,
    updated: 0,
    duplicateNaturalKeys: 0
  };

  await assertReferencedCampusesExist(manager, seeds);
  const accountsById = await loadReferencedAccounts(manager, seeds);
  const optionsById = await loadReferencedOptions(manager, seeds);

  for (const seed of seeds) {
    assertAccountBelongsToCampus(accountsById, seed);
    const category = requireOption(
      optionsById,
      seed.categoryId,
      seed.campusId,
      CampusStructuredOptionType.ActivityCategory,
      "activity category"
    );
    const meetingPoint = requireOption(
      optionsById,
      seed.meetingPointId,
      seed.campusId,
      CampusStructuredOptionType.CampusLocation,
      "meeting point"
    );
    const existingActivities = await findExistingMockActivities(manager, seed);
    const activity =
      existingActivities[0] ??
      manager.create(Activity, {
        campusId: seed.campusId,
        title: seed.title,
        currentParticipantCount: 0,
        currentRequestCount: 0
      });

    if (existingActivities.length > 0) {
      await syncActivityCountersFromParticipations(manager, activity);
      summary.updated += 1;
      summary.duplicateNaturalKeys += Math.max(0, existingActivities.length - 1);
    } else {
      summary.inserted += 1;
    }

    applyMockActivitySeed(activity, seed, category, meetingPoint);
    await manager.save(Activity, activity);
  }

  return summary;
}

async function assertReferencedCampusesExist(
  manager: EntityManager,
  seeds: DemoMockActivitySeed[]
): Promise<void> {
  const campusIds = unique(seeds.map((seed) => seed.campusId));
  const campuses = await manager.find(Campus, {
    where: { campusId: In(campusIds) }
  });
  const existingCampusIds = new Set(campuses.map((campus) => campus.campusId));
  const missingCampusId = campusIds.find((campusId) => !existingCampusIds.has(campusId));

  if (missingCampusId) {
    throw new Error(
      `Demo campus ${missingCampusId} is missing. Run npm run seed:demo before seed:mock-activities.`
    );
  }
}

async function loadReferencedAccounts(
  manager: EntityManager,
  seeds: DemoMockActivitySeed[]
): Promise<Map<string, StudentAccount>> {
  const accountIds = unique(seeds.map((seed) => seed.hostAccountId));
  const accounts = await manager.find(StudentAccount, {
    where: { studentAccountId: In(accountIds) }
  });
  const accountsById = new Map(
    accounts.map((account) => [account.studentAccountId, account])
  );
  const missingAccountId = accountIds.find((accountId) => !accountsById.has(accountId));

  if (missingAccountId) {
    throw new Error(
      `Demo host account ${missingAccountId} is missing. Run npm run seed:demo before seed:mock-activities.`
    );
  }

  return accountsById;
}

async function loadReferencedOptions(
  manager: EntityManager,
  seeds: DemoMockActivitySeed[]
): Promise<Map<string, CampusStructuredOption>> {
  const optionIds = unique(
    seeds.flatMap((seed) => [seed.categoryId, seed.meetingPointId])
  );
  const options = await manager.find(CampusStructuredOption, {
    where: { optionId: In(optionIds) }
  });
  const optionsById = new Map(options.map((option) => [option.optionId, option]));
  const missingOptionId = optionIds.find((optionId) => !optionsById.has(optionId));

  if (missingOptionId) {
    throw new Error(
      `Demo structured option ${missingOptionId} is missing. Run npm run seed:demo before seed:mock-activities.`
    );
  }

  return optionsById;
}

function assertAccountBelongsToCampus(
  accountsById: Map<string, StudentAccount>,
  seed: DemoMockActivitySeed
): void {
  const account = accountsById.get(seed.hostAccountId);

  if (!account || account.selectedCampusId !== seed.campusId) {
    throw new Error(
      `Demo host ${seed.hostAccountId} is not selected into campus ${seed.campusId}.`
    );
  }
}

function requireOption(
  optionsById: Map<string, CampusStructuredOption>,
  optionId: string,
  campusId: string,
  optionType: CampusStructuredOptionType,
  label: string
): CampusStructuredOption {
  const option = optionsById.get(optionId);

  if (
    !option ||
    option.campusId !== campusId ||
    option.optionType !== optionType ||
    !option.isActive
  ) {
    throw new Error(
      `Demo ${label} ${optionId} must be an active ${optionType} for campus ${campusId}.`
    );
  }

  return option;
}

async function findExistingMockActivities(
  manager: EntityManager,
  seed: DemoMockActivitySeed
): Promise<Activity[]> {
  return await manager
    .createQueryBuilder(Activity, "activity")
    .setLock("pessimistic_write")
    .where("activity.campusId = :campusId", { campusId: seed.campusId })
    .andWhere("activity.title = :title", { title: seed.title })
    .orderBy("activity.createdAt", "ASC")
    .getMany();
}

async function syncActivityCountersFromParticipations(
  manager: EntityManager,
  activity: Activity
): Promise<void> {
  const confirmedGuestCount = await manager.count(Participation, {
    where: {
      activityId: activity.activityId,
      recordType: ParticipationRecordType.Participation,
      status: ParticipationStatus.Confirmed
    }
  });
  const pendingRequestCount = await manager.count(Participation, {
    where: {
      activityId: activity.activityId,
      recordType: ParticipationRecordType.Request,
      status: ParticipationStatus.Pending
    }
  });

  activity.currentParticipantCount = confirmedGuestCount;
  activity.currentRequestCount = pendingRequestCount;
}

function applyMockActivitySeed(
  activity: Activity,
  seed: DemoMockActivitySeed,
  category: CampusStructuredOption,
  meetingPoint: CampusStructuredOption
): void {
  const scheduledDateTime = buildFutureDate(seed.startsInHours);

  activity.campusId = seed.campusId;
  activity.hostAccountId = seed.hostAccountId;
  activity.title = seed.title;
  activity.categoryId = category.optionId;
  activity.categoryLabel = category.name;
  activity.description = seed.description;
  activity.scheduledDateTime = scheduledDateTime;
  activity.scheduledEndDateTime = buildEndDate(scheduledDateTime, seed.durationHours);
  activity.meetingPointId = meetingPoint.optionId;
  activity.meetingPointLabel = meetingPoint.name;
  activity.participationMode = seed.participationMode;
  activity.maxParticipants = seed.maxParticipants;
  activity.maxRequests = seed.maxRequests;
  activity.genderPreference = seed.genderPreference;
  activity.status = deriveStatus(seed.status, activity);
}

function deriveStatus(seedStatus: ActivityStatus, activity: Activity): ActivityStatus {
  if (
    seedStatus === ActivityStatus.Open &&
    activity.currentParticipantCount >= Math.max(0, activity.maxParticipants - 1)
  ) {
    return ActivityStatus.Full;
  }

  return seedStatus;
}

function buildFutureDate(startsInHours: number): Date {
  return new Date(Date.now() + startsInHours * 60 * 60 * 1000);
}

function buildEndDate(start: Date, durationHours: number): Date {
  return new Date(start.getTime() + durationHours * 60 * 60 * 1000);
}

function assertMockActivitySeeds(seeds: DemoMockActivitySeed[]): void {
  if (seeds.length < 18 || seeds.length > 25) {
    throw new Error("Demo mock activity seed must contain 18 to 25 activities.");
  }

  const naturalKeys = new Set<string>();

  for (const seed of seeds) {
    if (seed.title.includes("[DEMO]")) {
      throw new Error(`Refusing to seed mock activity with visible demo marker: ${seed.title}`);
    }

    if (seed.maxRequests !== null && seed.maxRequests > Math.max(0, seed.maxParticipants - 1)) {
      throw new Error(`Mock activity maxRequests exceeds guest capacity: ${seed.title}`);
    }

    const naturalKey = `${seed.campusId}:${seed.title}`;
    if (naturalKeys.has(naturalKey)) {
      throw new Error(`Duplicate mock activity natural key: ${naturalKey}`);
    }
    naturalKeys.add(naturalKey);
  }
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

async function bootstrap(): Promise<void> {
  assertLocalDemoEnvironment();
  await AppDataSource.initialize();

  try {
    const summary = await seedMockActivities(AppDataSource);
    console.log("[Demo Mock Activities Seed] Local/demo mock activities synced");
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await AppDataSource.destroy();
  }
}

if (require.main === module) {
  void bootstrap().catch((error) => {
    console.error("Failed to seed demo mock activities", error);
    process.exit(1);
  });
}
