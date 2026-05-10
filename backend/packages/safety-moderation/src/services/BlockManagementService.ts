import type {
  BlockCreatedDto,
  CreateBlockRequestDto
} from "../../../shared/src/domain/dtos";
import { AppError } from "../../../shared/src/errors/AppError";
import { BlockRelationship } from "../entities/BlockRelationship";
import { BlockRepo } from "../repositories/BlockRepo";
import { PendingParticipationConsequenceDispatcher } from "./PendingParticipationConsequenceDispatcher";
import { StudentAccountExistenceLookup } from "./StudentAccountExistenceLookup";

export class BlockManagementService {
  constructor(
    private readonly blockRepo: Pick<
      BlockRepo,
      "findByDirectedPair" | "instantiate" | "persist"
    >,
    private readonly studentAccountExistenceLookup: StudentAccountExistenceLookup,
    private readonly pendingParticipationConsequenceDispatcher: PendingParticipationConsequenceDispatcher
  ) {}

  public async createBlock(
    initiatorAccountId: string,
    request: CreateBlockRequestDto
  ): Promise<BlockCreatedDto> {
    const normalizedInitiatorAccountId = normalizeRequiredString(
      initiatorAccountId,
      "initiatorAccountId"
    );
    const targetAccountId = validateCreateBlockRequest(request);

    if (normalizedInitiatorAccountId === targetAccountId) {
      throw AppError.validation("Request validation failed", [
        {
          field: "targetAccountId",
          message: "must not match the authenticated student account",
          code: "self_block_not_allowed"
        }
      ]);
    }

    const existingBlockRelationship = await this.blockRepo.findByDirectedPair(
      normalizedInitiatorAccountId,
      targetAccountId
    );

    if (existingBlockRelationship) {
      return toBlockCreatedDto(existingBlockRelationship, true);
    }

    const targetAccountExists = await this.studentAccountExistenceLookup.exists(targetAccountId);

    if (!targetAccountExists) {
      throw AppError.notFound("StudentAccount", targetAccountId);
    }

    const blockRelationship = this.blockRepo.instantiate({
      initiatorAccountId: normalizedInitiatorAccountId,
      blockedAccountId: targetAccountId
    });

    try {
      const savedBlockRelationship = await this.blockRepo.persist(blockRelationship);

      await this.pendingParticipationConsequenceDispatcher.handleNewBlock({
        blockId: savedBlockRelationship.blockId,
        initiatorAccountId: savedBlockRelationship.initiatorAccountId,
        blockedAccountId: savedBlockRelationship.blockedAccountId
      });

      return toBlockCreatedDto(savedBlockRelationship, false);
    } catch (error) {
      if (isUniqueViolation(error)) {
        const concurrentBlockRelationship = await this.blockRepo.findByDirectedPair(
          normalizedInitiatorAccountId,
          targetAccountId
        );

        if (concurrentBlockRelationship) {
          return toBlockCreatedDto(concurrentBlockRelationship, true);
        }

        throw AppError.conflict("Block relationship already exists", "BlockRelationship");
      }

      throw error;
    }
  }
}

function validateCreateBlockRequest(request: CreateBlockRequestDto): string {
  const issues = [];

  if (!request || typeof request !== "object") {
    throw AppError.validation("Request validation failed", [
      {
        field: "body",
        message: "must be an object",
        code: "invalid_type"
      }
    ]);
  }

  const targetAccountId = normalizeOptionalString(request.targetAccountId);

  if (!targetAccountId) {
    issues.push({
      field: "targetAccountId",
      message: "must be a non-empty string",
      code: "invalid_type"
    });
  }

  if (issues.length > 0) {
    throw AppError.validation("Request validation failed", issues);
  }

  return targetAccountId;
}

function normalizeRequiredString(value: string, field: string): string {
  const normalizedValue = normalizeOptionalString(value);

  if (!normalizedValue) {
    throw AppError.validation("Request validation failed", [
      {
        field,
        message: "must be a non-empty string",
        code: "invalid_type"
      }
    ]);
  }

  return normalizedValue;
}

function normalizeOptionalString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();

  return normalizedValue.length === 0 ? null : normalizedValue;
}

function toBlockCreatedDto(
  blockRelationship: BlockRelationship,
  alreadyExisted: boolean
): BlockCreatedDto {
  return {
    blockId: blockRelationship.blockId,
    initiatorAccountId: blockRelationship.initiatorAccountId,
    blockedAccountId: blockRelationship.blockedAccountId,
    createdAt: blockRelationship.createdAt.toISOString(),
    alreadyExisted
  };
}

function isUniqueViolation(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "23505"
  );
}
