import { describe, it, expect, beforeEach, afterEach, vi, Mock } from "vitest";
import { JoinService, EventDispatcherPort } from "../services/JoinService";
import { BlockLookupPort } from "../services/FeedService";
import { ActivityStatus, ParticipationMode, ParticipationRecordType, ParticipationStatus } from "../../../shared/src/domain/enums";
import { executeTransaction, findWithPessimisticWriteLock } from "../../../shared/src/db/transaction";

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

  it("should successfully submit a join request for an approval-based activity", async () => {
    const activity = {
      activityId: "act-2",
      campusId: "camp-1",
      hostAccountId: "host-1",
      status: ActivityStatus.Open,
      participationMode: ParticipationMode.ApprovalBased,
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

  it("should fail if activity is not Open", async () => {
    const activity = { activityId: "act-1", campusId: "camp-1", hostAccountId: "host-1", status: ActivityStatus.Full };
    (findWithPessimisticWriteLock as Mock).mockResolvedValue(activity);
    await expect(joinService.joinActivity("student-1", "camp-1", "act-1")).rejects.toThrow("Activity is not open for joining");
  });

  it("should fail if student has already joined or requested", async () => {
    const activity = { activityId: "act-1", campusId: "camp-1", hostAccountId: "host-1", status: ActivityStatus.Open };
    (findWithPessimisticWriteLock as Mock).mockResolvedValue(activity);
    mockManager.findOne.mockResolvedValue({ participationId: "existing-1" }); // Utente ha già joinato

    await expect(joinService.joinActivity("student-1", "camp-1", "act-1")).rejects.toThrow("already joined");
  });

  it("should fail if open activity is already full", async () => {
    const activity = { activityId: "act-1", campusId: "camp-1", hostAccountId: "host-1", status: ActivityStatus.Open, participationMode: ParticipationMode.Open, currentParticipantCount: 5, maxParticipants: 5 };
    (findWithPessimisticWriteLock as Mock).mockResolvedValue(activity);
    await expect(joinService.joinActivity("student-1", "camp-1", "act-1")).rejects.toThrow("already full");
  });

  it("should fail if approval-based activity has reached max requests", async () => {
    const activity = { activityId: "act-1", campusId: "camp-1", hostAccountId: "host-1", status: ActivityStatus.Open, participationMode: ParticipationMode.ApprovalBased, currentRequestCount: 10, maxRequests: 10 };
    (findWithPessimisticWriteLock as Mock).mockResolvedValue(activity);
    await expect(joinService.joinActivity("student-1", "camp-1", "act-1")).rejects.toThrow("maximum number of pending requests");
  });
});