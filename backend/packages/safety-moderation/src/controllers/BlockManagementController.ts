import type { NextFunction, Request, Response } from "express";

import { requireStudentContext } from "../../../shared/src/middleware/auth";
import { BlockManagementService } from "../services/BlockManagementService";

export class BlockManagementController {
  constructor(private readonly blockManagementService: BlockManagementService) {}

  public createBlock = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const studentContext = requireStudentContext(request);
      const blockRelationship = await this.blockManagementService.createBlock(
        studentContext.studentAccountId,
        request.body
      );

      response.status(blockRelationship.alreadyExisted ? 200 : 201).json(blockRelationship);
    } catch (error) {
      next(error);
    }
  };
}
