import { DataSource, Repository } from "typeorm";
import { Participation } from "../entities/Participation";

export class ParticipationRepo {
  private repo: Repository<Participation>;

  constructor(private dataSource: DataSource) {
    this.repo = this.dataSource.getRepository(Participation);
  }

  // Metodo usato da ActivityModerationCommandHandler per la hard-delete a cascata
  async deleteByActivityId(activityId: string): Promise<void> {
    await this.repo.delete({ activityId });
  }
}