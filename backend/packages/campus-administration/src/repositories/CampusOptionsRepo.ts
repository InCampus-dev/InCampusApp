import { DataSource, Repository } from "typeorm";

import { CampusStructuredOptionType } from "../../../shared/src/domain/enums";
import { CampusStructuredOption } from "../entities/CampusStructuredOption";

export interface FindCampusStructuredOptionsArgs {
  campusId: string;
  optionType?: CampusStructuredOptionType;
  includeInactive?: boolean;
}

export class CampusOptionsRepo extends Repository<CampusStructuredOption> {
  constructor(dataSource: DataSource) {
    super(CampusStructuredOption, dataSource.createEntityManager());
  }

  public async findByCampus(args: FindCampusStructuredOptionsArgs): Promise<CampusStructuredOption[]> {
    const queryBuilder = this.createQueryBuilder("option")
      .where("option.campusId = :campusId", { campusId: args.campusId })
      .orderBy("option.name", "ASC");

    if (args.optionType) {
      queryBuilder.andWhere("option.optionType = :optionType", { optionType: args.optionType });
    }

    if (!args.includeInactive) {
      queryBuilder.andWhere("option.isActive = :isActive", { isActive: true });
    }

    return await queryBuilder.getMany();
  }

  public async findByCampusAndOptionId(
    campusId: string,
    optionId: string
  ): Promise<CampusStructuredOption | null> {
    return await this.findOne({ where: { campusId, optionId } });
  }

  public async findByCampusTypeAndName(
    campusId: string,
    optionType: CampusStructuredOptionType,
    name: string
  ): Promise<CampusStructuredOption | null> {
    return await this.findOne({ where: { campusId, optionType, name } });
  }

  public async findSelectableOption(
    campusId: string,
    optionId: string,
    optionType: CampusStructuredOptionType
  ): Promise<CampusStructuredOption | null> {
    return await this.findOne({ where: { campusId, optionId, optionType, isActive: true } });
  }

  public instantiate(option: Partial<CampusStructuredOption>): CampusStructuredOption {
    return this.create(option);
  }

  public async persist(option: CampusStructuredOption): Promise<CampusStructuredOption> {
    return await this.save(option);
  }
}
