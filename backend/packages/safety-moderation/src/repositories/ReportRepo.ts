import { DataSource, Repository } from "typeorm";

import { ReportRecord } from "../entities/ReportRecord";
import { ReportTargetType } from "../../../shared/src/domain/enums";

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

  public async hasExistingReport(
    reporterAccountId: string,
    targetType: ReportTargetType,
    targetAccountId: string | null,
    targetActivityId: string | null
  ): Promise<boolean> {
    const count = await this.count({
      where: {
        reporterAccountId,
        targetType,
        targetAccountId: targetAccountId ?? undefined,
        targetActivityId: targetActivityId ?? undefined
      }
    });
    return count > 0;
  }

  public instantiate(payload: Partial<ReportRecord>): ReportRecord {
    return this.create(payload);
  }

  public async persist(reportRecord: ReportRecord): Promise<ReportRecord> {
    return await this.save(reportRecord);
  }
}
