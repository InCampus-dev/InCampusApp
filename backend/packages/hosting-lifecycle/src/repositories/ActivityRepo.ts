import { DataSource, Repository } from "typeorm";
import { Activity } from "../entities/Activity";

export class ActivityRepo {
  private repo: Repository<Activity>;

  constructor(private dataSource: DataSource) {
    this.repo = this.dataSource.getRepository(Activity);
  }

  // Metodi usati da ActivityLifecycleService
  create(payload: Partial<Activity>): Activity {
    return this.repo.create(payload);
  }

  async save(activity: Activity): Promise<Activity> {
    return await this.repo.save(activity);
  }

  async findOne(options: any): Promise<Activity | null> {
    return await this.repo.findOne(options);
  }

  async remove(activity: Activity): Promise<Activity> {
    return await this.repo.remove(activity);
  }

  // Metodi usati da ActivityModerationCommandHandler
  async findById(activityId: string): Promise<Activity | null> {
    return await this.repo.findOne({ where: { activityId } });
  }

  async delete(activityId: string): Promise<void> {
    await this.repo.delete(activityId);
  }
}