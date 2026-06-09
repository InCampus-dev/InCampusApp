import { describe, expect, it } from "vitest";

import {
  ActivityStatus,
  CampusStructuredOptionType,
  GenderPreference,
  ParticipationMode,
  ParticipationRecordType,
  ParticipationStatus,
  ReportStatus,
  ReportTargetType
} from "../domain/enums";
import {
  demoApprovalActivityId,
  demoGuestAccountId,
  demoHostAccountId,
  demoModerationActivityId,
  demoOpenActivityId,
  demoPassword,
  demoReportId,
  demoUser1AccountId,
  phase0DemoSeed,
  summarizeDemoSeed
} from "../seed/demoSeed";
import { demoMockActivities } from "../seed/demoMockActivities";

describe("phase0DemoSeed", () => {
  it("contains the data needed for the refreshed local demo path", () => {
    const summary = summarizeDemoSeed();

    expect(summary.universityIdentityRules).toBeGreaterThanOrEqual(1);
    expect(summary.campuses).toBeGreaterThanOrEqual(1);
    expect(
      phase0DemoSeed.campusStructuredOptions.filter(
        (option) => option.optionType === CampusStructuredOptionType.ActivityCategory
      )
    ).toHaveLength(5);
    expect(
      phase0DemoSeed.campusStructuredOptions.filter(
        (option) => option.optionType === CampusStructuredOptionType.CampusLocation
      )
    ).toHaveLength(4);
    expect(summary.studentAccounts).toBeGreaterThanOrEqual(10);
    expect(summary.studentProfiles).toBeGreaterThanOrEqual(10);
    expect(summary.activities).toBeGreaterThanOrEqual(10);
    expect(summary.participations).toBeGreaterThanOrEqual(4);
    expect(summary.reports).toBeGreaterThanOrEqual(1);
  });

  it("uses stable manifest keys for idempotent demo seeding", () => {
    expectUnique(
      phase0DemoSeed.universityIdentityRules.map((rule) => rule.emailDomain),
      "identity rule emailDomain"
    );
    expectUnique(
      phase0DemoSeed.campuses.map((campus) => `${campus.universityName}:${campus.campusName}`),
      "campus universityName + campusName"
    );
    expectUnique(
      phase0DemoSeed.campusStructuredOptions.map(
        (option) => `${option.campusId}:${option.optionType}:${option.name}`
      ),
      "campus option campusId + optionType + name"
    );
    expectUnique(
      phase0DemoSeed.studentAccounts.map((account) => account.universityEmail),
      "student account universityEmail"
    );
    expectUnique(
      phase0DemoSeed.studentProfiles.map((profile) => profile.studentAccountId),
      "student profile studentAccountId"
    );
    expectUnique(
      phase0DemoSeed.activities.map((activity) => activity.activityId),
      "activity activityId"
    );
    expectUnique(
      phase0DemoSeed.participations.map((participation) => participation.participationId),
      "participation participationId"
    );
    expectUnique(
      phase0DemoSeed.reports.map((report) => report.reportId),
      "report reportId"
    );
  });

  it("does not expose demo markers in visible activity titles", () => {
    expect(phase0DemoSeed.activities).not.toHaveLength(0);
    expect(phase0DemoSeed.activities.every((activity) => !activity.title.includes("[DEMO]"))).toBe(
      true
    );
  });

  it("keeps demo account credentials local and explicit", () => {
    expect(demoPassword).toBe("88888888");
    expect(
      phase0DemoSeed.studentAccounts.every((account) => account.password === demoPassword)
    ).toBe(true);
  });

  it("uses person names for seeded demo profiles", () => {
    const displayNames = phase0DemoSeed.studentProfiles.map((profile) => profile.displayName);

    expect(displayNames).toContain("Luca Ferri");
    expect(displayNames).toContain("Giulia Conti");
    expect(displayNames).toContain("Mei Chen");
    expect(displayNames.every((name) => !/^Demo |^User /.test(name))).toBe(true);

    for (const name of displayNames) {
      expect(name.split(" ").length).toBeGreaterThanOrEqual(2);
    }
  });

  it("uses varied Tongji-aware local start slots", () => {
    const scenarioDayCounts = new Map<number, number>();

    for (const activity of phase0DemoSeed.activities) {
      expect(activity.startsInDays).toBeGreaterThanOrEqual(0);
      expect(activity.startsInDays).toBeLessThanOrEqual(2);
      expect(isValidStartTime(activity.startTime)).toBe(true);
      scenarioDayCounts.set(
        activity.startsInDays,
        (scenarioDayCounts.get(activity.startsInDays) ?? 0) + 1
      );
    }

    expect(scenarioDayCounts.get(0)).toBe(3);
    expect(scenarioDayCounts.get(1)).toBe(4);
    expect(scenarioDayCounts.get(2)).toBe(3);

    const allSeededStartTimes = [
      ...phase0DemoSeed.activities.map((activity) => activity.startTime),
      ...demoMockActivities.map((activity) => activity.startTime)
    ];
    const uniqueMinutes = new Set(
      allSeededStartTimes.map((startTime) => startTime.split(":")[1])
    );

    expect(uniqueMinutes.size).toBeGreaterThanOrEqual(8);
    expect(new Set(allSeededStartTimes).size).toBeGreaterThanOrEqual(18);
  });

  it("seeds pending request and confirmed participation scenarios", () => {
    const hostApprovalActivity = phase0DemoSeed.activities.find(
      (activity) => activity.activityId === demoApprovalActivityId
    );
    const guestPendingRequest = phase0DemoSeed.participations.find(
      (participation) =>
        participation.activityId === demoApprovalActivityId &&
        participation.studentAccountId === demoGuestAccountId
    );
    const userOneConfirmed = phase0DemoSeed.participations.find(
      (participation) =>
        participation.activityId === demoOpenActivityId &&
        participation.studentAccountId === demoUser1AccountId
    );

    expect(hostApprovalActivity).toMatchObject({
      hostAccountId: demoHostAccountId,
      participationMode: ParticipationMode.ApprovalBased
    });
    expect(guestPendingRequest).toMatchObject({
      recordType: ParticipationRecordType.Request,
      status: ParticipationStatus.Pending
    });
    expect(userOneConfirmed).toMatchObject({
      recordType: ParticipationRecordType.Participation,
      status: ParticipationStatus.Confirmed
    });
  });

  it("does not configure seeded activities as immediately full", () => {
    for (const activity of phase0DemoSeed.activities) {
      const confirmedGuests = phase0DemoSeed.participations.filter(
        (participation) =>
          participation.activityId === activity.activityId &&
          participation.recordType === ParticipationRecordType.Participation &&
          participation.status === ParticipationStatus.Confirmed
      ).length;

      expect(confirmedGuests).toBeLessThan(activity.maxParticipants - 1);
    }
  });

  it("uses a realistic activity for the seeded admin-review report", () => {
    const moderationActivity = phase0DemoSeed.activities.find(
      (activity) => activity.activityId === demoModerationActivityId
    );
    const demoReport = phase0DemoSeed.reports.find((report) => report.reportId === demoReportId);

    expect(moderationActivity?.title).toBe("Main Gate Coffee Chat");
    expect(demoReport).toMatchObject({
      targetType: ReportTargetType.Activity,
      targetActivityId: demoModerationActivityId,
      status: ReportStatus.PendingReview
    });
    expect(demoReport?.description?.includes("[DEMO]")).toBe(false);
  });

  it("contains a rich idempotent mock activity set for demo feeds", () => {
    expect(demoMockActivities.length).toBeGreaterThanOrEqual(18);
    expect(demoMockActivities.length).toBeLessThanOrEqual(25);
    expect(demoMockActivities.every((activity) => !activity.title.includes("[DEMO]"))).toBe(true);
    expectUnique(
      demoMockActivities.map((activity) => `${activity.campusId}:${activity.title}`),
      "mock activity campusId + title"
    );

    const modes = new Set(demoMockActivities.map((activity) => activity.participationMode));
    expect(modes.has(ParticipationMode.Open)).toBe(true);
    expect(modes.has(ParticipationMode.ApprovalBased)).toBe(true);

    const genderPreferences = new Set(
      demoMockActivities.map((activity) => activity.genderPreference)
    );
    expect(genderPreferences.has(GenderPreference.All)).toBe(true);
    expect(genderPreferences.has(GenderPreference.MaleOnly)).toBe(true);
    expect(genderPreferences.has(GenderPreference.FemaleOnly)).toBe(true);

    const categories = new Set(
      phase0DemoSeed.campusStructuredOptions
        .filter((option) => option.optionType === CampusStructuredOptionType.ActivityCategory)
        .map((option) => option.optionId)
    );
    const locations = new Set(
      phase0DemoSeed.campusStructuredOptions
        .filter((option) => option.optionType === CampusStructuredOptionType.CampusLocation)
        .map((option) => option.optionId)
    );

    for (const activity of demoMockActivities) {
      expect(categories.has(activity.categoryId)).toBe(true);
      expect(locations.has(activity.meetingPointId)).toBe(true);
      expect(activity.status).toBe(ActivityStatus.Open);
      expect(activity.startsInDays).toBeGreaterThanOrEqual(0);
      expect(isValidStartTime(activity.startTime)).toBe(true);
      expect(activity.maxParticipants).toBeGreaterThanOrEqual(2);
      expect(activity.maxRequests ?? 0).toBeLessThanOrEqual(activity.maxParticipants - 1);
      expect(activity.description.length).toBeGreaterThan(40);
      expect(activity.description.length).toBeLessThanOrEqual(300);
      expect(activity.title.length).toBeLessThanOrEqual(100);
    }
  });
});

function expectUnique(values: string[], label: string): void {
  expect(new Set(values).size, `${label} should be unique`).toBe(values.length);
}

function isValidStartTime(value: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}
