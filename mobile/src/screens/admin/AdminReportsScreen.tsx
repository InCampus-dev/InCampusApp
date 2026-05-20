import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
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
import { type AdminReportListItem, listAdminReports } from '../../services/adminApi';
import { loadAdminContext, type AuthenticatedAdminContext } from '../../services/adminSession';
import { getApiErrorMessage } from '../../services/api';
import type { RootStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminReports'>;

export default function AdminReportsScreen({ navigation }: Props) {
  const [adminContext, setAdminContext] = useState<AuthenticatedAdminContext | null>(null);
  const [reports, setReports] = useState<AdminReportListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchReports = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'refresh') {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setErrorMessage(null);
    try {
      const context = await loadAdminContext();
      setAdminContext(context);
      if (!context) {
        setReports([]);
        setErrorMessage('Admin demo context is missing. Return to sign in and continue as demo admin.');
        return;
      }
      setReports(await listAdminReports(context.selectedCampusId));
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error) ?? 'Could not load reports.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchReports();
    }, [fetchReports])
  );

  const sortedReports = useMemo(() => sortReports(reports), [reports]);

  return (
    <ScreenShell padded={false} style={styles.screen}>
      <TopBar title="Reports" onBack={() => navigation.goBack()} rightLabel="Refresh" onRight={() => fetchReports('refresh')} />
      <View style={styles.header}>
        <Text style={styles.title}>Review queue</Text>
        <Text style={styles.subtitle}>
          {reports.length === 1 ? '1 campus report' : `${reports.length} campus reports`}
        </Text>
      </View>
      {loading ? (
        <View style={styles.loadingWrap}>
          <LoadingRows count={4} />
        </View>
      ) : (
        <FlatList
          data={sortedReports}
          keyExtractor={(item) => item.reportId}
          contentContainerStyle={[styles.list, sortedReports.length === 0 && styles.emptyList]}
          ListHeaderComponent={
            errorMessage ? (
              <InlineBanner tone="error" text={errorMessage} actionLabel="Retry" onAction={() => fetchReports('refresh')} />
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="R"
              title="No reports yet"
              text="Submitted campus reports will appear here after students use the report flow."
              primaryLabel="Refresh"
              onPrimary={() => fetchReports('refresh')}
            />
          }
          renderItem={({ item }) => (
            <ReportCard
              report={item}
              onPress={() => navigation.navigate('AdminReportDetail', { reportId: item.reportId, reportSummary: item })}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchReports('refresh')}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}
      {!adminContext && !loading ? <View style={styles.bottomSpace} /> : null}
    </ScreenShell>
  );
}

function ReportCard({ report, onPress }: { report: AdminReportListItem; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <SectionCard style={styles.reportCard}>
        <View style={styles.reportTop}>
          <View style={styles.reportTitleBlock}>
            <Text style={styles.reportTitle}>{report.targetType === 'activity' ? 'Activity report' : 'Student report'}</Text>
            <Text style={styles.reportId}>{report.reportId}</Text>
          </View>
          <StatusPill status={report.status} />
        </View>
        <View style={styles.metaGrid}>
          <Meta label="Reason" value={report.reasonCode} />
          <Meta label="Submitted" value={formatDate(report.submittedAt)} />
          <Meta label="Action" value={formatEnum(report.moderationAction)} />
          <Meta label="Outcome" value={report.reviewOutcome ? formatEnum(report.reviewOutcome) : 'Pending'} />
        </View>
        <Text style={styles.targetText}>
          {report.targetType === 'activity'
            ? `Target activity: ${report.targetActivityId ?? 'Unavailable'}`
            : `Target student: ${report.targetAccountId ?? 'Unavailable'}`}
        </Text>
      </SectionCard>
    </Pressable>
  );
}

function StatusPill({ status }: { status: AdminReportListItem['status'] }) {
  const pending = status === 'pending_review';
  return (
    <View style={[styles.statusPill, pending ? styles.pendingPill : styles.reviewedPill]}>
      <Text style={[styles.statusText, pending ? styles.pendingText : styles.reviewedText]}>
        {pending ? 'Pending' : 'Reviewed'}
      </Text>
    </View>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaItem}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function sortReports(reports: AdminReportListItem[]): AdminReportListItem[] {
  return [...reports].sort((left, right) => {
    if (left.status !== right.status) {
      return left.status === 'pending_review' ? -1 : 1;
    }
    return new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime();
  });
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }
  return date.toLocaleDateString();
}

function formatEnum(value: string): string {
  return value.replace(/_/g, ' ');
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg, paddingTop: 48 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
  title: { color: colors.text, fontSize: 25, fontWeight: '900' },
  subtitle: { color: colors.text2, fontSize: 13, fontWeight: '800', marginTop: 4 },
  loadingWrap: { padding: 16 },
  list: { padding: 16, gap: 12, paddingBottom: 32 },
  emptyList: { flexGrow: 1, justifyContent: 'center' },
  reportCard: { padding: 14, gap: 12 },
  reportTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  reportTitleBlock: { flex: 1 },
  reportTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  reportId: { color: colors.text3, fontSize: 11, fontWeight: '700', marginTop: 3 },
  statusPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  pendingPill: { backgroundColor: colors.yellowSoft },
  reviewedPill: { backgroundColor: colors.primarySoft },
  statusText: { fontSize: 11, fontWeight: '900' },
  pendingText: { color: '#8A5B00' },
  reviewedText: { color: colors.primaryDeep },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaItem: { width: '48%', borderRadius: 12, backgroundColor: colors.bg, paddingHorizontal: 10, paddingVertical: 9 },
  metaLabel: { color: colors.text3, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  metaValue: { color: colors.text, fontSize: 12, fontWeight: '800', marginTop: 3 },
  targetText: { color: colors.text2, fontSize: 12, fontWeight: '700' },
  bottomSpace: { height: 12 },
});
