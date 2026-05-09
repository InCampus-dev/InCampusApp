import { ErrorCode, ErrorEnvelope, ValidationIssue } from "./ErrorContract";

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: ErrorEnvelope["error"]["details"];

  public constructor(
    code: ErrorCode,
    message: string,
    statusCode = 500,
    details?: ErrorEnvelope["error"]["details"]
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }

  public toEnvelope(requestId?: string): ErrorEnvelope {
    return {
      error: {
        code: this.code,
        message: this.message,
        requestId,
        details: this.details
      }
    };
  }

  public static validation(message: string, validation: ValidationIssue[]): AppError {
    return new AppError("VALIDATION_ERROR", message, 400, { validation });
  }

  public static notFound(resourceType: string, resourceId: string): AppError {
    return new AppError("NOT_FOUND", `${resourceType} not found`, 404, {
      resourceType,
      resourceId
    });
  }

  public static conflict(message: string, conflictResource: string): AppError {
    return new AppError("CONFLICT", message, 409, { conflictResource });
  }
}
