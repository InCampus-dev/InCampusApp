export type ModuleOwner = "AP" | "CA" | "H&L" | "SM" | "NSF";

export type CanonicalStoreId =
  | "DS-CA-001"
  | "DS-CA-002"
  | "DS-AP-001"
  | "DS-AP-002"
  | "DS-AP-003"
  | "DS-HL-001"
  | "DS-HL-002"
  | "DS-SM-001"
  | "DS-SM-002"
  | "DS-NS-001";

export interface CanonicalStoreOwnership {
  storeId: CanonicalStoreId;
  ownerModule: ModuleOwner;
  label: string;
  physicalTable?: string;
}

export const canonicalStoreOwnership: readonly CanonicalStoreOwnership[] = [
  { storeId: "DS-CA-001", ownerModule: "CA", label: "Campus Configuration" },
  {
    storeId: "DS-CA-002",
    ownerModule: "CA",
    label: "Campus Structured Options",
    physicalTable: "campus_structured_options"
  },
  { storeId: "DS-AP-001", ownerModule: "AP", label: "Student Account" },
  { storeId: "DS-AP-002", ownerModule: "AP", label: "Student Profile" },
  { storeId: "DS-AP-003", ownerModule: "AP", label: "University Identity Rules" },
  { storeId: "DS-HL-001", ownerModule: "H&L", label: "Activities" },
  { storeId: "DS-HL-002", ownerModule: "H&L", label: "Activity Participations" },
  { storeId: "DS-SM-001", ownerModule: "SM", label: "Block Relationships" },
  { storeId: "DS-SM-002", ownerModule: "SM", label: "Report Records" },
  { storeId: "DS-NS-001", ownerModule: "NSF", label: "Notification Records" }
];

export interface DbConstraintNote {
  name: string;
  storeId: CanonicalStoreId;
  ownerModule: ModuleOwner;
  columns: readonly string[];
  physicalTable?: string;
  note: string;
}

export const phase1DbConstraintNotes: readonly DbConstraintNote[] = [
  {
    name: "uq_campus_structured_options_campus_type_name",
    storeId: "DS-CA-002",
    ownerModule: "CA",
    physicalTable: "campus_structured_options",
    columns: ["campusId", "optionType", "name"],
    note: "DS-CA-002 is one physical table shared by activity categories and campus locations."
  },
  {
    name: "active_participation_uniqueness_strategy",
    storeId: "DS-HL-002",
    ownerModule: "H&L",
    columns: ["activityId", "studentAccountId"],
    note: "Prevent duplicate active request/participation records for one student and activity; implement in the H&L migration with the final table/index shape."
  }
];
