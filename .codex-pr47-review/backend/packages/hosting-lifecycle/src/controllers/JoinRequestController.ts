import { NextFunction, Request, Response } from "express";
import { AppError } from "../../../shared/src/errors/AppError";
import { requireStudentContext } from "../../../shared/src/middleware/auth";
import { JoinRequestManagementService } from "../services/JoinRequestManagementService";

export class JoinRequestController {
  constructor(private joinRequestService: JoinRequestManagementService) {}

  getRequests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const studentContext = requireCampusSelectedStudentContext(req);

      const { id: activityId } = req.params;
      const requests = await this.joinRequestService.getPendingRequests(
        studentContext.studentAccountId,
        studentContext.selectedCampusId,
        activityId
      );

      res.status(200).json({ data: requests });
    } catch (error) {
      next(normalizeJoinRequestError(error, req.params.id));
    }
  };

  reviewRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const studentContext = requireCampusSelectedStudentContext(req);

      const { id: activityId, requestId: participationId } = req.params;
      const { decision } = req.body; // 'approve' | 'decline'

      if (decision !== "approve" && decision !== "decline") {
        throw AppError.validation("Request validation failed", [
          {
            field: "decision",
            message: "Invalid decision. Use 'approve' or 'decline'",
            code: "invalid_join_request_decision"
          }
        ]);
      }

      const participation = await this.joinRequestService.reviewJoinRequest(
        studentContext.studentAccountId,
        studentContext.selectedCampusId,
        activityId,
        participationId,
        decision
      );
      res.status(200).json({ message: `Request ${decision}d successfully`, data: participation });
    } catch (error) {
      next(normalizeJoinRequestError(error, req.params.id, req.params.requestId));
    }
  };
}

function requireCampusSelectedStudentContext(request: Request): {
  studentAccountId: string;
  selectedCampusId: string;
} {
  const studentContext = requireStudentContext(request);

  if (!studentContext.selectedCampusId) {
    throw new AppError("AUTH_REQUIRED", "A selected campus is required", 401, {
      authReason: "missing_selected_campus"
    });
  }

  return {
    studentAccountId: studentContext.studentAccountId,
    selectedCampusId: studentContext.selectedCampusId
  };
}

function normalizeJoinRequestError(
  error: unknown,
  activityId: string,
  requestId?: string
): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (!(error instanceof Error)) {
    return new AppError("INTERNAL_ERROR", "Unexpected error", 500);
  }

  switch (error.message) {
    case "Activity not found":
      return AppError.notFound("Activity", activityId);
    case "Join request not found":
      return AppError.notFound("Participation", requestId ?? "unknown");
    case "Applicant profile not found":
      return AppError.notFound("StudentProfile", "applicant");
    case "Unauthorized: Only the host can view requests":
    case "Unauthorized: Only the host can review requests":
      return new AppError("AUTH_FORBIDDEN", error.message, 403, {
        authReason: "not_activity_host"
      });
    case "This request is not pending":
      return AppError.conflict(error.message, "Participation");
    case "Cannot approve request: Activity is already full":
    case "Cannot approve request: Student already has an active participation record":
      return AppError.conflict(error.message, "Activity");
    default:
      return new AppError("INTERNAL_ERROR", error.message, 500);
  }
}
