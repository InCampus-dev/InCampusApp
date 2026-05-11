import { DataSource } from "typeorm";
import { Activity } from "../../../hosting-lifecycle/src/entities/Activity";
import { Participation } from "../../../hosting-lifecycle/src/entities/Participation";
import { ActivityStatus, ParticipationStatus } from "../../../shared/src/domain/enums";
import { AppError } from "../../../shared/src/errors/AppError";
import { executeTransaction, findWithPessimisticWriteLock } from "../../../shared/src/db/transaction";
import { EventDispatcherPort } from "./JoinService";

export class WithdrawLeaveService {
  constructor(
    private dataSource: DataSource,
    private eventDispatcher: EventDispatcherPort
  ) {}

  async withdrawOrLeaveActivity(studentAccountId: string, campusId: string, activityId: string): Promise<void> {
    return executeTransaction(this.dataSource, async (manager) => {
      // 1. Lock the activity to prevent concurrent capacity updates (Task S07)
      const activity = await findWithPessimisticWriteLock(manager, Activity, { activityId });
      
      if (!activity) {
        throw AppError.notFound("Activity", activityId);
      }
      if (activity.campusId !== campusId) {
        throw AppError.notFound("Activity", activityId); // Cross-campus isolation
      }

      // 2. Check for existing active participation/request
      const participation = await manager.findOne(Participation, {
        where: [
          { activityId, studentAccountId, status: ParticipationStatus.Pending },
          { activityId, studentAccountId, status: ParticipationStatus.Confirmed }
        ]
      });

      if (!participation) {
        throw AppError.notFound("Participation", "No active participation or request found to withdraw from");
      }

      const isConfirmed = participation.status === ParticipationStatus.Confirmed;
      const participationId = participation.participationId;
      const hostAccountId = activity.hostAccountId;

      // 3. Update Activity counters and status atomically
      if (isConfirmed) {
        activity.currentParticipantCount = Math.max(0, activity.currentParticipantCount - 1);
        if (activity.status === ActivityStatus.Full && activity.currentParticipantCount < activity.maxParticipants) {
          activity.status = ActivityStatus.Open;
        }
      } else {
        activity.currentRequestCount = Math.max(0, activity.currentRequestCount - 1);
      }

      // 4. Save changes (hard delete the participation record)
      await manager.remove(Participation, participation);
      await manager.save(Activity, activity);

      // 5. Emit event to Notification System ONLY if it was a confirmed participation
      if (isConfirmed) {
        await this.eventDispatcher.dispatch("JoinedParticipantLeft", {
          participationId,
          activityId,
          studentAccountId,
          hostAccountId
        });
      }
    });
  }
}