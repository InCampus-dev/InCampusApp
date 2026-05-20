import type { Request, RequestHandler } from "express";

import type { AuthenticatedStudentContext } from "../auth/AuthenticatedStudentContext";
import { AppError } from "../errors/AppError";

declare module "express-serve-static-core" {
  interface Request {
    studentContext?: AuthenticatedStudentContext;
  }
}

export type StudentContextResolver = (
  request: Request
) => AuthenticatedStudentContext | null | Promise<AuthenticatedStudentContext | null>;

// Phase 1 can plug JWT verification into this resolver without changing route code.
export function createStudentAuthMiddleware(
  resolveStudentContext: StudentContextResolver
): RequestHandler {
  return async (request, _response, next) => {
    try {
      const studentContext = await resolveStudentContext(request);

      if (!studentContext) {
        next(
          new AppError("AUTH_REQUIRED", "Student authentication is required", 401, {
            authReason: "missing_student_context"
          })
        );
        return;
      }

      request.studentContext = studentContext;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireStudentContext(request: Request): AuthenticatedStudentContext {
  if (!request.studentContext) {
    throw new AppError("AUTH_REQUIRED", "Student authentication is required", 401, {
      authReason: "missing_student_context"
    });
  }

  return request.studentContext;
}
