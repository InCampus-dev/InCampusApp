import { ModerationAction } from '../../../shared/src/domain/enums';
// Note: Adjust the import paths for your Repositories and Error classes based on your exact Day 1 setup
import { ActivityRepo } from '../repositories/ActivityRepo';
import { ParticipationRepo } from '../repositories/ParticipationRepo';
import { AppError } from '../../../shared/src/errors/AppError';

export interface RequestActivityModerationActionPayload {
  activityId: string;
  action: ModerationAction;
  adminId?: string; // Sourced from AuthenticatedAdminContext
  reason?: string;
}

export class ActivityModerationCommandHandler {
  constructor(
    private activityRepo: ActivityRepo,
    private participationRepo: ParticipationRepo
  ) {}

  /**
   * Handles moderation actions delegated from Safety & Moderation (SM).
   * Executes the native hard-delete workflow on DS-HL-001 and DS-HL-002 under H&L ownership.
   */
  async handle(payload: RequestActivityModerationActionPayload): Promise<void> {
    // H&L only processes activity removal. User bans are handled by AP.
    if (payload.action !== 'remove_activity') {
      return;
    }

    const activity = await this.activityRepo.findById(payload.activityId);
    if (!activity) {
      throw new AppError('NOT_FOUND', 'Activity not found for moderation removal');
    }

    // Hard-delete cascade (System Invariant Rule 1)
    await this.participationRepo.deleteByActivityId(payload.activityId);
    await this.activityRepo.delete(payload.activityId);
  }
}