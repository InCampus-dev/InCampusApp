// Task: NSF02 | Path: backend/packages/notifications-system-flow/src/services/BlockSuppressionService.ts

import { Repository } from "typeorm";

/**
 * Checks DS-SM-001 (BlockRelationship) for block-based notification suppression.
 * System Invariant Rule 2: all cross-user notifications must be suppressed
 * if a block relationship exists between trigger and recipient.
 * NSF reads DS-SM-001 but never writes it (SM ownership).
 */
export class BlockSuppressionService {
  constructor(
    private readonly blockRepo: Repository<any> // DS-SM-001 (read-only by NSF)
  ) {}

  /**
   * Returns true if notification should be suppressed (block exists in either direction).
   */
  public async shouldSuppress(
    triggeringAccountId: string,
    recipientAccountId: string
  ): Promise<boolean> {
    const block = await this.blockRepo.findOne({
      where: [
        { initiatorAccountId: triggeringAccountId, blockedAccountId: recipientAccountId },
        { initiatorAccountId: recipientAccountId, blockedAccountId: triggeringAccountId },
      ],
    });
    return block !== null;
  }
}
