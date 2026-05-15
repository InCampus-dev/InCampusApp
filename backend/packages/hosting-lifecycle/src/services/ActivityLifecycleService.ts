import { randomUUID } from "crypto";
import { Activity } from "../entities/Activity";
import { CampusStructuredOptionLookup } from "../../../campus-administration/src/services/CampusOptionsService";
import { AppError } from "../../../shared/src/errors/AppError";
import { ActivityStatus, CampusStructuredOptionType } from "../../../shared/src/domain/enums";
import { type ActivityCancelledEvent } from "../../../shared/src/events/EventBus";

export interface ActivityRepositoryPort {
  create(payload: Partial<Activity>): Activity;
  save(activity: Activity): Promise<Activity>;
  findOne(options: any): Promise<Activity | null>;
  remove(activity: Activity): Promise<Activity>;
}

export interface ActivityEventDispatcherPort {
  dispatch(eventName: string, payload: any): Promise<void>;
}

export class ActivityLifecycleService {
  constructor(
    private activityRepo: ActivityRepositoryPort,
    private campusStructuredOptionLookup: CampusStructuredOptionLookup,
    private eventDispatcher: ActivityEventDispatcherPort
  ) {}

  async createActivity(
    hostAccountId: string,
    campusId: string,
    data: Partial<Activity>
  ): Promise<Activity> {
    const categoryId = data.categoryId;
    const meetingPointId = data.meetingPointId;

    if (!categoryId) {
      throw AppError.validation("Request validation failed", [
        {
          field: "categoryId",
          message: "is required",
          code: "required"
        }
      ]);
    }

    if (!meetingPointId) {
      throw AppError.validation("Request validation failed", [
        {
          field: "meetingPointId",
          message: "is required",
          code: "required"
        }
      ]);
    }

    const category = await this.campusStructuredOptionLookup.findSelectableOption(
      campusId,
      categoryId,
      CampusStructuredOptionType.ActivityCategory
    );

    if (!category) {
      throw AppError.validation("Request validation failed", [
        {
          field: "categoryId",
          message: "must reference an active activity category for the selected campus",
          code: "invalid_category_option"
        }
      ]);
    }

    const meetingPoint = await this.campusStructuredOptionLookup.findSelectableOption(
      campusId,
      meetingPointId,
      CampusStructuredOptionType.CampusLocation
    );

    if (!meetingPoint) {
      throw AppError.validation("Request validation failed", [
        {
          field: "meetingPointId",
          message: "must reference an active campus location for the selected campus",
          code: "invalid_meeting_point_option"
        }
      ]);
    }

    const activity = this.activityRepo.create({
      ...data,
      campusId,
      hostAccountId,
      categoryId,
      meetingPointId,
      categoryLabel: category.name,
      meetingPointLabel: meetingPoint.name,
      status: ActivityStatus.Open
    });

    return await this.activityRepo.save(activity);
  }

  async updateActivityStatus(
    hostAccountId: string,
    campusId: string,
    activityId: string,
    newStatus: ActivityStatus
  ): Promise<Activity> {
    const activity = await this.activityRepo.findOne({ where: { activityId } });
    
    if (!activity) throw AppError.notFound("Activity", activityId);
    if (activity.campusId !== campusId) throw AppError.notFound("Activity", activityId);
    if (activity.hostAccountId !== hostAccountId) {
      throw new AppError("AUTH_REQUIRED", "Only the host can update the activity status", 403);
    }

    if (newStatus !== ActivityStatus.Completed && newStatus !== ActivityStatus.Cancelled) {
      throw AppError.validation("Invalid status update", [
        { field: "status", message: "Can only update to completed or cancelled", code: "invalid_status" }
      ]);
    }

    activity.status = newStatus;
    const savedActivity = await this.activityRepo.save(activity);

    if (newStatus === ActivityStatus.Cancelled) {
      const eventPayload: ActivityCancelledEvent = {
        eventId: randomUUID(),
        eventType: "ActivityCancelled",
        occurredAt: new Date().toISOString(),
        activityId: activity.activityId,
        triggeringAccountId: activity.hostAccountId,
        outcome: "cancelled"
      };

      await this.eventDispatcher.dispatch("ActivityCancelled", eventPayload);
    }

    return savedActivity;
  }

  async deleteActivity(hostAccountId: string, campusId: string, activityId: string): Promise<void> {
    const activity = await this.activityRepo.findOne({ where: { activityId } });
    
    if (!activity) throw AppError.notFound("Activity", activityId);
    if (activity.campusId !== campusId) throw AppError.notFound("Activity", activityId);
    if (activity.hostAccountId !== hostAccountId) throw new AppError("AUTH_REQUIRED", "Only the host can delete the activity", 403);

    if (new Date() >= activity.scheduledDateTime) {
      throw AppError.conflict("Cannot delete an activity that has already started", "Activity");
    }

    await this.activityRepo.remove(activity);
  }
}
