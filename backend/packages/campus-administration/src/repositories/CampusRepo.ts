import { DataSource, Repository } from "typeorm";

import { Campus } from "../entities/Campus";

export class CampusRepo extends Repository<Campus> {
  constructor(dataSource: DataSource) {
    super(Campus, dataSource.createEntityManager());
  }

  public async findByCampusId(campusId: string): Promise<Campus | null> {
    return await this.findOne({ where: { campusId } });
  }
}
