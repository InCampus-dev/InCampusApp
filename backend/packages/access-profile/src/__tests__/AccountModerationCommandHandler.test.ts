// Task: AP11 | Path: backend/packages/access-profile/src/__tests__/AccountModerationCommandHandler.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";

import type { StudentAccountRepo } from "../repositories/StudentAccountRepo";
import { AccountModerationCommandHandler } from "../services/AccountModerationCommandHandler";
import { ModerationAction, ReviewOutcome } from "../../../shared/src/domain/enums";

const mockAccountRepo = {
  findById: vi.fn(),
  save: vi.fn()
};

describe("AccountModerationCommandHandler", () => {
  let handler: AccountModerationCommandHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = new AccountModerationCommandHandler(mockAccountRepo as unknown as StudentAccountRepo);
  });

  it("should suspend a user account when action is suspend_user", async () => {
    const account = {
      studentAccountId: "acc-target",
      platformAccessStatus: "Active"
    };
    mockAccountRepo.findById.mockResolvedValue(account);
    mockAccountRepo.save.mockImplementation(async <T>(entity: T) => entity);

    await handler.handle({
      commandId: "cmd-1",
      targetAccountId: "acc-target",
      actionType: ModerationAction.SuspendUser,
      reportId: "rpt-1",
      campusId: "campus-1",
      reviewOutcomeId: ReviewOutcome.ActionTaken,
      requestedByAdminId: "admin-1",
      requestedAt: "2026-05-14T00:00:00.000Z"
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
    mockAccountRepo.save.mockImplementation(async <T>(entity: T) => entity);

    await handler.handle({
      commandId: "cmd-2",
      targetAccountId: "acc-target",
      actionType: ModerationAction.BanUser,
      reportId: "rpt-2",
      campusId: "campus-1",
      reviewOutcomeId: ReviewOutcome.ActionTaken,
      requestedByAdminId: "admin-1",
      requestedAt: "2026-05-14T00:00:00.000Z"
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
        commandId: "cmd-3",
        targetAccountId: "nonexistent",
        actionType: ModerationAction.SuspendUser,
        reportId: "rpt-3",
        campusId: "campus-1",
        reviewOutcomeId: ReviewOutcome.ActionTaken,
        requestedByAdminId: "admin-1",
        requestedAt: "2026-05-14T00:00:00.000Z"
      })
    ).rejects.toThrow();
  });
});
