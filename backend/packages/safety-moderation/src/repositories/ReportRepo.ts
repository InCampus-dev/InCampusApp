import { DataSource, Repository } from "typeorm";

import { ReportRecord } from "../entities/ReportRecord";

export class ReportRepo extends Repository<ReportRecord> {
  constructor(dataSource: DataSource) {
    super(ReportRecord, dataSource.createEntityManager());
  }

  public async findByCampus(campusId: string): Promise<ReportRecord[]> {
    return await this.find({
      where: { campusId },
      order: {
        submittedAt: "DESC"
      }
    });
  }

  public async findByCampusAndReportId(
    campusId: string,
    reportId: string
  ): Promise<ReportRecord | null> {
    return await this.findOne({
      where: {
        campusId,
        reportId
      }
    });
  }

  public instantiate(payload: Partial<ReportRecord>): ReportRecord {
    return this.create(payload);
  }

  public async persist(reportRecord: ReportRecord): Promise<ReportRecord> {
    return await this.save(reportRecord);
  }
}
