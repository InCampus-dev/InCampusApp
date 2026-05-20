import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response,
  type Router
} from "express";
import jwt from "jsonwebtoken";
import type { DataSource } from "typeorm";

import { createAccessProfileRoutes } from "../packages/access-profile/src/routes";
import { StudentAccountRepo } from "../packages/access-profile/src/repositories/StudentAccountRepo";
import { StudentProfileRepo } from "../packages/access-profile/src/repositories/StudentProfileRepo";
import { AccountModerationCommandHandler } from "../packages/access-profile/src/services/AccountModerationCommandHandler";
import { createCampusAdministrationRoutes } from "../packages/campus-administration/src/routes";
import { CampusRepo } from "../packages/campus-administration/src/repositories/CampusRepo";
import { CampusOptionsRepo } from "../packages/campus-administration/src/repositories/CampusOptionsRepo";
import { AdminInsightService } from "../packages/campus-administration/src/services/AdminInsightService";
import { CampusAuthorizationService } from "../packages/campus-administration/src/services/CampusAuthorizationService";
import { CampusConfigurationService } from "../packages/campus-administration/src/services/CampusConfigurationService";
import { CampusOptionsService } from "../packages/campus-administration/src/services/CampusOptionsService";
import { createDiscoveryParticipationRoutes } from "../packages/discovery-participation/src/routes";
import { ActivityRepo } from "../packages/hosting-lifecycle/src/repositories/ActivityRepo";
import { ParticipationRepo } from "../packages/hosting-lifecycle/src/repositories/ParticipationRepo";
import { createHostingLifecycleRoutes } from "../packages/hosting-lifecycle/src/routes";
import { ActivityModerationCommandHandler } from "../packages/hosting-lifecycle/src/services/ActivityModerationCommandHandler";
import { ApplicationOutcomeHandler } from "../packages/notifications-system-flow/src/handlers/ApplicationOutcomeHandler";
import { CancellationHandler } from "../packages/notifications-system-flow/src/handlers/CancellationHandler";
import { JoinEventHandler } from "../packages/notifications-system-flow/src/handlers/JoinEventHandler";
import { LeaveEventHandler } from "../packages/notifications-system-flow/src/handlers/LeaveEventHandler";
import { ReminderHandler } from "../packages/notifications-system-flow/src/handlers/ReminderHandler";
import { registerNSFHandlers } from "../packages/notifications-system-flow/src/handlers/registerNSFHandlers";
import { NotificationRepo } from "../packages/notifications-system-flow/src/repositories/NotificationRepo";
import { createNotificationsSystemFlowRoutes } from "../packages/notifications-system-flow/src/routes";
import { BlockSuppressionService } from "../packages/notifications-system-flow/src/services/BlockSuppressionService";
import { NotificationComposer } from "../packages/notifications-system-flow/src/services/NotificationComposer";
import { NotificationDispatcher } from "../packages/notifications-system-flow/src/services/NotificationDispatcher";
import { RecipientResolutionService } from "../packages/notifications-system-flow/src/services/RecipientResolutionService";
import { BlockRepo } from "../packages/safety-moderation/src/repositories/BlockRepo";
import { ReportRepo } from "../packages/safety-moderation/src/repositories/ReportRepo";
import { createSafetyModerationRoutes } from "../packages/safety-moderation/src/routes";
import { BlockManagementService } from "../packages/safety-moderation/src/services/BlockManagementService";
import { CommunityRulesContentProvider } from "../packages/safety-moderation/src/services/CommunityRulesContentProvider";
import { ModerationActionDispatcher } from "../packages/safety-moderation/src/services/ModerationActionDispatcher";
import { noOpPendingParticipationConsequenceDispatcher } from "../packages/safety-moderation/src/services/PendingParticipationConsequenceDispatcher";
import { ReportReviewService } from "../packages/safety-moderation/src/services/ReportReviewService";
import { ReportSubmissionService } from "../packages/safety-moderation/src/services/ReportSubmissionService";
import { type StudentAccountExistenceLookup } from "../packages/safety-moderation/src/services/StudentAccountExistenceLookup";
import type { AuthenticatedAdminContext } from "../packages/shared/src/auth/AuthenticatedAdminContext";
import type { AuthenticatedStudentContext } from "../packages/shared/src/auth/AuthenticatedStudentContext";
import { AppDataSource } from "../packages/shared/src/config/database";
import { PlatformAccessStatus, VerificationStatus } from "../packages/shared/src/domain/enums";
import { type HealthResponseDto } from "../packages/shared/src/domain/dtos";
import { AppError } from "../packages/shared/src/errors/AppError";
import { type EventBus, InMemoryEventBus } from "../packages/shared/src/events/EventBus";
import { InternalEventDispatcher } from "../packages/shared/src/events/InternalEventDispatcher";
import type { AdminContextResolver } from "../packages/shared/src/middleware/adminAuth";
import type { StudentContextResolver } from "../packages/shared/src/middleware/auth";

export interface CreateAppArgs {
  dataSource?: DataSource;
  eventBus?: EventBus;
  resolveAdminContext?: AdminContextResolver;
  resolveStudentContext?: StudentContextResolver;
}

export function createApp(args: CreateAppArgs = {}): Express {
  const app = express();
  const dataSource = args.dataSource ?? AppDataSource;
  const eventBus = args.eventBus ?? new InMemoryEventBus();
  const resolveAdminContext = args.resolveAdminContext ?? resolveAdminContextFromHeaders;
  const resolveStudentContext = args.resolveStudentContext ?? resolveStudentContextFromJwtOrHeaders;
  const campusRepo = new CampusRepo(dataSource);
  const campusOptionsRepo = new CampusOptionsRepo(dataSource);
  const blockRepo = new BlockRepo(dataSource);
  const reportRepo = new ReportRepo(dataSource);
  const studentAccountRepo = new StudentAccountRepo(dataSource);
  const studentProfileRepo = new StudentProfileRepo(dataSource);
  const activityRepo = new ActivityRepo(dataSource);
  const participationRepo = new ParticipationRepo(dataSource);
  const notificationRepo = new NotificationRepo(dataSource);
  const internalEventDispatcher = new InternalEventDispatcher(eventBus);
  const campusAuthorizationService = new CampusAuthorizationService();
  const campusConfigurationService = new CampusConfigurationService(
    dataSource,
    campusAuthorizationService
  );
  const campusOptionsService = new CampusOptionsService(
    campusRepo,
    campusOptionsRepo,
    campusAuthorizationService
  );
  const adminInsightService = new AdminInsightService(
    studentAccountRepo,
    studentProfileRepo,
    activityRepo,
    participationRepo,
    campusAuthorizationService
  );
  const studentAccountExistenceLookup: StudentAccountExistenceLookup = {
    async exists(studentAccountId: string): Promise<boolean> {
      return typeof studentAccountId === "string" && studentAccountId.trim().length > 0;
    }
  };
  const blockManagementService = new BlockManagementService(
    blockRepo,
    studentAccountExistenceLookup,
    noOpPendingParticipationConsequenceDispatcher
  );
  const communityRulesContentProvider = new CommunityRulesContentProvider();
  const reportSubmissionService = new ReportSubmissionService(reportRepo, studentAccountRepo);
  const accountModerationCommandHandler = new AccountModerationCommandHandler(studentAccountRepo);
  const activityModerationCommandHandler = new ActivityModerationCommandHandler(dataSource);
  const moderationActionDispatcher = new ModerationActionDispatcher(
    accountModerationCommandHandler,
    activityModerationCommandHandler
  );
  const reportReviewService = new ReportReviewService(
    reportRepo,
    studentAccountRepo,
    activityRepo,
    campusAuthorizationService,
    moderationActionDispatcher
  );
  const recipientResolutionService = new RecipientResolutionService(
    activityRepo,
    participationRepo,
    studentAccountRepo
  );
  const blockSuppressionService = new BlockSuppressionService(blockRepo);
  const notificationComposer = new NotificationComposer(notificationRepo);
  const notificationDispatcher = new NotificationDispatcher();
  const joinEventHandler = new JoinEventHandler(
    recipientResolutionService,
    blockSuppressionService,
    notificationComposer,
    notificationDispatcher
  );
  const applicationOutcomeHandler = new ApplicationOutcomeHandler(
    recipientResolutionService,
    blockSuppressionService,
    notificationComposer,
    notificationDispatcher
  );
  const cancellationHandler = new CancellationHandler(
    activityRepo,
    participationRepo,
    studentAccountRepo,
    blockSuppressionService,
    notificationComposer,
    notificationDispatcher
  );
  const leaveEventHandler = new LeaveEventHandler(
    activityRepo,
    studentAccountRepo,
    blockSuppressionService,
    notificationComposer,
    notificationDispatcher
  );
  const reminderHandler = new ReminderHandler(
    activityRepo,
    participationRepo,
    studentAccountRepo,
    notificationComposer,
    notificationDispatcher
  );

  registerNSFHandlers(
    eventBus,
    joinEventHandler,
    applicationOutcomeHandler,
    cancellationHandler,
    leaveEventHandler,
    reminderHandler
  );

  const moduleRouters: Array<{ basePath: string; router: Router }> = [
    {
      basePath: "/",
      router: createAccessProfileRoutes({ dataSource, resolveStudentContext })
    },
    {
      basePath: "/",
      router: createCampusAdministrationRoutes({
        resolveAdminContext,
        adminInsightService,
        campusConfigurationService,
        campusOptionsService
      })
    },
    {
      basePath: "/",
      router: createHostingLifecycleRoutes({
        dataSource,
        campusStructuredOptionLookup: campusOptionsService,
        resolveStudentContext,
        eventDispatcher: internalEventDispatcher
      })
    },
    {
      basePath: "/",
      router: createDiscoveryParticipationRoutes({
        dataSource,
        resolveStudentContext,
        eventDispatcher: internalEventDispatcher
      })
    },
    {
      basePath: "/",
      router: createSafetyModerationRoutes({
        resolveStudentContext,
        resolveAdminContext,
        blockManagementService,
        communityRulesContentProvider,
        reportSubmissionService,
        reportReviewService
      })
    },
    {
      basePath: "/",
      router: createNotificationsSystemFlowRoutes({
        dataSource,
        resolveStudentContext
      })
    }
  ];

  app.use(express.json());

  app.get("/health", (_request: Request, response: Response) => {
    const payload: HealthResponseDto = {
      status: "ok",
      service: "incampus-backend",
      architecture: "multi-tenant modular monolith"
    };

    response.status(200).json(payload);
  });

  moduleRouters.forEach(({ basePath, router }) => {
    app.use(basePath, router);
  });

  app.use(
    (error: unknown, _request: Request, response: Response, _next: NextFunction): void => {
      if (error instanceof AppError) {
        response.status(error.statusCode).json(error.toEnvelope());
        return;
      }

      console.error(error);

      const internalError = new AppError("INTERNAL_ERROR", "Unexpected error", 500);
      response.status(internalError.statusCode).json(internalError.toEnvelope());
    }
  );

  return app;
}

// Tries JWT Bearer token first; falls back to header-based resolution for dev/test convenience.
function resolveStudentContextFromJwtOrHeaders(request: Request): AuthenticatedStudentContext | null {
  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const payload = jwt.verify(
        token,
        process.env.JWT_SECRET ?? "inCampus-mvp-dev-secret"
      ) as {
        sub?: string;
        email?: string;
        campusId?: string | null;
        platformAccessStatus?: string;
        verificationStatus?: string;
      };

      const platformAccessStatus = parseEnumHeaderValue(
        payload.platformAccessStatus ?? "",
        PlatformAccessStatus
      );
      const verificationStatus = parseEnumHeaderValue(
        payload.verificationStatus ?? "",
        VerificationStatus
      );

      if (!payload.sub || !payload.email || !platformAccessStatus || !verificationStatus) {
        return null;
      }

      return {
        studentAccountId: payload.sub,
        universityEmail: payload.email,
        selectedCampusId: payload.campusId ?? null,
        platformAccessStatus,
        verificationStatus
      };
    } catch {
      return null;
    }
  }

  return resolveStudentContextFromHeaders(request);
}

function resolveAdminContextFromHeaders(request: Request): AuthenticatedAdminContext | null {
  const adminId = readRequiredHeader(request, "x-admin-id");
  const email = readRequiredHeader(request, "x-admin-email");
  const role = readRequiredHeader(request, "x-admin-role");
  const selectedCampusId = readRequiredHeader(request, "x-admin-selected-campus-id");
  const authorizedCampusIdsHeader = readRequiredHeader(
    request,
    "x-admin-authorized-campus-ids"
  );

  if (!adminId || !email || !role || !selectedCampusId || !authorizedCampusIdsHeader) {
    return null;
  }

  const authorizedCampusIds = authorizedCampusIdsHeader
    .split(",")
    .map((campusId) => campusId.trim())
    .filter((campusId) => campusId.length > 0);

  if (authorizedCampusIds.length === 0) {
    return null;
  }

  return {
    adminId,
    email,
    role,
    selectedCampusId,
    authorizedCampusIds
  };
}

function resolveStudentContextFromHeaders(request: Request): AuthenticatedStudentContext | null {
  const studentAccountId = readRequiredHeader(request, "x-student-account-id");
  const universityEmail = readRequiredHeader(request, "x-student-email");
  const platformAccessStatusHeader = readRequiredHeader(
    request,
    "x-student-platform-access-status"
  );
  const verificationStatusHeader = readRequiredHeader(
    request,
    "x-student-verification-status"
  );
  const selectedCampusId = readRequiredHeader(request, "x-student-selected-campus-id");

  if (
    !studentAccountId ||
    !universityEmail ||
    !platformAccessStatusHeader ||
    !verificationStatusHeader
  ) {
    return null;
  }

  const platformAccessStatus = parseEnumHeaderValue(
    platformAccessStatusHeader,
    PlatformAccessStatus
  );
  const verificationStatus = parseEnumHeaderValue(
    verificationStatusHeader,
    VerificationStatus
  );

  if (!platformAccessStatus || !verificationStatus) {
    return null;
  }

  return {
    studentAccountId,
    universityEmail,
    selectedCampusId,
    platformAccessStatus,
    verificationStatus
  };
}

function readRequiredHeader(request: Request, headerName: string): string | null {
  const headerValue = request.header(headerName);

  if (!headerValue) {
    return null;
  }

  const normalizedHeaderValue = headerValue.trim();

  return normalizedHeaderValue.length === 0 ? null : normalizedHeaderValue;
}

function parseEnumHeaderValue<T extends string>(
  value: string,
  enumObject: Record<string, T>
): T | null {
  return Object.values(enumObject).includes(value as T) ? (value as T) : null;
}
