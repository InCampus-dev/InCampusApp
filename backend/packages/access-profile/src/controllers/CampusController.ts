// Task: AP07 | Path: backend/packages/access-profile/src/controllers/CampusController.ts
// STATUS: PARTIAL — AWAITING S08 SEED FROM FRANCESCO

import type { NextFunction, Request, Response } from "express";

import { AppError } from "../../../shared/src/errors/AppError";
import { requireStudentContext } from "../../../shared/src/middleware/auth";
import { CampusAssociationService } from "../services/CampusAssociationService";

export class CampusController {
  constructor(private readonly campusAssociationService: CampusAssociationService) {}

  // GET /campuses
  public getCampuses = async (
    _request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const campuses = await this.campusAssociationService.getCampuses();
      response.json(campuses);
    } catch (error) {
      next(error);
    }
  };

  // PATCH /accounts/me/campus
  public selectCampus = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const studentContext = requireStudentContext(request);
      const { campusId } = request.body;

      if (!campusId) {
        throw AppError.validation("Missing required fields", [
          { field: "campusId", message: "campusId is required", code: "missing_required_fields" }
        ]);
      }

      await this.campusAssociationService.selectCampus(studentContext.studentAccountId, campusId);
      response.json({ message: "Campus selected successfully" });
    } catch (error) {
      next(error);
    }
  };
}
