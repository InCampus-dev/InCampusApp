import { DataSource, Repository } from "typeorm";
import { Participation } from "../entities/Participation";

export class ParticipationRepo extends Repository<Participation> {
  constructor(private dataSource: DataSource) {
    super(Participation, dataSource.createEntityManager());
  }

  // Specific methods like countPendingRequests(activityId) will go here
}