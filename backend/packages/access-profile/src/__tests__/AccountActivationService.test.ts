// Task: AP11 | Path: backend/packages/access-profile/src/__tests__/AccountActivationService.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";

import { AccountActivationService } from "../services/AccountActivationService";

const mockAccountRepo = {
  findByEmail: vi.fn(),
  create: vi.fn(),
  save: vi.fn()
};

describe("AccountActivationService", () => {
  let service: AccountActivationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AccountActivationService(mockAccountRepo as any);
  });

  it("should create a new account with PendingVerification status", async () => {
    mockAccountRepo.findByEmail.mockResolvedValue(null);
    const createdEntity = {
      studentAccountId: "acc-1",
      universityEmail: "student@tongji.edu.cn",
      verificationStatus: "Pending",
      platformAccessStatus: "PendingVerification"
    };
    mockAccountRepo.create.mockReturnValue(createdEntity);
    mockAccountRepo.save.mockResolvedValue(createdEntity);

    const result = await service.signUp(
      "student@tongji.edu.cn",
      "securePassword123",
      "STU-001"
    );

    expect(result.verificationStatus).toBe("Pending");
    expect(result.platformAccessStatus).toBe("PendingVerification");
    expect(mockAccountRepo.save).toHaveBeenCalledOnce();
  });

  it("should reject duplicate email registration", async () => {
    mockAccountRepo.findByEmail.mockResolvedValue({
      studentAccountId: "existing-acc",
      universityEmail: "student@tongji.edu.cn"
    });

    await expect(
      service.signUp("student@tongji.edu.cn", "password", "STU-002")
    ).rejects.toThrow();
  });

  it("should activate account on valid verification token", async () => {
    const pendingAccount = {
      studentAccountId: "acc-2",
      universityEmail: "student@tongji.edu.cn",
      verificationStatus: "Pending",
      platformAccessStatus: "PendingVerification",
      verificationToken: "valid-token"
    };
    mockAccountRepo.findByEmail.mockResolvedValue(pendingAccount);
    mockAccountRepo.save.mockImplementation(async (entity: any) => entity);

    const result = await service.verifyEmail("student@tongji.edu.cn", "valid-token");

    expect(result.verificationStatus).toBe("Verified");
    expect(result.platformAccessStatus).toBe("Active");
  });

  it("should reject invalid verification token", async () => {
    mockAccountRepo.findByEmail.mockResolvedValue({
      studentAccountId: "acc-3",
      universityEmail: "student@tongji.edu.cn",
      verificationToken: "correct-token"
    });

    await expect(
      service.verifyEmail("student@tongji.edu.cn", "wrong-token")
    ).rejects.toThrow();
  });

  it("should throw when verifying a non-existent account", async () => {
    mockAccountRepo.findByEmail.mockResolvedValue(null);

    await expect(
      service.verifyEmail("nobody@tongji.edu.cn", "any-token")
    ).rejects.toThrow();
  });
});
