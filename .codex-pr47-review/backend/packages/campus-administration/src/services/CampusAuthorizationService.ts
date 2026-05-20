import type { AuthenticatedAdminContext } from "../../../shared/src/auth/AuthenticatedAdminContext";
import type { CampusId } from "../../../shared/src/domain/dtos";
import { AppError } from "../../../shared/src/errors/AppError";

export class CampusAuthorizationService {
  public assertCanConfigureSelectedCampus(
    adminContext: AuthenticatedAdminContext,
    requestedCampusId?: CampusId
  ): CampusId {
    const selectedCampusId = adminContext.selectedCampusId;

    if (!adminContext.authorizedCampusIds.includes(selectedCampusId)) {
      throw new AppError("AUTH_FORBIDDEN", "Admin is not authorized for this campus", 403, {
        authReason: "campus_not_authorized"
      });
    }

    if (requestedCampusId !== undefined && requestedCampusId !== selectedCampusId) {
      throw AppError.validation("Request validation failed", [
        {
          field: "campusId",
          message: "must match the authenticated admin selected campus",
          code: "campus_id_mismatch"
        }
      ]);
    }

    return selectedCampusId;
  }

  public assertCanManageCampus(
    adminContext: AuthenticatedAdminContext,
    campusId: CampusId
  ): void {
    if (adminContext.selectedCampusId !== campusId) {
      throw new AppError("AUTH_FORBIDDEN", "Admin is not authorized for this campus", 403, {
        authReason: "campus_scope_mismatch"
      });
    }

    if (!adminContext.authorizedCampusIds.includes(campusId)) {
      throw new AppError("AUTH_FORBIDDEN", "Admin is not authorized for this campus", 403, {
        authReason: "campus_not_authorized"
      });
    }
  }
}
