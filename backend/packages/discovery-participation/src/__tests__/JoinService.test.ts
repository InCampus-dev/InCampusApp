import { describe, it, expect, beforeEach, afterEach, vi, Mock } from "vitest";
import { FindOperator } from "typeorm";
import type { BlockRelationship } from "../../../safety-moderation/src/entities/BlockRelationship";
import { JoinService } from "../services/JoinService";
import { ActivityStatus, ParticipationMode, ParticipationRecordType, ParticipationStatus } from "../../../shared/src/domain/enums";
import { executeTransaction, findWithPessimisticWriteLock } from "../../../shared/src/db/transaction";
import { SMBlockLookupAdapter } from "../services/SMBlockLookupAdapter";

// Mock dei transaction helper del database
vi.mock("../../../shared/src/db/transaction", () => ({
  executeTransaction: vi.fn(),
  findWithPessimisticWriteLock: vi.fn(),
}));

describe("JoinService", () => {
  let joinService: JoinService;
  let mockDataSource: any;
  let mockBlockLookup: any;
  let mockEventDispatcher: any;
  let mockManager: any;

  beforeEach(() => {
    // Simuliamo il manager di TypeORM all'interno della transazione
    mockManager = {
      findOne: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
    };

    mockDataSource = {}; 

    // Simuliamo l'esecuzione della transazione passandogli subito il nostro mockManager
    (executeTransaction as Mock).mockImplementation(async (ds, cb) => {
      return await cb(mockManager);
    });

    mockBlockLookup = {
      getBlockedAndBlockerIds: vi.fn().mockResolvedValue([]),
    };

    mockEventDispatcher = {
      dispatch: vi.fn().mockResolvedValue(undefined),
    };

    joinService = new JoinService(mockDataSource, mockBlockLookup, mockEventDispatcher);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should successfully directly join an open activity", async () => {
    const activity = {
      activityId: "act-1",
      campusId: "camp-1",
      hostAccountId: "host-1",
      status: ActivityStatus.Open,
      participationMode: ParticipationMode.Open,
      currentParticipantCount: 0,
      maxParticipants: 5,
    };

    (findWithPessimisticWriteLock as Mock).mockResolvedValue(activity);
    mockManager.findOne.mockResolvedValue(null); // Nessuna partecipazione esistente
    
    const mockParticipation = { participationId: "part-1" } as any;
    mockManager.create.mockReturnValue(mockParticipation);
    mockManager.save.mockImplementation(async (entity: any, instance: any) => instance || mockParticipation);

    const result = await joinService.joinActivity("student-1", "camp-1", "act-1");

    expect(result).toBe(mockParticipation);
    expect(mockParticipation.recordType).toBe(ParticipationRecordType.Participation);
    expect(mockParticipation.status).toBe(ParticipationStatus.Confirmed);
    expect(activity.currentParticipantCount).toBe(1); // Incrementato atomicamente!
    expect(mockEventDispatcher.dispatch).toHaveBeenCalledWith("DirectJoinCompleted", expect.any(Object));
  });

  it("marks an open activity full when the final guest slot is taken", async () => {
    const activity = {
      activityId: "act-1",
      campusId: "camp-1",
      hostAccountId: "host-1",
      status: ActivityStatus.Open,
      participationMode: ParticipationMode.Open,
      currentParticipantCount: 0,
      maxParticipants: 2,
    };

    (findWithPessimisticWriteLock as Mock).mockResolvedValue(activity);
    mockManager.findOne.mockResolvedValue(null);

    const mockParticipation = { participationId: "part-1" } as any;
    mockManager.create.mockReturnValue(mockParticipation);
    mockManager.save.mockImplementation(async (entity: any, instance: any) => instance || mockParticipation);

    await joinService.joinActivity("student-1", "camp-1", "act-1");

    expect(activity.currentParticipantCount).toBe(1);
    expect(activity.status).toBe(ActivityStatus.Full);
  });

  it("should successfully submit a join request for an approval-based activity", async () => {
    const activity = {
      activityId: "act-2",
      campusId: "camp-1",
      hostAccountId: "host-1",
      status: ActivityStatus.Open,
      participationMode: ParticipationMode.ApprovalBased,
      currentParticipantCount: 0,
      maxParticipants: 5,
      currentRequestCount: 0,
      maxRequests: 10,
    };

    (findWithPessimisticWriteLock as Mock).mockResolvedValue(activity);
    mockManager.findOne.mockResolvedValue(null);
    
    const mockParticipation = { participationId: "part-2" } as any;
    mockManager.create.mockReturnValue(mockParticipation);
    mockManager.save.mockImplementation(async (entity: any, instance: any) => instance || mockParticipation);

    await joinService.joinActivity("student-1", "camp-1", "act-2");

    expect(mockParticipation.recordType).toBe(ParticipationRecordType.Request);
    expect(mockParticipation.status).toBe(ParticipationStatus.Pending);
    expect(activity.currentRequestCount).toBe(1);
    expect(mockEventDispatcher.dispatch).toHaveBeenCalledWith("JoinRequestSubmitted", expect.any(Object));
  });

  it("should fail if activity is not found", async () => {
    (findWithPessimisticWriteLock as Mock).mockResolvedValue(null);
    await expect(joinService.joinActivity("student-1", "camp-1", "act-1")).rejects.toThrow();
  });

  it("should fail if campusId does not match (cross-campus isolation)", async () => {
    (findWithPessimisticWriteLock as Mock).mockResolvedValue({
      activityId: "act-1",
      campusId: "camp-2", // Campus differente dal 'camp-1' della richiesta
    });
    await expect(joinService.joinActivity("student-1", "camp-1", "act-1")).rejects.toThrow();
  });

  it("should fail with opaque not-found if host is blocked by the student or vice-versa", async () => {
    const activity = { activityId: "act-1", campusId: "camp-1", hostAccountId: "host-1" };
    (findWithPessimisticWriteLock as Mock).mockResolvedValue(activity);
    mockBlockLookup.getBlockedAndBlockerIds.mockResolvedValue(["host-1"]);

    // Il sistema deve ritornare un errore prima di far scoprire all'utente che è bloccato
    await expect(joinService.joinActivity("student-1", "camp-1", "act-1")).rejects.toThrow();
  });

  it("blocks join when the real SM lookup finds a reciprocal block relationship", async () => {
    const activity = { activityId: "act-1", campusId: "camp-1", hostAccountId: "host-1" };
    const realBlockLookup = new SMBlockLookupAdapter({
      find: vi.fn().mockResolvedValue([
        createBlockRelationship({
          initiatorAccountId: "host-1",
          blockedAccountId: "student-1"
        })
      ])
    } as any);
    const service = new JoinService(mockDataSource, realBlockLookup, mockEventDispatcher);

    (findWithPessimisticWriteLock as Mock).mockResolvedValue(activity);

    await expect(service.joinActivity("student-1", "camp-1", "act-1")).rejects.toThrow();
  });

  it("should fail if activity is not Open", async () => {
    const activity = { activityId: "act-1", campusId: "camp-1", hostAccountId: "host-1", status: ActivityStatus.Full };
    (findWithPessimisticWriteLock as Mock).mockResolvedValue(activity);
    await expect(joinService.joinActivity("student-1", "camp-1", "act-1")).rejects.toThrow("Activity is not open for joining");
  });

  it("allows a new request when only a declined historical request exists for the same activity and student", async () => {
    const activity = {
      activityId: "act-1",
      campusId: "camp-1",
      hostAccountId: "host-1",
      status: ActivityStatus.Open,
      participationMode: ParticipationMode.ApprovalBased,
      currentParticipantCount: 0,
      maxParticipants: 5,
      currentRequestCount: 0,
      maxRequests: 10
    };
    (findWithPessimisticWriteLock as Mock).mockResolvedValue(activity);
    mockManager.findOne.mockImplementation(
      createParticipationFindOneMock([
        {
          participationId: "declined-1",
          activityId: "act-1",
          studentAccountId: "student-1",
          recordType: ParticipationRecordType.Request,
          status: ParticipationStatus.Declined
        }
      ])
    );

    const mockParticipation = { participationId: "part-3" } as any;
    mockManager.create.mockReturnValue(mockParticipation);
    mockManager.save.mockImplementation(async (entity: any, instance: any) => instance || mockParticipation);

    const result = await joinService.joinActivity("student-1", "camp-1", "act-1");

    expect(result).toBe(mockParticipation);
    expect(mockParticipation.recordType).toBe(ParticipationRecordType.Request);
    expect(mockParticipation.status).toBe(ParticipationStatus.Pending);
    expect(activity.currentRequestCount).toBe(1);
  });

  it("should fail if student already has a pending request for the activity", async () => {
    const activity = {
      activityId: "act-1",
      campusId: "camp-1",
      hostAccountId: "host-1",
      status: ActivityStatus.Open,
      participationMode: ParticipationMode.ApprovalBased,
      currentParticipantCount: 0,
      maxParticipants: 5,
      currentRequestCount: 1,
      maxRequests: 10
    };
    (findWithPessimisticWriteLock as Mock).mockResolvedValue(activity);
    mockManager.findOne.mockImplementation(
      createParticipationFindOneMock([
        {
          participationId: "pending-1",
          activityId: "act-1",
          studentAccountId: "student-1",
          recordType: ParticipationRecordType.Request,
          status: ParticipationStatus.Pending
        }
      ])
    );

    await expect(joinService.joinActivity("student-1", "camp-1", "act-1")).rejects.toThrow("already joined");
  });

  it("should fail if student already has a confirmed participation for the activity", async () => {
    const activity = {
      activityId: "act-1",
      campusId: "camp-1",
      hostAccountId: "host-1",
      status: ActivityStatus.Open,
      participationMode: ParticipationMode.Open,
      currentParticipantCount: 1,
      maxParticipants: 5
    };
    (findWithPessimisticWriteLock as Mock).mockResolvedValue(activity);
    mockManager.findOne.mockImplementation(
      createParticipationFindOneMock([
        {
          participationId: "confirmed-1",
          activityId: "act-1",
          studentAccountId: "student-1",
          recordType: ParticipationRecordType.Participation,
          status: ParticipationStatus.Confirmed
        }
      ])
    );

    await expect(joinService.joinActivity("student-1", "camp-1", "act-1")).rejects.toThrow("already joined");
  });

  it("should fail if open activity is already full", async () => {
    const activity = { activityId: "act-1", campusId: "camp-1", hostAccountId: "host-1", status: ActivityStatus.Open, participationMode: ParticipationMode.Open, currentParticipantCount: 4, maxParticipants: 5 };
    (findWithPessimisticWriteLock as Mock).mockResolvedValue(activity);
    await expect(joinService.joinActivity("student-1", "camp-1", "act-1")).rejects.toThrow("already full");
  });

  it("should fail if approval-based activity has reached max requests", async () => {
    const activity = { activityId: "act-1", campusId: "camp-1", hostAccountId: "host-1", status: ActivityStatus.Open, participationMode: ParticipationMode.ApprovalBased, currentParticipantCount: 0, maxParticipants: 20, currentRequestCount: 10, maxRequests: 10 };
    (findWithPessimisticWriteLock as Mock).mockResolvedValue(activity);
    await expect(joinService.joinActivity("student-1", "camp-1", "act-1")).rejects.toThrow("maximum number of pending requests");
  });

  it("should fail if approval-based activity has no remaining guest capacity", async () => {
    const activity = { activityId: "act-1", campusId: "camp-1", hostAccountId: "host-1", status: ActivityStatus.Open, participationMode: ParticipationMode.ApprovalBased, currentParticipantCount: 1, maxParticipants: 2, currentRequestCount: 0, maxRequests: 10 };
    (findWithPessimisticWriteLock as Mock).mockResolvedValue(activity);
    await expect(joinService.joinActivity("student-1", "camp-1", "act-1")).rejects.toThrow("already full");
  });

  it("caps pending requests by guest capacity even when maxRequests is higher", async () => {
    const activity = { activityId: "act-1", campusId: "camp-1", hostAccountId: "host-1", status: ActivityStatus.Open, participationMode: ParticipationMode.ApprovalBased, currentParticipantCount: 0, maxParticipants: 2, currentRequestCount: 1, maxRequests: 10 };
    (findWithPessimisticWriteLock as Mock).mockResolvedValue(activity);
    await expect(joinService.joinActivity("student-1", "camp-1", "act-1")).rejects.toThrow("maximum number of pending requests");
  });
});

function createBlockRelationship(
  overrides: Partial<BlockRelationship> = {}
): BlockRelationship {
  return {
    blockId: "block-001",
    initiatorAccountId: "student-1",
    blockedAccountId: "host-1",
    createdAt: new Date("2026-05-10T00:00:00.000Z"),
    ...overrides
  } as BlockRelationship;
}

function createParticipationFindOneMock(records: Array<Record<string, unknown>>) {
  return async (_entity: unknown, options: { where: Record<string, unknown> | Record<string, unknown>[] }) => {
    const whereClauses = Array.isArray(options.where) ? options.where : [options.where];

    return (
      records.find((record) =>
        whereClauses.some((whereClause) =>
          Object.entries(whereClause).every(([field, expectedValue]) =>
            matchesWhereValue(record[field], expectedValue)
          )
        )
      ) ?? null
    );
  };
}

function matchesWhereValue(actualValue: unknown, expectedValue: unknown): boolean {
  if (expectedValue instanceof FindOperator) {
    if (expectedValue.type === "not") {
      return actualValue !== expectedValue.value;
    }
    return false;
  }

  return actualValue === expectedValue;
}
