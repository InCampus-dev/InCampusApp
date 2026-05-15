import { DataSource, type FindOptionsWhere, Not, Repository } from "typeorm";

import {
  ParticipationRecordType,
  ParticipationStatus
} from "../../../shared/src/domain/enums";
import { Participation } from "../entities/Participation";

export interface ParticipationLookupReader {
  findOne(options: {
    where: FindOptionsWhere<Participation> | FindOptionsWhere<Participation>[];
  }): Promise<Participation | null>;
}

export async function findActiveByActivityAndStudent(
  participationReader: ParticipationLookupReader,
  activityId: string,
  studentAccountId: string
): Promise<Participation | null> {
  return participationReader.findOne({
    where: buildActiveParticipationWhere(activityId, studentAccountId)
  });
}

export async function findPendingRequestByActivityAndStudent(
  participationReader: ParticipationLookupReader,
  activityId: string,
  studentAccountId: string
): Promise<Participation | null> {
  return participationReader.findOne({
    where: {
      activityId,
      studentAccountId,
      recordType: ParticipationRecordType.Request,
      status: ParticipationStatus.Pending
    }
  });
}

export async function findConfirmedParticipationByActivityAndStudent(
  participationReader: ParticipationLookupReader,
  activityId: string,
  studentAccountId: string
): Promise<Participation | null> {
  return participationReader.findOne({
    where: {
      activityId,
      studentAccountId,
      recordType: ParticipationRecordType.Participation,
      status: ParticipationStatus.Confirmed
    }
  });
}

export async function findOtherActiveByActivityAndStudent(
  participationReader: ParticipationLookupReader,
  activityId: string,
  studentAccountId: string,
  excludedParticipationId: string
): Promise<Participation | null> {
  return participationReader.findOne({
    where: buildActiveParticipationWhere(activityId, studentAccountId, excludedParticipationId)
  });
}

export class ParticipationRepo extends Repository<Participation> {
  constructor(private dataSource: DataSource) {
    super(Participation, dataSource.createEntityManager());
  }

  public async findActiveByActivityAndStudent(
    activityId: string,
    studentAccountId: string
  ): Promise<Participation | null> {
    return findActiveByActivityAndStudent(this, activityId, studentAccountId);
  }

  public async findPendingRequestByActivityAndStudent(
    activityId: string,
    studentAccountId: string
  ): Promise<Participation | null> {
    return findPendingRequestByActivityAndStudent(this, activityId, studentAccountId);
  }

  public async findConfirmedParticipationByActivityAndStudent(
    activityId: string,
    studentAccountId: string
  ): Promise<Participation | null> {
    return findConfirmedParticipationByActivityAndStudent(this, activityId, studentAccountId);
  }

  public async findOtherActiveByActivityAndStudent(
    activityId: string,
    studentAccountId: string,
    excludedParticipationId: string
  ): Promise<Participation | null> {
    return findOtherActiveByActivityAndStudent(
      this,
      activityId,
      studentAccountId,
      excludedParticipationId
    );
  }
}

function buildActiveParticipationWhere(
  activityId: string,
  studentAccountId: string,
  excludedParticipationId?: string
): FindOptionsWhere<Participation>[] {
  const sharedWhere = {
    activityId,
    studentAccountId,
    ...(excludedParticipationId
      ? { participationId: Not(excludedParticipationId) }
      : {})
  };

  return [
    {
      ...sharedWhere,
      recordType: ParticipationRecordType.Request,
      status: ParticipationStatus.Pending
    },
    {
      ...sharedWhere,
      recordType: ParticipationRecordType.Participation,
      status: ParticipationStatus.Confirmed
    }
  ];
}
