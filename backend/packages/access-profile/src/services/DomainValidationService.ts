// Task: AP04 | Path: backend/packages/access-profile/src/services/DomainValidationService.ts

import { IdentityRuleRepo } from "../repositories/IdentityRuleRepo";

export class DomainValidationService {
  constructor(private readonly identityRuleRepo: IdentityRuleRepo) {}

  public async validateDomain(emailDomain: string): Promise<boolean> {
    const rule = await this.identityRuleRepo.findByDomain(emailDomain);
    return rule !== null && rule.ruleStatus === "Active";
  }
}
