import { DataSource } from "typeorm";
import { Activity } from "../entities/Activity";
import { Participation } from "../entities/Participation";
import { ActivityStatus, ParticipationRecordType, ParticipationStatus } from "../../../shared/src/domain/enums";
import { executeTransaction, findWithPessimisticWriteLock } from "../../../shared/src/db/transaction";

export class JoinRequestManagementService {
  constructor(private dataSource: DataSource) {}

  async getPendingRequests(hostAccountId: string, activityId: string): Promise<Participation[]> {
    const participationRepo = this.dataSource.getRepository(Participation);
    const activityRepo = this.dataSource.getRepository(Activity);

    const activity = await activityRepo.findOne({ where: { activityId } });
    if (!activity) throw new Error("Activity not found");
    if (activity.hostAccountId !== hostAccountId) {
      throw new Error("Unauthorized: Only the host can view requests");
    }

    return participationRepo.find({
      where: {
        activityId,
        status: ParticipationStatus.Pending
      }
    });
  }

  async reviewJoinRequest(
    hostAccountId: string,
    activityId: string,
    participationId: string,
    decision: "approve" | "decline"
  ): Promise<Participation> {
    return executeTransaction(this.dataSource, async (manager) => {
      // 1. Lock the activity to prevent concurrent capacity updates (Task S07)
      const activity = await findWithPessimisticWriteLock(manager, Activity, { activityId });
      
      if (!activity) throw new Error("Activity not found");
      if (activity.hostAccountId !== hostAccountId) throw new Error("Unauthorized: Only the host can review requests");

      // 2. Fetch the participation request
      const participation = await manager.findOne(Participation, { where: { participationId, activityId } });
      if (!participation) throw new Error("Join request not found");
      if (participation.status !== ParticipationStatus.Pending) throw new Error("This request is not pending");

      // 3. Process decision
      if (decision === "approve") {
        if (activity.currentParticipantCount >= activity.maxParticipants) {
          throw new Error("Cannot approve request: Activity is already full");
        }
        participation.status = ParticipationStatus.Confirmed;
        participation.recordType = ParticipationRecordType.Participation;
        activity.currentParticipantCount += 1;
        activity.currentRequestCount = Math.max(0, activity.currentRequestCount - 1);
        if (activity.currentParticipantCount === activity.maxParticipants) activity.status = ActivityStatus.Full;
      } else {
        participation.status = ParticipationStatus.Declined;
        activity.currentRequestCount = Math.max(0, activity.currentRequestCount - 1);
      }

      // 4. Save changes atomically
      await manager.save(Activity, activity);
      return await manager.save(Participation, participation);
    });
  }
}