// Task: NSF02 | Path: backend/packages/notifications-system-flow/src/services/RecipientResolutionService.ts

import { Repository } from "typeorm";

/**
 * Resolves the notification recipient and activity context from upstream stores.
 * Reads DS-HL-001 (Activity), DS-HL-002 (Participation), DS-AP-001 (StudentAccount).
 * NSF never modifies these stores (H&L and AP ownership).
 */
export interface ActivityContext {
  activityId: string;
  hostAccountId: string;
  title: string;
  scheduledDateTime: Date;
  participationMode: string;
}

export interface RecipientResolution {
  recipientAccountId: string;
  activityContext: ActivityContext;
  suppressed: boolean;
  suppressionReason?: string;
}

export class RecipientResolutionService {
  constructor(
    private readonly activityRepo: Repository<any>,      // DS-HL-001 (read-only by NSF)
    private readonly participationRepo: Repository<any>, // DS-HL-002 (read-only by NSF)
    private readonly studentAccountRepo: Repository<any> // DS-AP-001 (read-only by NSF)
  ) {}

  /**
   * Resolve host as recipient for join/request events.
   * Per DUC-NSF-01: read activity → read participation → check host account is Active.
   */
  public async resolveHostRecipient(
    activityId: string,
    participationId: string
  ): Promise<RecipientResolution> {
    const activity = await this.activityRepo.findOne({ where: { activityId } });
    if (!activity) {
      return {
        recipientAccountId: "",
        activityContext: {} as ActivityContext,
        suppressed: true,
        suppressionReason: "ActivityNotFound",
      };
    }

    const activityContext: ActivityContext = {
      activityId: activity.activityId,
      hostAccountId: activity.hostAccountId,
      title: activity.title,
      scheduledDateTime: activity.scheduledDateTime,
      participationMode: activity.participationMode,
    };

    const participation = await this.participationRepo.findOne({ where: { participationId } });
    if (!participation) {
      return {
        recipientAccountId: activityContext.hostAccountId,
        activityContext,
        suppressed: true,
        suppressionReason: "ParticipationNotFound",
      };
    }

    const hostAccount = await this.studentAccountRepo.findOne({
      where: { studentAccountId: activityContext.hostAccountId },
    });
    if (!hostAccount || hostAccount.platformAccessStatus !== "Active") {
      return {
        recipientAccountId: activityContext.hostAccountId,
        activityContext,
        suppressed: true,
        suppressionReason: "HostAccountNotActive",
      };
    }

    return { recipientAccountId: activityContext.hostAccountId, activityContext, suppressed: false };
  }

  /**
   * Resolve applicant as recipient for application outcome events.
   * Per DUC-NSF-02: read participation → get applicant → read activity → check applicant Active.
   */
  public async resolveApplicantRecipient(
    activityId: string,
    participationId: string,
    _triggeringAccountId: string
  ): Promise<RecipientResolution> {
    const participation = await this.participationRepo.findOne({ where: { participationId } });
    if (!participation) {
      return {
        recipientAccountId: "",
        activityContext: {} as ActivityContext,
        suppressed: true,
        suppressionReason: "ParticipationNotFound",
      };
    }
    const applicantAccountId: string = participation.studentAccountId;

    const activity = await this.activityRepo.findOne({ where: { activityId } });
    if (!activity) {
      return {
        recipientAccountId: applicantAccountId,
        activityContext: {} as ActivityContext,
        suppressed: true,
        suppressionReason: "ActivityNotFound",
      };
    }

    const activityContext: ActivityContext = {
      activityId: activity.activityId,
      hostAccountId: activity.hostAccountId,
      title: activity.title,
      scheduledDateTime: activity.scheduledDateTime,
      participationMode: activity.participationMode,
    };

    const applicantAccount = await this.studentAccountRepo.findOne({
      where: { studentAccountId: applicantAccountId },
    });
    if (!applicantAccount || applicantAccount.platformAccessStatus !== "Active") {
      return {
        recipientAccountId: applicantAccountId,
        activityContext,
        suppressed: true,
        suppressionReason: "ApplicantAccountNotActive",
      };
    }

    return { recipientAccountId: applicantAccountId, activityContext, suppressed: false };
  }
}
