import { BlockRepo } from "../repositories/BlockRepo";

export interface BlockStateReader {
  hasBlockBetween(accountA: string, accountB: string): Promise<boolean>;
}

export class BlockEnforcementService implements BlockStateReader {
  constructor(
    private readonly blockRepo: Pick<BlockRepo, "hasBlockBetween">
  ) {}

  public async hasBlockBetween(accountA: string, accountB: string): Promise<boolean> {
    const normalizedAccountA = normalizeAccountId(accountA);
    const normalizedAccountB = normalizeAccountId(accountB);

    if (!normalizedAccountA || !normalizedAccountB || normalizedAccountA === normalizedAccountB) {
      return false;
    }

    return await this.blockRepo.hasBlockBetween(normalizedAccountA, normalizedAccountB);
  }
}

function normalizeAccountId(accountId: string): string | null {
  if (typeof accountId !== "string") {
    return null;
  }

  const normalizedAccountId = accountId.trim();

  return normalizedAccountId.length === 0 ? null : normalizedAccountId;
}
