import { randomUUID } from "crypto";
import { Activity } from "../entities/Activity";
import { CampusStructuredOptionLookup } from "../../../campus-administration/src/services/CampusOptionsService";
import { AppError } from "../../../shared/src/errors/AppError";
import {
  ActivityStatus,
  CampusStructuredOptionType,
  GenderPreference,
  ParticipationMode
} from "../../../shared/src/domain/enums";
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
    const validationIssues = validateCreateActivityData(data);

    if (!categoryId) {
      validationIssues.push({
        field: "categoryId",
        message: "is required",
        code: "required"
      });
    }

    if (!meetingPointId) {
      validationIssues.push({
        field: "meetingPointId",
        message: "is required",
        code: "required"
      });
    }

    if (validationIssues.length > 0) {
      throw AppError.validation("Request validation failed", validationIssues);
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
      throw new AppError("AUTH_FORBIDDEN", "Only the host can update the activity status", 403, {
        authReason: "not_activity_host"
      });
    }

    if (newStatus !== ActivityStatus.Completed && newStatus !== ActivityStatus.Cancelled) {
      throw AppError.validation("Invalid status update", [
        { field: "status", message: "Can only update to completed or cancelled", code: "invalid_status" }
      ]);
    }

    if (activity.status === ActivityStatus.Completed || activity.status === ActivityStatus.Cancelled) {
      throw AppError.conflict(
        `Cannot update activity status from ${activity.status} to ${newStatus}`,
        "Activity"
      );
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
    if (activity.hostAccountId !== hostAccountId) {
      throw new AppError("AUTH_FORBIDDEN", "Only the host can delete the activity", 403, {
        authReason: "not_activity_host"
      });
    }

    if (new Date() >= activity.scheduledDateTime) {
      throw AppError.conflict("Cannot delete an activity that has already started", "Activity");
    }

    await this.activityRepo.remove(activity);
  }
}

function validateCreateActivityData(
  data: Partial<Activity>
): Array<{ field: string; message: string; code: string }> {
  const validationIssues: Array<{ field: string; message: string; code: string }> = [];

  if (typeof data.title !== "string" || data.title.trim().length === 0) {
    validationIssues.push({
      field: "title",
      message: "is required",
      code: "required"
    });
  }

  if (!isValidDate(data.scheduledDateTime)) {
    validationIssues.push({
      field: "scheduledDateTime",
      message: "must be a valid date",
      code: "invalid_date"
    });
  } else if (data.scheduledDateTime.getTime() <= Date.now()) {
    validationIssues.push({
      field: "scheduledDateTime",
      message: "must be in the future",
      code: "must_be_future"
    });
  }

  if (
    data.scheduledEndDateTime !== undefined &&
    data.scheduledEndDateTime !== null
  ) {
    if (!isValidDate(data.scheduledEndDateTime)) {
      validationIssues.push({
        field: "scheduledEndDateTime",
        message: "must be a valid date",
        code: "invalid_date"
      });
    } else if (
      isValidDate(data.scheduledDateTime) &&
      data.scheduledEndDateTime.getTime() <= data.scheduledDateTime.getTime()
    ) {
      validationIssues.push({
        field: "scheduledEndDateTime",
        message: "must be after scheduledDateTime",
        code: "must_be_after_start"
      });
    }
  }

  if (!isPositiveInteger(data.maxParticipants)) {
    validationIssues.push({
      field: "maxParticipants",
      message: "must be a positive integer",
      code: "positive_integer_required"
    });
  }

  if (
    data.maxRequests !== undefined &&
    data.maxRequests !== null &&
    !isPositiveInteger(data.maxRequests)
  ) {
    validationIssues.push({
      field: "maxRequests",
      message: "must be a positive integer when provided",
      code: "positive_integer_required"
    });
  }

  if (!isEnumValue(ParticipationMode, data.participationMode)) {
    validationIssues.push({
      field: "participationMode",
      message: "must be a valid participation mode",
      code: "invalid_participation_mode"
    });
  }

  if (!isEnumValue(GenderPreference, data.genderPreference)) {
    validationIssues.push({
      field: "genderPreference",
      message: "must be a valid gender preference",
      code: "invalid_gender_preference"
    });
  }

  return validationIssues;
}

function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isEnumValue<T extends Record<string, string>>(
  enumObject: T,
  value: unknown
): value is T[keyof T] {
  return typeof value === "string" && Object.values(enumObject).includes(value);
}
