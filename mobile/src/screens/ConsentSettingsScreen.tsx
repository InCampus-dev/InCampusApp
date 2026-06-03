import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BottomActionBar,
  InlineBanner,
  PrimaryButton,
  ScreenShell,
  colors,
} from '../components/InCampusUI';
import api, { getApiErrorCode } from '../services/api';
import { type CampusStructuredOption, listCampusStructuredOptions } from '../services/studentApi';

interface CampusInsightConsentSettings {
  basicInsightsEnabled: boolean;
  activityInsightsEnabled: boolean;
  hiddenActivityCategoryIds: string[];
  excludeCoParticipants: boolean;
}

interface CampusInsightConsentResponse {
  campusInsightSharingConsent: boolean;
  campusInsightConsentSettings: CampusInsightConsentSettings;
}

const DEFAULT_SETTINGS: CampusInsightConsentSettings = {
  basicInsightsEnabled: false,
  activityInsightsEnabled: false,
  hiddenActivityCategoryIds: [],
  excludeCoParticipants: true,
};

export default function ConsentSettingsScreen({ navigation }: { navigation: any }) {
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState<CampusInsightConsentSettings>(DEFAULT_SETTINGS);
  const [categories, setCategories] = useState<CampusStructuredOption[]>([]);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [loadNotice, setLoadNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    let mounted = true;

    async function loadInitialState() {
      setInitializing(true);
      setCategoryLoading(true);
      setLoadNotice(null);
      setCategoryError(null);

      const [consentResult, categoryResult] = await Promise.allSettled([
        api.get<CampusInsightConsentResponse>('/accounts/me/insight-consent'),
        loadCampusCategories(),
      ]);

      if (!mounted) {
        return;
      }

      if (consentResult.status === 'fulfilled') {
        setSettings(normalizeSettings(consentResult.value.data.campusInsightConsentSettings));
      } else {
        setSettings(DEFAULT_SETTINGS);
        setLoadNotice('Saved choices could not be loaded. Default choices are shown.');
      }

      if (categoryResult.status === 'fulfilled') {
        setCategories(categoryResult.value);
      } else {
        setCategories([]);
        setCategoryError('Activity categories could not be loaded. You can still save your choices.');
      }

      setCategoryLoading(false);
      setInitializing(false);
    }

    loadInitialState();

    return () => {
      mounted = false;
    };
  }, []);

  function updateSettings(nextSettings: Partial<CampusInsightConsentSettings>) {
    setSettings((current) => ({
      ...current,
      ...nextSettings,
    }));
  }

  function toggleHiddenCategory(categoryId: string) {
    setSettings((current) => {
      const hiddenIds = new Set(current.hiddenActivityCategoryIds);
      if (hiddenIds.has(categoryId)) {
        hiddenIds.delete(categoryId);
      } else {
        hiddenIds.add(categoryId);
      }

      return {
        ...current,
        hiddenActivityCategoryIds: Array.from(hiddenIds),
      };
    });
  }

  async function saveConsent(nextSettings: CampusInsightConsentSettings) {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await api.patch('/accounts/me/insight-consent', nextSettings);
      navigation.reset({ index: 0, routes: [{ name: 'ActivityFeed' }] });
    } catch (error) {
      const code = getApiErrorCode(error);
      setErrorMessage(
        code === 'NOT_FOUND' || code === 'AccountNotFound'
          ? 'Account not found. Please sign in again.'
          : 'Could not save your choices. Try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScreenShell padded={false} style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top, 18) + 12 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Control your campus insights</Text>
          <Text style={styles.subtitle}>
            Choose what authorised campus staff can use to better understand student life on your campus. You can change this anytime.
          </Text>
        </View>

        {initializing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Loading choices</Text>
          </View>
        ) : null}

        {loadNotice ? <InlineBanner tone="warning" text={loadNotice} /> : null}
        {errorMessage ? <InlineBanner tone="error" text={errorMessage} actionLabel="Retry" onAction={() => saveConsent(settings)} /> : null}

        <ConsentSection
          title="Basic insights"
          copy="Share your profile information with authorised campus staff to help them understand student interests and needs."
          includes="Includes: display name, major, date of birth, gender, interests, languages, and short bio."
          enabled={settings.basicInsightsEnabled}
          onValueChange={(value) => updateSettings({ basicInsightsEnabled: value })}
          disabled={submitting || initializing}
        />

        <ConsentSection
          title="Activity insights"
          copy="Share insights about the activities you host, join, or request, so campus staff can understand what students actually use on campus."
          includes="Includes: activity category, date and time, location, and whether you hosted, joined, or requested the activity."
          enabled={settings.activityInsightsEnabled}
          onValueChange={(value) => updateSettings({ activityInsightsEnabled: value })}
          disabled={submitting || initializing}
        >
          <View style={styles.accordion}>
            <Pressable style={styles.accordionHeader} onPress={() => setCustomizeOpen((open) => !open)}>
              <Text style={styles.accordionTitle}>Customize activity insights</Text>
              <Chevron open={customizeOpen} />
            </Pressable>
            {customizeOpen ? (
              <View style={styles.customizeBody}>
                <View style={styles.customizeBlock}>
                  <Text style={styles.customizeTitle}>Hide activity categories from insights</Text>
                  <Text style={styles.helperText}>Select categories you do not want to include in campus insights.</Text>
                  {categoryLoading ? (
                    <View style={styles.categoryLoadingRow}>
                      <ActivityIndicator color={colors.primaryGreenPressed} size="small" />
                      <Text style={styles.helperText}>Loading categories</Text>
                    </View>
                  ) : categories.length > 0 ? (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.categoryRow}
                    >
                      {categories.map((category) => {
                        const selected = settings.hiddenActivityCategoryIds.includes(category.optionId);
                        return (
                          <Pressable
                            key={category.optionId}
                            style={[styles.categoryChip, selected && styles.categoryChipSelected]}
                            onPress={() => toggleHiddenCategory(category.optionId)}
                            disabled={submitting}
                          >
                            <Text style={[styles.categoryChipText, selected && styles.categoryChipTextSelected]}>
                              {category.name}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  ) : (
                    <Text style={styles.emptyCategoryText}>
                      {categoryError ?? 'No activity categories are available right now.'}
                    </Text>
                  )}
                  {categoryError && categories.length > 0 ? <Text style={styles.emptyCategoryText}>{categoryError}</Text> : null}
                </View>

                <View style={styles.inlineSetting}>
                  <View style={styles.inlineTextCol}>
                    <Text style={styles.customizeTitle}>Do not share who I joined activities with</Text>
                    <Text style={styles.helperText}>
                      Campus staff can still see your activity patterns, but not the list of students who attended with you.
                    </Text>
                  </View>
                  <Switch
                    value={settings.excludeCoParticipants}
                    onValueChange={(value) => updateSettings({ excludeCoParticipants: value })}
                    disabled={submitting}
                    trackColor={{ false: '#D0D5DD', true: colors.primaryGreen }}
                    thumbColor={colors.card}
                  />
                </View>
              </View>
            ) : null}
          </View>
        </ConsentSection>

        <View style={styles.controlCard}>
          <Text style={styles.sectionTitle}>Your control</Text>
          <Text style={styles.controlCopy}>
            You can update these choices anytime. Turning insights off does not affect your access to InCampus.
          </Text>
          <View style={styles.controlNote}>
            <Text style={styles.controlNoteText}>Safety reports and moderation reviews are handled separately.</Text>
          </View>
        </View>
      </ScrollView>

      <BottomActionBar>
        <PrimaryButton
          label="Continue"
          loading={submitting}
          disabled={initializing}
          onPress={() => saveConsent(settings)}
        />
        <Pressable
          style={styles.skipLink}
          onPress={() => saveConsent(DEFAULT_SETTINGS)}
          disabled={submitting || initializing}
        >
          <Text style={styles.skipText}>Skip for now</Text>
        </Pressable>
      </BottomActionBar>
    </ScreenShell>
  );
}

async function loadCampusCategories(): Promise<CampusStructuredOption[]> {
  const selectedCampusId = await AsyncStorage.getItem('selectedCampusId');
  if (!selectedCampusId) {
    throw new Error('Missing selected campus');
  }

  const options = await listCampusStructuredOptions(selectedCampusId, {
    optionType: 'activity_category',
  });

  return options.filter((option) => option.isActive);
}

function normalizeSettings(value?: CampusInsightConsentSettings | null): CampusInsightConsentSettings {
  if (!value) {
    return DEFAULT_SETTINGS;
  }

  return {
    basicInsightsEnabled: value.basicInsightsEnabled === true,
    activityInsightsEnabled: value.activityInsightsEnabled === true,
    hiddenActivityCategoryIds: Array.isArray(value.hiddenActivityCategoryIds)
      ? value.hiddenActivityCategoryIds.filter((item): item is string => typeof item === 'string')
      : [],
    excludeCoParticipants: value.excludeCoParticipants !== false,
  };
}

function ConsentSection({
  title,
  copy,
  includes,
  enabled,
  disabled,
  onValueChange,
  children,
}: {
  title: string;
  copy: string;
  includes: string;
  enabled: boolean;
  disabled?: boolean;
  onValueChange: (value: boolean) => void;
  children?: React.ReactNode;
}) {
  return (
    <View style={[styles.sectionCard, enabled && styles.sectionCardActive]}>
      <View style={styles.sectionTop}>
        <View style={styles.sectionTextCol}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionCopy}>{copy}</Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={onValueChange}
          disabled={disabled}
          trackColor={{ false: '#D0D5DD', true: colors.primaryGreen }}
          thumbColor={colors.card}
        />
      </View>
      <Text style={styles.sectionIncludes}>{includes}</Text>
      {children}
    </View>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <View style={styles.chevronIcon} accessibilityElementsHidden>
      <View style={[styles.chevronLine, open ? styles.chevronLeftOpen : styles.chevronLeftClosed]} />
      <View style={[styles.chevronLine, open ? styles.chevronRightOpen : styles.chevronRightClosed]} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 24, gap: 12 },
  header: { paddingTop: 8, paddingBottom: 8 },
  title: { color: colors.text, fontSize: 27, fontWeight: '900', letterSpacing: 0, lineHeight: 33 },
  subtitle: { color: colors.text2, fontSize: 15, fontWeight: '600', lineHeight: 22, marginTop: 8 },
  loadingBox: { borderRadius: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderSoft, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  loadingText: { color: colors.text2, fontSize: 13, fontWeight: '800' },
  sectionCard: { borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card, borderRadius: 18, padding: 16, gap: 13 },
  sectionCardActive: { borderColor: colors.primaryGreen },
  sectionTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  sectionTextCol: { flex: 1 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '900', lineHeight: 21 },
  sectionCopy: { color: colors.text2, fontSize: 12, fontWeight: '600', lineHeight: 17, marginTop: 5 },
  sectionIncludes: { color: colors.text2, fontSize: 12, fontWeight: '800', lineHeight: 17, backgroundColor: colors.bg, borderRadius: 12, paddingHorizontal: 11, paddingVertical: 9 },
  accordion: { borderTopWidth: 1, borderTopColor: colors.borderSoft, paddingTop: 2 },
  accordionHeader: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  accordionTitle: { color: colors.text, fontSize: 14, fontWeight: '900' },
  chevronIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  chevronLine: { position: 'absolute', width: 10, height: 2.5, borderRadius: 2, backgroundColor: colors.text2 },
  chevronLeftClosed: { left: 6, transform: [{ rotate: '45deg' }] },
  chevronRightClosed: { right: 6, transform: [{ rotate: '-45deg' }] },
  chevronLeftOpen: { left: 6, transform: [{ rotate: '-45deg' }] },
  chevronRightOpen: { right: 6, transform: [{ rotate: '45deg' }] },
  customizeBody: { gap: 14, paddingTop: 4 },
  customizeBlock: { gap: 8 },
  customizeTitle: { color: colors.text, fontSize: 14, fontWeight: '900', lineHeight: 19 },
  helperText: { color: colors.text2, fontSize: 12, fontWeight: '600', lineHeight: 17 },
  categoryLoadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  categoryRow: { gap: 8, paddingVertical: 4, paddingRight: 16 },
  categoryChip: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 999, backgroundColor: colors.card, paddingHorizontal: 13, paddingVertical: 9 },
  categoryChipSelected: { borderColor: colors.primaryGreen, backgroundColor: colors.successSoft },
  categoryChipText: { color: colors.text, fontSize: 13, fontWeight: '800' },
  categoryChipTextSelected: { color: colors.primaryGreenPressed },
  emptyCategoryText: { color: colors.text3, fontSize: 12, fontWeight: '700', lineHeight: 17 },
  inlineSetting: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 14, backgroundColor: colors.bg, padding: 12 },
  inlineTextCol: { flex: 1 },
  controlCard: { backgroundColor: colors.primaryGhost, borderRadius: 16, padding: 16, gap: 10 },
  controlCopy: { color: colors.text2, fontSize: 12, fontWeight: '600', lineHeight: 17 },
  controlNote: { borderLeftWidth: 3, borderLeftColor: colors.primaryGreen, paddingLeft: 10, paddingVertical: 2 },
  controlNoteText: { color: colors.text2, fontSize: 12, fontWeight: '800', lineHeight: 17 },
  skipLink: { alignItems: 'center', paddingVertical: 12 },
  skipText: { color: colors.text2, fontSize: 14, fontWeight: '900' },
});
