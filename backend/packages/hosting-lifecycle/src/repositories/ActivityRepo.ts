import { DataSource, Repository } from "typeorm";
import { Activity } from "../entities/Activity";

export class ActivityRepo extends Repository<Activity> {
  constructor(private dataSource: DataSource) {
    super(Activity, dataSource.createEntityManager());
  }

  // Business-specific methods (e.g., findAvailableActivities) will go here or in D&P
}