import { randomUUID } from "crypto";

import {
  ModerationAction,
  ReportTargetType,
  ReviewOutcome
} from "../../../shared/src/domain/enums";

export interface RequestAccountModerationAction {
  commandId: string;
  reportId: string;
  targetAccountId: string;
  actionType: ModerationAction.SuspendUser | ModerationAction.BanUser;
  campusId: string;
  reviewOutcomeId: ReviewOutcome;
  requestedByAdminId: string;
  requestedAt: string;
}

export interface RequestActivityModerationAction {
  commandId: string;
  reportId: string;
  activityId: string;
  actionType: ModerationAction.RemoveActivity;
  campusId: string;
  reviewOutcomeId: ReviewOutcome;
  requestedByAdminId: string;
  requestedAt: string;
}

export interface AccountModerationCommandHandler {
  handle(command: RequestAccountModerationAction): Promise<void>;
}

export interface ActivityModerationCommandHandler {
  handle(command: RequestActivityModerationAction): Promise<void>;
}

export interface DispatchModerationActionArgs {
  reportId: string;
  campusId: string;
  targetType: ReportTargetType;
  targetAccountId: string | null;
  targetActivityId: string | null;
  moderationAction: ModerationAction;
  reviewOutcome: ReviewOutcome;
  reviewedByAdminId: string;
}

export interface DispatchModerationActionResult {
  commandDispatchPending: boolean;
}

export class ModerationActionDispatcher {
  constructor(
    private readonly accountModerationCommandHandler?: AccountModerationCommandHandler,
    private readonly activityModerationCommandHandler?: ActivityModerationCommandHandler
  ) {}

  public async dispatch(
    args: DispatchModerationActionArgs
  ): Promise<DispatchModerationActionResult> {
    if (
      args.moderationAction === ModerationAction.None ||
      args.moderationAction === ModerationAction.WarnUser
    ) {
      return { commandDispatchPending: false };
    }

    if (
      args.moderationAction === ModerationAction.SuspendUser ||
      args.moderationAction === ModerationAction.BanUser
    ) {
      if (!this.accountModerationCommandHandler || !args.targetAccountId) {
        return { commandDispatchPending: true };
      }

      await this.accountModerationCommandHandler.handle({
        commandId: randomUUID(),
        reportId: args.reportId,
        targetAccountId: args.targetAccountId,
        actionType: args.moderationAction,
        campusId: args.campusId,
        reviewOutcomeId: args.reviewOutcome,
        requestedByAdminId: args.reviewedByAdminId,
        requestedAt: new Date().toISOString()
      });

      return { commandDispatchPending: false };
    }

    if (args.moderationAction === ModerationAction.RemoveActivity) {
      if (!this.activityModerationCommandHandler || !args.targetActivityId) {
        return { commandDispatchPending: true };
      }

      await this.activityModerationCommandHandler.handle({
        commandId: randomUUID(),
        reportId: args.reportId,
        activityId: args.targetActivityId,
        actionType: args.moderationAction,
        campusId: args.campusId,
        reviewOutcomeId: args.reviewOutcome,
        requestedByAdminId: args.reviewedByAdminId,
        requestedAt: new Date().toISOString()
      });

      return { commandDispatchPending: false };
    }

    return { commandDispatchPending: false };
  }
}
