import { Activity } from "../entities/Activity";
import { CampusStructuredOptionLookup } from "../../../campus-administration/src/services/CampusOptionsService";
import { AppError } from "../../../shared/src/errors/AppError";
import { ActivityStatus, CampusStructuredOptionType } from "../../../shared/src/domain/enums";

export interface ActivityRepositoryPort {
  create(payload: Partial<Activity>): Activity;
  save(activity: Activity): Promise<Activity>;
}

export class ActivityLifecycleService {
  constructor(
    private activityRepo: ActivityRepositoryPort,
    private campusStructuredOptionLookup: CampusStructuredOptionLookup
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
}
