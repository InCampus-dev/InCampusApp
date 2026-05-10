import type { ActivityId, CampusId, StudentAccountId } from "../domain/dtos";
import {
  ActivityStatus,
  CampusStructuredOptionType,
  GenderPreference,
  ParticipationMode,
  PlatformAccessStatus,
  VerificationStatus
} from "../domain/enums";

export const demoCampusId: CampusId = "1d8a58b3-4df0-40fe-9ad0-5bd563c13d6f";
export const demoCategoryLunchOptionId = "87fe4ec4-0d68-45c1-b7c2-0abef2e3ef70";
export const demoCategoryStudyOptionId = "d5f86aa2-7d8a-4c83-8426-d6f6b7b0ad7a";
export const demoLibraryLocationOptionId = "f2af15aa-d347-4037-8f1e-f6b4e8616d06";
export const demoStudentAccountOneId: StudentAccountId = "e5a8f8d7-34cd-4696-bf0f-1d2b89c29fbc";
export const demoStudentAccountTwoId: StudentAccountId = "845e6c55-e3fe-4aa0-9e0f-b2968876c4c8";
export const demoStudentProfileOneId = "8bc2ea96-b3b7-4b15-8c03-1c8b42d5d6d0";
export const demoStudentProfileTwoId = "b7f2e5f0-f780-4244-b03f-deddb8ffc16f";
export const demoActivityLunchId: ActivityId = "6b6a4767-5ebf-4d86-b65a-5716f17d9d41";

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
      optionId: demoCategoryLunchOptionId,
      campusId: demoCampusId,
      optionType: CampusStructuredOptionType.ActivityCategory,
      name: "Lunch",
      description: "Low-pressure meals on or near campus.",
      isActive: true
    },
    {
      optionId: demoCategoryStudyOptionId,
      campusId: demoCampusId,
      optionType: CampusStructuredOptionType.ActivityCategory,
      name: "Study",
      description: "Small study sessions and project work.",
      isActive: true
    },
    {
      optionId: demoLibraryLocationOptionId,
      campusId: demoCampusId,
      optionType: CampusStructuredOptionType.CampusLocation,
      name: "Jiading Library",
      description: "Shared library meeting point.",
      isActive: true
    }
  ],
  studentAccounts: [
    {
      studentAccountId: demoStudentAccountOneId,
      universityEmail: "demo.student1@tongji.edu.cn",
      selectedCampusId: demoCampusId,
      platformAccessStatus: PlatformAccessStatus.Active,
      verificationStatus: VerificationStatus.Verified
    },
    {
      studentAccountId: demoStudentAccountTwoId,
      universityEmail: "demo.student2@tongji.edu.cn",
      selectedCampusId: demoCampusId,
      platformAccessStatus: PlatformAccessStatus.Active,
      verificationStatus: VerificationStatus.Verified
    }
  ],
  studentProfiles: [
    {
      profileId: demoStudentProfileOneId,
      studentAccountId: demoStudentAccountOneId,
      displayName: "Demo Host",
      major: "Software Engineering",
      interests: ["lunch", "language exchange"],
      languages: ["English", "Chinese"]
    },
    {
      profileId: demoStudentProfileTwoId,
      studentAccountId: demoStudentAccountTwoId,
      displayName: "Demo Participant",
      major: "Design",
      interests: ["study", "coffee"],
      languages: ["English", "Italian"]
    }
  ],
  activities: [
    {
      activityId: demoActivityLunchId,
      campusId: demoCampusId,
      hostAccountId: demoStudentAccountOneId,
      title: "Lunch near the library",
      categoryId: demoCategoryLunchOptionId,
      categoryLabel: "Lunch",
      meetingPointId: demoLibraryLocationOptionId,
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
