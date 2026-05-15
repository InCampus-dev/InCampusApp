import { describe, expect, it } from "vitest";

import { DomainValidationService } from "../services/DomainValidationService";
import { seedUniversityIdentityRules } from "../seed/seedUniversityIdentityRules";
import { phase0DemoSeed } from "../../../shared/src/seed/demoSeed";

describe("seedUniversityIdentityRules", () => {
  it("seeds the demo university identity rules idempotently", async () => {
    const identityRuleRepo = createInMemoryIdentityRuleRepo();

    const firstRun = await seedUniversityIdentityRules(identityRuleRepo);
    const secondRun = await seedUniversityIdentityRules(identityRuleRepo);

    expect(firstRun).toEqual({
      created: phase0DemoSeed.universityIdentityRules.length,
      skipped: 0,
      total: phase0DemoSeed.universityIdentityRules.length,
      supportedDomains: phase0DemoSeed.universityIdentityRules.map((rule) => rule.emailDomain)
    });
    expect(secondRun).toEqual({
      created: 0,
      skipped: phase0DemoSeed.universityIdentityRules.length,
      total: phase0DemoSeed.universityIdentityRules.length,
      supportedDomains: phase0DemoSeed.universityIdentityRules.map((rule) => rule.emailDomain)
    });
    expect(identityRuleRepo.list()).toHaveLength(phase0DemoSeed.universityIdentityRules.length);
  });

  it("supports DomainValidationService for the seeded demo domain while rejecting unsupported domains", async () => {
    const identityRuleRepo = createInMemoryIdentityRuleRepo();
    const domainValidationService = new DomainValidationService(identityRuleRepo as any);

    await seedUniversityIdentityRules(identityRuleRepo);

    await expect(domainValidationService.validateDomain("tongji.edu.cn")).resolves.toBe(true);
    await expect(domainValidationService.validateDomain("gmail.com")).resolves.toBe(false);
  });
});

function createInMemoryIdentityRuleRepo() {
  const identityRuleStore = new Map<
    string,
    {
      domainRuleId: string;
      emailDomain: string;
      universityName: string;
      studentIdFormatRule: string | null;
      ruleStatus: string;
    }
  >();

  return {
    async findByDomain(domain: string) {
      return identityRuleStore.get(domain) ?? null;
    },
    create(payload: {
      emailDomain: string;
      universityName: string;
      studentIdFormatRule: string | null;
      ruleStatus: string;
    }) {
      return {
        domainRuleId: `rule-${identityRuleStore.size + 1}`,
        ...payload
      };
    },
    async save(rule: {
      domainRuleId: string;
      emailDomain: string;
      universityName: string;
      studentIdFormatRule: string | null;
      ruleStatus: string;
    }) {
      identityRuleStore.set(rule.emailDomain, rule);
      return rule;
    },
    list() {
      return Array.from(identityRuleStore.values());
    }
  };
}
