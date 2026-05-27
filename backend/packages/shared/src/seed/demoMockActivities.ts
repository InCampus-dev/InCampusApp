import type { CampusId, StudentAccountId } from "../domain/dtos";
import {
  ActivityStatus,
  GenderPreference,
  ParticipationMode
} from "../domain/enums";
import {
  demoActivityTitlePrefix,
  demoCampusId,
  demoCategoryCoffeeOptionId,
  demoCategoryLanguageExchangeOptionId,
  demoCategoryLunchOptionId,
  demoCategorySportOptionId,
  demoCategoryStudyOptionId,
  demoCafeteriaLocationOptionId,
  demoGuestAccountId,
  demoHostAccountId,
  demoLibraryPlazaLocationOptionId,
  demoMainGateLocationOptionId,
  demoSportsCenterLocationOptionId
} from "./demoSeed";

export const demoMockActivityTitlePrefix = `${demoActivityTitlePrefix} Mock:`;

export interface DemoMockActivitySeed {
  campusId: CampusId;
  hostAccountId: StudentAccountId;
  title: string;
  categoryId: string;
  description: string;
  startsInHours: number;
  durationHours: number;
  meetingPointId: string;
  maxParticipants: number;
  maxRequests: number | null;
  participationMode: ParticipationMode;
  genderPreference: GenderPreference;
  status: ActivityStatus;
}

export const demoMockActivities: DemoMockActivitySeed[] = [
  {
    campusId: demoCampusId,
    hostAccountId: demoHostAccountId,
    title: "[DEMO] Mock: Lunch at Cafeteria A",
    categoryId: demoCategoryLunchOptionId,
    description:
      "Looking for someone to grab a relaxed lunch between classes. No pressure, just good food and a quick chat.",
    startsInHours: 2,
    durationHours: 1,
    meetingPointId: demoCafeteriaLocationOptionId,
    maxParticipants: 2,
    maxRequests: null,
    participationMode: ParticipationMode.Open,
    genderPreference: GenderPreference.All,
    status: ActivityStatus.Open
  },
  {
    campusId: demoCampusId,
    hostAccountId: demoGuestAccountId,
    title: "[DEMO] Mock: Coffee Before Afternoon Class",
    categoryId: demoCategoryCoffeeOptionId,
    description:
      "Quick coffee near campus before the next lecture. Ideal if you want a short break and a friendly conversation.",
    startsInHours: 3,
    durationHours: 0.75,
    meetingPointId: demoCafeteriaLocationOptionId,
    maxParticipants: 2,
    maxRequests: null,
    participationMode: ParticipationMode.Open,
    genderPreference: GenderPreference.All,
    status: ActivityStatus.Open
  },
  {
    campusId: demoCampusId,
    hostAccountId: demoHostAccountId,
    title: "[DEMO] Mock: Library Focus Session",
    categoryId: demoCategoryStudyOptionId,
    description:
      "Quiet 90-minute study block at the library. We can set goals at the beginning and check progress at the end.",
    startsInHours: 5,
    durationHours: 1.5,
    meetingPointId: demoLibraryPlazaLocationOptionId,
    maxParticipants: 4,
    maxRequests: null,
    participationMode: ParticipationMode.Open,
    genderPreference: GenderPreference.All,
    status: ActivityStatus.Open
  },
  {
    campusId: demoCampusId,
    hostAccountId: demoGuestAccountId,
    title: "[DEMO] Mock: Beginner Basketball Shootaround",
    categoryId: demoCategorySportOptionId,
    description:
      "Casual basketball session, beginners welcome. We'll shoot around and maybe play a light 2v2 if enough people join.",
    startsInHours: 6,
    durationHours: 1.5,
    meetingPointId: demoSportsCenterLocationOptionId,
    maxParticipants: 4,
    maxRequests: 3,
    participationMode: ParticipationMode.ApprovalBased,
    genderPreference: GenderPreference.All,
    status: ActivityStatus.Open
  },
  {
    campusId: demoCampusId,
    hostAccountId: demoHostAccountId,
    title: "[DEMO] Mock: Chinese-English Language Exchange",
    categoryId: demoCategoryLanguageExchangeOptionId,
    description:
      "Half English, half Chinese conversation practice. Good for meeting people and improving speaking confidence.",
    startsInHours: 8,
    durationHours: 1.25,
    meetingPointId: demoCafeteriaLocationOptionId,
    maxParticipants: 4,
    maxRequests: 3,
    participationMode: ParticipationMode.ApprovalBased,
    genderPreference: GenderPreference.All,
    status: ActivityStatus.Open
  },
  {
    campusId: demoCampusId,
    hostAccountId: demoGuestAccountId,
    title: "[DEMO] Mock: Campus Walk Around Jiading",
    categoryId: demoCategorySportOptionId,
    description:
      "Short walk around campus to decompress after studying. Good for new students or anyone who wants fresh air.",
    startsInHours: 10,
    durationHours: 1,
    meetingPointId: demoMainGateLocationOptionId,
    maxParticipants: 3,
    maxRequests: null,
    participationMode: ParticipationMode.Open,
    genderPreference: GenderPreference.All,
    status: ActivityStatus.Open
  },
  {
    campusId: demoCampusId,
    hostAccountId: demoHostAccountId,
    title: "[DEMO] Mock: Quick Noodles After Lab",
    categoryId: demoCategoryLunchOptionId,
    description:
      "Heading to the cafeteria after lab work and happy to make it a small group. Easy conversation and a simple meal.",
    startsInHours: 24,
    durationHours: 1,
    meetingPointId: demoCafeteriaLocationOptionId,
    maxParticipants: 3,
    maxRequests: null,
    participationMode: ParticipationMode.Open,
    genderPreference: GenderPreference.MaleOnly,
    status: ActivityStatus.Open
  },
  {
    campusId: demoCampusId,
    hostAccountId: demoGuestAccountId,
    title: "[DEMO] Mock: Morning Espresso Reset",
    categoryId: demoCategoryCoffeeOptionId,
    description:
      "A short morning coffee for anyone who wants to start the day with a calmer pace before heading to class.",
    startsInHours: 25.5,
    durationHours: 0.75,
    meetingPointId: demoLibraryPlazaLocationOptionId,
    maxParticipants: 2,
    maxRequests: null,
    participationMode: ParticipationMode.Open,
    genderPreference: GenderPreference.FemaleOnly,
    status: ActivityStatus.Open
  },
  {
    campusId: demoCampusId,
    hostAccountId: demoHostAccountId,
    title: "[DEMO] Mock: Exam Prep Engineering Basics",
    categoryId: demoCategoryStudyOptionId,
    description:
      "Small group revision session for engineering fundamentals. Bring questions or exercises you want to discuss.",
    startsInHours: 27,
    durationHours: 2,
    meetingPointId: demoLibraryPlazaLocationOptionId,
    maxParticipants: 4,
    maxRequests: 3,
    participationMode: ParticipationMode.ApprovalBased,
    genderPreference: GenderPreference.All,
    status: ActivityStatus.Open
  },
  {
    campusId: demoCampusId,
    hostAccountId: demoGuestAccountId,
    title: "[DEMO] Mock: Badminton Doubles Practice",
    categoryId: demoCategorySportOptionId,
    description:
      "Light badminton practice at the sports center. We can rotate partners and keep the level friendly for beginners.",
    startsInHours: 29,
    durationHours: 1.5,
    meetingPointId: demoSportsCenterLocationOptionId,
    maxParticipants: 4,
    maxRequests: 3,
    participationMode: ParticipationMode.ApprovalBased,
    genderPreference: GenderPreference.All,
    status: ActivityStatus.Open
  },
  {
    campusId: demoCampusId,
    hostAccountId: demoHostAccountId,
    title: "[DEMO] Mock: Italian-Chinese Culture Swap",
    categoryId: demoCategoryLanguageExchangeOptionId,
    description:
      "Bring one small story, phrase, or food recommendation from your culture. We'll keep it casual and curious.",
    startsInHours: 31,
    durationHours: 1.5,
    meetingPointId: demoCafeteriaLocationOptionId,
    maxParticipants: 5,
    maxRequests: 4,
    participationMode: ParticipationMode.ApprovalBased,
    genderPreference: GenderPreference.All,
    status: ActivityStatus.Open
  },
  {
    campusId: demoCampusId,
    hostAccountId: demoGuestAccountId,
    title: "[DEMO] Mock: Quiet Thesis Writing Block",
    categoryId: demoCategoryStudyOptionId,
    description:
      "Two focused hours for thesis or project writing. We'll share goals first, then work quietly with a short break.",
    startsInHours: 34,
    durationHours: 2,
    meetingPointId: demoLibraryPlazaLocationOptionId,
    maxParticipants: 4,
    maxRequests: null,
    participationMode: ParticipationMode.Open,
    genderPreference: GenderPreference.All,
    status: ActivityStatus.Open
  },
  {
    campusId: demoCampusId,
    hostAccountId: demoHostAccountId,
    title: "[DEMO] Mock: Board Games Evening",
    categoryId: demoCategoryCoffeeOptionId,
    description:
      "Casual board games after class. No experience needed; we'll pick something easy and fun.",
    startsInHours: 49,
    durationHours: 2,
    meetingPointId: demoCafeteriaLocationOptionId,
    maxParticipants: 5,
    maxRequests: 4,
    participationMode: ParticipationMode.ApprovalBased,
    genderPreference: GenderPreference.All,
    status: ActivityStatus.Open
  },
  {
    campusId: demoCampusId,
    hostAccountId: demoGuestAccountId,
    title: "[DEMO] Mock: Lunch for New Exchange Students",
    categoryId: demoCategoryLunchOptionId,
    description:
      "A welcoming lunch for exchange students or anyone new to Jiading. We can share campus tips and class survival tricks.",
    startsInHours: 52,
    durationHours: 1,
    meetingPointId: demoCafeteriaLocationOptionId,
    maxParticipants: 4,
    maxRequests: null,
    participationMode: ParticipationMode.Open,
    genderPreference: GenderPreference.All,
    status: ActivityStatus.Open
  },
  {
    campusId: demoCampusId,
    hostAccountId: demoHostAccountId,
    title: "[DEMO] Mock: Step Count Walk from Main Gate",
    categoryId: demoCategorySportOptionId,
    description:
      "A relaxed walk from the main gate toward the quieter side of campus. Good for stretching after a long study day.",
    startsInHours: 55,
    durationHours: 1,
    meetingPointId: demoMainGateLocationOptionId,
    maxParticipants: 3,
    maxRequests: null,
    participationMode: ParticipationMode.Open,
    genderPreference: GenderPreference.All,
    status: ActivityStatus.Open
  },
  {
    campusId: demoCampusId,
    hostAccountId: demoGuestAccountId,
    title: "[DEMO] Mock: TOEFL Speaking Mini Practice",
    categoryId: demoCategoryLanguageExchangeOptionId,
    description:
      "Short speaking practice with timed answers and gentle feedback. Bring one prompt or use the ones I prepare.",
    startsInHours: 58,
    durationHours: 1,
    meetingPointId: demoLibraryPlazaLocationOptionId,
    maxParticipants: 4,
    maxRequests: 3,
    participationMode: ParticipationMode.ApprovalBased,
    genderPreference: GenderPreference.All,
    status: ActivityStatus.Open
  },
  {
    campusId: demoCampusId,
    hostAccountId: demoHostAccountId,
    title: "[DEMO] Mock: Project Debugging Study Circle",
    categoryId: demoCategoryStudyOptionId,
    description:
      "Bring a small coding or project blocker. We'll explain problems out loud and help each other find the next step.",
    startsInHours: 72,
    durationHours: 1.5,
    meetingPointId: demoLibraryPlazaLocationOptionId,
    maxParticipants: 4,
    maxRequests: 3,
    participationMode: ParticipationMode.ApprovalBased,
    genderPreference: GenderPreference.All,
    status: ActivityStatus.Open
  },
  {
    campusId: demoCampusId,
    hostAccountId: demoGuestAccountId,
    title: "[DEMO] Mock: Sunset Coffee and Campus Chat",
    categoryId: demoCategoryCoffeeOptionId,
    description:
      "Late afternoon coffee and an easy chat about classes, weekend plans, or whatever makes the day feel lighter.",
    startsInHours: 76,
    durationHours: 1,
    meetingPointId: demoMainGateLocationOptionId,
    maxParticipants: 3,
    maxRequests: null,
    participationMode: ParticipationMode.Open,
    genderPreference: GenderPreference.All,
    status: ActivityStatus.Open
  },
  {
    campusId: demoCampusId,
    hostAccountId: demoHostAccountId,
    title: "[DEMO] Mock: Women's Volleyball Serve Practice",
    categoryId: demoCategorySportOptionId,
    description:
      "Friendly volleyball serve practice at the sports center. We'll focus on basics and keep the session supportive.",
    startsInHours: 82,
    durationHours: 1.5,
    meetingPointId: demoSportsCenterLocationOptionId,
    maxParticipants: 5,
    maxRequests: 4,
    participationMode: ParticipationMode.ApprovalBased,
    genderPreference: GenderPreference.FemaleOnly,
    status: ActivityStatus.Open
  },
  {
    campusId: demoCampusId,
    hostAccountId: demoGuestAccountId,
    title: "[DEMO] Mock: Weekend Dim Sum Planning Lunch",
    categoryId: demoCategoryLunchOptionId,
    description:
      "Let's meet for lunch and compare nearby dim sum spots for the weekend. Useful if you like food plans but hate planning alone.",
    startsInHours: 96,
    durationHours: 1.25,
    meetingPointId: demoCafeteriaLocationOptionId,
    maxParticipants: 4,
    maxRequests: 3,
    participationMode: ParticipationMode.ApprovalBased,
    genderPreference: GenderPreference.All,
    status: ActivityStatus.Open
  },
  {
    campusId: demoCampusId,
    hostAccountId: demoHostAccountId,
    title: "[DEMO] Mock: Sunday Library Mock Exam Sprint",
    categoryId: demoCategoryStudyOptionId,
    description:
      "Three-hour mock exam sprint with a short review at the end. Bring practice questions and a water bottle.",
    startsInHours: 120,
    durationHours: 3,
    meetingPointId: demoLibraryPlazaLocationOptionId,
    maxParticipants: 5,
    maxRequests: 4,
    participationMode: ParticipationMode.ApprovalBased,
    genderPreference: GenderPreference.All,
    status: ActivityStatus.Open
  },
  {
    campusId: demoCampusId,
    hostAccountId: demoGuestAccountId,
    title: "[DEMO] Mock: Evening Hangout After Studio",
    categoryId: demoCategoryCoffeeOptionId,
    description:
      "Low-key evening hangout after studio or lab. Grab a drink, compare notes from the day, and decompress a bit.",
    startsInHours: 126,
    durationHours: 1.5,
    meetingPointId: demoCafeteriaLocationOptionId,
    maxParticipants: 4,
    maxRequests: null,
    participationMode: ParticipationMode.Open,
    genderPreference: GenderPreference.MaleOnly,
    status: ActivityStatus.Open
  }
];
