import { describe, expect, it } from "vitest";

import {
  getEffectivePendingRequestLimit,
  getGuestCapacity,
  getTotalOccupancyIncludingHost,
  isGuestCapacityFull
} from "../services/activityCapacity";

describe("activity capacity helpers", () => {
  it("documents storage count as confirmed guests and display occupancy as host plus guests", () => {
    const activity = {
      maxParticipants: 2,
      currentParticipantCount: 0,
      maxRequests: null
    };

    expect(getGuestCapacity(activity)).toBe(1);
    expect(getTotalOccupancyIncludingHost(activity)).toBe(1);
    expect(isGuestCapacityFull(activity)).toBe(false);
  });

  it("marks host-only activities as full because guest capacity is zero", () => {
    const activity = {
      maxParticipants: 1,
      currentParticipantCount: 0,
      maxRequests: null
    };

    expect(getGuestCapacity(activity)).toBe(0);
    expect(getTotalOccupancyIncludingHost(activity)).toBe(1);
    expect(isGuestCapacityFull(activity)).toBe(true);
    expect(getEffectivePendingRequestLimit(activity)).toBe(0);
  });

  it("caps pending request limits by guest capacity", () => {
    expect(
      getEffectivePendingRequestLimit({
        maxParticipants: 2,
        currentParticipantCount: 0,
        maxRequests: 10
      })
    ).toBe(1);
  });
});
