export type NotificationFallbackReason =
  | 'TargetActivityUnavailable'
  | 'BlockRelationshipExists'
  | 'MissingActivityContext'
  | 'UnknownNotificationTarget';

export interface NotificationFallbackCopy {
  title: string;
  body: string;
  icon: string;
  reasonLabel: string;
}

export function getNotificationFallbackCopy(reason: unknown): NotificationFallbackCopy {
  switch (normalizeFallbackReason(reason)) {
    case 'TargetActivityUnavailable':
      return {
        title: 'Activity no longer available',
        body: 'This activity may have been deleted, cancelled, or made unavailable.',
        icon: 'x',
        reasonLabel: 'Target deleted or unavailable'
      };
    case 'BlockRelationshipExists':
      return {
        title: 'Content not accessible',
        body: 'This notification points to content that is blocked or inaccessible.',
        icon: 'i',
        reasonLabel: 'Blocked or inaccessible content'
      };
    case 'MissingActivityContext':
      return {
        title: 'Activity unavailable',
        body: "We couldn't find the activity linked to this notification.",
        icon: '?',
        reasonLabel: 'Unavailable activity'
      };
    case 'UnknownNotificationTarget':
    default:
      return {
        title: 'Notification unavailable',
        body: 'This notification can no longer be opened.',
        icon: 'i',
        reasonLabel: 'Generic fallback'
      };
  }
}

export function normalizeFallbackReason(reason: unknown): NotificationFallbackReason | undefined {
  return reason === 'TargetActivityUnavailable' ||
    reason === 'BlockRelationshipExists' ||
    reason === 'MissingActivityContext' ||
    reason === 'UnknownNotificationTarget'
    ? reason
    : undefined;
}
