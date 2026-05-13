import type { Request, Response } from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";

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
  });

  it("requires student auth for POST /reports", async () => {
    const app = createApp();

    const response = await request(app).post("/reports").send({
      campusId: "campus-001",
      targetType: "activity",
      targetActivityId: "activity-001",
      reasonCode: "unsafe_activity"
    });

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      error: {
        code: "AUTH_REQUIRED"
      }
    });
  });

  it("requires admin auth for admin report routes", async () => {
    const app = createApp();

    const response = await request(app).get("/admin/campuses/campus-001/reports");

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      error: {
        code: "AUTH_REQUIRED"
      }
    });
  });
});

interface MockResponse {
  statusCode?: number;
  jsonPayload?: unknown;
  status(code: number): MockResponse;
  json(payload: unknown): MockResponse;
}

function createMockResponse(): MockResponse {
  return {
    statusCode: undefined,
    jsonPayload: undefined,
    status(code: number): MockResponse {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown): MockResponse {
      this.jsonPayload = payload;
      return this;
    }
  };
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
