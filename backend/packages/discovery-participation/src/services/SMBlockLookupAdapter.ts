import type { BlockRelationship } from "../../../safety-moderation/src/entities/BlockRelationship";
import type { BlockRepo } from "../../../safety-moderation/src/repositories/BlockRepo";
import type { BlockLookupPort } from "./FeedService";

export class SMBlockLookupAdapter implements BlockLookupPort {
  constructor(private readonly blockRepo: Pick<BlockRepo, "find">) {}

  public async getBlockedAndBlockerIds(studentAccountId: string): Promise<string[]> {
    const normalizedStudentAccountId = normalizeStudentAccountId(studentAccountId);

    if (!normalizedStudentAccountId) {
      return [];
    }

    const blockRelationships = await this.blockRepo.find({
      where: [
        { initiatorAccountId: normalizedStudentAccountId },
        { blockedAccountId: normalizedStudentAccountId }
      ]
    });

    const counterpartIds = new Set<string>();

    for (const blockRelationship of blockRelationships) {
      addCounterpartId(counterpartIds, normalizedStudentAccountId, blockRelationship);
    }

    return [...counterpartIds];
  }
}

function normalizeStudentAccountId(studentAccountId: string): string | null {
  if (typeof studentAccountId !== "string") {
    return null;
  }

  const normalizedStudentAccountId = studentAccountId.trim();

  return normalizedStudentAccountId.length > 0 ? normalizedStudentAccountId : null;
}

function addCounterpartId(
  counterpartIds: Set<string>,
  studentAccountId: string,
  blockRelationship: Pick<BlockRelationship, "initiatorAccountId" | "blockedAccountId">
): void {
  if (
    blockRelationship.initiatorAccountId === studentAccountId &&
    blockRelationship.blockedAccountId !== studentAccountId
  ) {
    counterpartIds.add(blockRelationship.blockedAccountId);
  }

  if (
    blockRelationship.blockedAccountId === studentAccountId &&
    blockRelationship.initiatorAccountId !== studentAccountId
  ) {
    counterpartIds.add(blockRelationship.initiatorAccountId);
  }
}
