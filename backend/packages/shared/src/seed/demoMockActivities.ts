import type { CampusId, StudentAccountId } from "../domain/dtos";
import {
  ActivityStatus,
  GenderPreference,
  ParticipationMode
} from "../domain/enums";
import {
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

export interface DemoMockActivitySeed {
  campusId: CampusId;
  hostAccountId: StudentAccountId;
  title: string;
  categoryId: string;
  description: string;
  startsInDays: number;
  startTime: string;
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
    title: "Lunch at Cafeteria A",
    categoryId: demoCategoryLunchOptionId,
    description:
      "Looking for someone to grab a relaxed lunch between classes. No pressure, just good food and a quick chat.",
    startsInDays: 0,
    startTime: "12:05",
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
    title: "Coffee Before Afternoon Class",
    categoryId: demoCategoryCoffeeOptionId,
    description:
      "Quick coffee near campus before the next lecture. Ideal if you want a short break and a friendly conversation.",
    startsInDays: 0,
    startTime: "15:15",
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
    title: "Library Focus Session",
    categoryId: demoCategoryStudyOptionId,
    description:
      "Quiet 90-minute study block at the library. We can set goals at the beginning and check progress at the end.",
    startsInDays: 0,
    startTime: "19:30",
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
    title: "Beginner Basketball Shootaround",
    categoryId: demoCategorySportOptionId,
    description:
      "Casual basketball session, beginners welcome. We'll shoot around and maybe play a light 2v2 if enough people join.",
    startsInDays: 0,
    startTime: "18:35",
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
    title: "Chinese-English Language Exchange",
    categoryId: demoCategoryLanguageExchangeOptionId,
    description:
      "Half English, half Chinese conversation practice. Good for meeting people and improving speaking confidence.",
    startsInDays: 0,
    startTime: "20:20",
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
    title: "Campus Walk Around Jiading",
    categoryId: demoCategorySportOptionId,
    description:
      "Short walk around campus to decompress after studying. Good for new students or anyone who wants fresh air.",
    startsInDays: 0,
    startTime: "21:05",
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
    title: "Quick Noodles After Lab",
    categoryId: demoCategoryLunchOptionId,
    description:
      "Heading to the cafeteria after lab work and happy to make it a small group. Easy conversation and a simple meal.",
    startsInDays: 1,
    startTime: "17:35",
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
    title: "Morning Espresso Reset",
    categoryId: demoCategoryCoffeeOptionId,
    description:
      "A short morning coffee for anyone who wants to start the day with a calmer pace before heading to class.",
    startsInDays: 1,
    startTime: "09:40",
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
    title: "Exam Prep Engineering Basics",
    categoryId: demoCategoryStudyOptionId,
    description:
      "Small group revision session for engineering fundamentals. Bring questions or exercises you want to discuss.",
    startsInDays: 1,
    startTime: "13:35",
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
    title: "Badminton Doubles Practice",
    categoryId: demoCategorySportOptionId,
    description:
      "Light badminton practice at the sports center. We can rotate partners and keep the level friendly for beginners.",
    startsInDays: 1,
    startTime: "15:35",
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
    title: "Italian-Chinese Culture Swap",
    categoryId: demoCategoryLanguageExchangeOptionId,
    description:
      "Bring one small story, phrase, or food recommendation from your culture. We'll keep it casual and curious.",
    startsInDays: 1,
    startTime: "18:05",
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
    title: "Quiet Thesis Writing Block",
    categoryId: demoCategoryStudyOptionId,
    description:
      "Two focused hours for thesis or project writing. We'll share goals first, then work quietly with a short break.",
    startsInDays: 1,
    startTime: "20:30",
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
    title: "Board Games Evening",
    categoryId: demoCategoryCoffeeOptionId,
    description:
      "Casual board games after class. No experience needed; we'll pick something easy and fun.",
    startsInDays: 2,
    startTime: "19:25",
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
    title: "Lunch for New Exchange Students",
    categoryId: demoCategoryLunchOptionId,
    description:
      "A welcoming lunch for exchange students or anyone new to Jiading. We can share campus tips and class survival tricks.",
    startsInDays: 2,
    startTime: "12:10",
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
    title: "Step Count Walk from Main Gate",
    categoryId: demoCategorySportOptionId,
    description:
      "A relaxed walk from the main gate toward the quieter side of campus. Good for stretching after a long study day.",
    startsInDays: 2,
    startTime: "17:15",
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
    title: "TOEFL Speaking Mini Practice",
    categoryId: demoCategoryLanguageExchangeOptionId,
    description:
      "Short speaking practice with timed answers and gentle feedback. Bring one prompt or use the ones I prepare.",
    startsInDays: 2,
    startTime: "09:45",
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
    title: "Project Debugging Study Circle",
    categoryId: demoCategoryStudyOptionId,
    description:
      "Bring a small coding or project blocker. We'll explain problems out loud and help each other find the next step.",
    startsInDays: 3,
    startTime: "13:45",
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
    title: "Sunset Coffee and Campus Chat",
    categoryId: demoCategoryCoffeeOptionId,
    description:
      "Late afternoon coffee and an easy chat about classes, weekend plans, or whatever makes the day feel lighter.",
    startsInDays: 3,
    startTime: "17:50",
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
    title: "Women's Volleyball Serve Practice",
    categoryId: demoCategorySportOptionId,
    description:
      "Friendly volleyball serve practice at the sports center. We'll focus on basics and keep the session supportive.",
    startsInDays: 3,
    startTime: "15:40",
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
    title: "Weekend Dim Sum Planning Lunch",
    categoryId: demoCategoryLunchOptionId,
    description:
      "Let's meet for lunch and compare nearby dim sum spots for the weekend. Useful if you like food plans but hate planning alone.",
    startsInDays: 4,
    startTime: "11:55",
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
    title: "Sunday Library Mock Exam Sprint",
    categoryId: demoCategoryStudyOptionId,
    description:
      "Three-hour mock exam sprint with a short review at the end. Bring practice questions and a water bottle.",
    startsInDays: 5,
    startTime: "09:50",
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
    title: "Evening Hangout After Studio",
    categoryId: demoCategoryCoffeeOptionId,
    description:
      "Low-key evening hangout after studio or lab. Grab a drink, compare notes from the day, and decompress a bit.",
    startsInDays: 5,
    startTime: "20:05",
    durationHours: 1.5,
    meetingPointId: demoCafeteriaLocationOptionId,
    maxParticipants: 4,
    maxRequests: null,
    participationMode: ParticipationMode.Open,
    genderPreference: GenderPreference.MaleOnly,
    status: ActivityStatus.Open
  }
];
