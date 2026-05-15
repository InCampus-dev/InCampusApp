/**
 * AP/NSF Integration Tests — Demo Scenarios 1, 5, 6
 *
 * Cross-module integration tests verifying AP and NSF modules work together
 * through the actual Express app. Uses supertest for HTTP-level verification,
 * InMemoryEventBus for event integration, and mock student context resolvers.
 *
 * Scenario 1 — Full Onboarding Route Wiring (DUC-AP-01 through DUC-AP-07)
 * Scenario 5 — Join Event Triggers Host Notification (DUC-NSF-01)
 * Scenario 6 — Reminder Fan-Out (DUC-NSF-05)
 *
 * Note: These tests verify route mounting, auth enforcement, and event bus
 * wiring at the Express layer. Full database integration requires S08 seed
 * data which is outside this sprint's scope.
 */

import { describe, it, expect, vi } from "vitest";
import request from "supertest";

import { createApp } from "../app";
import {
  PlatformAccessStatus,
  VerificationStatus,
  NotificationType,
  TargetContextType
} from "../../packages/shared/src/domain/enums";
import { InMemoryEventBus } from "../../packages/shared/src/events/EventBus";
import { NotificationRepo } from "../../packages/notifications-system-flow/src/repositories/NotificationRepo";

// ── Shared test fixtures ──────────────────────────────────────────────────

const STUDENT_A_CONTEXT = {
  studentAccountId: "student-a-001",
  universityEmail: "student.a@tongji.edu.cn",
  selectedCampusId: "campus-001",
  platformAccessStatus: PlatformAccessStatus.Active,
  verificationStatus: VerificationStatus.Verified
};

const STUDENT_B_CONTEXT = {
  studentAccountId: "student-b-002",
  universityEmail: "student.b@tongji.edu.cn",
  selectedCampusId: "campus-001",
  platformAccessStatus: PlatformAccessStatus.Active,
  verificationStatus: VerificationStatus.Verified
};

// ═══════════════════════════════════════════════════════════════════════════
// Scenario 1 — Full Onboarding Route Wiring
// ═══════════════════════════════════════════════════════════════════════════

describe("Scenario 1 — Full Onboarding Route Wiring", () => {
  it("mounts POST /auth/signup for student registration", async () => {
    const app = createApp();
    const res = await request(app).post("/auth/signup").send({});
    // Route is mounted; without DB it may return error, but not 404
    expect(res.status).not.toBe(404);
  });

  it("mounts POST /auth/verify-email for email verification", async () => {
    const app = createApp();
    const res = await request(app).post("/auth/verify-email").send({});
    expect(res.status).not.toBe(404);
  });

  it("mounts POST /auth/signin for sign-in", async () => {
    const app = createApp();
    const res = await request(app).post("/auth/signin").send({});
    expect(res.status).not.toBe(404);
  });

  it("enforces student auth on GET /campuses", async () => {
    const app = createApp();
    const res = await request(app).get("/campuses");
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ error: { code: "AUTH_REQUIRED" } });
  });

  it("enforces student auth on PATCH /accounts/me/campus", async () => {
    const app = createApp();
    const res = await request(app)
      .patch("/accounts/me/campus")
      .send({ campusId: "campus-001" });
    expect(res.status).toBe(401);
  });

  it("enforces student auth on POST /profiles", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/profiles")
      .send({ displayName: "Test", major: "CS" });
    expect(res.status).toBe(401);
  });

  it("enforces student auth on PATCH /accounts/me/consent", async () => {
    const app = createApp();
    const res = await request(app)
      .patch("/accounts/me/consent")
      .send({ campusInsightSharingConsent: true });
    expect(res.status).toBe(401);
  });

  it("allows authenticated student to access GET /campuses", async () => {
    const app = createApp({
      resolveStudentContext: () => STUDENT_A_CONTEXT
    });
    const res = await request(app).get("/campuses");
    // With auth resolved, the route processes (may fail on DB but won't be 401)
    expect(res.status).not.toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Scenario 5 — Join Event Triggers Host Notification
// ═══════════════════════════════════════════════════════════════════════════

describe("Scenario 5 — Join Event Triggers Host Notification", () => {
  it("wires JoinRequestSubmitted event handler on the shared event bus", () => {
    const eventBus = new InMemoryEventBus();
    const subscribeSpy = vi.spyOn(eventBus, "subscribe");

    createApp({ eventBus });

    expect(subscribeSpy).toHaveBeenCalledWith(
      "JoinRequestSubmitted",
      expect.any(Function)
    );
  });

  it("wires DirectJoinCompleted event handler on the shared event bus", () => {
    const eventBus = new InMemoryEventBus();
    const subscribeSpy = vi.spyOn(eventBus, "subscribe");

    createApp({ eventBus });

    expect(subscribeSpy).toHaveBeenCalledWith(
      "DirectJoinCompleted",
      expect.any(Function)
    );
  });

  it("enforces student auth on GET /notifications", async () => {
    const app = createApp();
    const res = await request(app).get("/notifications");
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ error: { code: "AUTH_REQUIRED" } });
  });

  it("returns paginated notifications for authenticated student", async () => {
    vi.spyOn(NotificationRepo.prototype, "findByRecipientPaginated").mockResolvedValue({
      records: [
        {
          notificationId: "notif-001",
          recipientAccountId: STUDENT_A_CONTEXT.studentAccountId,
          notificationType: NotificationType.JoinEvent,
          notificationChannels: "PushAndInApp",
          notificationTitle: "New join request",
          notificationMessage: "A student has requested to join your activity.",
          relatedActivityId: "activity-001",
          relatedParticipationId: "participation-001",
          targetContextType: TargetContextType.JoinRequestReview,
          targetContextId: "activity-001",
          triggeringAccountId: STUDENT_B_CONTEXT.studentAccountId,
          createdAt: new Date("2026-05-14T09:00:00.000Z")
        }
      ] as any,
      total: 1
    });

    const app = createApp({
      resolveStudentContext: () => STUDENT_A_CONTEXT
    });
    const res = await request(app).get("/notifications");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      notifications: [
        {
          notificationId: "notif-001",
          notificationType: NotificationType.JoinEvent,
          notificationTitle: "New join request",
          triggeringAccountId: STUDENT_B_CONTEXT.studentAccountId
        }
      ],
      page: 1,
      limit: 20,
      total: 1
    });

    vi.restoreAllMocks();
  });

  it("enforces student auth on GET /notifications/:notificationId/context", async () => {
    const app = createApp();
    const res = await request(app).get("/notifications/notif-001/context");
    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Scenario 6 — Reminder Fan-Out
// ═══════════════════════════════════════════════════════════════════════════

describe("Scenario 6 — Reminder Fan-Out", () => {
  it("wires ActivityReminderDue event handler on the shared event bus", () => {
    const eventBus = new InMemoryEventBus();
    const subscribeSpy = vi.spyOn(eventBus, "subscribe");

    createApp({ eventBus });

    expect(subscribeSpy).toHaveBeenCalledWith(
      "ActivityReminderDue",
      expect.any(Function)
    );
  });

  it("wires JoinRequestApproved and JoinRequestDeclined event handlers", () => {
    const eventBus = new InMemoryEventBus();
    const subscribeSpy = vi.spyOn(eventBus, "subscribe");

    createApp({ eventBus });

    expect(subscribeSpy).toHaveBeenCalledWith(
      "JoinRequestApproved",
      expect.any(Function)
    );
    expect(subscribeSpy).toHaveBeenCalledWith(
      "JoinRequestDeclined",
      expect.any(Function)
    );
  });

  it("registers all 7 expected event subscriptions", () => {
    const eventBus = new InMemoryEventBus();
    const subscribeSpy = vi.spyOn(eventBus, "subscribe");

    createApp({ eventBus });

    expect(subscribeSpy).toHaveBeenCalledTimes(7);
    const registeredEvents = subscribeSpy.mock.calls.map((call) => call[0]);
    expect(registeredEvents).toContain("DirectJoinCompleted");
    expect(registeredEvents).toContain("JoinRequestSubmitted");
    expect(registeredEvents).toContain("JoinRequestApproved");
    expect(registeredEvents).toContain("JoinRequestDeclined");
    expect(registeredEvents).toContain("ActivityCancelled");
    expect(registeredEvents).toContain("JoinedParticipantLeft");
    expect(registeredEvents).toContain("ActivityReminderDue");
  });
});
