import type { NextFunction, Request, Response } from "express";

import { UpdateCampusInsightConsentRequestDto } from "../../../shared/src/domain/dtos";
import { AppError } from "../../../shared/src/errors/AppError";
import { requireStudentContext } from "../../../shared/src/middleware/auth";
import { CampusInsightConsentService } from "../services/CampusInsightConsentService";

export class ConsentController {
  constructor(private readonly campusInsightConsentService: CampusInsightConsentService) {}

  public updateOwnConsent = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const studentContext = requireStudentContext(request);
      const { campusInsightSharingConsent } =
        request.body as UpdateCampusInsightConsentRequestDto;

      if (typeof campusInsightSharingConsent !== "boolean") {
        throw AppError.validation("Request validation failed", [
          {
            field: "campusInsightSharingConsent",
            message: "campusInsightSharingConsent must be a boolean",
            code: "invalid_field_type"
          }
        ]);
      }

      const consent = await this.campusInsightConsentService.updateOwnConsent(
        studentContext.studentAccountId,
        campusInsightSharingConsent
      );

      response.status(200).json({ data: consent });
    } catch (error) {
      next(error);
    }
  };
}
