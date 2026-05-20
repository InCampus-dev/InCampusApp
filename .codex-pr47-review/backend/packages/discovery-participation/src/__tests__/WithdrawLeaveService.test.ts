import { vi, describe, beforeEach, it, expect, Mock } from 'vitest';
import { WithdrawLeaveService } from '../services/WithdrawLeaveService';
import { ActivityStatus, ParticipationRecordType, ParticipationStatus } from '../../../shared/src/domain/enums';
import { executeTransaction, findWithPessimisticWriteLock } from '../../../shared/src/db/transaction';
import { Activity } from '../../../hosting-lifecycle/src/entities/Activity';
import { Participation } from '../../../hosting-lifecycle/src/entities/Participation';

// Mock the transaction helpers to bypass real DB locking while verifying they are called
vi.mock('../../../shared/src/db/transaction', () => ({
  executeTransaction: vi.fn(),
  findWithPessimisticWriteLock: vi.fn(),
}));

describe('WithdrawLeaveService (DP07)', () => {
  let service: WithdrawLeaveService;
  
  const mockManager = {
    findOne: vi.fn(),
    remove: vi.fn(),
    save: vi.fn(),
  };

  const mockDataSource = {} as any;
  const mockEventDispatcher = { dispatch: vi.fn() };

  const defaultStudentId = 'student-123';
  const defaultCampusId = 'campus-abc';
  const defaultActivityId = 'act-999';

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Wire executeTransaction to immediately invoke its callback with our mock manager
    (executeTransaction as Mock).mockImplementation(async (ds: any, callback: any) => {
      return await callback(mockManager);
    });

    service = new WithdrawLeaveService(
      mockDataSource,
      mockEventDispatcher as any
    );
  });

  describe('Withdraw Join Request (DUC-DP-04)', () => {
    it('should successfully withdraw a pending request, decrement count, and NOT emit an event', async () => {
      const mockActivity = {
        activityId: defaultActivityId,
        campusId: defaultCampusId,
        currentRequestCount: 2,
      };

      const mockParticipation = {
        participationId: 'req-111',
        activityId: defaultActivityId,
        studentAccountId: defaultStudentId,
        recordType: ParticipationRecordType.Request,
        status: ParticipationStatus.Pending,
      };

      (findWithPessimisticWriteLock as Mock).mockResolvedValueOnce(mockActivity);
      mockManager.findOne.mockImplementationOnce(createParticipationFindOneMock([mockParticipation]));
      mockManager.remove.mockResolvedValueOnce({});
      mockManager.save.mockResolvedValueOnce({});

      await service.withdrawRequest(defaultStudentId, defaultCampusId, defaultActivityId);

      expect(mockManager.findOne).toHaveBeenCalledWith(Participation, {
        where: {
          activityId: defaultActivityId,
          studentAccountId: defaultStudentId,
          recordType: ParticipationRecordType.Request,
          status: ParticipationStatus.Pending
        }
      });
      expect(mockManager.remove).toHaveBeenCalledWith(Participation, mockParticipation);
      expect(mockActivity.currentRequestCount).toBe(1); // Decremented
      expect(mockManager.save).toHaveBeenCalledWith(Activity, mockActivity);
      expect(mockEventDispatcher.dispatch).not.toHaveBeenCalled(); // Crucial rule: no notification for withdrawal
    });

    it('should throw CONFLICT if only a declined historical request exists', async () => {
      const mockActivity = { activityId: defaultActivityId, campusId: defaultCampusId };
      const historicalDeclinedRequest = {
        participationId: 'req-222',
        activityId: defaultActivityId,
        studentAccountId: defaultStudentId,
        recordType: ParticipationRecordType.Request,
        status: ParticipationStatus.Declined, // Already decided
      };

      (findWithPessimisticWriteLock as Mock).mockResolvedValueOnce(mockActivity);
      mockManager.findOne.mockImplementationOnce(
        createParticipationFindOneMock([historicalDeclinedRequest])
      );

      await expect(service.withdrawRequest(defaultStudentId, defaultCampusId, defaultActivityId))
        .rejects.toMatchObject({ code: 'CONFLICT' });
    });

    it('should return opaque NOT_FOUND when withdrawing from another campus activity', async () => {
      const mockActivity = {
        activityId: defaultActivityId,
        campusId: 'campus-other',
        currentRequestCount: 1,
      };

      (findWithPessimisticWriteLock as Mock).mockResolvedValueOnce(mockActivity);

      await expect(service.withdrawRequest(defaultStudentId, defaultCampusId, defaultActivityId))
        .rejects.toMatchObject({
          code: 'NOT_FOUND',
          details: {
            resourceType: 'Activity',
            resourceId: defaultActivityId,
          },
        });
      expect(mockManager.findOne).not.toHaveBeenCalled();
      expect(mockEventDispatcher.dispatch).not.toHaveBeenCalled();
    });
  });

  describe('Leave Joined Activity (DUC-DP-05)', () => {
    it('should successfully leave, restore full status to open, and emit JoinedParticipantLeft', async () => {
      const mockActivity = {
        activityId: defaultActivityId,
        campusId: defaultCampusId,
        status: ActivityStatus.Full,
        currentParticipantCount: 5,
        maxParticipants: 5,
        scheduledDateTime: new Date(Date.now() + 86400000), // Tomorrow (has not started)
      };

      const mockParticipation = {
        participationId: 'part-222',
        activityId: defaultActivityId,
        studentAccountId: defaultStudentId,
        recordType: ParticipationRecordType.Participation,
        status: ParticipationStatus.Confirmed,
      };

      (findWithPessimisticWriteLock as Mock).mockResolvedValueOnce(mockActivity);
      mockManager.findOne.mockImplementationOnce(createParticipationFindOneMock([mockParticipation]));
      mockManager.remove.mockResolvedValueOnce({});
      mockManager.save.mockResolvedValueOnce({});

      await service.leaveActivity(defaultStudentId, defaultCampusId, defaultActivityId);

      expect(mockManager.findOne).toHaveBeenCalledWith(Participation, {
        where: {
          activityId: defaultActivityId,
          studentAccountId: defaultStudentId,
          recordType: ParticipationRecordType.Participation,
          status: ParticipationStatus.Confirmed
        }
      });
      expect(mockManager.remove).toHaveBeenCalledWith(Participation, mockParticipation);
      expect(mockActivity.currentParticipantCount).toBe(4); // Decremented
      expect(mockActivity.status).toBe(ActivityStatus.Open); // Reopened because it's no longer full
      expect(mockManager.save).toHaveBeenCalledWith(Activity, mockActivity);
      
      expect(mockEventDispatcher.dispatch).toHaveBeenCalledWith('JoinedParticipantLeft', expect.objectContaining({
        eventId: expect.any(String),
        eventType: 'JoinedParticipantLeft',
        occurredAt: expect.any(String),
        activityId: defaultActivityId,
        triggeringAccountId: defaultStudentId,
        participationId: 'part-222'
      }));
    });

    it('should throw CONFLICT if trying to leave after the activity has started', async () => {
      const mockActivity = {
        activityId: defaultActivityId,
        campusId: defaultCampusId,
        scheduledDateTime: new Date(Date.now() - 3600000), // 1 hour ago (already started)
      };

      (findWithPessimisticWriteLock as Mock).mockResolvedValueOnce(mockActivity);

      await expect(service.leaveActivity(defaultStudentId, defaultCampusId, defaultActivityId))
        .rejects.toMatchObject({ code: 'CONFLICT' });
    });

    it('should throw CONFLICT if the user is not a confirmed participant', async () => {
      const mockActivity = {
        activityId: defaultActivityId,
        campusId: defaultCampusId,
        scheduledDateTime: new Date(Date.now() + 86400000)
      };
      const pendingRequest = {
        participationId: 'req-333',
        activityId: defaultActivityId,
        studentAccountId: defaultStudentId,
        recordType: ParticipationRecordType.Request, // Not confirmed participation
        status: ParticipationStatus.Pending,
      };

      (findWithPessimisticWriteLock as Mock).mockResolvedValueOnce(mockActivity);
      mockManager.findOne.mockImplementationOnce(createParticipationFindOneMock([pendingRequest]));

      await expect(service.leaveActivity(defaultStudentId, defaultCampusId, defaultActivityId))
        .rejects.toMatchObject({ code: 'CONFLICT' });
    });

    it('should return opaque NOT_FOUND when leaving another campus activity', async () => {
      const mockActivity = {
        activityId: defaultActivityId,
        campusId: 'campus-other',
        scheduledDateTime: new Date(Date.now() + 86400000),
      };

      (findWithPessimisticWriteLock as Mock).mockResolvedValueOnce(mockActivity);

      await expect(service.leaveActivity(defaultStudentId, defaultCampusId, defaultActivityId))
        .rejects.toMatchObject({
          code: 'NOT_FOUND',
          details: {
            resourceType: 'Activity',
            resourceId: defaultActivityId,
          },
        });
      expect(mockManager.findOne).not.toHaveBeenCalled();
      expect(mockEventDispatcher.dispatch).not.toHaveBeenCalled();
    });
  });
});

function createParticipationFindOneMock(records: Array<Record<string, unknown>>) {
  return async (_entity: unknown, options: { where: Record<string, unknown> }) => {
    return (
      records.find((record) =>
        Object.entries(options.where).every(
          ([field, expectedValue]) => record[field] === expectedValue
        )
      ) ?? null
    );
  };
}
