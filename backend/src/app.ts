import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response,
  type Router
} from "express";
import type { DataSource } from "typeorm";

import { accessProfileRouter } from "../packages/access-profile/src/routes";
import { createCampusAdministrationRoutes } from "../packages/campus-administration/src/routes";
import { CampusRepo } from "../packages/campus-administration/src/repositories/CampusRepo";
import { CampusOptionsRepo } from "../packages/campus-administration/src/repositories/CampusOptionsRepo";
import { CampusAuthorizationService } from "../packages/campus-administration/src/services/CampusAuthorizationService";
import { CampusConfigurationService } from "../packages/campus-administration/src/services/CampusConfigurationService";
import { CampusOptionsService } from "../packages/campus-administration/src/services/CampusOptionsService";
import { discoveryParticipationRouter } from "../packages/discovery-participation/src/routes";
import { createHostingLifecycleRoutes } from "../packages/hosting-lifecycle/src/routes";
import { notificationsSystemFlowRouter } from "../packages/notifications-system-flow/src/routes";
import { safetyModerationRouter } from "../packages/safety-moderation/src/routes";
import type { AuthenticatedAdminContext } from "../packages/shared/src/auth/AuthenticatedAdminContext";
import { AppDataSource } from "../packages/shared/src/config/database";
import { type HealthResponseDto } from "../packages/shared/src/domain/dtos";
import { AppError } from "../packages/shared/src/errors/AppError";
import type { AdminContextResolver } from "../packages/shared/src/middleware/adminAuth";

export interface CreateAppArgs {
  dataSource?: DataSource;
  resolveAdminContext?: AdminContextResolver;
}

export function createApp(args: CreateAppArgs = {}): Express {
  const app = express();
  const dataSource = args.dataSource ?? AppDataSource;
  const resolveAdminContext = args.resolveAdminContext ?? resolveAdminContextFromHeaders;
  const campusRepo = new CampusRepo(dataSource);
  const campusOptionsRepo = new CampusOptionsRepo(dataSource);
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
  const moduleRouters: Array<{ basePath: string; router: Router }> = [
    { basePath: "/", router: accessProfileRouter },
    {
      basePath: "/",
      router: createCampusAdministrationRoutes({
        resolveAdminContext,
        campusConfigurationService,
        campusOptionsService
      })
    },
    {
      basePath: "/",
      router: createHostingLifecycleRoutes({
        dataSource,
        campusStructuredOptionLookup: campusOptionsService
      })
    },
    { basePath: "/", router: discoveryParticipationRouter },
    { basePath: "/", router: safetyModerationRouter },
    { basePath: "/", router: notificationsSystemFlowRouter }
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

function readRequiredHeader(request: Request, headerName: string): string | null {
  const headerValue = request.header(headerName);

  if (!headerValue) {
    return null;
  }

  const normalizedHeaderValue = headerValue.trim();

  return normalizedHeaderValue.length === 0 ? null : normalizedHeaderValue;
}
