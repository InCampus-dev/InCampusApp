export interface ActivityCapacityDisplayFields {
  currentParticipantCount?: number | null;
  maxParticipants?: number | null;
}

function normalizedGuestCount(value?: number | null): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0;
}

function normalizedCapacity(value?: number | null): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function getDisplayParticipantCountIncludingHost(activity: ActivityCapacityDisplayFields): number {
  const maxParticipants = normalizedCapacity(activity.maxParticipants);
  if (maxParticipants === 0) {
    return 0;
  }

  return Math.min(maxParticipants, normalizedGuestCount(activity.currentParticipantCount) + 1);
}

export function getOccupancyRatioIncludingHost(activity: ActivityCapacityDisplayFields): number {
  const maxParticipants = normalizedCapacity(activity.maxParticipants);
  if (maxParticipants === 0) {
    return 0;
  }

  return getDisplayParticipantCountIncludingHost(activity) / maxParticipants;
}

export function getJoinedCountLabel(activity: ActivityCapacityDisplayFields): string {
  return `${getDisplayParticipantCountIncludingHost(activity)}/${normalizedCapacity(activity.maxParticipants)} joined`;
}
