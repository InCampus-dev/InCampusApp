import {
  CampusStructuredOptionType,
  ParticipationMode
} from "../packages/shared/src/domain/enums";
import { demoPassword, phase0DemoSeed } from "../packages/shared/src/seed/demoSeed";
import { demoMockActivities } from "../packages/shared/src/seed/demoMockActivities";

type CheckKind = "required" | "conditional" | "skipped";
type CheckStatus = "PASS" | "FAIL" | "SKIPPED" | "BLOCKED";

interface SmokeResult {
  kind: CheckKind;
  status: CheckStatus;
  name: string;
  detail: string;
}

interface AuthResponse {
  accessToken: string;
  studentAccountId: string;
  selectedCampusId: string | null;
}

interface CampusDto {
  campusId: string;
  universityName: string;
  campusName: string;
  activationStatus: boolean;
}

interface StructuredOptionDto {
  optionId: string;
  campusId: string;
  optionType: CampusStructuredOptionType;
  name: string;
  isActive: boolean;
}

interface ActivityDto {
  activityId: string;
  title: string;
  categoryId: string;
  categoryLabel: string;
  meetingPointId: string;
  meetingPointLabel: string;
  participationMode: ParticipationMode;
}

interface ParticipationDto {
  participationId: string;
  activityId: string;
  studentAccountId: string;
  status: string;
}

interface JoinRequestListItemDto {
  requestId: string;
  activityId: string;
  applicantId: string;
  status: string;
  createdAt: string;
  applicant: {
    applicantId: string;
    displayName: string;
    major: string;
    shortBio: string | null;
  };
}

interface NotificationListResponse {
  notifications: NotificationListItem[];
  total: number;
}

interface NotificationListItem {
  notificationId: string;
  notificationTitle: string;
  relatedActivityId: string | null;
  targetContextType: string;
}

interface NotificationContextResponse {
  notificationId: string;
  contextType: string;
  accessible: boolean;
  fallbackReason?: string;
}

class CheckSkipped extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "CheckSkipped";
  }
}

const baseUrl = (process.env.DEMO_API_BASE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
const runId = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
const hostSeed = phase0DemoSeed.studentAccounts[0];
const guestSeed = phase0DemoSeed.studentAccounts[1];
const seededOpenActivity = phase0DemoSeed.activities.find(
  (activity) => activity.participationMode === ParticipationMode.Open
);

const results: SmokeResult[] = [];
let hostAuth: AuthResponse | null = null;
let guestAuth: AuthResponse | null = null;
let campusId: string | null = null;
let category: StructuredOptionDto | null = null;
let meetingPoint: StructuredOptionDto | null = null;
let directActivityId: string | null = null;
let approvalActivityId: string | null = null;
let directJoinNotificationId: string | null = null;

async function main(): Promise<void> {
  console.log(`[Demo Smoke] Base URL: ${baseUrl}`);

  try {
    await runDemoChecks();
  } finally {
    await cleanupSmokeActivities();
  }

  printSummary();
  const failed = results.filter((result) => result.status === "FAIL");
  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

async function runDemoChecks(): Promise<void> {
  await required("health check", async () => {
    const health = await getJson<{ status: string; service: string }>("/health");
    assert(health.status === "ok", "Expected health status ok");
    return `${health.service} is healthy`;
  });

  await required("demo host and guest sign in", async () => {
    hostAuth = await signIn(hostSeed.universityEmail, demoPassword);
    guestAuth = await signIn(guestSeed.universityEmail, demoPassword);
    assert(hostAuth.accessToken.length > 0, "Host access token missing");
    assert(guestAuth.accessToken.length > 0, "Guest access token missing");
    campusId = hostAuth.selectedCampusId ?? guestAuth.selectedCampusId;
    assert(Boolean(campusId), "Seeded accounts must have selectedCampusId");
    return `host=${hostAuth.studentAccountId}, guest=${guestAuth.studentAccountId}`;
  });

  await required("campus selection refreshes token", async () => {
    requireAuth();
    const refreshedHost = await patchJson<AuthResponse>(
      "/accounts/me/campus",
      { campusId },
      hostAuth!.accessToken
    );
    const refreshedGuest = await patchJson<AuthResponse>(
      "/accounts/me/campus",
      { campusId },
      guestAuth!.accessToken
    );
    hostAuth = refreshedHost;
    guestAuth = refreshedGuest;
    assert(refreshedHost.selectedCampusId === campusId, "Host campus was not selected");
    assert(refreshedGuest.selectedCampusId === campusId, "Guest campus was not selected");
    return `selectedCampusId=${campusId}`;
  });

  await required("profile read", async () => {
    requireAuth();
    const hostProfile = await getJson<{ displayName: string }>("/profiles/me", hostAuth!.accessToken);
    const guestProfile = await getJson<{ displayName: string }>(
      "/profiles/me",
      guestAuth!.accessToken
    );
    assert(hostProfile.displayName.length > 0, "Host profile missing displayName");
    assert(guestProfile.displayName.length > 0, "Guest profile missing displayName");
    return `host=${hostProfile.displayName}, guest=${guestProfile.displayName}`;
  });

  await required("campus list includes demo campus", async () => {
    requireAuth();
    const campuses = await getJson<CampusDto[]>("/campuses", hostAuth!.accessToken);
    const campus = campuses.find((item) => item.campusId === campusId);
    assert(Boolean(campus), "Demo campus not returned by /campuses");
    return `${campus!.universityName} / ${campus!.campusName}`;
  });

  await required("structured options are present", async () => {
    requireAuth();
    const options = await getJson<StructuredOptionDto[]>(
      `/admin/campuses/${campusId}/structured-options`,
      undefined,
      adminHeaders()
    );
    const categories = options.filter(
      (option) => option.optionType === CampusStructuredOptionType.ActivityCategory
    );
    const locations = options.filter(
      (option) => option.optionType === CampusStructuredOptionType.CampusLocation
    );
    category = categories.find((option) => option.name === "Lunch") ?? categories[0] ?? null;
    meetingPoint =
      locations.find((option) => option.name === "Library Plaza") ?? locations[0] ?? null;
    assert(categories.length >= 5, "Expected at least 5 demo activity categories");
    assert(locations.length >= 4, "Expected at least 4 demo campus locations");
    assert(Boolean(category), "No category available for smoke create");
    assert(Boolean(meetingPoint), "No meeting point available for smoke create");
    return `categories=${categories.length}, locations=${locations.length}`;
  });

  await required("seeded feed and detail are readable", async () => {
    requireAuth();
    assert(Boolean(seededOpenActivity), "No seeded open activity configured");
    const feed = await getJson<ActivityDto[]>("/activities", guestAuth!.accessToken);
    assert(
      feed.every((item) => !item.title.includes("[DEMO]")),
      "Seeded feed should not expose [DEMO] activity titles"
    );
    const activity = feed.find((item) => item.title === seededOpenActivity!.title);
    assert(Boolean(activity), `Seeded activity not visible: ${seededOpenActivity!.title}`);
    const mockActivityTitles = new Set(demoMockActivities.map((item) => item.title));
    const visibleMockActivities = feed.filter((item) => mockActivityTitles.has(item.title));
    const visibleMockModes = new Set(
      visibleMockActivities.map((item) => item.participationMode)
    );
    assert(
      visibleMockActivities.length >= 18,
      `Expected at least 18 visible demo mock activities, found ${visibleMockActivities.length}`
    );
    assert(
      visibleMockModes.has(ParticipationMode.Open) &&
        visibleMockModes.has(ParticipationMode.ApprovalBased),
      "Expected demo mock activities to include both open and approval-based modes"
    );
    const detail = await getJson<ActivityDto>(
      `/activities/${activity!.activityId}`,
      guestAuth!.accessToken
    );
    assert(detail.activityId === activity!.activityId, "Activity detail id mismatch");
    return `${detail.title}; mockActivities=${visibleMockActivities.length}`;
  });

  await conditional("create smoke direct-join activity through backend", async () => {
    requireAuth();
    requireStructuredOptions();
    const activity = await createSmokeActivity("Direct Join", ParticipationMode.Open);
    directActivityId = activity.activityId;
    return activity.title;
  });

  await conditional("guest direct-joins smoke activity", async () => {
    requireAuth();
    if (!directActivityId) {
      throw new CheckSkipped("direct smoke activity was not created");
    }
    const participation = await postJson<ParticipationDto>(
      `/activities/${directActivityId}/join`,
      {},
      guestAuth!.accessToken
    );
    assert(participation.activityId === directActivityId, "Direct join activity mismatch");
    return `participation=${participation.participationId}`;
  });

  await conditional("host notification record/list/context for direct join", async () => {
    requireAuth();
    if (!directActivityId) {
      throw new CheckSkipped("direct smoke activity was not created");
    }
    const notification = await findNotification(hostAuth!.accessToken, directActivityId);
    directJoinNotificationId = notification.notificationId;
    const context = await getJson<NotificationContextResponse>(
      `/notifications/${notification.notificationId}/context`,
      hostAuth!.accessToken
    );
    assert(context.accessible === true, "Direct join notification context should be accessible");
    return `${notification.notificationTitle} -> ${context.contextType}`;
  });

  await conditional("create smoke approval activity through backend", async () => {
    requireAuth();
    requireStructuredOptions();
    const activity = await createSmokeActivity("Approval Request", ParticipationMode.ApprovalBased);
    approvalActivityId = activity.activityId;
    return activity.title;
  });

  await conditional("guest request and host approval", async () => {
    requireAuth();
    if (!approvalActivityId) {
      throw new CheckSkipped("approval smoke activity was not created");
    }
    const request = await postJson<ParticipationDto>(
      `/activities/${approvalActivityId}/join`,
      {},
      guestAuth!.accessToken
    );
    const pendingRequests = await getJson<JoinRequestListItemDto[]>(
      `/activities/${approvalActivityId}/requests`,
      hostAuth!.accessToken
    );
    const pendingRequest = pendingRequests.find(
      (item) => item.requestId === request.participationId
    );
    assert(
      Boolean(pendingRequest),
      "Pending request not returned to host"
    );
    const approved = await patchJson<ParticipationDto>(
      `/activities/${approvalActivityId}/requests/${pendingRequest!.requestId}`,
      { decision: "approve" },
      hostAuth!.accessToken
    );
    assert(approved.status === "confirmed", "Approved request did not become confirmed");
    return `approved=${approved.participationId}`;
  });

  await conditional("guest notification record/list/context for approval outcome", async () => {
    requireAuth();
    if (!approvalActivityId) {
      throw new CheckSkipped("approval smoke activity was not created");
    }
    const notification = await findNotification(guestAuth!.accessToken, approvalActivityId);
    const context = await getJson<NotificationContextResponse>(
      `/notifications/${notification.notificationId}/context`,
      guestAuth!.accessToken
    );
    assert(context.accessible === true, "Approval notification context should be accessible");
    return `${notification.notificationTitle} -> ${context.contextType}`;
  });

  await conditional("notification fallback after smoke activity deletion", async () => {
    requireAuth();
    if (!directActivityId || !directJoinNotificationId) {
      throw new CheckSkipped("direct notification was not created");
    }
    await deleteSmokeActivity(directActivityId);
    directActivityId = null;
    const fallback = await getJson<NotificationContextResponse>(
      `/notifications/${directJoinNotificationId}/context`,
      hostAuth!.accessToken
    );
    assert(fallback.accessible === false, "Deleted activity notification should use fallback");
    return fallback.fallbackReason ?? "fallback";
  });

  skipped("mobile create activity UI", "T09 is outside backend smoke and must be verified in Expo");
  skipped("mobile feed refresh / join / manage UI", "T10-T12 are verified by mobile checklist");
  skipped("push delivery", "NotificationDispatcher is a known stub; smoke checks records only");
}

async function required(name: string, run: () => Promise<string>): Promise<void> {
  await runCheck("required", name, run);
}

async function conditional(name: string, run: () => Promise<string>): Promise<void> {
  await runCheck("conditional", name, run);
}

function skipped(name: string, detail: string): void {
  record({ kind: "skipped", status: "SKIPPED", name, detail });
}

async function runCheck(
  kind: Exclude<CheckKind, "skipped">,
  name: string,
  run: () => Promise<string>
): Promise<void> {
  try {
    const detail = await run();
    record({ kind, status: "PASS", name, detail });
  } catch (error) {
    if (error instanceof CheckSkipped) {
      record({ kind, status: "SKIPPED", name, detail: error.message });
      return;
    }

    record({
      kind,
      status: "FAIL",
      name,
      detail: error instanceof Error ? error.message : String(error)
    });
  }
}

function record(result: SmokeResult): void {
  results.push(result);
  console.log(`[${result.status}] ${result.kind}: ${result.name} - ${result.detail}`);
}

function printSummary(): void {
  const counts = results.reduce<Record<CheckStatus, number>>(
    (accumulator, result) => {
      accumulator[result.status] += 1;
      return accumulator;
    },
    { PASS: 0, FAIL: 0, SKIPPED: 0, BLOCKED: 0 }
  );

  console.log(
    `[Demo Smoke] Summary: pass=${counts.PASS}, fail=${counts.FAIL}, ` +
      `skipped=${counts.SKIPPED}, blocked=${counts.BLOCKED}`
  );
}

async function signIn(email: string, password: string): Promise<AuthResponse> {
  return postJson<AuthResponse>("/auth/signin", {
    universityEmail: email,
    password
  });
}

async function createSmokeActivity(label: string, mode: ParticipationMode): Promise<ActivityDto> {
  const startsAt = new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString();
  const endsAt = new Date(Date.now() + 37 * 60 * 60 * 1000).toISOString();
  const isApprovalBased = mode === ParticipationMode.ApprovalBased;

  return postJson<ActivityDto>(
    "/activities",
    {
      title: `Smoke ${label} ${runId}`,
      description: `Backend smoke check activity for ${label}.`,
      categoryId: category!.optionId,
      scheduledDateTime: startsAt,
      scheduledEndDateTime: endsAt,
      meetingPointId: meetingPoint!.optionId,
      participationMode: mode,
      maxParticipants: isApprovalBased ? 2 : 4,
      maxRequests: isApprovalBased ? 1 : undefined,
      genderPreference: "all"
    },
    hostAuth!.accessToken
  );
}

async function cleanupSmokeActivities(): Promise<void> {
  const smokeActivities = [
    { label: "direct smoke activity", activityId: directActivityId },
    { label: "approval smoke activity", activityId: approvalActivityId }
  ].filter((item): item is { label: string; activityId: string } => Boolean(item.activityId));

  for (const { label, activityId } of smokeActivities) {
    try {
      await deleteSmokeActivity(activityId);
      if (activityId === directActivityId) {
        directActivityId = null;
      }
      if (activityId === approvalActivityId) {
        approvalActivityId = null;
      }
      record({ kind: "conditional", status: "PASS", name: `cleanup ${label}`, detail: "deleted" });
    } catch (error) {
      record({
        kind: "conditional",
        status: "FAIL",
        name: `cleanup ${label}`,
        detail: error instanceof Error ? error.message : String(error)
      });
    }
  }
}

async function deleteSmokeActivity(activityId: string): Promise<void> {
  if (!hostAuth) {
    throw new CheckSkipped("host auth prerequisite missing");
  }
  await deleteRequest(`/activities/${activityId}`, hostAuth.accessToken);
}

async function findNotification(
  token: string,
  relatedActivityId: string
): Promise<NotificationListItem> {
  const response = await getJson<NotificationListResponse>(
    "/notifications?page=1&limit=20",
    token
  );
  const notification = response.notifications.find(
    (item) => item.relatedActivityId === relatedActivityId
  );
  assert(Boolean(notification), `No notification found for activity ${relatedActivityId}`);

  return notification!;
}

async function getJson<T>(
  path: string,
  token?: string,
  extraHeaders?: Record<string, string>
): Promise<T> {
  return requestJson<T>("GET", path, undefined, token, extraHeaders);
}

async function postJson<T>(path: string, body: unknown, token?: string): Promise<T> {
  return requestJson<T>("POST", path, body, token);
}

async function patchJson<T>(path: string, body: unknown, token?: string): Promise<T> {
  return requestJson<T>("PATCH", path, body, token);
}

async function deleteRequest(path: string, token?: string): Promise<void> {
  await requestJson<unknown>("DELETE", path, undefined, token);
}

async function requestJson<T>(
  method: string,
  path: string,
  body?: unknown,
  token?: string,
  extraHeaders?: Record<string, string>
): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extraHeaders
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {})
  });
  const responseBody = await parseResponse(response);

  if (!response.ok) {
    throw new Error(`${method} ${path} failed with ${response.status}: ${formatBody(responseBody)}`);
  }

  return unwrapData(responseBody) as T;
}

async function parseResponse(response: Response): Promise<unknown> {
  const rawText = await response.text();
  if (!rawText) {
    return null;
  }

  try {
    return JSON.parse(rawText);
  } catch {
    return rawText;
  }
}

function unwrapData(responseBody: unknown): unknown {
  if (
    responseBody &&
    typeof responseBody === "object" &&
    Object.prototype.hasOwnProperty.call(responseBody, "data")
  ) {
    return (responseBody as { data: unknown }).data;
  }

  return responseBody;
}

function formatBody(responseBody: unknown): string {
  return typeof responseBody === "string" ? responseBody : JSON.stringify(responseBody);
}

function adminHeaders(): Record<string, string> {
  return {
    "x-admin-id": "demo-admin",
    "x-admin-email": "demo.admin@tongji.edu.cn",
    "x-admin-role": "campus_admin",
    "x-admin-selected-campus-id": campusId!,
    "x-admin-authorized-campus-ids": campusId!
  };
}

function requireAuth(): void {
  if (!hostAuth || !guestAuth || !campusId) {
    throw new CheckSkipped("auth prerequisite missing");
  }
}

function requireStructuredOptions(): void {
  if (!category || !meetingPoint) {
    throw new CheckSkipped("structured options prerequisite missing");
  }
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

void main().catch((error) => {
  console.error("[Demo Smoke] Unexpected failure", error);
  process.exit(1);
});
