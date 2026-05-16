import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import api, { getApiErrorMessage } from '../services/api';

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

export default function CommunityRulesScreen() {
  const [rules, setRules] = useState<CommunityRulesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchRules = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'refresh') {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setErrorMessage(null);

    try {
      const response = await api.get<CommunityRulesResponse>('/community-rules');
      setRules(response.data);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error) ?? 'Community rules could not be loaded.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.stateText}>Loading community rules...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchRules('refresh')} />}
    >
      <Text style={styles.title}>{rules?.title ?? 'InCampus Community Rules'}</Text>
      <Text style={styles.subtitle}>
        These rules are static MVP safety content and do not create a view record or acknowledgement.
      </Text>

      {errorMessage ? (
        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>{errorMessage}</Text>
          <TouchableOpacity onPress={() => fetchRules('refresh')}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {(rules?.sections ?? FALLBACK_RULE_SECTIONS).map((section) => (
        <View key={section.sectionId} style={styles.ruleCard}>
          <Text style={styles.ruleTitle}>{section.title}</Text>
          <Text style={styles.ruleBody}>{section.body}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const FALLBACK_RULE_SECTIONS: CommunityRuleSection[] = [
  {
    sectionId: 'respect-campus-context',
    title: 'Respect campus context',
    body: 'Use InCampus to make ordinary student life easier, safer, and more welcoming.',
  },
  {
    sectionId: 'report-unsafe-behavior',
    title: 'Report unsafe behavior',
    body: 'Use report and block actions when an interaction feels unsafe or inappropriate.',
  },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingBottom: 36 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  stateText: { marginTop: 8, fontSize: 14, color: '#666' },
  title: { fontSize: 24, fontWeight: '700', color: '#222', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 18 },
  noticeBox: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#fff8e1',
    borderWidth: 1,
    borderColor: '#ffecb3',
    marginBottom: 16,
  },
  noticeText: { color: '#6d4c00', fontSize: 14, lineHeight: 20, marginBottom: 6 },
  retryText: { color: '#1976d2', fontSize: 14, fontWeight: '700' },
  ruleCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#f8fafc',
  },
  ruleTitle: { fontSize: 16, fontWeight: '700', color: '#222', marginBottom: 8 },
  ruleBody: { fontSize: 14, color: '#555', lineHeight: 20 },
});
