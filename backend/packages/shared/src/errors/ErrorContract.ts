export type ErrorCode =
  | "VALIDATION_ERROR"
  | "AUTH_REQUIRED"
  | "AUTH_FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL_ERROR"
  | "CONCURRENCY_CONFLICT"
  | "UNSUPPORTED_EMAIL_DOMAIN"
  | "ACCOUNT_NOT_VERIFIED"
  | "ACCOUNT_SUSPENDED"
  | "ACCOUNT_BANNED"
  | "CAMPUS_SCOPE_VIOLATION"
  | "BLOCK_RELATIONSHIP_EXISTS"
  | "TARGET_UNAVAILABLE";

export interface ValidationIssue {
  field: string;
  message: string;
  code?: string;
}

export interface ErrorEnvelope {
  error: {
    code: ErrorCode;
    message: string;
    requestId?: string;
    details?: {
      validation?: ValidationIssue[];
      resourceType?: string;
      resourceId?: string;
      conflictResource?: string;
      authReason?: string;
    };
  };
}
