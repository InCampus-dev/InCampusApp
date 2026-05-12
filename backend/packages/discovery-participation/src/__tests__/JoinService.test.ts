import { vi, describe, beforeEach, it, expect, Mock } from 'vitest';
import { JoinService } from '../services/JoinService';
import { ActivityStatus, ParticipationMode, ParticipationRecordType, ParticipationStatus } from '../../../shared/src/domain/enums';
import { AppError } from '../../../shared/src/errors/AppError';
import { executeTransaction, findWithPessimisticWriteLock } from '../../../shared/src/db/transaction';
import { Activity } from '../../../hosting-lifecycle/src/entities/Activity';
import { Participation } from '../../../hosting-lifecycle/src/entities/Participation';

// Mock the transaction helpers to bypass real DB locking while verifying they are called
vi.mock('../../../shared/src/db/transaction', () => ({
  executeTransaction: vi.fn(),
  findWithPessimisticWriteLock: vi.fn(),
}));

describe('JoinService (DP07)', () => {
  let service: JoinService;
  
  const mockManager = {
    findOne: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
  };

  const mockDataSource = {} as any;
  const mockBlockLookup = { getBlockedAndBlockerIds: vi.fn() };
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

    service = new JoinService(
      mockDataSource,
      mockBlockLookup as any,
      mockEventDispatcher as any
    );
  });

  describe('Concurrency & Lock Handling', () => {
    it('should acquire a pessimistic write lock on the activity before checking capacity', async () => {
      const mockActivity = {
        activityId: defaultActivityId,
        campusId: defaultCampusId,
        hostAccountId: 'host-456',
        status: ActivityStatus.Open,
        participationMode: ParticipationMode.Open,
        maxParticipants: 10,
        currentParticipantCount: 0,
      };

      (findWithPessimisticWriteLock as Mock).mockResolvedValueOnce(mockActivity);
      mockBlockLookup.getBlockedAndBlockerIds.mockResolvedValueOnce([]);
      mockManager.findOne.mockResolvedValueOnce(null); // No existing participation
      mockManager.create.mockReturnValueOnce({});
      mockManager.save.mockResolvedValue({});

      await service.joinActivity(defaultStudentId, defaultCampusId, defaultActivityId);

      expect(findWithPessimisticWriteLock).toHaveBeenCalledWith(
        mockManager,
        Activity,
        { activityId: defaultActivityId }
      );
    });
  });

  describe('Direct Join (Open Participation Mode)', () => {
    it('should successfully join an open activity and emit DirectJoinCompleted', async () => {
      const mockActivity = {
        activityId: defaultActivityId,
        campusId: defaultCampusId,
        hostAccountId: 'host-456',
        status: ActivityStatus.Open,
        participationMode: ParticipationMode.Open,
        maxParticipants: 5,
        currentParticipantCount: 4,
      };

      (findWithPessimisticWriteLock as Mock).mockResolvedValueOnce(mockActivity);
      mockBlockLookup.getBlockedAndBlockerIds.mockResolvedValueOnce([]);
      mockManager.findOne.mockResolvedValueOnce(null);
      mockManager.create.mockReturnValueOnce({ activityId: defaultActivityId, studentAccountId: defaultStudentId });
      mockManager.save.mockResolvedValueOnce({ participationId: 'part-111' }); // For Activity save
      mockManager.save.mockResolvedValueOnce({ participationId: 'part-111' }); // For Participation save

      await service.joinActivity(defaultStudentId, defaultCampusId, defaultActivityId);

      // Assert capacity was updated and status changed to full
      expect(mockActivity.currentParticipantCount).toBe(5);
      expect(mockActivity.status).toBe(ActivityStatus.Full);
      
      expect(mockManager.create).toHaveBeenCalledWith(Participation, expect.any(Object));
      expect(mockEventDispatcher.dispatch).toHaveBeenCalledWith('DirectJoinCompleted', expect.objectContaining({
        participationId: 'part-111',
        activityId: defaultActivityId,
        studentAccountId: defaultStudentId
      }));
    });

    it('should throw CONFLICT if capacity is already full during lock check', async () => {
      const mockActivity = {
        activityId: defaultActivityId,
        campusId: defaultCampusId,
        hostAccountId: 'host-456',
        status: ActivityStatus.Open,
        participationMode: ParticipationMode.Open,
        maxParticipants: 5,
        currentParticipantCount: 5, // Full
      };

      (findWithPessimisticWriteLock as Mock).mockResolvedValueOnce(mockActivity);
      mockBlockLookup.getBlockedAndBlockerIds.mockResolvedValueOnce([]);
      mockManager.findOne.mockResolvedValueOnce(null);

      await expect(service.joinActivity(defaultStudentId, defaultCampusId, defaultActivityId))
        .rejects.toThrow(AppError);
    });
  });

  describe('Join Request (Approval-Based Participation Mode)', () => {
    it('should submit a request and emit JoinRequestSubmitted', async () => {
      const mockActivity = {
        activityId: defaultActivityId,
        campusId: defaultCampusId,
        hostAccountId: 'host-456',
        status: ActivityStatus.Open,
        participationMode: ParticipationMode.ApprovalBased,
        maxRequests: 10,
        currentRequestCount: 2,
      };

      (findWithPessimisticWriteLock as Mock).mockResolvedValueOnce(mockActivity);
      mockBlockLookup.getBlockedAndBlockerIds.mockResolvedValueOnce([]);
      mockManager.findOne.mockResolvedValueOnce(null);
      
      const createdParticipation: any = { recordType: null, status: null };
      mockManager.create.mockReturnValueOnce(createdParticipation);
      mockManager.save.mockResolvedValue({ participationId: 'req-222' });

      await service.joinActivity(defaultStudentId, defaultCampusId, defaultActivityId);

      expect(createdParticipation.recordType).toBe(ParticipationRecordType.Request);
      expect(createdParticipation.status).toBe(ParticipationStatus.Pending);
      expect(mockActivity.currentRequestCount).toBe(3);
      expect(mockEventDispatcher.dispatch).toHaveBeenCalledWith('JoinRequestSubmitted', expect.any(Object));
    });
  });

  describe('Access Rules & Block Suppression', () => {
    it('should throw NOT_FOUND (Block Suppression) if user is blocked by host', async () => {
      const mockActivity = {
        activityId: defaultActivityId,
        campusId: defaultCampusId,
        hostAccountId: 'host-456',
      };

      (findWithPessimisticWriteLock as Mock).mockResolvedValueOnce(mockActivity);
      mockBlockLookup.getBlockedAndBlockerIds.mockResolvedValueOnce(['host-456']); // Block relationship exists

      await expect(service.joinActivity(defaultStudentId, defaultCampusId, defaultActivityId))
        .rejects.toMatchObject({ code: 'NOT_FOUND' }); // Opaque 404 to avoid leaking block state
    });

    it('should throw NOT_FOUND on campus mismatch (Tenant Boundary check)', async () => {
      const mockActivity = {
        activityId: defaultActivityId,
        campusId: 'different-campus', // Mismatch
      };

      (findWithPessimisticWriteLock as Mock).mockResolvedValueOnce(mockActivity);

      await expect(service.joinActivity(defaultStudentId, defaultCampusId, defaultActivityId))
        .rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });
});