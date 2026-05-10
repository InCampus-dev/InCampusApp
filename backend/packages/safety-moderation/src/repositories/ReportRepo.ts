import { DataSource, Repository } from "typeorm";

import { ReportRecord } from "../entities/ReportRecord";

export class ReportRepo extends Repository<ReportRecord> {
  constructor(dataSource: DataSource) {
    super(ReportRecord, dataSource.createEntityManager());
  }
}
