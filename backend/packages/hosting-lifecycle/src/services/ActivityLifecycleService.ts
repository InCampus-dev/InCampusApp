import { ActivityStatus } from '../../../shared/src/domain/enums';
import { AppError } from '../../../shared/src/errors/AppError';

export class ActivityLifecycleService {
  constructor(
    private activityRepo: any,
    private campusValidationService: any,
    private eventBus: any
  ) {}

  async createActivity(payload: any) {
    await this.campusValidationService.validateCategoryAndLocation(
      payload.campusId,
      payload.categoryId,
      payload.meetingPointId
    );

    return this.activityRepo.create(payload);
  }

  async updateStatus(activityId: string, hostId: string, status: ActivityStatus) {
    const activity = await this.activityRepo.findById(activityId);
    if (!activity) {
      throw AppError.notFound('Activity', activityId);
    }
    if (activity.hostId !== hostId) {
      throw AppError.conflict('Only the host can update the activity status', 'Activity');
    }

    await this.activityRepo.updateStatus(activityId, status);

    if (status === ActivityStatus.Cancelled) {
      await this.eventBus.publish('ActivityCancelled', {
        activityId,
        triggeringAccountId: hostId
      });
    }
  }
}