import type {
  ActivityId,
  CampusId,
  ParticipationId,
  ReportId,
  StudentAccountId
} from "../domain/dtos";
import {
  ActivityStatus,
  CampusStructuredOptionType,
  GenderPreference,
  ModerationAction,
  ParticipationMode,
  ParticipationRecordType,
  ParticipationStatus,
  PlatformAccessStatus,
  ReportStatus,
  ReportTargetType,
  ReviewOutcome,
  StudentProfileGender,
  VerificationStatus
} from "../domain/enums";

export const demoPassword = "88888888";
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
export const demoUser1AccountId: StudentAccountId = "11111111-1111-4111-8111-111111111111";
export const demoUser2AccountId: StudentAccountId = "22222222-2222-4222-8222-222222222222";
export const demoUser3AccountId: StudentAccountId = "33333333-3333-4333-8333-333333333333";
export const demoUser4AccountId: StudentAccountId = "44444444-4444-4444-8444-444444444444";
export const demoUser5AccountId: StudentAccountId = "55555555-5555-4555-8555-555555555555";
export const demoUser6AccountId: StudentAccountId = "66666666-6666-4666-8666-666666666666";
export const demoUser7AccountId: StudentAccountId = "77777777-7777-4777-8777-777777777777";
export const demoUser8AccountId: StudentAccountId = "88888888-8888-4888-8888-888888888888";
export const demoHostProfileId = "8bc2ea96-b3b7-4b15-8c03-1c8b42d5d6d0";
export const demoGuestProfileId = "b7f2e5f0-f780-4244-b03f-deddb8ffc16f";
export const demoUser1ProfileId = "21111111-1111-4111-8111-111111111111";
export const demoUser2ProfileId = "22222222-1111-4222-8222-222222222222";
export const demoUser3ProfileId = "23333333-1111-4333-8333-333333333333";
export const demoUser4ProfileId = "24444444-1111-4444-8444-444444444444";
export const demoUser5ProfileId = "25555555-1111-4555-8555-555555555555";
export const demoUser6ProfileId = "26666666-1111-4666-8666-666666666666";
export const demoUser7ProfileId = "27777777-1111-4777-8777-777777777777";
export const demoUser8ProfileId = "28888888-1111-4888-8888-888888888888";
export const demoOpenActivityId: ActivityId = "6b6a4767-5ebf-4d86-b65a-5716f17d9d41";
export const demoApprovalActivityId: ActivityId = "172ddca6-871d-41ce-ad5e-f7c310b20743";
export const demoModerationActivityId: ActivityId = "39c9e44a-b351-46d7-8c63-fc20d66a76af";
export const demoCoffeeActivityId: ActivityId = "4e42a9d2-4df1-4f31-8b2c-000000000001";
export const demoStudyActivityId: ActivityId = "4e42a9d2-4df1-4f31-8b2c-000000000002";
export const demoCvActivityId: ActivityId = "4e42a9d2-4df1-4f31-8b2c-000000000003";
export const demoSportActivityId: ActivityId = "4e42a9d2-4df1-4f31-8b2c-000000000004";
export const demoDesignActivityId: ActivityId = "4e42a9d2-4df1-4f31-8b2c-000000000005";
export const demoPhotoWalkActivityId: ActivityId = "4e42a9d2-4df1-4f31-8b2c-000000000006";
export const demoPlanningCoffeeActivityId: ActivityId = "4e42a9d2-4df1-4f31-8b2c-000000000007";
export const demoGuestPendingParticipationId: ParticipationId =
  "b1000000-0000-4000-8000-000000000001";
export const demoUser2PendingParticipationId: ParticipationId =
  "b1000000-0000-4000-8000-000000000002";
export const demoUser3PendingParticipationId: ParticipationId =
  "b1000000-0000-4000-8000-000000000003";
export const demoUser1ConfirmedParticipationId: ParticipationId =
  "b1000000-0000-4000-8000-000000000004";
export const demoUser4ConfirmedParticipationId: ParticipationId =
  "b1000000-0000-4000-8000-000000000005";
export const demoUser5PendingParticipationId: ParticipationId =
  "b1000000-0000-4000-8000-000000000006";
export const demoUser6ConfirmedParticipationId: ParticipationId =
  "b1000000-0000-4000-8000-000000000007";
export const demoUser7ConfirmedParticipationId: ParticipationId =
  "b1000000-0000-4000-8000-000000000008";
export const demoGuestConfirmedParticipationId: ParticipationId =
  "b1000000-0000-4000-8000-000000000009";
export const demoReportId: ReportId = "62d6543c-d6cf-4acf-94ec-66e8c8ac8c10";

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
  startsInDays: number;
  startTime: string;
  durationHours: number;
  meetingPointId: string;
  meetingPointLabel: string;
  maxParticipants: number;
  maxRequests: number | null;
  participationMode: ParticipationMode;
  genderPreference: GenderPreference;
  status: ActivityStatus;
}

export interface DemoParticipationSeed {
  participationId: ParticipationId;
  activityId: ActivityId;
  studentAccountId: StudentAccountId;
  recordType: ParticipationRecordType;
  status: ParticipationStatus;
}

export interface DemoReportSeed {
  reportId: ReportId;
  campusId: CampusId;
  reporterAccountId: StudentAccountId;
  targetType: ReportTargetType;
  targetAccountId: StudentAccountId | null;
  targetActivityId: ActivityId | null;
  reasonCode: string;
  description: string | null;
  status: ReportStatus;
  moderationAction: ModerationAction;
  reviewOutcome: ReviewOutcome | null;
  reviewNotes: string | null;
  reviewedByAdminId: string | null;
  commandDispatchPending: boolean;
}

export interface DemoSeedData {
  campuses: DemoCampusSeed[];
  campusStructuredOptions: DemoStructuredOptionSeed[];
  universityIdentityRules: DemoUniversityIdentityRuleSeed[];
  studentAccounts: DemoStudentAccountSeed[];
  studentProfiles: DemoStudentProfileSeed[];
  activities: DemoActivitySeed[];
  participations: DemoParticipationSeed[];
  reports: DemoReportSeed[];
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
    },
    {
      studentAccountId: demoUser1AccountId,
      universityEmail: "user1@tongji.edu.cn",
      password: demoPassword,
      universityStudentId: "DEMO-USER-001",
      selectedCampusId: demoCampusId,
      platformAccessStatus: PlatformAccessStatus.Active,
      verificationStatus: VerificationStatus.Verified,
      campusInsightSharingConsent: true
    },
    {
      studentAccountId: demoUser2AccountId,
      universityEmail: "user2@tongji.edu.cn",
      password: demoPassword,
      universityStudentId: "DEMO-USER-002",
      selectedCampusId: demoCampusId,
      platformAccessStatus: PlatformAccessStatus.Active,
      verificationStatus: VerificationStatus.Verified,
      campusInsightSharingConsent: true
    },
    {
      studentAccountId: demoUser3AccountId,
      universityEmail: "user3@tongji.edu.cn",
      password: demoPassword,
      universityStudentId: "DEMO-USER-003",
      selectedCampusId: demoCampusId,
      platformAccessStatus: PlatformAccessStatus.Active,
      verificationStatus: VerificationStatus.Verified,
      campusInsightSharingConsent: false
    },
    {
      studentAccountId: demoUser4AccountId,
      universityEmail: "user4@tongji.edu.cn",
      password: demoPassword,
      universityStudentId: "DEMO-USER-004",
      selectedCampusId: demoCampusId,
      platformAccessStatus: PlatformAccessStatus.Active,
      verificationStatus: VerificationStatus.Verified,
      campusInsightSharingConsent: true
    },
    {
      studentAccountId: demoUser5AccountId,
      universityEmail: "user5@tongji.edu.cn",
      password: demoPassword,
      universityStudentId: "DEMO-USER-005",
      selectedCampusId: demoCampusId,
      platformAccessStatus: PlatformAccessStatus.Active,
      verificationStatus: VerificationStatus.Verified,
      campusInsightSharingConsent: false
    },
    {
      studentAccountId: demoUser6AccountId,
      universityEmail: "user6@tongji.edu.cn",
      password: demoPassword,
      universityStudentId: "DEMO-USER-006",
      selectedCampusId: demoCampusId,
      platformAccessStatus: PlatformAccessStatus.Active,
      verificationStatus: VerificationStatus.Verified,
      campusInsightSharingConsent: true
    },
    {
      studentAccountId: demoUser7AccountId,
      universityEmail: "user7@tongji.edu.cn",
      password: demoPassword,
      universityStudentId: "DEMO-USER-007",
      selectedCampusId: demoCampusId,
      platformAccessStatus: PlatformAccessStatus.Active,
      verificationStatus: VerificationStatus.Verified,
      campusInsightSharingConsent: false
    },
    {
      studentAccountId: demoUser8AccountId,
      universityEmail: "user8@tongji.edu.cn",
      password: demoPassword,
      universityStudentId: "DEMO-USER-008",
      selectedCampusId: demoCampusId,
      platformAccessStatus: PlatformAccessStatus.Active,
      verificationStatus: VerificationStatus.Verified,
      campusInsightSharingConsent: true
    }
  ],
  studentProfiles: [
    {
      profileId: demoHostProfileId,
      studentAccountId: demoHostAccountId,
      displayName: "Luca Ferri",
      major: "Software Engineering",
      dateOfBirth: "2001-04-18",
      gender: StudentProfileGender.PreferNotToSay,
      interests: ["lunch", "language exchange", "campus events"],
      languages: ["English", "Chinese"],
      shortBio: "Organizes small campus meetups and reviews join requests."
    },
    {
      profileId: demoGuestProfileId,
      studentAccountId: demoGuestAccountId,
      displayName: "Giulia Conti",
      major: "Industrial Design",
      dateOfBirth: "2002-09-02",
      gender: StudentProfileGender.PreferNotToSay,
      interests: ["study", "coffee", "language exchange"],
      languages: ["English", "Italian"],
      shortBio: "Browses the feed and has a pending request ready to withdraw."
    },
    {
      profileId: demoUser1ProfileId,
      studentAccountId: demoUser1AccountId,
      displayName: "Mei Chen",
      major: "Computer Science",
      dateOfBirth: "2001-11-14",
      gender: StudentProfileGender.Female,
      interests: ["algorithms", "lunch", "running"],
      languages: ["Chinese", "English"],
      shortBio: "Already joined a meal activity for the leave-flow demo."
    },
    {
      profileId: demoUser2ProfileId,
      studentAccountId: demoUser2AccountId,
      displayName: "Marco Rinaldi",
      major: "Mechanical Engineering",
      dateOfBirth: "2000-07-21",
      gender: StudentProfileGender.Male,
      interests: ["basketball", "coffee", "lab work"],
      languages: ["Chinese", "English"],
      shortBio: "Likes quick meetups between lab sessions."
    },
    {
      profileId: demoUser3ProfileId,
      studentAccountId: demoUser3AccountId,
      displayName: "Sofia Alvarez",
      major: "Transportation Engineering",
      dateOfBirth: "2002-02-08",
      gender: StudentProfileGender.Other,
      interests: ["urban mobility", "language exchange", "photography"],
      languages: ["Chinese", "Spanish"],
      shortBio: "Practices languages and joins campus walks."
    },
    {
      profileId: demoUser4ProfileId,
      studentAccountId: demoUser4AccountId,
      displayName: "Li Wei",
      major: "Data Science",
      dateOfBirth: "2001-12-03",
      gender: StudentProfileGender.Female,
      interests: ["study groups", "data visualization", "coffee"],
      languages: ["Chinese", "English", "French"],
      shortBio: "Hosts focused study sessions and peer reviews."
    },
    {
      profileId: demoUser5ProfileId,
      studentAccountId: demoUser5AccountId,
      displayName: "Elena Rossi",
      major: "Architecture",
      dateOfBirth: "2000-05-30",
      gender: StudentProfileGender.PreferNotToSay,
      interests: ["design critique", "campus photography", "lunch"],
      languages: ["Chinese", "English"],
      shortBio: "Looks for feedback on studio projects."
    },
    {
      profileId: demoUser6ProfileId,
      studentAccountId: demoUser6AccountId,
      displayName: "Tommaso Bianchi",
      major: "Civil Engineering",
      dateOfBirth: "2002-10-11",
      gender: StudentProfileGender.Male,
      interests: ["basketball", "project planning", "coffee"],
      languages: ["Chinese", "English"],
      shortBio: "Usually joins sport and project planning activities."
    },
    {
      profileId: demoUser7ProfileId,
      studentAccountId: demoUser7AccountId,
      displayName: "Yuna Park",
      major: "Media Studies",
      dateOfBirth: "2001-01-27",
      gender: StudentProfileGender.Female,
      interests: ["photography", "language exchange", "events"],
      languages: ["Chinese", "Korean", "English"],
      shortBio: "Runs relaxed creative walks around campus."
    },
    {
      profileId: demoUser8ProfileId,
      studentAccountId: demoUser8AccountId,
      displayName: "Nora Smith",
      major: "Business Analytics",
      dateOfBirth: "2000-08-19",
      gender: StudentProfileGender.PreferNotToSay,
      interests: ["career prep", "planning", "coffee"],
      languages: ["Chinese", "English"],
      shortBio: "Keeps meetups structured and practical."
    }
  ],
  activities: [
    {
      activityId: demoOpenActivityId,
      campusId: demoCampusId,
      hostAccountId: demoHostAccountId,
      title: "Cafeteria Dinner Table",
      categoryId: demoCategoryLunchOptionId,
      categoryLabel: "Lunch",
      description: "Casual cafeteria dinner for students who want company after afternoon classes.",
      startsInDays: 0,
      startTime: "19:30",
      durationHours: 1,
      meetingPointId: demoCafeteriaLocationOptionId,
      meetingPointLabel: "Cafeteria",
      maxParticipants: 5,
      maxRequests: null,
      participationMode: ParticipationMode.Open,
      genderPreference: GenderPreference.All,
      status: ActivityStatus.Open
    },
    {
      activityId: demoApprovalActivityId,
      campusId: demoCampusId,
      hostAccountId: demoHostAccountId,
      title: "Mandarin Practice Circle",
      categoryId: demoCategoryLanguageExchangeOptionId,
      categoryLabel: "Language Exchange",
      description: "Small conversation group for Mandarin practice with short introductions.",
      startsInDays: 0,
      startTime: "20:20",
      durationHours: 1,
      meetingPointId: demoCafeteriaLocationOptionId,
      meetingPointLabel: "Cafeteria",
      maxParticipants: 5,
      maxRequests: 4,
      participationMode: ParticipationMode.ApprovalBased,
      genderPreference: GenderPreference.All,
      status: ActivityStatus.Open
    },
    {
      activityId: demoCoffeeActivityId,
      campusId: demoCampusId,
      hostAccountId: demoUser2AccountId,
      title: "Evening Espresso Reset",
      categoryId: demoCategoryCoffeeOptionId,
      categoryLabel: "Coffee",
      description: "Short coffee reset after evening class, open to anyone still on campus.",
      startsInDays: 0,
      startTime: "21:55",
      durationHours: 0.75,
      meetingPointId: demoCafeteriaLocationOptionId,
      meetingPointLabel: "Cafeteria",
      maxParticipants: 4,
      maxRequests: null,
      participationMode: ParticipationMode.Open,
      genderPreference: GenderPreference.All,
      status: ActivityStatus.Open
    },
    {
      activityId: demoStudyActivityId,
      campusId: demoCampusId,
      hostAccountId: demoUser4AccountId,
      title: "Quiet Algorithms Study Block",
      categoryId: demoCategoryStudyOptionId,
      categoryLabel: "Study",
      description: "Focused 90-minute session for algorithms practice and silent problem solving.",
      startsInDays: 1,
      startTime: "09:40",
      durationHours: 2,
      meetingPointId: demoLibraryPlazaLocationOptionId,
      meetingPointLabel: "Library Plaza",
      maxParticipants: 6,
      maxRequests: null,
      participationMode: ParticipationMode.Open,
      genderPreference: GenderPreference.All,
      status: ActivityStatus.Open
    },
    {
      activityId: demoCvActivityId,
      campusId: demoCampusId,
      hostAccountId: demoUser8AccountId,
      title: "CV Review Swap",
      categoryId: demoCategoryStudyOptionId,
      categoryLabel: "Study",
      description: "Bring one CV draft and exchange concrete feedback in pairs.",
      startsInDays: 1,
      startTime: "12:20",
      durationHours: 1,
      meetingPointId: demoLibraryPlazaLocationOptionId,
      meetingPointLabel: "Library Plaza",
      maxParticipants: 4,
      maxRequests: 2,
      participationMode: ParticipationMode.ApprovalBased,
      genderPreference: GenderPreference.All,
      status: ActivityStatus.Open
    },
    {
      activityId: demoSportActivityId,
      campusId: demoCampusId,
      hostAccountId: demoUser5AccountId,
      title: "Basketball Shooting Practice",
      categoryId: demoCategorySportOptionId,
      categoryLabel: "Sport",
      description: "Light shooting drills at the sports center, no competitive game required.",
      startsInDays: 1,
      startTime: "17:25",
      durationHours: 1,
      meetingPointId: demoSportsCenterLocationOptionId,
      meetingPointLabel: "Sports Center",
      maxParticipants: 6,
      maxRequests: null,
      participationMode: ParticipationMode.Open,
      genderPreference: GenderPreference.All,
      status: ActivityStatus.Open
    },
    {
      activityId: demoDesignActivityId,
      campusId: demoCampusId,
      hostAccountId: demoUser6AccountId,
      title: "Evening Design Critique",
      categoryId: demoCategoryStudyOptionId,
      categoryLabel: "Study",
      description: "Small approval-based critique for sketches, posters, or early project ideas.",
      startsInDays: 1,
      startTime: "20:15",
      durationHours: 2,
      meetingPointId: demoCafeteriaLocationOptionId,
      meetingPointLabel: "Cafeteria",
      maxParticipants: 5,
      maxRequests: 3,
      participationMode: ParticipationMode.ApprovalBased,
      genderPreference: GenderPreference.All,
      status: ActivityStatus.Open
    },
    {
      activityId: demoPhotoWalkActivityId,
      campusId: demoCampusId,
      hostAccountId: demoUser7AccountId,
      title: "Campus Photo Walk",
      categoryId: demoCategoryCoffeeOptionId,
      categoryLabel: "Coffee",
      description: "Slow walk from the main gate to the library with stops for photos and coffee.",
      startsInDays: 2,
      startTime: "10:05",
      durationHours: 2,
      meetingPointId: demoMainGateLocationOptionId,
      meetingPointLabel: "Main Gate",
      maxParticipants: 5,
      maxRequests: null,
      participationMode: ParticipationMode.Open,
      genderPreference: GenderPreference.All,
      status: ActivityStatus.Open
    },
    {
      activityId: demoPlanningCoffeeActivityId,
      campusId: demoCampusId,
      hostAccountId: demoUser8AccountId,
      title: "Finals Planning Coffee",
      categoryId: demoCategoryCoffeeOptionId,
      categoryLabel: "Coffee",
      description: "Plan study blocks for finals week over a short coffee meetup.",
      startsInDays: 2,
      startTime: "15:15",
      durationHours: 1,
      meetingPointId: demoCafeteriaLocationOptionId,
      meetingPointLabel: "Cafeteria",
      maxParticipants: 4,
      maxRequests: null,
      participationMode: ParticipationMode.Open,
      genderPreference: GenderPreference.All,
      status: ActivityStatus.Open
    },
    {
      activityId: demoModerationActivityId,
      campusId: demoCampusId,
      hostAccountId: demoUser3AccountId,
      title: "Main Gate Coffee Chat",
      categoryId: demoCategoryCoffeeOptionId,
      categoryLabel: "Coffee",
      description: "Meet at the main gate for a short coffee chat before heading to the library.",
      startsInDays: 2,
      startTime: "18:10",
      durationHours: 1,
      meetingPointId: demoMainGateLocationOptionId,
      meetingPointLabel: "Main Gate",
      maxParticipants: 4,
      maxRequests: null,
      participationMode: ParticipationMode.Open,
      genderPreference: GenderPreference.All,
      status: ActivityStatus.Open
    }
  ],
  participations: [
    {
      participationId: demoUser1ConfirmedParticipationId,
      activityId: demoOpenActivityId,
      studentAccountId: demoUser1AccountId,
      recordType: ParticipationRecordType.Participation,
      status: ParticipationStatus.Confirmed
    },
    {
      participationId: demoGuestPendingParticipationId,
      activityId: demoApprovalActivityId,
      studentAccountId: demoGuestAccountId,
      recordType: ParticipationRecordType.Request,
      status: ParticipationStatus.Pending
    },
    {
      participationId: demoUser2PendingParticipationId,
      activityId: demoApprovalActivityId,
      studentAccountId: demoUser2AccountId,
      recordType: ParticipationRecordType.Request,
      status: ParticipationStatus.Pending
    },
    {
      participationId: demoUser3PendingParticipationId,
      activityId: demoApprovalActivityId,
      studentAccountId: demoUser3AccountId,
      recordType: ParticipationRecordType.Request,
      status: ParticipationStatus.Pending
    },
    {
      participationId: demoUser4ConfirmedParticipationId,
      activityId: demoStudyActivityId,
      studentAccountId: demoUser2AccountId,
      recordType: ParticipationRecordType.Participation,
      status: ParticipationStatus.Confirmed
    },
    {
      participationId: demoUser5PendingParticipationId,
      activityId: demoCvActivityId,
      studentAccountId: demoUser5AccountId,
      recordType: ParticipationRecordType.Request,
      status: ParticipationStatus.Pending
    },
    {
      participationId: demoUser6ConfirmedParticipationId,
      activityId: demoSportActivityId,
      studentAccountId: demoUser6AccountId,
      recordType: ParticipationRecordType.Participation,
      status: ParticipationStatus.Confirmed
    },
    {
      participationId: demoUser7ConfirmedParticipationId,
      activityId: demoSportActivityId,
      studentAccountId: demoUser7AccountId,
      recordType: ParticipationRecordType.Participation,
      status: ParticipationStatus.Confirmed
    },
    {
      participationId: demoGuestConfirmedParticipationId,
      activityId: demoPlanningCoffeeActivityId,
      studentAccountId: demoGuestAccountId,
      recordType: ParticipationRecordType.Participation,
      status: ParticipationStatus.Confirmed
    }
  ],
  reports: [
    {
      reportId: demoReportId,
      campusId: demoCampusId,
      reporterAccountId: demoGuestAccountId,
      targetType: ReportTargetType.Activity,
      targetAccountId: null,
      targetActivityId: demoModerationActivityId,
      reasonCode: "misleading_meeting_details",
      description: "The meeting point details looked unclear and should be reviewed before the event.",
      status: ReportStatus.PendingReview,
      moderationAction: ModerationAction.None,
      reviewOutcome: null,
      reviewNotes: null,
      reviewedByAdminId: null,
      commandDispatchPending: false
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
  participations: number;
  reports: number;
}

export function summarizeDemoSeed(seed: DemoSeedData = phase0DemoSeed): DemoSeedSummary {
  return {
    campuses: seed.campuses.length,
    campusStructuredOptions: seed.campusStructuredOptions.length,
    universityIdentityRules: seed.universityIdentityRules.length,
    studentAccounts: seed.studentAccounts.length,
    studentProfiles: seed.studentProfiles.length,
    activities: seed.activities.length,
    participations: seed.participations.length,
    reports: seed.reports.length
  };
}
