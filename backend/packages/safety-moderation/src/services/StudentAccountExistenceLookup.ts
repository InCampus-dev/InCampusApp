export interface StudentAccountExistenceLookup {
  exists(studentAccountId: string): Promise<boolean>;
}
