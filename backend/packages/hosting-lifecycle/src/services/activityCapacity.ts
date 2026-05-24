import type { Activity } from "../entities/Activity";

type ActivityCapacityFields = Pick<
  Activity,
  "currentParticipantCount" | "maxParticipants" | "maxRequests"
>;

/**
 * Backend `currentParticipantCount` intentionally stores confirmed guests only.
 * Product occupancy shown to students is host + confirmed guests, because
 * `maxParticipants` means total people including the host.
 */
export function getGuestCapacity(activity: Pick<Activity, "maxParticipants">): number {
  return Math.max(0, activity.maxParticipants - 1);
}

export function getTotalOccupancyIncludingHost(
  activity: Pick<Activity, "currentParticipantCount" | "maxParticipants">
): number {
  return Math.min(activity.maxParticipants, activity.currentParticipantCount + 1);
}

export function isGuestCapacityFull(
  activity: Pick<Activity, "currentParticipantCount" | "maxParticipants">
): boolean {
  return activity.currentParticipantCount >= getGuestCapacity(activity);
}

export function getEffectivePendingRequestLimit(activity: ActivityCapacityFields): number {
  return Math.min(activity.maxRequests ?? getGuestCapacity(activity), getGuestCapacity(activity));
}
