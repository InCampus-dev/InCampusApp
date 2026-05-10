import type { Request, Response } from "express";
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
