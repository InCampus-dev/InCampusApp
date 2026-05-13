import { Mock, beforeEach, describe, expect, it, vi } from "vitest";

import { ParticipationStatus, ParticipationRecordType } from "../../../shared/src/domain/enums";
import { executeTransaction, findWithPessimisticWriteLock } from "../../../shared/src/db/transaction";
import { JoinRequestManagementService } from "../services/JoinRequestManagementService";

vi.mock("../../../shared/src/db/transaction", () => ({
  executeTransaction: vi.fn(),
  findWithPessimisticWriteLock: vi.fn()
}));

describe("JoinRequestManagementService", () => {
  let service: JoinRequestManagementService;

  const mockManager = {
    findOne: vi.fn(),
    save: vi.fn()
  };

  const mockDataSource = {} as any;
  const mockEventDispatcher = { dispatch: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();

    (executeTransaction as Mock).mockImplementation(async (_dataSource: any, callback: any) => {
      return await callback(mockManager);
    });

    service = new JoinRequestManagementService(
      mockDataSource,
      mockEventDispatcher as any
    );
  });

  it("emits JoinRequestApproved after a successful approval", async () => {
    const activity = {
      activityId: "activity-001",
      hostAccountId: "host-001",
      maxParticipants: 4,
      currentParticipantCount: 2,
      currentRequestCount: 1
    };
    const participation = {
      participationId: "participation-001",
      activityId: "activity-001",
      studentAccountId: "student-001",
      status: ParticipationStatus.Pending,
      recordType: ParticipationRecordType.Request
    };

    (findWithPessimisticWriteLock as Mock).mockResolvedValueOnce(activity);
    mockManager.findOne.mockResolvedValueOnce(participation);
    mockManager.save.mockResolvedValueOnce(activity);
    mockManager.save.mockResolvedValueOnce(participation);

    await service.reviewJoinRequest("host-001", "activity-001", "participation-001", "approve");

    expect(mockEventDispatcher.dispatch).toHaveBeenCalledWith(
      "JoinRequestApproved",
      expect.objectContaining({
        eventId: expect.any(String),
        eventType: "JoinRequestApproved",
        occurredAt: expect.any(String),
        activityId: "activity-001",
        triggeringAccountId: "host-001",
        participationId: "participation-001",
        outcome: "approved"
      })
    );
  });

  it("emits JoinRequestDeclined after a successful decline", async () => {
    const activity = {
      activityId: "activity-001",
      hostAccountId: "host-001",
      maxParticipants: 4,
      currentParticipantCount: 2,
      currentRequestCount: 1
    };
    const participation = {
      participationId: "participation-001",
      activityId: "activity-001",
      studentAccountId: "student-001",
      status: ParticipationStatus.Pending,
      recordType: ParticipationRecordType.Request
    };

    (findWithPessimisticWriteLock as Mock).mockResolvedValueOnce(activity);
    mockManager.findOne.mockResolvedValueOnce(participation);
    mockManager.save.mockResolvedValueOnce(activity);
    mockManager.save.mockResolvedValueOnce(participation);

    await service.reviewJoinRequest("host-001", "activity-001", "participation-001", "decline");

    expect(mockEventDispatcher.dispatch).toHaveBeenCalledWith(
      "JoinRequestDeclined",
      expect.objectContaining({
        eventId: expect.any(String),
        eventType: "JoinRequestDeclined",
        occurredAt: expect.any(String),
        activityId: "activity-001",
        triggeringAccountId: "host-001",
        participationId: "participation-001",
        outcome: "declined"
      })
    );
  });
});
