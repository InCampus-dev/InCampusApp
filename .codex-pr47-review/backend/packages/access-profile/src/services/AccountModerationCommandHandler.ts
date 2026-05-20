// Task: AP12 | Path: backend/packages/access-profile/src/services/AccountModerationCommandHandler.ts

import type {
  AccountModerationCommandHandler as AccountModerationCommandHandlerPort,
  RequestAccountModerationAction
} from "../../../safety-moderation/src/services/ModerationActionDispatcher";
import { AppError } from "../../../shared/src/errors/AppError";
import { ModerationAction, PlatformAccessStatus } from "../../../shared/src/domain/enums";
import { StudentAccountRepo } from "../repositories/StudentAccountRepo";

/**
 * Internal command payload from SM after report review.
 * Defined in docs/internal-command-contract.md.
 * Source: UCR - A&P v1.2 Internal Interfaces; UCR - S&M v1.3 DUC-SM-03.
 */
const ACTION_TO_STATUS: Partial<Record<ModerationAction, PlatformAccessStatus>> = {
  [ModerationAction.SuspendUser]: PlatformAccessStatus.Suspended,
  [ModerationAction.BanUser]: PlatformAccessStatus.Banned,
};

export class AccountModerationCommandHandler implements AccountModerationCommandHandlerPort {
  constructor(private readonly studentAccountRepo: StudentAccountRepo) {}

  /**
   * Handle RequestAccountModerationAction from Safety and Moderation.
   *
   * AP updates only DS-AP-001.PlatformAccessStatus under AP ownership.
   * AP does not validate the report review itself; SM is the source of truth
   * for report outcomes. AP handles only suspend_user and ban_user actions.
   *
   * This is an internal module interface, not an HTTP endpoint.
   */
  public async handle(command: RequestAccountModerationAction): Promise<void> {
    const newStatus = ACTION_TO_STATUS[command.actionType];
    if (!newStatus) {
      throw new AppError(
        "VALIDATION_ERROR",
        `AP12: Unsupported actionType "${command.actionType}". AP handles only suspend_user and ban_user.`,
        400
      );
    }

    const account = await this.studentAccountRepo.findById(command.targetAccountId);
    if (!account) {
      throw AppError.notFound("StudentAccount", command.targetAccountId);
    }

    account.platformAccessStatus = newStatus;
    await this.studentAccountRepo.save(account);

    console.log(
      `[AP12] PlatformAccessStatus updated: account=${command.targetAccountId}, ` +
        `action=${command.actionType}, newStatus=${newStatus}, ` +
        `reportId=${command.reportId}, reviewOutcomeId=${command.reviewOutcomeId}`
    );
  }
}
