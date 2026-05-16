import type { ActivityId, CampusId, StudentAccountId } from "../domain/dtos";
import {
  ActivityStatus,
  CampusStructuredOptionType,
  GenderPreference,
  ParticipationMode,
  PlatformAccessStatus,
  StudentProfileGender,
  VerificationStatus
} from "../domain/enums";

export const demoPassword = "InCampusDemo2026!";
export const demoActivityTitlePrefix = "[DEMO]";
export const demoCampusId: CampusId = "1d8a58b3-4df0-40fe-9ad0-5bd563c13d6f";
export const demoCategoryLunchOptionId = "87fe4ec4-0d68-45c1-b7c2-0abef2e3ef70";
export const demoCategoryCoffeeOptionId = "06390f30-5028-4d1c-8c31-095b893d4534";
export const demoCategoryStudyOptionId = "d5f86aa2-7d8a-4c83-8426-d6f6b7b0ad7a";
export const demoCategorySportOptionId = "094f2c11-fc93-4b7c-9f95-695de30fd194";
export const demoCategoryLanguageExchangeOptionId = "8a52a24e-c5b0-4f83-ae5d-0c31a5d998b2";
export const demoLibraryPlazaLocationOptionId = "f2af15aa-d347-4037-8f1e-f6b4e8616d06";
export const demoCafeteriaLocationOptionId = "779ae557-ed88-4b1f-9f45-286fa6f32044";
export const demoMainGateLocationOptionId = "17a7563d-0e26-4352-9bde-b0472fe10bb2";
export const demoSportsCenterLocationOptionId = "a15a2c41-b0eb-4135-8f4b-29f4a08bf76c";
export const demoHostAccountId: StudentAccountId = "e5a8f8d7-34cd-4696-bf0f-1d2b89c29fbc";
export const demoGuestAccountId: StudentAccountId = "845e6c55-e3fe-4aa0-9e0f-b2968876c4c8";
export const demoHostProfileId = "8bc2ea96-b3b7-4b15-8c03-1c8b42d5d6d0";
export const demoGuestProfileId = "b7f2e5f0-f780-4244-b03f-deddb8ffc16f";
export const demoOpenActivityId: ActivityId = "6b6a4767-5ebf-4d86-b65a-5716f17d9d41";
export const demoApprovalActivityId: ActivityId = "172ddca6-871d-41ce-ad5e-f7c310b20743";

// Backward-compatible aliases used by older seed tests/docs.
export const demoLibraryLocationOptionId = demoLibraryPlazaLocationOptionId;
export const demoStudentAccountOneId = demoHostAccountId;
export const demoStudentAccountTwoId = demoGuestAccountId;
export const demoStudentProfileOneId = demoHostProfileId;
export const demoStudentProfileTwoId = demoGuestProfileId;
export const demoActivityLunchId = demoOpenActivityId;

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
  password: string;
  universityStudentId: string;
  selectedCampusId: CampusId;
  platformAccessStatus: PlatformAccessStatus;
  verificationStatus: VerificationStatus;
  campusInsightSharingConsent: boolean;
}

export interface DemoUniversityIdentityRuleSeed {
  emailDomain: string;
  universityName: string;
  studentIdFormatRule: string | null;
  ruleStatus: string;
}

export interface DemoStudentProfileSeed {
  profileId: string;
  studentAccountId: StudentAccountId;
  displayName: string;
  major: string;
  dateOfBirth: string | null;
  gender: StudentProfileGender | null;
  interests: string[];
  languages: string[];
  shortBio: string | null;
}

export interface DemoActivitySeed {
  activityId: ActivityId;
  campusId: CampusId;
  hostAccountId: StudentAccountId;
  title: string;
  categoryId: string;
  categoryLabel: string;
  description: string | null;
  startsInHours: number;
  durationHours: number;
  meetingPointId: string;
  meetingPointLabel: string;
  maxParticipants: number;
  maxRequests: number | null;
  participationMode: ParticipationMode;
  genderPreference: GenderPreference;
  status: ActivityStatus;
}

export interface DemoSeedData {
  campuses: DemoCampusSeed[];
  campusStructuredOptions: DemoStructuredOptionSeed[];
  universityIdentityRules: DemoUniversityIdentityRuleSeed[];
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
      optionId: demoCategoryCoffeeOptionId,
      campusId: demoCampusId,
      optionType: CampusStructuredOptionType.ActivityCategory,
      name: "Coffee",
      description: "Short coffee breaks and casual campus chats.",
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
      optionId: demoCategorySportOptionId,
      campusId: demoCampusId,
      optionType: CampusStructuredOptionType.ActivityCategory,
      name: "Sport",
      description: "Light sports and movement activities.",
      isActive: true
    },
    {
      optionId: demoCategoryLanguageExchangeOptionId,
      campusId: demoCampusId,
      optionType: CampusStructuredOptionType.ActivityCategory,
      name: "Language Exchange",
      description: "Small language practice meetups.",
      isActive: true
    },
    {
      optionId: demoLibraryPlazaLocationOptionId,
      campusId: demoCampusId,
      optionType: CampusStructuredOptionType.CampusLocation,
      name: "Library Plaza",
      description: "Open plaza outside the Jiading campus library.",
      isActive: true
    },
    {
      optionId: demoCafeteriaLocationOptionId,
      campusId: demoCampusId,
      optionType: CampusStructuredOptionType.CampusLocation,
      name: "Cafeteria",
      description: "Main student cafeteria meeting area.",
      isActive: true
    },
    {
      optionId: demoMainGateLocationOptionId,
      campusId: demoCampusId,
      optionType: CampusStructuredOptionType.CampusLocation,
      name: "Main Gate",
      description: "Jiading Campus main gate.",
      isActive: true
    },
    {
      optionId: demoSportsCenterLocationOptionId,
      campusId: demoCampusId,
      optionType: CampusStructuredOptionType.CampusLocation,
      name: "Sports Center",
      description: "Campus sports center entrance.",
      isActive: true
    }
  ],
  universityIdentityRules: [
    {
      emailDomain: "tongji.edu.cn",
      universityName: "Tongji University",
      studentIdFormatRule: null,
      ruleStatus: "Active"
    }
  ],
  studentAccounts: [
    {
      studentAccountId: demoHostAccountId,
      universityEmail: "demo.host@tongji.edu.cn",
      password: demoPassword,
      universityStudentId: "DEMO-HOST-001",
      selectedCampusId: demoCampusId,
      platformAccessStatus: PlatformAccessStatus.Active,
      verificationStatus: VerificationStatus.Verified,
      campusInsightSharingConsent: true
    },
    {
      studentAccountId: demoGuestAccountId,
      universityEmail: "demo.guest@tongji.edu.cn",
      password: demoPassword,
      universityStudentId: "DEMO-GUEST-001",
      selectedCampusId: demoCampusId,
      platformAccessStatus: PlatformAccessStatus.Active,
      verificationStatus: VerificationStatus.Verified,
      campusInsightSharingConsent: false
    }
  ],
  studentProfiles: [
    {
      profileId: demoHostProfileId,
      studentAccountId: demoHostAccountId,
      displayName: "Demo Host",
      major: "Software Engineering",
      dateOfBirth: "2001-04-18",
      gender: StudentProfileGender.PreferNotToSay,
      interests: ["lunch", "language exchange"],
      languages: ["English", "Chinese"],
      shortBio: "Hosts low-pressure campus activities for demo walkthroughs."
    },
    {
      profileId: demoGuestProfileId,
      studentAccountId: demoGuestAccountId,
      displayName: "Demo Participant",
      major: "Design",
      dateOfBirth: "2002-09-02",
      gender: StudentProfileGender.PreferNotToSay,
      interests: ["study", "coffee"],
      languages: ["English", "Italian"],
      shortBio: "Uses the demo flow to browse, join, and request activities."
    }
  ],
  activities: [
    {
      activityId: demoOpenActivityId,
      campusId: demoCampusId,
      hostAccountId: demoHostAccountId,
      title: "[DEMO] Lunch near Library Plaza",
      categoryId: demoCategoryLunchOptionId,
      categoryLabel: "Lunch",
      description: "A simple open-join lunch activity for the core demo path.",
      startsInHours: 24,
      durationHours: 1,
      meetingPointId: demoLibraryPlazaLocationOptionId,
      meetingPointLabel: "Library Plaza",
      maxParticipants: 4,
      maxRequests: null,
      participationMode: ParticipationMode.Open,
      genderPreference: GenderPreference.All,
      status: ActivityStatus.Open
    },
    {
      activityId: demoApprovalActivityId,
      campusId: demoCampusId,
      hostAccountId: demoHostAccountId,
      title: "[DEMO] Language Exchange at Cafeteria",
      categoryId: demoCategoryLanguageExchangeOptionId,
      categoryLabel: "Language Exchange",
      description: "Approval-based activity for join-request and manage-request checks.",
      startsInHours: 30,
      durationHours: 1,
      meetingPointId: demoCafeteriaLocationOptionId,
      meetingPointLabel: "Cafeteria",
      maxParticipants: 3,
      maxRequests: 8,
      participationMode: ParticipationMode.ApprovalBased,
      genderPreference: GenderPreference.All,
      status: ActivityStatus.Open
    }
  ]
};

export interface DemoSeedSummary {
  campuses: number;
  campusStructuredOptions: number;
  universityIdentityRules: number;
  studentAccounts: number;
  studentProfiles: number;
  activities: number;
}

export function summarizeDemoSeed(seed: DemoSeedData = phase0DemoSeed): DemoSeedSummary {
  return {
    campuses: seed.campuses.length,
    campusStructuredOptions: seed.campusStructuredOptions.length,
    universityIdentityRules: seed.universityIdentityRules.length,
    studentAccounts: seed.studentAccounts.length,
    studentProfiles: seed.studentProfiles.length,
    activities: seed.activities.length
  };
}
