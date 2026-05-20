import type { Request, Response, Router } from "express";
import { afterEach, describe, expect, it, vi, type Mock } from "vitest";

import type { AuthenticatedStudentContext } from "../../../shared/src/auth/AuthenticatedStudentContext";
import { PlatformAccessStatus, VerificationStatus } from "../../../shared/src/domain/enums";
import { AppError } from "../../../shared/src/errors/AppError";
import { Activity } from "../../../hosting-lifecycle/src/entities/Activity";
import { Participation } from "../../../hosting-lifecycle/src/entities/Participation";
import type { StudentProfile } from "../../../access-profile/src/entities/StudentProfile";
import type { BlockRelationship } from "../../../safety-moderation/src/entities/BlockRelationship";
import {
  ActivityStatus,
  GenderPreference,
  ParticipationMode,
  StudentProfileGender
} from "../../../shared/src/domain/enums";
import type { Activity as ActivityEntity } from "../../../hosting-lifecycle/src/entities/Activity";

vi.mock("../../../shared/src/db/transaction", () => ({
  executeTransaction: vi.fn(),
  findWithPessimisticWriteLock: vi.fn()
}));

describe("createDiscoveryParticipationRoutes", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.doUnmock("../../../safety-moderation/src/repositories/BlockRepo");
    vi.doUnmock("../../../access-profile/src/repositories/StudentProfileRepo");
  });

  it("uses real SM block data to suppress blocked hosts from the feed", async () => {
    const harness = await createRoutesHarness({
      activities: [
        createActivity({
          activityId: "activity-001",
          hostAccountId: "host-blocked",
          scheduledDateTime: new Date("2026-05-20T10:00:00.000Z")
        }),
        createActivity({
          activityId: "activity-002",
          hostAccountId: "host-visible",
          title: "Visible Activity",
          scheduledDateTime: new Date("2026-05-21T10:00:00.000Z")
        })
      ],
      blockRelationships: [
        createBlockRelationship({
          initiatorAccountId: "student-001",
          blockedAccountId: "host-blocked"
        })
      ]
    });

    const response = await dispatchRouterRoute(harness.router, {
      method: "GET",
      routePath: "/activities",
      path: "/activities"
    });

    expect(response.statusCode).toBe(200);
    expect(response.jsonPayload).toMatchObject({
      data: [
        {
          activityId: "activity-002",
          title: "Visible Activity",
          hostAccountId: "host-visible"
        }
      ]
    });
  });

  it("uses real AP profile data for activity details instead of the placeholder host profile", async () => {
    const harness = await createRoutesHarness({
      activities: [
        createActivity({
          activityId: "activity-001",
          hostAccountId: "host-001",
          scheduledDateTime: new Date("2026-05-20T10:00:00.000Z")
        })
      ],
      profiles: [
        createProfile({
          studentAccountId: "host-001",
          displayName: "Ada Lovelace",
          major: "Computer Science",
          interests: ["Robotics"]
        })
      ]
    });

    const response = await dispatchRouterRoute(harness.router, {
      method: "GET",
      routePath: "/activities/:id",
      path: "/activities/activity-001"
    });

    expect(response.statusCode).toBe(200);
    expect(response.jsonPayload).toMatchObject({
      data: {
        hostProfile: {
          studentAccountId: "host-001",
          displayName: "Ada Lovelace",
          major: "Computer Science",
          interests: ["Robotics"]
        }
      }
    });
    expect(
      (
        response.jsonPayload as {
          data?: { hostProfile?: { displayName?: string } };
        }
      ).data?.hostProfile?.displayName
    ).not.toBe("Host Student");
  });

  it("returns context-limited public profile data for the activity host", async () => {
    const harness = await createRoutesHarness({
      activities: [
        createActivity({
          activityId: "activity-001",
          hostAccountId: "host-001",
          scheduledDateTime: new Date("2026-05-20T10:00:00.000Z")
        })
      ],
      profiles: [
        createProfile({
          studentAccountId: "host-001",
          displayName: "Ada Lovelace",
          major: "Computer Science",
          dateOfBirth: "2001-04-18",
          gender: StudentProfileGender.PreferNotToSay,
          interests: ["Robotics"],
          languages: ["English"],
          shortBio: "Builder"
        })
      ]
    });

    const response = await dispatchRouterRoute(harness.router, {
      method: "GET",
      routePath: "/activities/:id/profiles/:studentAccountId",
      path: "/activities/activity-001/profiles/host-001"
    });

    expect(response.statusCode).toBe(200);
    expect(response.jsonPayload).toEqual({
      data: {
        studentAccountId: "host-001",
        displayName: "Ada Lovelace",
        major: "Computer Science",
        interests: ["Robotics"],
        languages: ["English"],
        shortBio: "Builder"
      }
    });
  });

  it("rejects context-limited public profile access for non-host students", async () => {
    const harness = await createRoutesHarness({
      activities: [
        createActivity({
          activityId: "activity-001",
          hostAccountId: "host-001",
          scheduledDateTime: new Date("2026-05-20T10:00:00.000Z")
        })
      ],
      profiles: [createProfile({ studentAccountId: "other-001" })]
    });

    const response = await dispatchRouterRoute(harness.router, {
      method: "GET",
      routePath: "/activities/:id/profiles/:studentAccountId",
      path: "/activities/activity-001/profiles/other-001"
    });

    expect(response.statusCode).toBe(404);
    expect(response.jsonPayload).toMatchObject({
      error: {
        code: "NOT_FOUND"
      }
    });
  });

});

async function createRoutesHarness(args: {
  activities: ActivityEntity[];
  blockRelationships?: BlockRelationship[];
  profiles?: StudentProfile[];
  studentContext?: AuthenticatedStudentContext;
}) {
  const activityStore = args.activities;
  const blockRelationshipStore = args.blockRelationships ?? [];
  const profileStore = args.profiles ?? [];
  const studentContext = args.studentContext ?? createStudentContext();
  const activityRepository = createActivityRepository(activityStore);
  const mockManager = {
    findOne: vi.fn().mockResolvedValue(null),
    create: vi.fn((_entity: unknown, payload: Record<string, unknown>) => ({
      participationId: "participation-001",
      ...payload
    })),
    save: vi.fn(async (_entity: unknown, instance: unknown) => instance)
  };
  const transactionModule = await import("../../../shared/src/db/transaction");

  (transactionModule.executeTransaction as Mock).mockImplementation(async (_dataSource, callback) => {
    return await callback(mockManager);
  });
  (transactionModule.findWithPessimisticWriteLock as Mock).mockImplementation(
    async (_manager, _entity, where: { activityId: string }) => {
      return activityStore.find((activity) => activity.activityId === where.activityId) ?? null;
    }
  );

  vi.doMock("../../../safety-moderation/src/repositories/BlockRepo", () => ({
    BlockRepo: class {
      public async find(args: {
        where: Array<{
          initiatorAccountId?: string;
          blockedAccountId?: string;
        }>;
      }): Promise<BlockRelationship[]> {
        return blockRelationshipStore.filter((blockRelationship) =>
          args.where.some((condition) => {
            const matchesInitiator =
              condition.initiatorAccountId === undefined ||
              blockRelationship.initiatorAccountId === condition.initiatorAccountId;
            const matchesBlocked =
              condition.blockedAccountId === undefined ||
              blockRelationship.blockedAccountId === condition.blockedAccountId;

            return matchesInitiator && matchesBlocked;
          })
        );
      }
    }
  }));

  vi.doMock("../../../access-profile/src/repositories/StudentProfileRepo", () => ({
    StudentProfileRepo: class {
      public async findByStudentAccountId(studentAccountId: string): Promise<StudentProfile | null> {
        return (
          profileStore.find((studentProfile) => studentProfile.studentAccountId === studentAccountId) ??
          null
        );
      }
    }
  }));

  const { createDiscoveryParticipationRoutes } = await import("../routes");
  const router = createDiscoveryParticipationRoutes({
    dataSource: {
      getRepository: vi.fn().mockImplementation((entity) => {
        if ((entity as { name?: string })?.name === Activity.name) {
          return activityRepository;
        }

        if ((entity as { name?: string })?.name === Participation.name) {
          return {
            findOne: vi.fn().mockResolvedValue(null)
          };
        }

        if ((entity as { name?: string })?.name === "StudentProfile") {
          return {
            findOne: vi.fn(async (query: { where: { studentAccountId: string } }) => {
              return (
                profileStore.find(
                  (studentProfile) => studentProfile.studentAccountId === query.where.studentAccountId
                ) ?? null
              );
            })
          };
        }

        throw new Error("Unexpected repository requested by D&P route test");
      })
    } as any,
    resolveStudentContext: async () => studentContext,
    eventDispatcher: {
      dispatch: vi.fn().mockResolvedValue(undefined)
    } as any
  });

  return { router, activityRepository, mockManager };
}

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

async function dispatchRouterRoute(
  router: Router,
  args: {
    method: string;
    routePath: string;
    path: string;
    headers?: Record<string, string>;
    body?: unknown;
  }
): Promise<MockResponse> {
  const response = createMockResponse();
  const request = createMockRequest(router, args);
  const stack = (router as unknown as { stack?: Array<any> }).stack ?? [];
  const routeLayer = stack.find(
    (layer) =>
      layer.route?.path === args.routePath &&
      layer.route?.methods?.[args.method.toLowerCase()] === true
  );

  if (!routeLayer) {
    throw new Error(`Unable to find ${args.method.toUpperCase()} ${args.routePath} route`);
  }

  const match = matchRoute(routeLayer.route, args.path, args.method);
  if (!match) {
    throw new Error(
      `Route ${args.method.toUpperCase()} ${args.routePath} did not match path ${args.path}`
    );
  }

  request.params = match.params;

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

    const dispatchError = (error: unknown): void => {
      if (!isAppErrorLike(error)) {
        fail(error instanceof Error ? error : new Error("Unhandled route error"));
        return;
      }

      response.status(error.statusCode).json(error.toEnvelope());
      finish();
    };

    invokeRouteStack(
      routeLayer.route.stack ?? [],
      request,
      response,
      (nextError?: unknown) => {
        if (nextError) {
          dispatchError(nextError);
          return;
        }

        finish();
      },
      fail
    );
  });

  return response;
}

function isAppErrorLike(error: unknown): error is AppError {
  return Boolean(
    error &&
      typeof error === "object" &&
      "statusCode" in error &&
      "toEnvelope" in error &&
      typeof (error as { toEnvelope?: unknown }).toEnvelope === "function"
  );
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
  app: unknown,
  args: {
    method: string;
    path: string;
    headers?: Record<string, string>;
    body?: unknown;
  }
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

function invokeRouteStack(
  stack: Array<{
    handle: (
      request: Request,
      response: Response,
      next: (error?: unknown) => void
    ) => Promise<void> | void;
  }>,
  request: Request,
  response: MockResponse,
  next: (error?: unknown) => void,
  fail: (error: unknown) => void
): void {
  const runHandler = (index: number): void => {
    if (response.finished) {
      next();
      return;
    }

    const layer = stack[index];

    if (!layer) {
      next();
      return;
    }

    invokeLayerHandler(
      layer.handle,
      request,
      response,
      (nextError?: unknown) => {
        if (nextError) {
          next(nextError);
          return;
        }

        runHandler(index + 1);
      },
      fail
    );
  };

  runHandler(0);
}

function matchRoute(
  route: { path?: string; methods?: Record<string, boolean> },
  path: string,
  method: string
): { params: Record<string, string> } | null {
  if (route.methods?.[method.toLowerCase()] !== true || !route.path) {
    return null;
  }

  const routeSegments = route.path.split("/").filter(Boolean);
  const pathSegments = path.split("/").filter(Boolean);

  if (routeSegments.length !== pathSegments.length) {
    return null;
  }

  const params: Record<string, string> = {};

  for (const [index, routeSegment] of routeSegments.entries()) {
    const pathSegment = pathSegments[index];

    if (routeSegment.startsWith(":")) {
      params[routeSegment.slice(1)] = pathSegment;
      continue;
    }

    if (routeSegment !== pathSegment) {
      return null;
    }
  }

  return { params };
}

function createActivityRepository(activities: ActivityEntity[]) {
  return {
    findOne: vi.fn(async (args: { where: { activityId: string } }) => {
      return activities.find((activity) => activity.activityId === args.where.activityId) ?? null;
    }),
    createQueryBuilder: vi.fn(() => {
      const queryState: {
        blockedIds: string[];
        campusId?: string;
        categoryId?: string;
        now?: Date;
        status?: ActivityStatus;
      } = {
        blockedIds: []
      };

      const queryBuilder = {
        where: vi.fn((sql: string, params: { campusId?: string }) => {
          if (sql.includes("activity.campusId")) {
            queryState.campusId = params.campusId;
          }

          return queryBuilder;
        }),
        andWhere: vi.fn((sql: string, params: Record<string, any>) => {
          if (sql.includes("activity.status")) {
            queryState.status = params.status;
          }
          if (sql.includes("activity.scheduledDateTime >")) {
            queryState.now = params.now;
          }
          if (sql.includes("activity.categoryId")) {
            queryState.categoryId = params.categoryId;
          }
          if (sql.includes("activity.hostAccountId NOT IN")) {
            queryState.blockedIds = params.blockedIds;
          }

          return queryBuilder;
        }),
        orderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn(async () => {
          return activities
            .filter((activity) =>
              queryState.campusId === undefined ? true : activity.campusId === queryState.campusId
            )
            .filter((activity) =>
              queryState.status === undefined ? true : activity.status === queryState.status
            )
            .filter((activity) =>
              queryState.now === undefined ? true : activity.scheduledDateTime > queryState.now
            )
            .filter((activity) =>
              queryState.categoryId === undefined
                ? true
                : activity.categoryId === queryState.categoryId
            )
            .filter((activity) => !queryState.blockedIds.includes(activity.hostAccountId))
            .sort(
              (left, right) =>
                left.scheduledDateTime.getTime() - right.scheduledDateTime.getTime()
            );
        })
      };

      return queryBuilder;
    })
  };
}

function createStudentContext(
  overrides: Partial<AuthenticatedStudentContext> = {}
): AuthenticatedStudentContext {
  return {
    studentAccountId: "student-001",
    universityEmail: "student@incampus.test",
    selectedCampusId: "campus-001",
    platformAccessStatus: PlatformAccessStatus.Active,
    verificationStatus: VerificationStatus.Verified,
    ...overrides
  };
}

function createActivity(overrides: Partial<ActivityEntity> = {}): ActivityEntity {
  return {
    activityId: "activity-default",
    campusId: "campus-001",
    hostAccountId: "host-default",
    title: "Default Activity",
    categoryId: "category-001",
    categoryLabel: "General",
    description: null,
    scheduledDateTime: new Date("2026-05-20T10:00:00.000Z"),
    scheduledEndDateTime: null,
    meetingPointId: "meeting-point-001",
    meetingPointLabel: "Main Gate",
    participationMode: ParticipationMode.Open,
    maxParticipants: 10,
    maxRequests: null,
    currentParticipantCount: 0,
    currentRequestCount: 0,
    genderPreference: GenderPreference.All,
    status: ActivityStatus.Open,
    createdAt: new Date("2026-05-10T00:00:00.000Z"),
    participations: [],
    ...overrides
  } as ActivityEntity;
}

function createProfile(overrides: Partial<StudentProfile> = {}): StudentProfile {
  return {
    profileId: "profile-001",
    studentAccountId: "host-default",
    displayName: "Host Student",
    major: "Undeclared",
    dateOfBirth: null,
    gender: StudentProfileGender.PreferNotToSay,
    interests: [],
    languages: [],
    shortBio: null,
    createdAt: new Date("2026-05-10T00:00:00.000Z"),
    updatedAt: null,
    ...overrides
  } as StudentProfile;
}

function createBlockRelationship(
  overrides: Partial<BlockRelationship> = {}
): BlockRelationship {
  return {
    blockId: "block-001",
    initiatorAccountId: "student-001",
    blockedAccountId: "host-001",
    createdAt: new Date("2026-05-10T00:00:00.000Z"),
    ...overrides
  } as BlockRelationship;
}
