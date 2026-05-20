import type {
  CommunityRuleSectionDto,
  CommunityRulesDto
} from "../../../shared/src/domain/dtos";

export class CommunityRulesContentProvider {
  public getCommunityRules(locale?: unknown): CommunityRulesDto {
    return {
      locale: resolveLocale(locale),
      title: "InCampus Community Rules",
      sections: COMMUNITY_RULES_SECTIONS
    };
  }
}

const COMMUNITY_RULES_SECTIONS: CommunityRuleSectionDto[] = [
  {
    sectionId: "respect-other-students",
    title: "Respect other students",
    body: "Treat people with respect in messages, profiles, and activities."
  },
  {
    sectionId: "use-real-campus-identity",
    title: "Use real campus identity",
    body: "Use your real student identity and keep your campus details accurate."
  },
  {
    sectionId: "no-harassment-or-discrimination",
    title: "Do not harass, threaten, or discriminate",
    body: "Harassment, threats, hate, and discrimination are not allowed."
  },
  {
    sectionId: "create-accurate-activities",
    title: "Create accurate activities",
    body: "Post truthful activity details so students can make informed decisions."
  },
  {
    sectionId: "report-unsafe-behavior",
    title: "Report unsafe or inappropriate behavior",
    body: "If something feels unsafe or inappropriate, report it through the platform."
  },
  {
    sectionId: "blocking-limits-interaction",
    title: "Blocking limits future interaction",
    body: "Blocking another student is meant to reduce future interaction across the platform."
  }
];

function resolveLocale(locale: unknown): string {
  if (typeof locale !== "string") {
    return "en";
  }

  const normalizedLocale = locale.trim().toLowerCase();

  return normalizedLocale === "en" || normalizedLocale.startsWith("en-") ? "en" : "en";
}
