// Task: AP11 | Path: backend/packages/access-profile/src/__tests__/AccountModerationCommandHandler.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";

import { AccountModerationCommandHandler } from "../services/AccountModerationCommandHandler";
import { ModerationAction } from "../../../shared/src/domain/enums";

const mockAccountRepo = {
  findById: vi.fn(),
  save: vi.fn()
};

describe("AccountModerationCommandHandler", () => {
  let handler: AccountModerationCommandHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = new AccountModerationCommandHandler(mockAccountRepo as any);
  });

  it("should suspend a user account when action is suspend_user", async () => {
    const account = {
      studentAccountId: "acc-target",
      platformAccessStatus: "Active"
    };
    mockAccountRepo.findById.mockResolvedValue(account);
    mockAccountRepo.save.mockImplementation(async (entity: any) => entity);

    await handler.handle({
      targetAccountId: "acc-target",
      actionType: ModerationAction.SuspendUser,
      reportId: "rpt-1",
      campusId: "campus-1",
      reviewOutcomeId: "ro-1"
    });

    expect(mockAccountRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        platformAccessStatus: "Suspended"
      })
    );
  });

  it("should ban a user account when action is ban_user", async () => {
    const account = {
      studentAccountId: "acc-target",
      platformAccessStatus: "Active"
    };
    mockAccountRepo.findById.mockResolvedValue(account);
    mockAccountRepo.save.mockImplementation(async (entity: any) => entity);

    await handler.handle({
      targetAccountId: "acc-target",
      actionType: ModerationAction.BanUser,
      reportId: "rpt-2",
      campusId: "campus-1",
      reviewOutcomeId: "ro-2"
    });

    expect(mockAccountRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        platformAccessStatus: "Banned"
      })
    );
  });

  it("should throw if target account does not exist", async () => {
    mockAccountRepo.findById.mockResolvedValue(null);

    await expect(
      handler.handle({
        targetAccountId: "nonexistent",
        actionType: ModerationAction.SuspendUser,
        reportId: "rpt-3",
        campusId: "campus-1",
        reviewOutcomeId: "ro-3"
      })
    ).rejects.toThrow();
  });
});
