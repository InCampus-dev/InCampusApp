import { CampusId } from "../domain/dtos";

export interface AuthenticatedAdminContext {
  adminId: string;
  email: string;
  role: string;
  authorizedCampusIds: CampusId[];
  selectedCampusId: CampusId;
}
