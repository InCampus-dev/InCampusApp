import { vi, describe, beforeEach, it, expect } from 'vitest';
import { ActivityLifecycleService } from '../services/ActivityLifecycleService';
import { ActivityStatus } from '../../../shared/src/domain/enums';
import { AppError } from '../../../shared/src/errors/AppError';

// Mock dependencies
const mockActivityRepo = {
  create: vi.fn(),
  findById: vi.fn(),
  updateStatus: vi.fn(),
  delete: vi.fn(),
};

const mockCampusValidationService = {
  validateCategoryAndLocation: vi.fn(),
};

const mockEventBus = {
  publish: vi.fn(),
};

describe('ActivityLifecycleService', () => {
  let service: ActivityLifecycleService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ActivityLifecycleService(
      mockActivityRepo as any,
      mockCampusValidationService as any,
      mockEventBus as any
    );
  });

  describe('Create Activity (DUC-HL-01)', () => {
    it('should create an activity successfully and store snapshot labels', async () => {
      const payload = {
        hostId: 'student-123',
        campusId: 'campus-abc',
        title: 'Lunch at Cafeteria',
        categoryId: 'cat-1',
        meetingPointId: 'loc-1',
        scheduledDateTime: new Date(Date.now() + 86400000), // Tomorrow
        maxParticipants: 5,
        participationMode: 'open' as const,
        genderPreference: 'all' as const,
      };

      mockCampusValidationService.validateCategoryAndLocation.mockResolvedValueOnce({
        categoryName: 'Food',
        locationName: 'Main Cafeteria'
      });
      mockActivityRepo.create.mockResolvedValueOnce({ id: 'act-999', ...payload });

      const result = await service.createActivity(payload);

      expect(mockCampusValidationService.validateCategoryAndLocation).toHaveBeenCalledWith('campus-abc', 'cat-1', 'loc-1');
      expect(mockActivityRepo.create).toHaveBeenCalled();
      expect(result.id).toBe('act-999');
    });
  });

  describe('Update Activity Status - Cancel (DUC-HL-03)', () => {
    it('should update status to cancelled and emit ActivityCancelled event', async () => {
      const mockActivity = { id: 'act-999', hostId: 'student-123', status: ActivityStatus.Open };
      mockActivityRepo.findById.mockResolvedValueOnce(mockActivity);
      
      await service.updateStatus('act-999', 'student-123', ActivityStatus.Cancelled);

      expect(mockActivityRepo.updateStatus).toHaveBeenCalledWith('act-999', ActivityStatus.Cancelled);
      expect(mockEventBus.publish).toHaveBeenCalledWith('ActivityCancelled', expect.objectContaining({
        activityId: 'act-999',
        triggeringAccountId: 'student-123'
      }));
    });

    it('should throw FORBIDDEN if a non-host attempts to cancel', async () => {
      const mockActivity = { id: 'act-999', hostId: 'student-123', status: ActivityStatus.Open };
      mockActivityRepo.findById.mockResolvedValueOnce(mockActivity);

      await expect(service.updateStatus('act-999', 'imposter-456', ActivityStatus.Cancelled))
        .rejects.toThrow(AppError);
    });
  });
});