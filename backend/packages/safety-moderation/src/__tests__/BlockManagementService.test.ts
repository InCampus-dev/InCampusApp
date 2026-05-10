import { describe, expect, it } from "vitest";

import { BlockRelationship } from "../entities/BlockRelationship";
import { BlockManagementService } from "../services/BlockManagementService";

describe("BlockManagementService", () => {
  it("creates a new block relationship", async () => {
    const store = createBlockStore();
    const dispatcherCalls: Array<{
      blockId: string;
      initiatorAccountId: string;
      blockedAccountId: string;
    }> = [];
    const service = createBlockManagementService(store, {
      existingAccounts: ["9f099ece-e43b-4b57-bf21-ac091852626d"],
      dispatcherCalls
    });

    const blockRelationship = await service.createBlock(
      "d6bd41f5-8750-43da-adc2-c5ed8ae17d58",
      {
        targetAccountId: "9f099ece-e43b-4b57-bf21-ac091852626d"
      }
    );

    expect(blockRelationship.alreadyExisted).toBe(false);
    expect(blockRelationship.initiatorAccountId).toBe(
      "d6bd41f5-8750-43da-adc2-c5ed8ae17d58"
    );
    expect(blockRelationship.blockedAccountId).toBe("9f099ece-e43b-4b57-bf21-ac091852626d");
    expect(store).toHaveLength(1);
    expect(dispatcherCalls).toEqual([
      {
        blockId: blockRelationship.blockId,
        initiatorAccountId: "d6bd41f5-8750-43da-adc2-c5ed8ae17d58",
        blockedAccountId: "9f099ece-e43b-4b57-bf21-ac091852626d"
      }
    ]);
  });

  it("rejects self-block attempts", async () => {
    const service = createBlockManagementService(createBlockStore(), {
      existingAccounts: ["d6bd41f5-8750-43da-adc2-c5ed8ae17d58"]
    });

    await expect(
      service.createBlock("d6bd41f5-8750-43da-adc2-c5ed8ae17d58", {
        targetAccountId: "d6bd41f5-8750-43da-adc2-c5ed8ae17d58"
      })
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR"
    });
  });

  it("returns idempotent success for duplicate directed blocks", async () => {
    const existingBlockRelationship = createBlockRelationship({
      blockId: "6da9e1cc-8ef6-4205-b872-854b7d4e68e3",
      initiatorAccountId: "d6bd41f5-8750-43da-adc2-c5ed8ae17d58",
      blockedAccountId: "9f099ece-e43b-4b57-bf21-ac091852626d"
    });
    const store = createBlockStore(existingBlockRelationship);
    const dispatcherCalls: Array<{
      blockId: string;
      initiatorAccountId: string;
      blockedAccountId: string;
    }> = [];
    const service = createBlockManagementService(store, {
      existingAccounts: ["9f099ece-e43b-4b57-bf21-ac091852626d"],
      dispatcherCalls
    });

    const blockRelationship = await service.createBlock(
      "d6bd41f5-8750-43da-adc2-c5ed8ae17d58",
      {
        targetAccountId: "9f099ece-e43b-4b57-bf21-ac091852626d"
      }
    );

    expect(blockRelationship).toEqual({
      blockId: "6da9e1cc-8ef6-4205-b872-854b7d4e68e3",
      initiatorAccountId: "d6bd41f5-8750-43da-adc2-c5ed8ae17d58",
      blockedAccountId: "9f099ece-e43b-4b57-bf21-ac091852626d",
      createdAt: "2026-05-10T00:00:00.000Z",
      alreadyExisted: true
    });
    expect(store).toHaveLength(1);
    expect(dispatcherCalls).toHaveLength(0);
  });

  it("rejects unknown target accounts when the lookup says they do not exist", async () => {
    const service = createBlockManagementService(createBlockStore(), {
      existingAccounts: []
    });

    await expect(
      service.createBlock("d6bd41f5-8750-43da-adc2-c5ed8ae17d58", {
        targetAccountId: "9f099ece-e43b-4b57-bf21-ac091852626d"
      })
    ).rejects.toMatchObject({
      code: "NOT_FOUND"
    });
  });
});

function createBlockManagementService(
  store: BlockRelationship[],
  options: {
    existingAccounts: string[];
    dispatcherCalls?: Array<{
      blockId: string;
      initiatorAccountId: string;
      blockedAccountId: string;
    }>;
  }
) {
  return new BlockManagementService(
    {
      async findByDirectedPair(initiatorAccountId: string, blockedAccountId: string) {
        return (
          store.find(
            (blockRelationship) =>
              blockRelationship.initiatorAccountId === initiatorAccountId &&
              blockRelationship.blockedAccountId === blockedAccountId
          ) ?? null
        );
      },
      instantiate(payload: Partial<BlockRelationship>) {
        return createBlockRelationship(payload);
      },
      async persist(blockRelationship: BlockRelationship) {
        const existingBlockRelationshipIndex = store.findIndex(
          (existingBlockRelationship) => existingBlockRelationship.blockId === blockRelationship.blockId
        );

        if (existingBlockRelationshipIndex >= 0) {
          store[existingBlockRelationshipIndex] = blockRelationship;
          return blockRelationship;
        }

        store.push(blockRelationship);
        return blockRelationship;
      }
    },
    {
      async exists(studentAccountId: string) {
        return options.existingAccounts.includes(studentAccountId);
      }
    },
    {
      async handleNewBlock(args) {
        options.dispatcherCalls?.push(args);
      }
    }
  );
}

function createBlockStore(
  ...blockRelationships: BlockRelationship[]
): BlockRelationship[] {
  return [...blockRelationships];
}

function createBlockRelationship(
  overrides: Partial<BlockRelationship> = {}
): BlockRelationship {
  return {
    blockId: "b676c742-3ed7-4715-bf43-e5f61ce60d84",
    initiatorAccountId: "d6bd41f5-8750-43da-adc2-c5ed8ae17d58",
    blockedAccountId: "9f099ece-e43b-4b57-bf21-ac091852626d",
    createdAt: new Date("2026-05-10T00:00:00.000Z"),
    ...overrides
  };
}
