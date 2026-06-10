import bcrypt from "bcryptjs";
import { DataSource, Repository } from "typeorm";

import { StudentAccount } from "../packages/access-profile/src/entities/StudentAccount";
import { StudentProfile } from "../packages/access-profile/src/entities/StudentProfile";
import { UniversityIdentityRule } from "../packages/access-profile/src/entities/UniversityIdentityRule";
import { Campus } from "../packages/campus-administration/src/entities/Campus";
import { CampusStructuredOption } from "../packages/campus-administration/src/entities/CampusStructuredOption";
import { Activity } from "../packages/hosting-lifecycle/src/entities/Activity";
import { Participation } from "../packages/hosting-lifecycle/src/entities/Participation";
import { ReportRecord } from "../packages/safety-moderation/src/entities/ReportRecord";
import {
  createDefaultCampusInsightConsentSettings,
  createLegacyEnabledCampusInsightConsentSettings
} from "../packages/shared/src/domain/campusInsightConsent";
import { AppDataSource } from "../packages/shared/src/config/database";
import { ParticipationRecordType, ParticipationStatus } from "../packages/shared/src/domain/enums";
import {
  phase0DemoSeed,
  type DemoParticipationSeed,
  type DemoReportSeed,
  type DemoSeedData
} from "../packages/shared/src/seed/demoSeed";
import { assertLocalDemoEnvironment } from "./demoSeedEnvironment";
import { seedMockActivities } from "./seedMockActivities";

interface DemoSeedRunSummary {
  universityIdentityRules: number;
  campuses: number;
  campusStructuredOptions: number;
  studentAccounts: number;
  studentProfiles: number;
  activities: number;
  participations: number;
  mockActivities: number;
  reports: number;
  refreshedDemoActivityIds: string[];
}

interface SeedContext {
  campusIdBySeedId: Map<string, string>;
  accountIdBySeedId: Map<string, string>;
  optionBySeedId: Map<string, CampusStructuredOption>;
  activityIdBySeedId: Map<string, string>;
}

export async function seedDemo(dataSource: DataSource): Promise<DemoSeedRunSummary> {
  assertLocalDemoEnvironment();

  const context: SeedContext = {
    campusIdBySeedId: new Map(),
    accountIdBySeedId: new Map(),
    optionBySeedId: new Map(),
    activityIdBySeedId: new Map()
  };

  const summary: DemoSeedRunSummary = {
    universityIdentityRules: 0,
    campuses: 0,
    campusStructuredOptions: 0,
    studentAccounts: 0,
    studentProfiles: 0,
    activities: 0,
    participations: 0,
    mockActivities: 0,
    reports: 0,
    refreshedDemoActivityIds: []
  };

  await seedUniversityIdentityRules(dataSource, phase0DemoSeed, summary);
  await seedCampuses(dataSource, phase0DemoSeed, context, summary);
  await seedStructuredOptions(dataSource, phase0DemoSeed, context, summary);
  await seedStudentAccounts(dataSource, phase0DemoSeed, context, summary);
  await seedStudentProfiles(dataSource, phase0DemoSeed, context, summary);
  await seedActivities(dataSource, phase0DemoSeed, context, summary);
  await seedParticipations(dataSource, phase0DemoSeed, context, summary);
  await refreshSeededActivityCounters(dataSource, phase0DemoSeed, context);
  const mockActivitySummary = await seedMockActivities(dataSource);
  summary.mockActivities = mockActivitySummary.inserted + mockActivitySummary.updated;
  await seedReports(dataSource, phase0DemoSeed, context, summary);

  return summary;
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
    account.campusInsightConsentSettings = accountSeed.campusInsightSharingConsent
      ? createLegacyEnabledCampusInsightConsentSettings()
      : createDefaultCampusInsightConsentSettings();
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
      where: { activityId: activitySeed.activityId }
    });

    const activity =
      existingActivity ??
      repo.create({
        activityId: activitySeed.activityId,
        campusId,
        hostAccountId,
        title: activitySeed.title
      });
    const scheduledDateTime = buildScheduledDate(
      activitySeed.startsInDays,
      activitySeed.startTime
    );

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
    activity.status = activitySeed.status;

    const savedActivity = await repo.save(activity);
    context.activityIdBySeedId.set(activitySeed.activityId, savedActivity.activityId);
    summary.refreshedDemoActivityIds.push(savedActivity.activityId);
    summary.activities += 1;
  }
}

async function seedParticipations(
  dataSource: DataSource,
  seed: DemoSeedData,
  context: SeedContext,
  summary: DemoSeedRunSummary
): Promise<void> {
  const repo = dataSource.getRepository(Participation);

  for (const participationSeed of seed.participations) {
    const participation = await buildDemoParticipation(repo, participationSeed, context);

    await repo.save(participation);
    summary.participations += 1;
  }
}

async function buildDemoParticipation(
  repo: Repository<Participation>,
  participationSeed: DemoParticipationSeed,
  context: SeedContext
): Promise<Participation> {
  const activityId = requireMappedValue(
    context.activityIdBySeedId,
    participationSeed.activityId,
    "activity"
  );
  const studentAccountId = requireMappedValue(
    context.accountIdBySeedId,
    participationSeed.studentAccountId,
    "student account"
  );
  const existingParticipation = await repo.findOne({
    where: { participationId: participationSeed.participationId }
  });
  const participation =
    existingParticipation ??
    repo.create({
      participationId: participationSeed.participationId
    });

  participation.activityId = activityId;
  participation.studentAccountId = studentAccountId;
  participation.recordType = participationSeed.recordType;
  participation.status = participationSeed.status;

  return participation;
}

async function refreshSeededActivityCounters(
  dataSource: DataSource,
  seed: DemoSeedData,
  context: SeedContext
): Promise<void> {
  const activityRepo = dataSource.getRepository(Activity);
  const participationRepo = dataSource.getRepository(Participation);

  for (const activitySeed of seed.activities) {
    const activityId = requireMappedValue(
      context.activityIdBySeedId,
      activitySeed.activityId,
      "activity"
    );
    const activity = await activityRepo.findOne({ where: { activityId } });
    if (!activity) {
      throw new Error(`Missing seeded activity for counter refresh: ${activitySeed.activityId}`);
    }

    activity.currentParticipantCount = await participationRepo.count({
      where: {
        activityId,
        recordType: ParticipationRecordType.Participation,
        status: ParticipationStatus.Confirmed
      }
    });
    activity.currentRequestCount = await participationRepo.count({
      where: {
        activityId,
        recordType: ParticipationRecordType.Request,
        status: ParticipationStatus.Pending
      }
    });

    await activityRepo.save(activity);
  }
}

async function seedReports(
  dataSource: DataSource,
  seed: DemoSeedData,
  context: SeedContext,
  summary: DemoSeedRunSummary
): Promise<void> {
  const repo = dataSource.getRepository(ReportRecord);

  for (const reportSeed of seed.reports) {
    const campusId = requireMappedValue(context.campusIdBySeedId, reportSeed.campusId, "campus");
    const reporterAccountId = requireMappedValue(
      context.accountIdBySeedId,
      reportSeed.reporterAccountId,
      "reporter account"
    );
    const targetAccountId = reportSeed.targetAccountId
      ? requireMappedValue(context.accountIdBySeedId, reportSeed.targetAccountId, "target account")
      : null;
    const targetActivityId = reportSeed.targetActivityId
      ? requireMappedValue(context.activityIdBySeedId, reportSeed.targetActivityId, "target activity")
      : null;
    const existingReport = await repo.findOne({
      where: {
        reportId: reportSeed.reportId
      }
    });
    const report =
      existingReport ??
      repo.create({
        reportId: reportSeed.reportId
      });

    applyDemoReportSeed(report, reportSeed, {
      campusId,
      reporterAccountId,
      targetAccountId,
      targetActivityId
    });

    await repo.save(report);
    summary.reports += 1;
  }
}

function applyDemoReportSeed(
  report: ReportRecord,
  reportSeed: DemoReportSeed,
  mappedValues: {
    campusId: string;
    reporterAccountId: string;
    targetAccountId: string | null;
    targetActivityId: string | null;
  }
): void {
  report.campusId = mappedValues.campusId;
  report.reporterAccountId = mappedValues.reporterAccountId;
  report.targetType = reportSeed.targetType;
  report.targetAccountId = mappedValues.targetAccountId;
  report.targetActivityId = mappedValues.targetActivityId;
  report.reasonCode = reportSeed.reasonCode;
  report.description = reportSeed.description;
  report.status = reportSeed.status;
  report.reviewedAt = null;
  report.reviewedByAdminId = reportSeed.reviewedByAdminId;
  report.moderationAction = reportSeed.moderationAction;
  report.reviewOutcome = reportSeed.reviewOutcome;
  report.reviewNotes = reportSeed.reviewNotes;
  report.commandDispatchPending = reportSeed.commandDispatchPending;
}

function buildScheduledDate(startsInDays: number, startTime: string): Date {
  const now = new Date();
  const [hours, minutes] = parseStartTime(startTime);
  const scheduledDate = new Date(now);

  scheduledDate.setDate(now.getDate() + startsInDays);
  scheduledDate.setHours(hours, minutes, 0, 0);

  while (scheduledDate <= now) {
    scheduledDate.setDate(scheduledDate.getDate() + 1);
  }

  return scheduledDate;
}

function buildEndDate(start: Date, durationHours: number): Date {
  return new Date(start.getTime() + durationHours * 60 * 60 * 1000);
}

function parseStartTime(startTime: string): [number, number] {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(startTime);

  if (!match) {
    throw new Error(`Invalid demo activity start time: ${startTime}`);
  }

  return [Number(match[1]), Number(match[2])];
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
