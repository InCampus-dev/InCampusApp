import type { ActivityId, CampusId, StudentAccountId } from "../domain/dtos";
import {
  ActivityStatus,
  CampusStructuredOptionType,
  GenderPreference,
  ParticipationMode,
  PlatformAccessStatus,
  VerificationStatus
} from "../domain/enums";

export const demoCampusId: CampusId = "tongji-jiading";

export interface DemoCampusSeed {
  campusId: CampusId;
  universityName: string;
  campusName: string;
  activationStatus: boolean;
}

export interface DemoStructuredOptionSeed {
  optionId: string;
  campusId: CampusId;
  optionType: CampusStructuredOptionType;
  name: string;
  description: string | null;
  isActive: boolean;
}

export interface DemoStudentAccountSeed {
  studentAccountId: StudentAccountId;
  universityEmail: string;
  selectedCampusId: CampusId;
  platformAccessStatus: PlatformAccessStatus;
  verificationStatus: VerificationStatus;
}

export interface DemoStudentProfileSeed {
  profileId: string;
  studentAccountId: StudentAccountId;
  displayName: string;
  major: string;
  interests: string[];
  languages: string[];
}

export interface DemoActivitySeed {
  activityId: ActivityId;
  campusId: CampusId;
  hostAccountId: StudentAccountId;
  title: string;
  categoryId: string;
  categoryLabel: string;
  meetingPointId: string;
  meetingPointLabel: string;
  maxParticipants: number;
  participationMode: ParticipationMode;
  genderPreference: GenderPreference;
  status: ActivityStatus;
}

export interface DemoSeedData {
  campuses: DemoCampusSeed[];
  campusStructuredOptions: DemoStructuredOptionSeed[];
  studentAccounts: DemoStudentAccountSeed[];
  studentProfiles: DemoStudentProfileSeed[];
  activities: DemoActivitySeed[];
}

export const phase0DemoSeed: DemoSeedData = {
  campuses: [
    {
      campusId: demoCampusId,
      universityName: "Tongji University",
      campusName: "Jiading Campus",
      activationStatus: true
    }
  ],
  campusStructuredOptions: [
    {
      optionId: "demo-category-lunch",
      campusId: demoCampusId,
      optionType: CampusStructuredOptionType.ActivityCategory,
      name: "Lunch",
      description: "Low-pressure meals on or near campus.",
      isActive: true
    },
    {
      optionId: "demo-category-study",
      campusId: demoCampusId,
      optionType: CampusStructuredOptionType.ActivityCategory,
      name: "Study",
      description: "Small study sessions and project work.",
      isActive: true
    },
    {
      optionId: "demo-location-library",
      campusId: demoCampusId,
      optionType: CampusStructuredOptionType.CampusLocation,
      name: "Jiading Library",
      description: "Shared library meeting point.",
      isActive: true
    }
  ],
  studentAccounts: [
    {
      studentAccountId: "demo-student-001",
      universityEmail: "demo.student1@tongji.edu.cn",
      selectedCampusId: demoCampusId,
      platformAccessStatus: PlatformAccessStatus.Active,
      verificationStatus: VerificationStatus.Verified
    },
    {
      studentAccountId: "demo-student-002",
      universityEmail: "demo.student2@tongji.edu.cn",
      selectedCampusId: demoCampusId,
      platformAccessStatus: PlatformAccessStatus.Active,
      verificationStatus: VerificationStatus.Verified
    }
  ],
  studentProfiles: [
    {
      profileId: "demo-profile-001",
      studentAccountId: "demo-student-001",
      displayName: "Demo Host",
      major: "Software Engineering",
      interests: ["lunch", "language exchange"],
      languages: ["English", "Chinese"]
    },
    {
      profileId: "demo-profile-002",
      studentAccountId: "demo-student-002",
      displayName: "Demo Participant",
      major: "Design",
      interests: ["study", "coffee"],
      languages: ["English", "Italian"]
    }
  ],
  activities: [
    {
      activityId: "demo-activity-lunch-001",
      campusId: demoCampusId,
      hostAccountId: "demo-student-001",
      title: "Lunch near the library",
      categoryId: "demo-category-lunch",
      categoryLabel: "Lunch",
      meetingPointId: "demo-location-library",
      meetingPointLabel: "Jiading Library",
      maxParticipants: 4,
      participationMode: ParticipationMode.Open,
      genderPreference: GenderPreference.All,
      status: ActivityStatus.Open
    }
  ]
};

export interface DemoSeedSummary {
  campuses: number;
  campusStructuredOptions: number;
  studentAccounts: number;
  studentProfiles: number;
  activities: number;
}

export function summarizeDemoSeed(seed: DemoSeedData = phase0DemoSeed): DemoSeedSummary {
  return {
    campuses: seed.campuses.length,
    campusStructuredOptions: seed.campusStructuredOptions.length,
    studentAccounts: seed.studentAccounts.length,
    studentProfiles: seed.studentProfiles.length,
    activities: seed.activities.length
  };
}
