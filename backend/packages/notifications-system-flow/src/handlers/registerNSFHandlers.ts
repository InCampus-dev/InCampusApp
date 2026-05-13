// Path: backend/packages/notifications-system-flow/src/handlers/registerNSFHandlers.ts

/**
 * Registers NSF event handlers on the shared EventBus.
 * Called during NSF module initialization.
 *
 * Day 3 handlers: JoinEventHandler (NSF02), ApplicationOutcomeHandler (NSF03).
 * Day 4 handler:  ReminderHandler (NSF06) — not registered here yet.
 * Francesco's handlers: CancellationHandler (NSF04), LeaveEventHandler (NSF05).
 */
import { ApplicationOutcomeHandler } from "./ApplicationOutcomeHandler";
import { CancellationHandler } from "./CancellationHandler";
import { JoinEventHandler } from "./JoinEventHandler";
import { LeaveEventHandler } from "./LeaveEventHandler";
import type { EventBus } from "../../../shared/src/events/EventBus";

export function registerNSFHandlers(
  eventBus: EventBus,
  joinHandler: JoinEventHandler,
  outcomeHandler: ApplicationOutcomeHandler,
  cancellationHandler: CancellationHandler,
  leaveEventHandler: LeaveEventHandler
): void {
  for (const eventType of joinHandler.getHandledEvents()) {
    eventBus.subscribe(eventType, (event) => joinHandler.handle(event));
  }

  for (const eventType of outcomeHandler.getHandledEvents()) {
    eventBus.subscribe(eventType, (event) => outcomeHandler.handle(event));
  }

  for (const eventType of cancellationHandler.getHandledEvents()) {
    eventBus.subscribe(eventType, (event) => cancellationHandler.handle(event));
  }

  for (const eventType of leaveEventHandler.getHandledEvents()) {
    eventBus.subscribe(eventType, (event) => leaveEventHandler.handle(event));
  }

  console.log(
    "[NSF] Handlers registered: JoinEventHandler (NSF02), ApplicationOutcomeHandler (NSF03), " +
      "CancellationHandler (NSF04), LeaveEventHandler (NSF05)"
  );
}
