import { DataSource, Repository } from "typeorm";

import { BlockRelationship } from "../entities/BlockRelationship";

export class BlockRepo extends Repository<BlockRelationship> {
  constructor(dataSource: DataSource) {
    super(BlockRelationship, dataSource.createEntityManager());
  }

  public async findByDirectedPair(
    initiatorAccountId: string,
    blockedAccountId: string
  ): Promise<BlockRelationship | null> {
    return await this.findOne({
      where: {
        initiatorAccountId,
        blockedAccountId
      }
    });
  }

  public async hasBlockBetween(accountA: string, accountB: string): Promise<boolean> {
    const count = await this.createQueryBuilder("block")
      .where(
        `
          (block.initiatorAccountId = :accountA AND block.blockedAccountId = :accountB)
          OR
          (block.initiatorAccountId = :accountB AND block.blockedAccountId = :accountA)
        `,
        {
          accountA,
          accountB
        }
      )
      .getCount();

    return count > 0;
  }

  public instantiate(payload: Partial<BlockRelationship>): BlockRelationship {
    return this.create(payload);
  }

  public async persist(blockRelationship: BlockRelationship): Promise<BlockRelationship> {
    return await this.save(blockRelationship);
  }
}
