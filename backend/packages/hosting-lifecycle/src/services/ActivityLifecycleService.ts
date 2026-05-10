import { DataSource } from "typeorm";
import { Activity } from "../entities/Activity";
import { ActivityRepo } from "../repositories/ActivityRepo";
import { CampusStructuredOptionType, ActivityStatus } from "../../../shared/src/domain/enums";

export class ActivityLifecycleService {
  constructor(
    private dataSource: DataSource,
    private activityRepo: ActivityRepo
  ) {}

  async createActivity(
    hostAccountId: string,
    campusId: string,
    data: Partial<Activity>
  ): Promise<Activity> {
    // 1. Verify that the chosen category exists and is active for this campus
    // Note: Adjust column names (e.g., "optionId" vs "option_id") based on your TypeORM naming strategy
    const [category] = await this.dataSource.query(
      `SELECT name, "isActive" FROM campus_structured_options WHERE "optionId" = $1 AND "optionType" = $2 AND "campusId" = $3`,
      [data.categoryId, CampusStructuredOptionType.ActivityCategory, campusId]
    );

    if (!category) {
      throw new Error("Invalid category ID or category does not belong to this campus");
    }
    if (!category.isActive) {
      throw new Error("The selected activity category is no longer active");
    }

    // 2. Verify that the chosen meeting point exists and is active for this campus
    const [meetingPoint] = await this.dataSource.query(
      `SELECT name, "isActive" FROM campus_structured_options WHERE "optionId" = $1 AND "optionType" = $2 AND "campusId" = $3`,
      [data.meetingPointId, CampusStructuredOptionType.CampusLocation, campusId]
    );

    if (!meetingPoint) {
      throw new Error("Invalid meeting point ID or meeting point does not belong to this campus");
    }
    if (!meetingPoint.isActive) {
      throw new Error("The selected meeting point is no longer active");
    }

    // 3. Create the Activity entity using the snapshot labels (NFR-13 / Data Model Rules)
    const activity = this.activityRepo.create({
      ...data,
      campusId,
      hostAccountId,
      categoryLabel: category.name, // Snapshot
      meetingPointLabel: meetingPoint.name, // Snapshot
      status: ActivityStatus.Open,
    });

    // 4. Save to database
    return await this.activityRepo.save(activity);
  }
}