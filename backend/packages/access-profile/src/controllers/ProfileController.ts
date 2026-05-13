import type { NextFunction, Request, Response } from "express";

import {
  CreateStudentProfileRequestDto,
  UpdateStudentProfileRequestDto
} from "../../../shared/src/domain/dtos";
import { requireStudentContext } from "../../../shared/src/middleware/auth";
import { StudentProfileService } from "../services/StudentProfileService";

export class ProfileController {
  constructor(private readonly studentProfileService: StudentProfileService) {}

  public createProfile = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const studentContext = requireStudentContext(request);
      const studentProfile = await this.studentProfileService.createOwnProfile(
        studentContext.studentAccountId,
        request.body as CreateStudentProfileRequestDto
      );

      response.status(201).json({ data: studentProfile });
    } catch (error) {
      next(error);
    }
  };

  public getOwnProfile = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const studentContext = requireStudentContext(request);
      const studentProfile = await this.studentProfileService.getOwnProfile(
        studentContext.studentAccountId
      );

      response.status(200).json({ data: studentProfile });
    } catch (error) {
      next(error);
    }
  };

  public updateOwnProfile = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const studentContext = requireStudentContext(request);
      const studentProfile = await this.studentProfileService.updateOwnProfile(
        studentContext.studentAccountId,
        request.body as UpdateStudentProfileRequestDto
      );

      response.status(200).json({ data: studentProfile });
    } catch (error) {
      next(error);
    }
  };
}
