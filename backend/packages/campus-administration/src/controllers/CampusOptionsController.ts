import type { NextFunction, Request, Response } from "express";

import { requireAdminContext } from "../../../shared/src/middleware/adminAuth";
import { CampusOptionsService } from "../services/CampusOptionsService";

export class CampusOptionsController {
  constructor(private readonly campusOptionsService: CampusOptionsService) {}

  public listStructuredOptions = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const adminContext = requireAdminContext(request);
      const structuredOptions = await this.campusOptionsService.listStructuredOptions(
        adminContext,
        request.params.campusId,
        {
          optionType: request.query.optionType,
          includeInactive: request.query.includeInactive
        }
      );

      response.status(200).json(structuredOptions);
    } catch (error) {
      next(error);
    }
  };

  public createStructuredOption = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const adminContext = requireAdminContext(request);
      const structuredOption = await this.campusOptionsService.createStructuredOption(
        adminContext,
        request.params.campusId,
        request.body
      );

      response.status(201).json(structuredOption);
    } catch (error) {
      next(error);
    }
  };

  public updateStructuredOption = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const adminContext = requireAdminContext(request);
      const structuredOption = await this.campusOptionsService.updateStructuredOption(
        adminContext,
        request.params.campusId,
        request.params.optionId,
        request.body
      );

      response.status(200).json(structuredOption);
    } catch (error) {
      next(error);
    }
  };

  public deleteStructuredOption = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const adminContext = requireAdminContext(request);
      const result = await this.campusOptionsService.deactivateStructuredOption(
        adminContext,
        request.params.campusId,
        request.params.optionId
      );

      response.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
