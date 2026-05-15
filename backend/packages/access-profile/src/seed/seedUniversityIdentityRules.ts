import { phase0DemoSeed, type DemoUniversityIdentityRuleSeed } from "../../../shared/src/seed/demoSeed";

type UniversityIdentityRuleSeedRecord = {
  emailDomain: string;
  universityName: string;
  studentIdFormatRule: string | null;
  ruleStatus: string;
};

export interface UniversityIdentityRuleSeedRepo {
  findByDomain(domain: string): Promise<UniversityIdentityRuleSeedRecord | null>;
  create(payload: DemoUniversityIdentityRuleSeed): UniversityIdentityRuleSeedRecord;
  save(rule: UniversityIdentityRuleSeedRecord): Promise<UniversityIdentityRuleSeedRecord>;
}

export interface SeedUniversityIdentityRulesResult {
  created: number;
  skipped: number;
  total: number;
  supportedDomains: string[];
}

export async function seedUniversityIdentityRules(
  identityRuleRepo: UniversityIdentityRuleSeedRepo,
  rules: DemoUniversityIdentityRuleSeed[] = phase0DemoSeed.universityIdentityRules
): Promise<SeedUniversityIdentityRulesResult> {
  let created = 0;
  let skipped = 0;

  for (const rule of rules) {
    const existingRule = await identityRuleRepo.findByDomain(rule.emailDomain);
    if (existingRule) {
      skipped += 1;
      continue;
    }

    const newRule = identityRuleRepo.create(rule);
    await identityRuleRepo.save(newRule);
    created += 1;
  }

  return {
    created,
    skipped,
    total: rules.length,
    supportedDomains: rules.map((rule) => rule.emailDomain)
  };
}
