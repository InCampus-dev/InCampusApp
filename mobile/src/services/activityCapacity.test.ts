import { describe, expect, it } from 'vitest';
import {
  getDisplayParticipantCountIncludingHost,
  getJoinedCountLabel,
  getOccupancyRatioIncludingHost
} from './activityCapacity';

describe('activity capacity display helpers', () => {
  it('displays host plus confirmed guests while backend count stays guest-only', () => {
    const activity = { currentParticipantCount: 0, maxParticipants: 2 };

    expect(getDisplayParticipantCountIncludingHost(activity)).toBe(1);
    expect(getJoinedCountLabel(activity)).toBe('1/2 joined');
    expect(getOccupancyRatioIncludingHost(activity)).toBe(0.5);
  });

  it('clamps display occupancy to total capacity', () => {
    expect(getDisplayParticipantCountIncludingHost({ currentParticipantCount: 5, maxParticipants: 2 })).toBe(2);
  });
});
