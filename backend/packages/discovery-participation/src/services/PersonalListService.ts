import { DataSource } from "typeorm";
import { Activity } from "../../../hosting-lifecycle/src/entities/Activity";
import { ParticipationStatus } from "../../../shared/src/domain/enums";

export class PersonalListService {
  constructor(private dataSource: DataSource) {}

  async getPersonalActivities(studentAccountId: string, campusId: string): Promise<Activity[]> {
    const activityRepo = this.dataSource.getRepository(Activity);
    
    return await activityRepo.createQueryBuilder("activity")
      .leftJoin("activity.participations", "participation")
      .where("activity.campusId = :campusId", { campusId })
      .andWhere(
        "(activity.hostAccountId = :studentAccountId OR (participation.studentAccountId = :studentAccountId AND participation.status IN (:...statuses)))",
        { studentAccountId, statuses: [ParticipationStatus.Pending, ParticipationStatus.Confirmed] }
      )
      .orderBy("activity.scheduledDateTime", "ASC")
      .getMany();
  }
}