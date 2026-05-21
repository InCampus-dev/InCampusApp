import { beforeEach, describe, expect, it, vi } from "vitest";

import { InMemoryEventBus, type DirectJoinCompletedEvent } from "../events/EventBus";

describe("InMemoryEventBus", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("invokes multiple handlers subscribed to an event", async () => {
    const eventBus = new InMemoryEventBus();
    const firstHandler = vi.fn();
    const secondHandler = vi.fn();

    eventBus.subscribe("DirectJoinCompleted", firstHandler);
    eventBus.subscribe("DirectJoinCompleted", secondHandler);

    await eventBus.publish(createDirectJoinCompletedEvent());

    expect(firstHandler).toHaveBeenCalledTimes(1);
    expect(secondHandler).toHaveBeenCalledTimes(1);
  });

  it("logs a failing handler and still lets other handlers run", async () => {
    const eventBus = new InMemoryEventBus();
    const calls: string[] = [];
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    eventBus.subscribe("DirectJoinCompleted", () => {
      calls.push("failing");
      throw new Error("handler failed");
    });
    eventBus.subscribe("DirectJoinCompleted", async () => {
      calls.push("healthy");
    });

    await expect(eventBus.publish(createDirectJoinCompletedEvent())).resolves.toBeUndefined();

    expect(calls).toEqual(["failing", "healthy"]);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[EventBus] Handler failed for DirectJoinCompleted",
      expect.any(Error)
    );
  });
});

function createDirectJoinCompletedEvent(): DirectJoinCompletedEvent {
  return {
    eventId: "event-001",
    eventType: "DirectJoinCompleted",
    occurredAt: "2026-05-21T00:00:00.000Z",
    activityId: "activity-001",
    triggeringAccountId: "student-001",
    participationId: "participation-001"
  };
}
