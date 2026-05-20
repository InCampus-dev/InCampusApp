// Task: AP11 | Path: backend/packages/access-profile/src/__tests__/DomainValidationService.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";

import { DomainValidationService } from "../services/DomainValidationService";

const mockIdentityRuleRepo = {
  findByDomain: vi.fn()
};

describe("DomainValidationService", () => {
  let service: DomainValidationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DomainValidationService(mockIdentityRuleRepo as any);
  });

  it("should return true for a supported active university domain", async () => {
    mockIdentityRuleRepo.findByDomain.mockResolvedValue({
      domainRuleId: "rule-1",
      emailDomain: "tongji.edu.cn",
      universityName: "Tongji University",
      ruleStatus: "Active"
    });

    const result = await service.validateDomain("tongji.edu.cn");

    expect(result).toBe(true);
    expect(mockIdentityRuleRepo.findByDomain).toHaveBeenCalledWith("tongji.edu.cn");
  });

  it("should return false for an unsupported domain", async () => {
    mockIdentityRuleRepo.findByDomain.mockResolvedValue(null);

    const result = await service.validateDomain("gmail.com");

    expect(result).toBe(false);
  });

  it("should return false for an inactive domain rule", async () => {
    mockIdentityRuleRepo.findByDomain.mockResolvedValue({
      domainRuleId: "rule-2",
      emailDomain: "old-uni.edu",
      universityName: "Old University",
      ruleStatus: "Inactive"
    });

    const result = await service.validateDomain("old-uni.edu");

    expect(result).toBe(false);
  });
});
