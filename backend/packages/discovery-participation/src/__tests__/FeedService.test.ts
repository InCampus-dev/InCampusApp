import { vi, describe, beforeEach, it, expect } from 'vitest';
import { FeedService, BlockLookupPort } from '../services/FeedService';
import { ActivityStatus } from '../../../shared/src/domain/enums';
import { Activity } from '../../../hosting-lifecycle/src/entities/Activity';

describe('FeedService (DP07)', () => {
  let feedService: FeedService;
  let mockBlockLookup: BlockLookupPort;
  let mockDataSource: any;
  let mockQueryBuilder: any;
  let mockRepository: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock del QueryBuilder di TypeORM
    mockQueryBuilder = {
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      getMany: vi.fn().mockResolvedValue([]),
    };

    mockRepository = {
      createQueryBuilder: vi.fn().mockReturnValue(mockQueryBuilder),
    };

    mockDataSource = {
      getRepository: vi.fn().mockReturnValue(mockRepository),
    };

    mockBlockLookup = {
      getBlockedAndBlockerIds: vi.fn().mockResolvedValue([]),
    };

    feedService = new FeedService(mockDataSource, mockBlockLookup);
  });

  it('should fetch activities for a given campus that are Open and in the future', async () => {
    const mockActivities = [{ activityId: 'act-1' }, { activityId: 'act-2' }];
    mockQueryBuilder.getMany.mockResolvedValue(mockActivities);

    const result = await feedService.getActivities('student-1', 'campus-abc');

    expect(result).toEqual(mockActivities);
    expect(mockDataSource.getRepository).toHaveBeenCalledWith(Activity);
    expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('activity');
    expect(mockQueryBuilder.where).toHaveBeenCalledWith('activity.campusId = :campusId', { campusId: 'campus-abc' });
    expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('activity.status = :status', { status: ActivityStatus.Open });
    expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('activity.scheduledDateTime > :now', expect.any(Object));
    expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('activity.scheduledDateTime', 'ASC');
  });

  it('should apply category filter if provided', async () => {
    await feedService.getActivities('student-1', 'campus-abc', { categoryId: 'cat-1' });
    expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('activity.categoryId = :categoryId', { categoryId: 'cat-1' });
  });

  it('should apply block suppression by excluding activities hosted by blocked users', async () => {
    mockBlockLookup.getBlockedAndBlockerIds = vi.fn().mockResolvedValue(['blocked-user-1']);
    await feedService.getActivities('student-1', 'campus-abc');
    
    expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('activity.hostAccountId NOT IN (:...blockedIds)', { blockedIds: ['blocked-user-1'] });
  });
});