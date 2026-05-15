// Task: AP03 | Path: backend/packages/access-profile/src/repositories/IdentityRuleRepo.ts

import { DataSource, Repository } from "typeorm";

import { UniversityIdentityRule } from "../entities/UniversityIdentityRule";

export class IdentityRuleRepo extends Repository<UniversityIdentityRule> {
  constructor(dataSource: DataSource) {
    super(UniversityIdentityRule, dataSource.createEntityManager());
  }

  public async findByDomain(domain: string): Promise<UniversityIdentityRule | null> {
    return this.findOne({ where: { emailDomain: domain } });
  }

  public async findAllActive(): Promise<UniversityIdentityRule[]> {
    return this.find({ where: { ruleStatus: "Active" } });
  }
}
