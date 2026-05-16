import { describe, expect, it } from "vitest";

import { CampusStructuredOptionType } from "../domain/enums";
import {
  demoActivityTitlePrefix,
  demoPassword,
  phase0DemoSeed,
  summarizeDemoSeed
} from "../seed/demoSeed";

describe("phase0DemoSeed", () => {
  it("contains the minimum data needed for the local demo path", () => {
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
    expect(summary.studentAccounts).toBeGreaterThanOrEqual(2);
    expect(summary.studentProfiles).toBeGreaterThanOrEqual(2);
    expect(summary.activities).toBeGreaterThanOrEqual(2);
  });

  it("uses stable natural keys for idempotent demo seeding", () => {
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
      phase0DemoSeed.activities.map(
        (activity) => `${activity.campusId}:${activity.hostAccountId}:${activity.title}`
      ),
      "activity campusId + hostAccountId + title"
    );
  });

  it("marks all seeded activities as explicit demo records", () => {
    expect(phase0DemoSeed.activities).not.toHaveLength(0);
    expect(
      phase0DemoSeed.activities.every((activity) =>
        activity.title.startsWith(demoActivityTitlePrefix)
      )
    ).toBe(true);
  });

  it("keeps demo account credentials local and explicit", () => {
    expect(demoPassword).toBe("InCampusDemo2026!");
    expect(
      phase0DemoSeed.studentAccounts.every((account) => account.password === demoPassword)
    ).toBe(true);
  });
});

function expectUnique(values: string[], label: string): void {
  expect(new Set(values).size, `${label} should be unique`).toBe(values.length);
}
