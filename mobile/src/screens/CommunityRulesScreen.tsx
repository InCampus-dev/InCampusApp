import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import api, { getApiErrorMessage } from '../services/api';
import {
  EmptyState,
  InlineBanner,
  LoadingRows,
  ScreenShell,
  SectionCard,
  TopBar,
  colors,
} from '../components/InCampusUI';

interface CommunityRuleSection {
  sectionId: string;
  title: string;
  body: string;
}

interface CommunityRulesResponse {
  locale: string;
  title: string;
  sections: CommunityRuleSection[];
}

export default function CommunityRulesScreen({ navigation }: { navigation: any }) {
  const [rules, setRules] = useState<CommunityRulesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const fetchRules = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'refresh') setRefreshing(true);
    else setLoading(true);
    setErrorMessage(null);
    try {
      const response = await api.get<CommunityRulesResponse>('/community-rules');
      setRules(response.data);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error) ?? "Couldn't load community guidelines");
      setRules({ locale: 'en', title: 'Community Guidelines', sections: FALLBACK_RULE_SECTIONS });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  const sections = rules?.sections ?? [];

  return (
    <ScreenShell padded={false} style={styles.screen}>
      <TopBar title="Community Guidelines" onBack={() => navigation.goBack()} />
      {loading ? (
        <View style={styles.loadingWrap}><LoadingRows count={4} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchRules('refresh')} />}
        >
          <View style={styles.introCard}>
            <Text style={styles.introText}>InCampus works because everyone looks out for each other.</Text>
          </View>
          {errorMessage ? <InlineBanner tone="error" text={errorMessage} actionLabel="Retry" onAction={() => fetchRules('refresh')} /> : null}
          {sections.length === 0 ? <EmptyState title="Community guidelines will appear here soon" /> : sections.map((section, index) => <RuleCard key={section.sectionId || index} section={section} index={index} />)}
          <SectionCard style={styles.reportCard}>
            <View style={styles.reportTextCol}>
              <Text style={styles.reportTitle}>See something off?</Text>
              <Text style={styles.reportBody}>Help keep campus safe.</Text>
            </View>
            <Text style={styles.reportLink} onPress={() => navigation.navigate('ReportSubmission')}>Report a concern</Text>
          </SectionCard>
        </ScrollView>
      )}
    </ScreenShell>
  );
}

function RuleCard({ section, index }: { section: CommunityRuleSection; index: number }) {
  const tone = RULE_TONES[index % RULE_TONES.length];
  return (
    <SectionCard style={styles.ruleCard}>
      <View style={[styles.ruleNumber, { backgroundColor: tone.bg }]}><Text style={[styles.ruleNumberText, { color: tone.fg }]}>{String(index + 1).padStart(2, '0')}</Text></View>
      <View style={styles.ruleTextCol}>
        <Text style={styles.ruleTitle}>{section.title}</Text>
        <Text style={styles.ruleBody}>{section.body}</Text>
      </View>
    </SectionCard>
  );
}

const FALLBACK_RULE_SECTIONS: CommunityRuleSection[] = [
  { sectionId: 'respect', title: 'Respect other students', body: 'Treat people with respect in messages, profiles, and activities.' },
  { sectionId: 'identity', title: 'Use real campus identity', body: 'Use your real student identity and keep your campus details accurate.' },
  { sectionId: 'harassment', title: 'Do not harass, threaten, or discriminate', body: 'Harassment, threats, hate, and discrimination are not allowed.' },
  { sectionId: 'accurate', title: 'Create accurate activities', body: 'Post truthful activity details so students can make informed decisions.' },
  { sectionId: 'report', title: 'Report unsafe or inappropriate behavior', body: 'If something feels unsafe or inappropriate, report it through the platform.' },
];

const RULE_TONES = [
  { bg: colors.primarySoft, fg: colors.primary },
  { bg: colors.successSoft, fg: colors.primaryGreenPressed },
  { bg: colors.coralSoft, fg: colors.coralDeep },
  { bg: colors.yellowSoft, fg: '#8A5B00' },
];

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg, paddingTop: 54 },
  loadingWrap: { padding: 16 },
  content: { padding: 16, gap: 10, paddingBottom: 28 },
  introCard: { padding: 16, borderRadius: 18, backgroundColor: colors.successSoft, borderWidth: 1, borderColor: '#D7F0E5' },
  introText: { color: colors.text, fontSize: 14, fontWeight: '800', lineHeight: 20 },
  ruleCard: { padding: 15, flexDirection: 'row', gap: 12 },
  ruleNumber: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  ruleNumberText: { fontSize: 12, fontWeight: '900' },
  ruleTextCol: { flex: 1 },
  ruleTitle: { color: colors.text, fontSize: 16, fontWeight: '900', lineHeight: 21 },
  ruleBody: { color: colors.text2, fontSize: 13, fontWeight: '600', lineHeight: 20, marginTop: 4 },
  reportCard: { padding: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  reportTextCol: { flex: 1 },
  reportTitle: { color: colors.text, fontSize: 14, fontWeight: '900' },
  reportBody: { color: colors.text2, fontSize: 12, fontWeight: '700', marginTop: 2 },
  reportLink: { color: colors.primary, fontSize: 13, fontWeight: '900' },
});
