import { DataSource } from 'typeorm';
import { ActivityStatus, ParticipationRecordType, ParticipationStatus } from '../../../shared/src/domain/enums';
import { AppError } from '../../../shared/src/errors/AppError';
import { executeTransaction, findWithPessimisticWriteLock } from '../../../shared/src/db/transaction';
import { Activity } from '../../../hosting-lifecycle/src/entities/Activity';
import { Participation } from '../../../hosting-lifecycle/src/entities/Participation';

export class WithdrawLeaveService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly eventDispatcher: any
  ) {}

  async withdrawRequest(studentAccountId: string, activityId: string): Promise<void> {
    await executeTransaction(this.dataSource, async (manager) => {
      const activity = await findWithPessimisticWriteLock(manager, Activity, { activityId });

      if (!activity) {
        throw AppError.notFound('Activity', activityId);
      }

      const participation = await manager.findOne(Participation, {
        where: { activityId, studentAccountId }
      });

      if (
        !participation ||
        participation.recordType !== ParticipationRecordType.Request ||
        participation.status !== ParticipationStatus.Pending
      ) {
        throw AppError.conflict('Cannot withdraw a request that is not pending', 'Participation');
      }

      await manager.remove(Participation, participation);
      activity.currentRequestCount -= 1;
      await manager.save(Activity, activity);
    });
  }

  async leaveActivity(studentAccountId: string, activityId: string): Promise<void> {
    await executeTransaction(this.dataSource, async (manager) => {
      const activity = await findWithPessimisticWriteLock(manager, Activity, { activityId });

      if (!activity) {
        throw AppError.notFound('Activity', activityId);
      }

      if (activity.scheduledDateTime && new Date(activity.scheduledDateTime) <= new Date()) {
        throw AppError.conflict('Cannot leave an activity after it has started', 'Activity');
      }

      const participation = await manager.findOne(Participation, {
        where: { activityId, studentAccountId }
      });

      if (
        !participation ||
        participation.recordType !== ParticipationRecordType.Participation ||
        participation.status !== ParticipationStatus.Confirmed
      ) {
        throw AppError.conflict('User is not a confirmed participant', 'Participation');
      }

      await manager.remove(Participation, participation);
      activity.currentParticipantCount -= 1;

      if (activity.status === ActivityStatus.Full) {
        activity.status = ActivityStatus.Open;
      }

      await manager.save(Activity, activity);

      this.eventDispatcher.dispatch('JoinedParticipantLeft', {
        activityId: activity.activityId,
        studentAccountId: studentAccountId,
        participationId: participation.participationId
      });
    });
  }
}