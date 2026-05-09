import express, { type Express, type Request, type Response, type Router } from "express";

import { accessProfileRouter } from "../packages/access-profile/src/routes";
import { campusAdministrationRouter } from "../packages/campus-administration/src/routes";
import { discoveryParticipationRouter } from "../packages/discovery-participation/src/routes";
import { hostingLifecycleRouter } from "../packages/hosting-lifecycle/src/routes";
import { notificationsSystemFlowRouter } from "../packages/notifications-system-flow/src/routes";
import { safetyModerationRouter } from "../packages/safety-moderation/src/routes";
import { type HealthResponseDto } from "../packages/shared/src/domain/dtos";

const moduleRouters: Array<{ basePath: string; router: Router }> = [
  { basePath: "/", router: accessProfileRouter },
  { basePath: "/", router: campusAdministrationRouter },
  { basePath: "/", router: hostingLifecycleRouter },
  { basePath: "/", router: discoveryParticipationRouter },
  { basePath: "/", router: safetyModerationRouter },
  { basePath: "/", router: notificationsSystemFlowRouter }
];

export function createApp(): Express {
  const app = express();

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

  return app;
}
