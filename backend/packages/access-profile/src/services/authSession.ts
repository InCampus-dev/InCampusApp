import jwt from "jsonwebtoken";

import type { AuthenticatedResponseDto } from "../../../shared/src/domain/dtos";
import type {
  PlatformAccessStatus,
  VerificationStatus
} from "../../../shared/src/domain/enums";

const JWT_SECRET = process.env.JWT_SECRET ?? "inCampus-mvp-dev-secret";

export interface AuthSessionAccount {
  studentAccountId: string;
  universityEmail: string;
  selectedCampusId: string | null;
  platformAccessStatus: PlatformAccessStatus;
  verificationStatus: VerificationStatus;
}

export function buildAuthenticatedResponse(
  account: AuthSessionAccount
): AuthenticatedResponseDto {
  const tokenPayload = {
    sub: account.studentAccountId,
    email: account.universityEmail,
    campusId: account.selectedCampusId ?? null,
    platformAccessStatus: account.platformAccessStatus,
    verificationStatus: account.verificationStatus
  };
  const accessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "7d" });

  return {
    accessToken,
    studentAccountId: account.studentAccountId,
    selectedCampusId: account.selectedCampusId ?? null,
    platformAccessStatus: account.platformAccessStatus,
    verificationStatus: account.verificationStatus
  };
}
