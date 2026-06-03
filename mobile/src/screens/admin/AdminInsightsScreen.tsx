import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  EmptyState,
  InlineBanner,
  LoadingRows,
  ScreenShell,
  SectionCard,
  TopBar,
  colors,
} from '../../components/InCampusUI';
import { type StudentInsight, listStudentInsights } from '../../services/adminApi';
import { loadAdminContext, type AuthenticatedAdminContext } from '../../services/adminSession';
import { getApiErrorCode, getApiErrorMessage } from '../../services/api';
import type { RootStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminInsights'>;

export default function AdminInsightsScreen({ navigation }: Props) {
  const [adminContext, setAdminContext] = useState<AuthenticatedAdminContext | null>(null);
  const [students, setStudents] = useState<StudentInsight[]>([]);
  const [studentsWithoutInsightsEnabledCount, setStudentsWithoutInsightsEnabledCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  const fetchInsights = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'refresh') {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setErrorMessage(null);
    setAccessDenied(false);
    try {
      const context = await loadAdminContext();
      setAdminContext(context);
      if (!context) {
        setStudents([]);
        setErrorMessage('Admin demo context is missing. Return to sign in and continue as demo admin.');
        return;
      }
      const data = await listStudentInsights(context.selectedCampusId);
      setStudents(data.students);
      setStudentsWithoutInsightsEnabledCount(data.studentsWithoutInsightsEnabledCount ?? 0);
    } catch (error) {
      const code = getApiErrorCode(error);
      if (code === 'AUTH_FORBIDDEN' || code === 'AUTH_REQUIRED' || code === 'CAMPUS_SCOPE_VIOLATION') {
        setAccessDenied(true);
      }
      setErrorMessage(getApiErrorMessage(error) ?? 'Could not load student insights.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchInsights();
    }, [fetchInsights])
  );

  return (
    <ScreenShell padded={false} style={styles.screen}>
      <TopBar title="Student Insights" onBack={() => navigation.goBack()} rightLabel="Refresh" onRight={() => fetchInsights('refresh')} />
      <View style={styles.header}>
        <Text style={styles.title}>Consent-based insights</Text>
        <Text style={styles.subtitle}>
          {students.length === 1 ? '1 returned student' : `${students.length} returned students`}
          {studentsWithoutInsightsEnabledCount > 0
            ? ` - ${studentsWithoutInsightsEnabledCount} with no insights enabled`
            : ''}
        </Text>
      </View>
      {loading ? (
        <View style={styles.loadingWrap}>
          <LoadingRows count={3} />
        </View>
      ) : (
        <FlatList
          data={students}
          keyExtractor={(item) => item.studentAccountId}
          contentContainerStyle={[styles.list, students.length === 0 && styles.emptyList]}
          ListHeaderComponent={
            errorMessage || studentsWithoutInsightsEnabledCount > 0 ? (
              <View style={styles.listHeader}>
                {errorMessage ? (
                  <InlineBanner
                    tone={accessDenied ? 'error' : 'warning'}
                    text={errorMessage}
                    actionLabel="Retry"
                    onAction={() => fetchInsights('refresh')}
                  />
                ) : null}
                {studentsWithoutInsightsEnabledCount > 0 ? (
                  <InlineBanner
                    tone="warning"
                    text={`${studentsWithoutInsightsEnabledCount} ${
                      studentsWithoutInsightsEnabledCount === 1 ? 'student has' : 'students have'
                    } no insights enabled.`}
                  />
                ) : null}
              </View>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="I"
              title={adminContext ? 'No consent-eligible students' : 'Admin context required'}
              text={
                adminContext
                  ? studentsWithoutInsightsEnabledCount > 0
                    ? 'Students with no insights enabled are hidden from identifiable insight rows.'
                    : 'The backend did not return any students with campus insight sharing consent.'
                  : 'Return to sign in and continue as demo admin.'
              }
              primaryLabel="Refresh"
              onPrimary={() => fetchInsights('refresh')}
            />
          }
          renderItem={({ item }) => <StudentInsightCard student={item} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchInsights('refresh')}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}
    </ScreenShell>
  );
}

function StudentInsightCard({ student }: { student: StudentInsight }) {
  const { consentSettings } = student;
  const profileLabel = consentSettings.basicInsightsEnabled
    ? student.profile?.displayName ?? 'Profile not returned'
    : 'Basic insights not shared';

  return (
    <SectionCard style={styles.studentCard}>
      <View style={styles.studentTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(student.profile?.displayName)}</Text>
        </View>
        <View style={styles.studentTitleBlock}>
          <Text style={styles.studentName}>{profileLabel}</Text>
          <Text style={styles.studentId}>{student.studentAccountId}</Text>
          {consentSettings.basicInsightsEnabled && student.profile ? <Text style={styles.major}>{student.profile.major}</Text> : null}
        </View>
      </View>

      <View style={styles.consentRow}>
        <ConsentPill
          label={consentSettings.basicInsightsEnabled ? 'Basic shared' : 'Basic insights not shared'}
          active={consentSettings.basicInsightsEnabled}
        />
        <ConsentPill
          label={consentSettings.activityInsightsEnabled ? 'Activity shared' : 'Activity insights not shared'}
          active={consentSettings.activityInsightsEnabled}
        />
      </View>

      {!consentSettings.basicInsightsEnabled ? <InsightNotice text="Basic insights not shared" /> : null}
      {consentSettings.hiddenActivityCategoryIds.length > 0 ? <InsightNotice text="Some categories hidden by student" /> : null}
      {consentSettings.excludeCoParticipants ? <InsightNotice text="Co-participants hidden by student" /> : null}

      {consentSettings.basicInsightsEnabled && student.profile?.interests.length ? (
        <View style={styles.interestRow}>
          {student.profile.interests.map((interest) => (
            <View key={interest} style={styles.interestPill}>
              <Text style={styles.interestText}>{interest}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <InsightSection
        title="Hosted activities"
        count={student.hostedActivities.length}
        emptyText={consentSettings.activityInsightsEnabled ? 'No returned records.' : 'Activity insights not shared'}
      >
        {student.hostedActivities.map((activity) => (
          <InsightLine
            key={activity.activityId}
            primary={activity.title}
            secondary={`${activity.categoryLabel} - ${activity.status} - ${formatDate(activity.scheduledDateTime)}`}
          />
        ))}
      </InsightSection>

      <InsightSection
        title="Participations"
        count={student.participations.length}
        emptyText={consentSettings.activityInsightsEnabled ? 'No returned records.' : 'Activity insights not shared'}
      >
        {student.participations.map((participation) => (
          <InsightLine
            key={participation.participationId}
            primary={participation.activityTitle}
            secondary={`${participation.recordType} - ${participation.status} - ${formatDate(participation.createdAt)}`}
          />
        ))}
      </InsightSection>
    </SectionCard>
  );
}

function InsightSection({
  title,
  count,
  emptyText = 'No returned records.',
  children,
}: {
  title: string;
  count: number;
  emptyText?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.insightSection}>
      <Text style={styles.insightTitle}>{title} ({count})</Text>
      {count > 0 ? children : <Text style={styles.emptyText}>{emptyText}</Text>}
    </View>
  );
}

function ConsentPill({ label, active }: { label: string; active: boolean }) {
  return (
    <View style={[styles.consentPill, active ? styles.consentPillActive : styles.consentPillMuted]}>
      <Text style={[styles.consentPillText, active ? styles.consentPillTextActive : styles.consentPillTextMuted]}>
        {label}
      </Text>
    </View>
  );
}

function InsightNotice({ text }: { text: string }) {
  return (
    <View style={styles.noticeRow}>
      <Text style={styles.noticeText}>{text}</Text>
    </View>
  );
}

function InsightLine({ primary, secondary }: { primary: string; secondary: string }) {
  return (
    <View style={styles.insightLine}>
      <Text style={styles.linePrimary}>{primary}</Text>
      <Text style={styles.lineSecondary}>{secondary}</Text>
    </View>
  );
}

function initials(value?: string): string {
  if (!value) {
    return 'ST';
  }
  return value.trim().split(/\s+/).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('') || 'ST';
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }
  return date.toLocaleDateString();
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg, paddingTop: 48 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
  title: { color: colors.text, fontSize: 25, fontWeight: '900' },
  subtitle: { color: colors.text2, fontSize: 13, fontWeight: '800', marginTop: 4 },
  loadingWrap: { padding: 16 },
  listHeader: { gap: 10 },
  list: { padding: 16, gap: 12, paddingBottom: 32 },
  emptyList: { flexGrow: 1, justifyContent: 'center' },
  studentCard: { padding: 14, gap: 14 },
  studentTop: { flexDirection: 'row', gap: 12 },
  avatar: { width: 50, height: 50, borderRadius: 16, backgroundColor: colors.skySoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.skyDeep, fontSize: 16, fontWeight: '900' },
  studentTitleBlock: { flex: 1 },
  studentName: { color: colors.text, fontSize: 17, fontWeight: '900' },
  studentId: { color: colors.text3, fontSize: 11, fontWeight: '700', marginTop: 3 },
  major: { color: colors.text2, fontSize: 12, fontWeight: '800', marginTop: 4 },
  consentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  consentPill: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6 },
  consentPillActive: { backgroundColor: colors.successSoft },
  consentPillMuted: { backgroundColor: colors.borderSoft },
  consentPillText: { fontSize: 11, fontWeight: '900' },
  consentPillTextActive: { color: colors.primaryGreenPressed },
  consentPillTextMuted: { color: colors.text2 },
  noticeRow: { borderRadius: 12, backgroundColor: colors.bg, paddingHorizontal: 10, paddingVertical: 9 },
  noticeText: { color: colors.text2, fontSize: 12, fontWeight: '800' },
  interestRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  interestPill: { borderRadius: 999, backgroundColor: colors.primarySoft, paddingHorizontal: 9, paddingVertical: 5 },
  interestText: { color: colors.primaryDeep, fontSize: 11, fontWeight: '900' },
  insightSection: { gap: 7 },
  insightTitle: { color: colors.text2, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  insightLine: { borderRadius: 12, backgroundColor: colors.bg, paddingHorizontal: 10, paddingVertical: 9 },
  linePrimary: { color: colors.text, fontSize: 13, fontWeight: '900' },
  lineSecondary: { color: colors.text2, fontSize: 12, fontWeight: '700', marginTop: 3 },
  emptyText: { color: colors.text3, fontSize: 12, fontWeight: '700' },
});
