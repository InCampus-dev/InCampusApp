import { describe, expect, it } from "vitest";

import { BlockEnforcementService } from "../services/BlockEnforcementService";

describe("BlockEnforcementService", () => {
  it("treats a directed block relationship as reciprocal when checking access", async () => {
    const storedBlockRelationships = [
      {
        initiatorAccountId: "d6bd41f5-8750-43da-adc2-c5ed8ae17d58",
        blockedAccountId: "9f099ece-e43b-4b57-bf21-ac091852626d"
      }
    ];
    const service = new BlockEnforcementService({
      async hasBlockBetween(accountA: string, accountB: string) {
        return storedBlockRelationships.some(
          (blockRelationship) =>
            (blockRelationship.initiatorAccountId === accountA &&
              blockRelationship.blockedAccountId === accountB) ||
            (blockRelationship.initiatorAccountId === accountB &&
              blockRelationship.blockedAccountId === accountA)
        );
      }
    });

    await expect(
      service.hasBlockBetween(
        "d6bd41f5-8750-43da-adc2-c5ed8ae17d58",
        "9f099ece-e43b-4b57-bf21-ac091852626d"
      )
    ).resolves.toBe(true);
    await expect(
      service.hasBlockBetween(
        "9f099ece-e43b-4b57-bf21-ac091852626d",
        "d6bd41f5-8750-43da-adc2-c5ed8ae17d58"
      )
    ).resolves.toBe(true);
    await expect(
      service.hasBlockBetween(
        "d6bd41f5-8750-43da-adc2-c5ed8ae17d58",
        "f10d5a9c-1d98-4c4c-a8be-ed3951d560ef"
      )
    ).resolves.toBe(false);
  });
});
