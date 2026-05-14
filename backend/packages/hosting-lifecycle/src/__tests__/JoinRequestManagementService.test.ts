import { describe, it, expect, beforeEach, afterEach, vi, Mock } from "vitest";
import { JoinRequestManagementService } from "../services/JoinRequestManagementService";
import { Activity } from "../entities/Activity";
import { Participation } from "../entities/Participation";
import { ActivityStatus, ParticipationRecordType, ParticipationStatus } from "../../../shared/src/domain/enums";
import { executeTransaction, findWithPessimisticWriteLock } from "../../../shared/src/db/transaction";

// Mock dei transaction helper
vi.mock("../../../shared/src/db/transaction", () => ({
  executeTransaction: vi.fn(),
  findWithPessimisticWriteLock: vi.fn(),
}));

describe("JoinRequestManagementService", () => {
  let service: JoinRequestManagementService;
  let mockDataSource: any;
  let mockEventDispatcher: any;
  let mockManager: any;
  let mockActivityRepo: any;
  let mockParticipationRepo: any;

  beforeEach(() => {
    mockActivityRepo = {
      findOne: vi.fn(),
    };
    mockParticipationRepo = {
      find: vi.fn(),
    };

    mockManager = {
      findOne: vi.fn(),
      save: vi.fn(),
    };

    // Mocking Data Source to return the respective repository mock
    mockDataSource = {
      getRepository: vi.fn((entity) => {
        if (entity === Activity) return mockActivityRepo;
        if (entity === Participation) return mockParticipationRepo;
      }),
    };

    // Simuliamo l'esecuzione della transazione passandogli subito il nostro mockManager
    (executeTransaction as Mock).mockImplementation(async (ds, cb) => {
      return await cb(mockManager);
    });

    mockEventDispatcher = {
      dispatch: vi.fn().mockResolvedValue(undefined),
    };

    service = new JoinRequestManagementService(mockDataSource, mockEventDispatcher);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getPendingRequests", () => {
    it("should return pending requests if user is host", async () => {
      mockActivityRepo.findOne.mockResolvedValue({ activityId: "act-1", hostAccountId: "host-1" });
      const mockRequests = [{ participationId: "req-1" }, { participationId: "req-2" }];
      mockParticipationRepo.find.mockResolvedValue(mockRequests);

      const result = await service.getPendingRequests("host-1", "act-1");

      expect(result).toEqual(mockRequests);
      expect(mockParticipationRepo.find).toHaveBeenCalledWith({
        where: {
          activityId: "act-1",
          recordType: ParticipationRecordType.Request,
          status: ParticipationStatus.Pending
        },
      });
    });

    it("should throw if activity not found", async () => {
      mockActivityRepo.findOne.mockResolvedValue(null);
      await expect(service.getPendingRequests("host-1", "act-1")).rejects.toThrow("Activity not found");
    });

    it("should throw if user is not host", async () => {
      mockActivityRepo.findOne.mockResolvedValue({ activityId: "act-1", hostAccountId: "host-2" });
      await expect(service.getPendingRequests("host-1", "act-1")).rejects.toThrow("Unauthorized");
    });
  });

  describe("reviewJoinRequest", () => {
    const defaultActivity = {
      activityId: "act-1",
      hostAccountId: "host-1",
      currentParticipantCount: 0,
      maxParticipants: 5,
      currentRequestCount: 1,
      status: ActivityStatus.Open,
    };

    const defaultParticipation = {
      participationId: "req-1",
      activityId: "act-1",
      studentAccountId: "student-1",
      status: ParticipationStatus.Pending,
      recordType: ParticipationRecordType.Request,
    };

    it("should successfully approve a pending request and update counts", async () => {
      const activity = { ...defaultActivity };
      const participation = { ...defaultParticipation };

      (findWithPessimisticWriteLock as Mock).mockResolvedValue(activity);
      mockManager.findOne
        .mockResolvedValueOnce(participation)
        .mockResolvedValueOnce(null);
      mockManager.save.mockImplementation(async (entity: any, instance: any) => instance);

      const result = await service.reviewJoinRequest("host-1", "act-1", "req-1", "approve");

      expect(result.status).toBe(ParticipationStatus.Confirmed);
      expect(result.recordType).toBe(ParticipationRecordType.Participation);
      expect(activity.currentParticipantCount).toBe(1);
      expect(activity.currentRequestCount).toBe(0);
      expect(mockManager.save).toHaveBeenCalledWith(Activity, activity);
      expect(mockManager.save).toHaveBeenCalledWith(Participation, participation);
      expect(mockEventDispatcher.dispatch).toHaveBeenCalledWith("JoinRequestApproved", expect.objectContaining({
        eventType: "JoinRequestApproved",
        outcome: "approved",
      }));
    });

    it("should update activity status to Full if maxParticipants reached after approval", async () => {
      const activity = { ...defaultActivity, currentParticipantCount: 4, maxParticipants: 5 };
      const participation = { ...defaultParticipation };

      (findWithPessimisticWriteLock as Mock).mockResolvedValue(activity);
      mockManager.findOne
        .mockResolvedValueOnce(participation)
        .mockResolvedValueOnce(null);
      mockManager.save.mockImplementation(async (entity: any, instance: any) => instance);

      await service.reviewJoinRequest("host-1", "act-1", "req-1", "approve");

      expect(activity.currentParticipantCount).toBe(5);
      expect(activity.status).toBe(ActivityStatus.Full); // Regola coperta!
    });

    it("should successfully decline a pending request without changing participant counts", async () => {
      const activity = { ...defaultActivity };
      const participation = { ...defaultParticipation };

      (findWithPessimisticWriteLock as Mock).mockResolvedValue(activity);
      mockManager.findOne.mockResolvedValue(participation);
      mockManager.save.mockImplementation(async (entity: any, instance: any) => instance);

      const result = await service.reviewJoinRequest("host-1", "act-1", "req-1", "decline");

      expect(result.status).toBe(ParticipationStatus.Declined);
      expect(result.recordType).toBe(ParticipationRecordType.Request); // Rimane request
      expect(activity.currentParticipantCount).toBe(0); // Nessun nuovo partecipante
      expect(activity.currentRequestCount).toBe(0); // Ma la coda delle request scende
      expect(mockEventDispatcher.dispatch).toHaveBeenCalledWith("JoinRequestDeclined", expect.objectContaining({
        eventType: "JoinRequestDeclined",
        outcome: "declined",
      }));
    });

    it("should throw if trying to approve but activity is already full", async () => {
      const activity = { ...defaultActivity, currentParticipantCount: 5, maxParticipants: 5 };
      const participation = { ...defaultParticipation };

      (findWithPessimisticWriteLock as Mock).mockResolvedValue(activity);
      mockManager.findOne
        .mockResolvedValueOnce(participation)
        .mockResolvedValueOnce(null);

      await expect(service.reviewJoinRequest("host-1", "act-1", "req-1", "approve"))
        .rejects.toThrow("Cannot approve request: Activity is already full");
    });

    it("should throw if approval would create a duplicate active participation", async () => {
      const activity = { ...defaultActivity };
      const participation = {
        ...defaultParticipation,
        studentAccountId: "student-1"
      };

      (findWithPessimisticWriteLock as Mock).mockResolvedValue(activity);
      mockManager.findOne
        .mockResolvedValueOnce(participation)
        .mockResolvedValueOnce({
          participationId: "part-existing",
          activityId: "act-1",
          studentAccountId: "student-1",
          recordType: ParticipationRecordType.Participation,
          status: ParticipationStatus.Confirmed
        });

      await expect(service.reviewJoinRequest("host-1", "act-1", "req-1", "approve"))
        .rejects.toThrow("Student already has an active participation record");
    });

    it("should throw if activity not found", async () => {
      (findWithPessimisticWriteLock as Mock).mockResolvedValue(null);
      await expect(service.reviewJoinRequest("host-1", "act-1", "req-1", "approve")).rejects.toThrow("Activity not found");
    });

    it("should throw if user is not host", async () => {
      const activity = { ...defaultActivity, hostAccountId: "host-2" };
      (findWithPessimisticWriteLock as Mock).mockResolvedValue(activity);
      await expect(service.reviewJoinRequest("host-1", "act-1", "req-1", "approve")).rejects.toThrow("Unauthorized");
    });

    it("should throw if participation request not found", async () => {
      const activity = { ...defaultActivity };
      (findWithPessimisticWriteLock as Mock).mockResolvedValue(activity);
      mockManager.findOne.mockResolvedValue(null);
      await expect(service.reviewJoinRequest("host-1", "act-1", "req-1", "approve")).rejects.toThrow("Join request not found");
    });

    it("should throw if request is not pending", async () => {
      const activity = { ...defaultActivity };
      const participation = { ...defaultParticipation, status: ParticipationStatus.Declined };
      (findWithPessimisticWriteLock as Mock).mockResolvedValue(activity);
      mockManager.findOne.mockResolvedValue(participation);
      await expect(service.reviewJoinRequest("host-1", "act-1", "req-1", "approve")).rejects.toThrow("This request is not pending");
    });

    it("should throw if the targeted record is not a join request", async () => {
      const activity = { ...defaultActivity };
      const participation = {
        ...defaultParticipation,
        recordType: ParticipationRecordType.Participation
      };
      (findWithPessimisticWriteLock as Mock).mockResolvedValue(activity);
      mockManager.findOne.mockResolvedValue(participation);
      await expect(service.reviewJoinRequest("host-1", "act-1", "req-1", "approve")).rejects.toThrow("This request is not pending");
    });
  });
});
