import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";

import { NotificationRepo } from "../packages/notifications-system-flow/src/repositories/NotificationRepo";
import { PlatformAccessStatus, VerificationStatus } from "../packages/shared/src/domain/enums";
import { createApp } from "./app";

describe("GET /health", () => {
  it("returns the Phase 0 backend health payload", async () => {
    const app = createApp();
    const handler = findRouteHandler(app, "/health", "get");
    const response = createMockResponse();

    await handler({} as Request, response as unknown as Response);

    expect(response.statusCode).toBe(200);
    expect(response.jsonPayload).toEqual({
      status: "ok",
      service: "incampus-backend",
      architecture: "multi-tenant modular monolith"
    });
  });

  it("mounts the Safety & Moderation block and community rules routes", () => {
    const app = createApp();
    const routes = collectRoutes(app);

    expect(routes).toContainEqual({
      method: "post",
      path: "/auth/signup"
    });
    expect(routes).toContainEqual({
      method: "get",
      path: "/campuses"
    });
    expect(routes).toContainEqual({
      method: "get",
      path: "/campuses/:campusId/structured-options"
    });
    expect(routes).toContainEqual({
      method: "post",
      path: "/profiles"
    });
    expect(routes).toContainEqual({
      method: "get",
      path: "/profiles/me"
    });
    expect(routes).toContainEqual({
      method: "patch",
      path: "/profiles/me"
    });
    expect(routes).toContainEqual({
      method: "patch",
      path: "/accounts/me/consent"
    });
    expect(routes).toContainEqual({
      method: "post",
      path: "/admin/campuses"
    });
    expect(routes).toContainEqual({
      method: "get",
      path: "/admin/campuses/:campusId/student-insights"
    });
    expect(routes).toContainEqual({
      method: "post",
      path: "/blocks"
    });
    expect(routes).toContainEqual({
      method: "get",
      path: "/community-rules"
    });
    expect(routes).toContainEqual({
      method: "post",
      path: "/reports"
    });
    expect(routes).toContainEqual({
      method: "get",
      path: "/admin/campuses/:campusId/reports"
    });
    expect(routes).toContainEqual({
      method: "get",
      path: "/admin/campuses/:campusId/reports/:reportId"
    });
    expect(routes).toContainEqual({
      method: "patch",
      path: "/admin/campuses/:campusId/reports/:reportId/review"
    });
    expect(routes).toContainEqual({
      method: "get",
      path: "/activities"
    });
    expect(routes).toContainEqual({
      method: "get",
      path: "/activities/:id"
    });
    expect(routes).toContainEqual({
      method: "get",
      path: "/activities/:id/profiles/:studentAccountId"
    });
    expect(routes).toContainEqual({
      method: "post",
      path: "/activities/:id/join"
    });
    expect(routes).toContainEqual({
      method: "delete",
      path: "/activities/:id/requests/me"
    });
    expect(routes).toContainEqual({
      method: "delete",
      path: "/activities/:id/participants/me"
    });
    expect(routes).toContainEqual({
      method: "get",
      path: "/profiles/me/activities"
    });
    expect(routes).toContainEqual({
      method: "get",
      path: "/notifications"
    });
    expect(routes).toContainEqual({
      method: "get",
      path: "/notifications/:notificationId/context"
    });
  });

  it("requires student auth for POST /reports", async () => {
    const app = createApp();

    const response = await dispatchAppRequest(app, {
      method: "POST",
      path: "/reports",
      body: {
        campusId: "campus-001",
        targetType: "activity",
        targetActivityId: "activity-001",
        reasonCode: "unsafe_activity"
      }
    });

    expect(response.statusCode).toBe(401);
    expect(response.jsonPayload).toMatchObject({
      error: {
        code: "AUTH_REQUIRED"
      }
    });
  });

  it("requires admin auth for admin report routes", async () => {
    const app = createApp();

    const response = await dispatchAppRequest(app, {
      method: "GET",
      path: "/admin/campuses/campus-001/reports"
    });

    expect(response.statusCode).toBe(401);
    expect(response.jsonPayload).toMatchObject({
      error: {
        code: "AUTH_REQUIRED"
      }
    });
  });

  it("requires admin auth for campus student insights routes", async () => {
    const app = createApp();

    const response = await dispatchAppRequest(app, {
      method: "GET",
      path: "/admin/campuses/campus-001/student-insights"
    });

    expect(response.statusCode).toBe(401);
    expect(response.jsonPayload).toMatchObject({
      error: {
        code: "AUTH_REQUIRED"
      }
    });
  });

  it("requires student auth for POST /activities", async () => {
    const app = createApp();

    const response = await dispatchAppRequest(app, {
      method: "POST",
      path: "/activities",
      body: {
        title: "Study Session",
        categoryId: "category-001",
        scheduledDateTime: "2026-05-15T10:00:00.000Z",
        meetingPointId: "meeting-point-001",
        participationMode: "approval",
        maxParticipants: 10
      }
    });

    expect(response.statusCode).toBe(401);
    expect(response.jsonPayload).toMatchObject({
      error: {
        code: "AUTH_REQUIRED"
      }
    });
  });

  it("requires student auth for GET /activities/:id/requests", async () => {
    const app = createApp();

    const response = await dispatchAppRequest(app, {
      method: "GET",
      path: "/activities/activity-001/requests"
    });

    expect(response.statusCode).toBe(401);
    expect(response.jsonPayload).toMatchObject({
      error: {
        code: "AUTH_REQUIRED"
      }
    });
  });

  it("requires student auth for GET /activities", async () => {
    const app = createApp();

    const response = await dispatchAppRequest(app, {
      method: "GET",
      path: "/activities"
    });

    expect(response.statusCode).toBe(401);
    expect(response.jsonPayload).toMatchObject({
      error: {
        code: "AUTH_REQUIRED"
      }
    });
  });

  it("requires student auth for GET /campuses/:campusId/structured-options", async () => {
    const app = createApp();

    const response = await dispatchAppRequest(app, {
      method: "GET",
      path: "/campuses/:campusId/structured-options"
    });

    expect(response.statusCode).toBe(401);
    expect(response.jsonPayload).toMatchObject({
      error: {
        code: "AUTH_REQUIRED"
      }
    });
  });

  it("requires student auth for GET /activities/:id/profiles/:studentAccountId", async () => {
    const app = createApp();

    const response = await dispatchAppRequest(app, {
      method: "GET",
      path: "/activities/:id/profiles/:studentAccountId"
    });

    expect(response.statusCode).toBe(401);
    expect(response.jsonPayload).toMatchObject({
      error: {
        code: "AUTH_REQUIRED"
      }
    });
  });

  it("requires student auth for POST /activities/:id/join", async () => {
    const app = createApp();

    const response = await dispatchAppRequest(app, {
      method: "POST",
      path: "/activities/activity-001/join"
    });

    expect(response.statusCode).toBe(401);
    expect(response.jsonPayload).toMatchObject({
      error: {
        code: "AUTH_REQUIRED"
      }
    });
  });

  it("requires student auth for POST /profiles", async () => {
    const app = createApp();

    const response = await dispatchAppRequest(app, {
      method: "POST",
      path: "/profiles",
      body: {
        displayName: "Ada",
        major: "Computer Science"
      }
    });

    expect(response.statusCode).toBe(401);
    expect(response.jsonPayload).toMatchObject({
      error: {
        code: "AUTH_REQUIRED"
      }
    });
  });

  it("requires student auth for GET /profiles/me", async () => {
    const app = createApp();

    const response = await dispatchAppRequest(app, {
      method: "GET",
      path: "/profiles/me"
    });

    expect(response.statusCode).toBe(401);
    expect(response.jsonPayload).toMatchObject({
      error: {
        code: "AUTH_REQUIRED"
      }
    });
  });

  it("requires student auth for PATCH /profiles/me", async () => {
    const app = createApp();

    const response = await dispatchAppRequest(app, {
      method: "PATCH",
      path: "/profiles/me",
      body: {
        shortBio: "Updated bio"
      }
    });

    expect(response.statusCode).toBe(401);
    expect(response.jsonPayload).toMatchObject({
      error: {
        code: "AUTH_REQUIRED"
      }
    });
  });

  it("requires student auth for PATCH /accounts/me/consent", async () => {
    const app = createApp();

    const response = await dispatchAppRequest(app, {
      method: "PATCH",
      path: "/accounts/me/consent",
      body: {
        campusInsightSharingConsent: true
      }
    });

    expect(response.statusCode).toBe(401);
    expect(response.jsonPayload).toMatchObject({
      error: {
        code: "AUTH_REQUIRED"
      }
    });
  });

  it("requires student auth for GET /campuses", async () => {
    const app = createApp();

    const response = await dispatchAppRequest(app, {
      method: "GET",
      path: "/campuses"
    });

    expect(response.statusCode).toBe(401);
    expect(response.jsonPayload).toMatchObject({
      error: {
        code: "AUTH_REQUIRED"
      }
    });
  });

  it("accepts valid student context for GET /notifications", async () => {
    vi.spyOn(NotificationRepo.prototype, "findByRecipientPaginated").mockResolvedValue({
      records: [],
      total: 0
    });

    const app = createApp({
      resolveStudentContext: () => ({
        studentAccountId: "student-001",
        universityEmail: "student@tongji.edu.cn",
        selectedCampusId: "campus-001",
        platformAccessStatus: PlatformAccessStatus.Active,
        verificationStatus: VerificationStatus.Verified
      })
    });

    const response = await dispatchAppRequest(app, {
      method: "GET",
      path: "/notifications"
    });

    expect(response.statusCode).toBe(200);
    expect(response.jsonPayload).toEqual({
      notifications: [],
      page: 1,
      limit: 20,
      total: 0
    });
  });

  it("wires native moderation handlers into the dispatcher during app creation", async () => {
    const dispatcherConstructor = vi.fn();
    const dispatcherModulePath =
      "../packages/safety-moderation/src/services/ModerationActionDispatcher";

    vi.resetModules();

    try {
      vi.doMock(dispatcherModulePath, () => ({
        ModerationActionDispatcher: class {
          constructor(accountHandler?: unknown, activityHandler?: unknown) {
            dispatcherConstructor(accountHandler, activityHandler);
          }

          public async dispatch() {
            return { commandDispatchPending: false };
          }
        }
      }));

      const { createApp: createAppWithMockedDispatcher } = await import("./app");
      createAppWithMockedDispatcher();

      expect(dispatcherConstructor).toHaveBeenCalledTimes(1);
      const [accountHandler, activityHandler] = dispatcherConstructor.mock.calls[0] ?? [];

      expect(accountHandler).toBeDefined();
      expect(activityHandler).toBeDefined();
      expect((accountHandler as { constructor?: { name?: string } }).constructor?.name).toBe(
        "AccountModerationCommandHandler"
      );
      expect((activityHandler as { constructor?: { name?: string } }).constructor?.name).toBe(
        "ActivityModerationCommandHandler"
      );
    } finally {
      vi.doUnmock(dispatcherModulePath);
      vi.resetModules();
    }
  });

  it("registers NSF handlers on the shared event bus during app creation", () => {
    const eventBus = {
      publish: vi.fn(),
      subscribe: vi.fn(() => () => undefined)
    };

    createApp({ eventBus: eventBus as any });

    expect(eventBus.subscribe).toHaveBeenCalledTimes(7);
    expect(eventBus.subscribe).toHaveBeenCalledWith(
      "DirectJoinCompleted",
      expect.any(Function)
    );
    expect(eventBus.subscribe).toHaveBeenCalledWith(
      "JoinRequestSubmitted",
      expect.any(Function)
    );
    expect(eventBus.subscribe).toHaveBeenCalledWith(
      "JoinRequestApproved",
      expect.any(Function)
    );
    expect(eventBus.subscribe).toHaveBeenCalledWith(
      "JoinRequestDeclined",
      expect.any(Function)
    );
    expect(eventBus.subscribe).toHaveBeenCalledWith(
      "ActivityCancelled",
      expect.any(Function)
    );
    expect(eventBus.subscribe).toHaveBeenCalledWith(
      "JoinedParticipantLeft",
      expect.any(Function)
    );
    expect(eventBus.subscribe).toHaveBeenCalledWith(
      "ActivityReminderDue",
      expect.any(Function)
    );
  });
});

interface MockResponse {
  statusCode: number;
  headers: Record<string, string>;
  jsonPayload?: unknown;
  sendPayload?: unknown;
  finished: boolean;
  status(code: number): MockResponse;
  json(payload: unknown): MockResponse;
  send(payload?: unknown): MockResponse;
  end(payload?: unknown): MockResponse;
  setHeader(name: string, value: string): MockResponse;
  getHeader(name: string): string | undefined;
}

function createMockResponse(): MockResponse {
  return {
    statusCode: 200,
    headers: {},
    jsonPayload: undefined,
    sendPayload: undefined,
    finished: false,
    status(code: number): MockResponse {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown): MockResponse {
      this.jsonPayload = payload;
      this.finished = true;
      return this;
    },
    send(payload?: unknown): MockResponse {
      this.sendPayload = payload;
      this.finished = true;
      return this;
    },
    end(payload?: unknown): MockResponse {
      this.sendPayload = payload;
      this.finished = true;
      return this;
    },
    setHeader(name: string, value: string): MockResponse {
      this.headers[name.toLowerCase()] = value;
      return this;
    },
    getHeader(name: string): string | undefined {
      return this.headers[name.toLowerCase()];
    }
  };
}

interface DispatchRequestArgs {
  method: string;
  path: string;
  headers?: Record<string, string>;
  body?: unknown;
}

async function dispatchAppRequest(
  app: ReturnType<typeof createApp>,
  args: DispatchRequestArgs
): Promise<MockResponse> {
  const response = createMockResponse();
  const request = createMockRequest(app, args);
  const expressRouter = (app as unknown as { _router?: { stack?: Array<any> } })._router;
  const stack = expressRouter?.stack ?? [];

  await new Promise<void>((resolve, reject) => {
    let settled = false;

    const finish = (): void => {
      if (!settled) {
        settled = true;
        resolve();
      }
    };

    const fail = (error: unknown): void => {
      if (!settled) {
        settled = true;
        reject(error);
      }
    };

    attachCompletionCallback(response, finish);

    const errorLayer = stack.find((layer) => layer.handle?.length === 4);

    const dispatchError = (error: unknown): void => {
      if (!errorLayer) {
        fail(error instanceof Error ? error : new Error("Unhandled route error"));
        return;
      }

      try {
        errorLayer.handle(
          error,
          request as Request,
          response as unknown as Response,
          (nextError?: unknown) => {
            if (nextError) {
              fail(nextError);
              return;
            }

            finish();
          }
        );
      } catch (errorFromHandler) {
        fail(errorFromHandler);
      }
    };

    const runLayer = (index: number): void => {
      if (response.finished) {
        finish();
        return;
      }

      const layer = stack[index];

      if (!layer) {
        finish();
        return;
      }

      if (layer.handle?.length === 4 || layer.name === "jsonParser") {
        runLayer(index + 1);
        return;
      }

      if (!layer.route && !layer.handle?.stack) {
        runLayer(index + 1);
        return;
      }

      if (layer.route && !doesRouteMatch(layer.route, request.path, request.method)) {
        runLayer(index + 1);
        return;
      }

      invokeLayerHandler(
        layer.handle,
        request,
        response,
        (nextError?: unknown) => {
          if (nextError) {
            dispatchError(nextError);
            return;
          }

          runLayer(index + 1);
        },
        fail
      );
    };

    runLayer(0);
  });

  return response;
}

function attachCompletionCallback(
  response: MockResponse,
  onComplete: () => void
): void {
  const callbackCarrier = response as MockResponse & { __onComplete?: () => void };
  callbackCarrier.__onComplete = onComplete;

  const originalJson = response.json;
  const originalSend = response.send;
  const originalEnd = response.end;

  response.json = function json(payload: unknown): MockResponse {
    const result = originalJson.call(this, payload);
    callbackCarrier.__onComplete?.();
    return result;
  };

  response.send = function send(payload?: unknown): MockResponse {
    const result = originalSend.call(this, payload);
    callbackCarrier.__onComplete?.();
    return result;
  };

  response.end = function end(payload?: unknown): MockResponse {
    const result = originalEnd.call(this, payload);
    callbackCarrier.__onComplete?.();
    return result;
  };
}

function createMockRequest(
  app: ReturnType<typeof createApp>,
  args: DispatchRequestArgs
): Request {
  const normalizedHeaders = Object.fromEntries(
    Object.entries(args.headers ?? {}).map(([key, value]) => [key.toLowerCase(), value])
  );

  return {
    app,
    method: args.method,
    url: args.path,
    originalUrl: args.path,
    path: args.path,
    headers: normalizedHeaders,
    body: args.body,
    params: {},
    query: {},
    baseUrl: "",
    header(name: string): string | undefined {
      return normalizedHeaders[name.toLowerCase()];
    },
    get(name: string): string | undefined {
      return normalizedHeaders[name.toLowerCase()];
    }
  } as unknown as Request;
}

function invokeLayerHandler(
  handler: (
    request: Request,
    response: Response,
    next: (error?: unknown) => void
  ) => Promise<void> | void,
  request: Request,
  response: MockResponse,
  next: (error?: unknown) => void,
  fail: (error: unknown) => void
): void {
  try {
    const result = handler(request, response as unknown as Response, next);

    if (result && typeof result.then === "function") {
      result.catch(fail);
    }
  } catch (error) {
    fail(error);
  }
}

function doesRouteMatch(
  route: { path?: string; methods?: Record<string, boolean> },
  path: string,
  method: string
): boolean {
  return route.path === path && route.methods?.[method.toLowerCase()] === true;
}

function findRouteHandler(app: ReturnType<typeof createApp>, path: string, method: string) {
  const expressRouter = (app as unknown as { _router?: { stack?: Array<any> } })._router;
  const matchedLayer = expressRouter?.stack?.find(
    (layer) => layer.route?.path === path && layer.route?.methods?.[method] === true
  );

  if (!matchedLayer) {
    throw new Error(`Unable to find ${method.toUpperCase()} ${path} handler`);
  }

  return matchedLayer.route.stack[0].handle as (
    request: Request,
    response: Response
  ) => Promise<void> | void;
}

function collectRoutes(app: ReturnType<typeof createApp>): Array<{ method: string; path: string }> {
  const expressRouter = (app as unknown as { _router?: { stack?: Array<any> } })._router;
  const routes: Array<{ method: string; path: string }> = [];

  collectRoutesFromStack(expressRouter?.stack ?? [], routes);

  return routes;
}

function collectRoutesFromStack(
  stack: Array<any>,
  routes: Array<{ method: string; path: string }>
): void {
  stack.forEach((layer) => {
    if (layer.route?.path) {
      Object.keys(layer.route.methods)
        .filter((method) => layer.route.methods[method] === true)
        .forEach((method) => {
          routes.push({
            method,
            path: layer.route.path
          });
        });
    }

    if (layer.handle?.stack) {
      collectRoutesFromStack(layer.handle.stack, routes);
    }
  });
}
