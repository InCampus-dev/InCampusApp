import bcrypt from "bcryptjs";
import { DataSource, In } from "typeorm";

import { StudentAccount } from "../packages/access-profile/src/entities/StudentAccount";
import { StudentProfile } from "../packages/access-profile/src/entities/StudentProfile";
import { UniversityIdentityRule } from "../packages/access-profile/src/entities/UniversityIdentityRule";
import { Campus } from "../packages/campus-administration/src/entities/Campus";
import { CampusStructuredOption } from "../packages/campus-administration/src/entities/CampusStructuredOption";
import { Activity } from "../packages/hosting-lifecycle/src/entities/Activity";
import { Participation } from "../packages/hosting-lifecycle/src/entities/Participation";
import { NotificationRecord } from "../packages/notifications-system-flow/src/entities/NotificationRecord";
import { AppDataSource } from "../packages/shared/src/config/database";
import { ActivityStatus } from "../packages/shared/src/domain/enums";
import {
  demoActivityTitlePrefix,
  phase0DemoSeed,
  type DemoActivitySeed,
  type DemoSeedData
} from "../packages/shared/src/seed/demoSeed";

interface DemoSeedRunSummary {
  universityIdentityRules: number;
  campuses: number;
  campusStructuredOptions: number;
  studentAccounts: number;
  studentProfiles: number;
  activities: number;
  resetDemoActivityIds: string[];
}

interface SeedContext {
  campusIdBySeedId: Map<string, string>;
  accountIdBySeedId: Map<string, string>;
  optionBySeedId: Map<string, CampusStructuredOption>;
}

export async function seedDemo(dataSource: DataSource): Promise<DemoSeedRunSummary> {
  assertLocalDemoEnvironment();

  const context: SeedContext = {
    campusIdBySeedId: new Map(),
    accountIdBySeedId: new Map(),
    optionBySeedId: new Map()
  };

  const summary: DemoSeedRunSummary = {
    universityIdentityRules: 0,
    campuses: 0,
    campusStructuredOptions: 0,
    studentAccounts: 0,
    studentProfiles: 0,
    activities: 0,
    resetDemoActivityIds: []
  };

  await seedUniversityIdentityRules(dataSource, phase0DemoSeed, summary);
  await seedCampuses(dataSource, phase0DemoSeed, context, summary);
  await seedStructuredOptions(dataSource, phase0DemoSeed, context, summary);
  await seedStudentAccounts(dataSource, phase0DemoSeed, context, summary);
  await seedStudentProfiles(dataSource, phase0DemoSeed, context, summary);
  await seedActivities(dataSource, phase0DemoSeed, context, summary);

  return summary;
}

function assertLocalDemoEnvironment(): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed demo data when NODE_ENV=production");
  }
}

async function seedUniversityIdentityRules(
  dataSource: DataSource,
  seed: DemoSeedData,
  summary: DemoSeedRunSummary
): Promise<void> {
  const repo = dataSource.getRepository(UniversityIdentityRule);

  for (const ruleSeed of seed.universityIdentityRules) {
    const existingRule = await repo.findOne({
      where: { emailDomain: ruleSeed.emailDomain }
    });
    const rule =
      existingRule ??
      repo.create({
        emailDomain: ruleSeed.emailDomain
      });

    rule.universityName = ruleSeed.universityName;
    rule.studentIdFormatRule = ruleSeed.studentIdFormatRule;
    rule.ruleStatus = ruleSeed.ruleStatus;
    await repo.save(rule);
    summary.universityIdentityRules += 1;
  }
}

async function seedCampuses(
  dataSource: DataSource,
  seed: DemoSeedData,
  context: SeedContext,
  summary: DemoSeedRunSummary
): Promise<void> {
  const repo = dataSource.getRepository(Campus);

  for (const campusSeed of seed.campuses) {
    const existingCampus = await repo.findOne({
      where: {
        universityName: campusSeed.universityName,
        campusName: campusSeed.campusName
      }
    });
    const campus =
      existingCampus ??
      repo.create({
        campusId: campusSeed.campusId
      });

    campus.universityName = campusSeed.universityName;
    campus.campusName = campusSeed.campusName;
    campus.activationStatus = campusSeed.activationStatus;

    const savedCampus = await repo.save(campus);
    context.campusIdBySeedId.set(campusSeed.campusId, savedCampus.campusId);
    summary.campuses += 1;
  }
}

async function seedStructuredOptions(
  dataSource: DataSource,
  seed: DemoSeedData,
  context: SeedContext,
  summary: DemoSeedRunSummary
): Promise<void> {
  const repo = dataSource.getRepository(CampusStructuredOption);

  for (const optionSeed of seed.campusStructuredOptions) {
    const campusId = requireMappedValue(
      context.campusIdBySeedId,
      optionSeed.campusId,
      "campus"
    );
    const existingOption = await repo.findOne({
      where: {
        campusId,
        optionType: optionSeed.optionType,
        name: optionSeed.name
      }
    });
    const option =
      existingOption ??
      repo.create({
        optionId: optionSeed.optionId,
        campusId,
        optionType: optionSeed.optionType,
        name: optionSeed.name
      });

    option.campusId = campusId;
    option.optionType = optionSeed.optionType;
    option.name = optionSeed.name;
    option.description = optionSeed.description;
    option.isActive = optionSeed.isActive;

    const savedOption = await repo.save(option);
    context.optionBySeedId.set(optionSeed.optionId, savedOption);
    summary.campusStructuredOptions += 1;
  }
}

async function seedStudentAccounts(
  dataSource: DataSource,
  seed: DemoSeedData,
  context: SeedContext,
  summary: DemoSeedRunSummary
): Promise<void> {
  const repo = dataSource.getRepository(StudentAccount);

  for (const accountSeed of seed.studentAccounts) {
    const campusId = requireMappedValue(
      context.campusIdBySeedId,
      accountSeed.selectedCampusId,
      "selected campus"
    );
    const existingAccount = await repo.findOne({
      where: { universityEmail: accountSeed.universityEmail }
    });
    const account =
      existingAccount ??
      repo.create({
        studentAccountId: accountSeed.studentAccountId,
        universityEmail: accountSeed.universityEmail
      });

    account.universityEmail = accountSeed.universityEmail;
    account.universityStudentId = accountSeed.universityStudentId;
    account.passwordHash = await bcrypt.hash(accountSeed.password, 10);
    account.selectedCampusId = campusId;
    account.platformAccessStatus = accountSeed.platformAccessStatus;
    account.verificationStatus = accountSeed.verificationStatus;
    account.campusInsightSharingConsent = accountSeed.campusInsightSharingConsent;
    account.verificationToken = null;

    const savedAccount = await repo.save(account);
    context.accountIdBySeedId.set(accountSeed.studentAccountId, savedAccount.studentAccountId);
    summary.studentAccounts += 1;
  }
}

async function seedStudentProfiles(
  dataSource: DataSource,
  seed: DemoSeedData,
  context: SeedContext,
  summary: DemoSeedRunSummary
): Promise<void> {
  const repo = dataSource.getRepository(StudentProfile);

  for (const profileSeed of seed.studentProfiles) {
    const studentAccountId = requireMappedValue(
      context.accountIdBySeedId,
      profileSeed.studentAccountId,
      "student account"
    );
    const existingProfile = await repo.findOne({
      where: { studentAccountId }
    });
    const profile =
      existingProfile ??
      repo.create({
        profileId: profileSeed.profileId,
        studentAccountId
      });

    profile.studentAccountId = studentAccountId;
    profile.displayName = profileSeed.displayName;
    profile.major = profileSeed.major;
    profile.dateOfBirth = profileSeed.dateOfBirth;
    profile.gender = profileSeed.gender;
    profile.interests = profileSeed.interests;
    profile.languages = profileSeed.languages;
    profile.shortBio = profileSeed.shortBio;
    profile.updatedAt = existingProfile ? new Date() : null;

    await repo.save(profile);
    summary.studentProfiles += 1;
  }
}

async function seedActivities(
  dataSource: DataSource,
  seed: DemoSeedData,
  context: SeedContext,
  summary: DemoSeedRunSummary
): Promise<void> {
  const repo = dataSource.getRepository(Activity);

  for (const activitySeed of seed.activities) {
    assertDemoActivityTitle(activitySeed);

    const campusId = requireMappedValue(context.campusIdBySeedId, activitySeed.campusId, "campus");
    const hostAccountId = requireMappedValue(
      context.accountIdBySeedId,
      activitySeed.hostAccountId,
      "host account"
    );
    const category = requireMappedObject(
      context.optionBySeedId,
      activitySeed.categoryId,
      "activity category"
    );
    const meetingPoint = requireMappedObject(
      context.optionBySeedId,
      activitySeed.meetingPointId,
      "meeting point"
    );
    const existingActivity = await repo.findOne({
      where: {
        campusId,
        hostAccountId,
        title: activitySeed.title
      }
    });

    if (existingActivity) {
      await resetDemoActivityRelations(dataSource, [existingActivity.activityId]);
      summary.resetDemoActivityIds.push(existingActivity.activityId);
    }

    const activity =
      existingActivity ??
      repo.create({
        activityId: activitySeed.activityId,
        campusId,
        hostAccountId,
        title: activitySeed.title
      });
    const scheduledDateTime = buildFutureDate(activitySeed.startsInHours);

    activity.campusId = campusId;
    activity.hostAccountId = hostAccountId;
    activity.title = activitySeed.title;
    activity.categoryId = category.optionId;
    activity.categoryLabel = category.name;
    activity.description = activitySeed.description;
    activity.scheduledDateTime = scheduledDateTime;
    activity.scheduledEndDateTime = buildEndDate(scheduledDateTime, activitySeed.durationHours);
    activity.meetingPointId = meetingPoint.optionId;
    activity.meetingPointLabel = meetingPoint.name;
    activity.participationMode = activitySeed.participationMode;
    activity.maxParticipants = activitySeed.maxParticipants;
    activity.maxRequests = activitySeed.maxRequests;
    activity.currentParticipantCount = 0;
    activity.currentRequestCount = 0;
    activity.genderPreference = activitySeed.genderPreference;
    activity.status = ActivityStatus.Open;

    await repo.save(activity);
    summary.activities += 1;
  }
}

async function resetDemoActivityRelations(
  dataSource: DataSource,
  demoActivityIds: string[]
): Promise<void> {
  if (demoActivityIds.length === 0) {
    return;
  }

  await dataSource.getRepository(NotificationRecord).delete({
    relatedActivityId: In(demoActivityIds)
  });
  await dataSource.getRepository(Participation).delete({
    activityId: In(demoActivityIds)
  });
}

function buildFutureDate(startsInHours: number): Date {
  return new Date(Date.now() + startsInHours * 60 * 60 * 1000);
}

function buildEndDate(start: Date, durationHours: number): Date {
  return new Date(start.getTime() + durationHours * 60 * 60 * 1000);
}

function assertDemoActivityTitle(activitySeed: DemoActivitySeed): void {
  if (!activitySeed.title.startsWith(demoActivityTitlePrefix)) {
    throw new Error(
      `Refusing to seed activity without ${demoActivityTitlePrefix} prefix: ${activitySeed.title}`
    );
  }
}

function requireMappedValue(map: Map<string, string>, seedId: string, label: string): string {
  const value = map.get(seedId);
  if (!value) {
    throw new Error(`Missing mapped ${label} for seed id ${seedId}`);
  }

  return value;
}

function requireMappedObject<T>(map: Map<string, T>, seedId: string, label: string): T {
  const value = map.get(seedId);
  if (!value) {
    throw new Error(`Missing mapped ${label} for seed id ${seedId}`);
  }

  return value;
}

async function bootstrap(): Promise<void> {
  assertLocalDemoEnvironment();
  await AppDataSource.initialize();

  try {
    const summary = await seedDemo(AppDataSource);
    console.log("[Demo Seed] Local/demo data synced");
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await AppDataSource.destroy();
  }
}

if (require.main === module) {
  void bootstrap().catch((error) => {
    console.error("Failed to seed demo data", error);
    process.exit(1);
  });
}
