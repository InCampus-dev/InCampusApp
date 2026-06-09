import type { CampusInsightConsentSettingsDto } from "./dtos";

export function createDefaultCampusInsightConsentSettings(): CampusInsightConsentSettingsDto {
  return {
    basicInsightsEnabled: false,
    activityInsightsEnabled: false,
    hiddenActivityCategoryIds: [],
    excludeCoParticipants: true
  };
}

export function createLegacyEnabledCampusInsightConsentSettings(): CampusInsightConsentSettingsDto {
  return {
    basicInsightsEnabled: true,
    activityInsightsEnabled: true,
    hiddenActivityCategoryIds: [],
    excludeCoParticipants: true
  };
}

export function deriveCampusInsightSharingConsent(
  settings: CampusInsightConsentSettingsDto
): boolean {
  return settings.basicInsightsEnabled || settings.activityInsightsEnabled;
}

export function normalizeCampusInsightConsentSettings(
  value: unknown,
  legacyConsent = false
): CampusInsightConsentSettingsDto {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return legacyConsent
      ? createLegacyEnabledCampusInsightConsentSettings()
      : createDefaultCampusInsightConsentSettings();
  }

  const candidate = value as Partial<CampusInsightConsentSettingsDto>;

  return {
    basicInsightsEnabled:
      typeof candidate.basicInsightsEnabled === "boolean"
        ? candidate.basicInsightsEnabled
        : legacyConsent,
    activityInsightsEnabled:
      typeof candidate.activityInsightsEnabled === "boolean"
        ? candidate.activityInsightsEnabled
        : legacyConsent,
    hiddenActivityCategoryIds: Array.isArray(candidate.hiddenActivityCategoryIds)
      ? normalizeStringArray(candidate.hiddenActivityCategoryIds)
      : [],
    excludeCoParticipants:
      typeof candidate.excludeCoParticipants === "boolean"
        ? candidate.excludeCoParticipants
        : true
  };
}

export function normalizeStringArray(value: unknown[]): string[] {
  const normalizedValues: string[] = [];
  const seenValues = new Set<string>();

  for (const item of value) {
    if (typeof item !== "string") {
      continue;
    }

    const normalizedValue = item.trim();
    if (!normalizedValue || seenValues.has(normalizedValue)) {
      continue;
    }

    seenValues.add(normalizedValue);
    normalizedValues.push(normalizedValue);
  }

  return normalizedValues;
}
