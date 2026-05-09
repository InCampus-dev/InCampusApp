import type { Request, RequestHandler } from "express";

import type { AuthenticatedAdminContext } from "../auth/AuthenticatedAdminContext";
import type { CampusId } from "../domain/dtos";
import { AppError } from "../errors/AppError";

declare module "express-serve-static-core" {
  interface Request {
    adminContext?: AuthenticatedAdminContext;
  }
}

export type AdminContextResolver = (
  request: Request
) => AuthenticatedAdminContext | null | Promise<AuthenticatedAdminContext | null>;

// Admin identity is runtime context only; Phase 0 does not introduce an admin store.
export function createAdminAuthMiddleware(
  resolveAdminContext: AdminContextResolver
): RequestHandler {
  return async (request, _response, next) => {
    try {
      const adminContext = await resolveAdminContext(request);

      if (!adminContext) {
        next(
          new AppError("AUTH_REQUIRED", "Admin authentication is required", 401, {
            authReason: "missing_admin_context"
          })
        );
        return;
      }

      request.adminContext = adminContext;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireAdminContext(request: Request): AuthenticatedAdminContext {
  if (!request.adminContext) {
    throw new AppError("AUTH_REQUIRED", "Admin authentication is required", 401, {
      authReason: "missing_admin_context"
    });
  }

  return request.adminContext;
}

export function assertAdminCanAccessCampus(
  adminContext: AuthenticatedAdminContext,
  campusId: CampusId
): void {
  if (!adminContext.authorizedCampusIds.includes(campusId)) {
    throw new AppError("AUTH_FORBIDDEN", "Admin is not authorized for this campus", 403, {
      authReason: "campus_not_authorized"
    });
  }
}

export function requireAdminContextForCampus(
  request: Request,
  campusId: CampusId
): AuthenticatedAdminContext {
  const adminContext = requireAdminContext(request);
  assertAdminCanAccessCampus(adminContext, campusId);

  return adminContext;
}
