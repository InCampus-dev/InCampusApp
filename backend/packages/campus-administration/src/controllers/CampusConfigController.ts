import type { Request, Response, NextFunction } from "express";

import { requireAdminContext } from "../../../shared/src/middleware/adminAuth";
import { CampusConfigurationService } from "../services/CampusConfigurationService";

export class CampusConfigController {
  constructor(private readonly campusConfigurationService: CampusConfigurationService) {}

  public createCampus = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const adminContext = requireAdminContext(request);
      const createdCampus = await this.campusConfigurationService.createCampus(
        adminContext,
        request.body
      );

      response.status(201).json(createdCampus);
    } catch (error) {
      next(error);
    }
  };
}
