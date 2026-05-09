import { CampusId, StudentAccountId } from "../domain/dtos";
import { PlatformAccessStatus, VerificationStatus } from "../domain/enums";

export interface AuthenticatedStudentContext {
  studentAccountId: StudentAccountId;
  universityEmail: string;
  selectedCampusId?: CampusId | null;
  platformAccessStatus: PlatformAccessStatus;
  verificationStatus: VerificationStatus;
}
