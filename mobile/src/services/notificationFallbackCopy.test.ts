import { describe, expect, it } from 'vitest';
import { getNotificationFallbackCopy } from './notificationFallbackCopy';

describe('getNotificationFallbackCopy', () => {
  it('maps known fallback reasons to friendly text', () => {
    expect(getNotificationFallbackCopy('TargetActivityUnavailable')).toMatchObject({
      title: 'Activity no longer available',
      reasonLabel: 'Target deleted or unavailable',
    });
    expect(getNotificationFallbackCopy('BlockRelationshipExists')).toMatchObject({
      title: 'Content not accessible',
      reasonLabel: 'Blocked or inaccessible content',
    });
    expect(getNotificationFallbackCopy('MissingActivityContext')).toMatchObject({
      title: 'Activity unavailable',
      reasonLabel: 'Unavailable activity',
    });
  });

  it('uses a safe generic fallback for missing or unknown reasons', () => {
    expect(getNotificationFallbackCopy(undefined)).toMatchObject({
      title: 'Notification unavailable',
      reasonLabel: 'Generic fallback',
    });
    expect(getNotificationFallbackCopy('UnexpectedReason')).toMatchObject({
      title: 'Notification unavailable',
      reasonLabel: 'Generic fallback',
    });
  });
});
