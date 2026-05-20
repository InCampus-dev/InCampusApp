import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  type ActivityReportTargetContext,
  type AdminReportDetail,
  type AdminReportListItem,
  type AdminReportReviewed,
  type ModerationAction,
  type ReviewOutcome,
  getAdminReportDetail,
  reviewAdminReport,
} from '../../services/adminApi';
import { loadAdminContext, type AuthenticatedAdminContext } from '../../services/adminSession';
import { getApiErrorCode, getApiErrorMessage } from '../../services/api';
import {
  Chip,
  EmptyState,
  InlineBanner,
  LoadingRows,
  PrimaryButton,
  ScreenShell,
  SectionCard,
  TextField,
  TopBar,
  colors,
} from '../../components/InCampusUI';
import type { RootStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminReportDetail'>;

const OUTCOMES: Array<{ value: ReviewOutcome; label: string }> = [
  { value: 'no_action', label: 'No action' },
  { value: 'dismissed', label: 'Dismissed' },
  { value: 'action_taken', label: 'Action taken' },
];

export default function AdminReportDetailScreen({ navigation, route }: Props) {
  const { reportId, reportSummary } = route.params;
  const [adminContext, setAdminContext] = useState<AuthenticatedAdminContext | null>(null);
  const [detail, setDetail] = useState<AdminReportDetail | null>(null);
  const [targetUnavailable, setTargetUnavailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [reviewedReport, setReviewedReport] = useState<AdminReportReviewed | null>(null);
  const [reviewOutcome, setReviewOutcome] = useState<ReviewOutcome>('action_taken');
  const [moderationAction, setModerationAction] = useState<ModerationAction>('remove_activity');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    setTargetUnavailable(false);
    try {
      const context = await loadAdminContext();
      setAdminContext(context);
      if (!context) {
        setDetail(null);
        setErrorMessage('Admin demo context is missing. Return to sign in and continue as demo admin.');
        return;
      }
      setDetail(await getAdminReportDetail(context.selectedCampusId, reportId));
    } catch (error) {
      if (getApiErrorCode(error) === 'TARGET_UNAVAILABLE') {
        setDetail(null);
        setTargetUnavailable(true);
      } else {
        setErrorMessage(getApiErrorMessage(error) ?? 'Could not load report detail.');
      }
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useFocusEffect(
    useCallback(() => {
      fetchDetail();
    }, [fetchDetail])
  );

  const currentReport = useMemo(
    () => buildCurrentReport(detail, reportSummary, reviewedReport),
    [detail, reportSummary, reviewedReport]
  );
  const targetType = detail?.targetType ?? reportSummary?.targetType;
  const actionChoices = useMemo(() => getActionChoices(targetType), [targetType]);
  const canReview = currentReport?.status === 'pending_review';

  useEffect(() => {
    if (reviewOutcome !== 'action_taken') {
      setModerationAction('none');
      return;
    }
    if (!actionChoices.some((item) => item.value === moderationAction)) {
      setModerationAction(actionChoices[0]?.value ?? 'none');
    }
  }, [actionChoices, moderationAction, reviewOutcome]);

  function selectOutcome(nextOutcome: ReviewOutcome) {
    setReviewOutcome(nextOutcome);
    if (nextOutcome === 'action_taken') {
      setModerationAction(actionChoices[0]?.value ?? 'none');
    } else {
      setModerationAction('none');
    }
  }

  async function submitReview() {
    if (!adminContext) {
      setErrorMessage('Admin demo context is missing. Return to sign in and continue as demo admin.');
      return;
    }
    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const reviewed = await reviewAdminReport(adminContext.selectedCampusId, reportId, {
        reviewOutcome,
        moderationAction,
        reviewNotes: normalizedText(reviewNotes),
      });
      setReviewedReport(reviewed);
      setSuccessMessage('Report review submitted.');
      await fetchDetail();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error) ?? 'Could not submit report review.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScreenShell style={styles.screen}>
      <TopBar title="Report Detail" onBack={() => navigation.goBack()} rightLabel="Reports" onRight={() => navigation.navigate('AdminReports')} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {loading ? (
          <LoadingRows count={3} />
        ) : !currentReport ? (
          <EmptyState title="Report unavailable" text={errorMessage ?? 'The report could not be loaded.'} primaryLabel="Back" onPrimary={() => navigation.goBack()} />
        ) : (
          <>
            {errorMessage ? <InlineBanner tone="error" text={errorMessage} actionLabel="Retry" onAction={fetchDetail} /> : null}
            {successMessage ? <InlineBanner tone="success" text={successMessage} /> : null}
            {targetUnavailable ? (
              <InlineBanner
                tone="warning"
                text="The reported target is unavailable. The report record can still be reviewed from the backend queue state."
              />
            ) : null}

            <SectionCard style={styles.card}>
              <View style={styles.detailTop}>
                <View style={styles.detailTitleBlock}>
                  <Text style={styles.kicker}>{currentReport.targetType} report</Text>
                  <Text style={styles.title}>{currentReport.reasonCode}</Text>
                  <Text style={styles.reportId}>{currentReport.reportId}</Text>
                </View>
                <StatusPill status={currentReport.status} />
              </View>
              <InfoRow label="Submitted" value={formatDate(currentReport.submittedAt)} />
              <InfoRow label="Reporter" value={detail?.reporterAccountId ?? 'Available after detail load'} />
              <InfoRow
                label="Target"
                value={
                  currentReport.targetType === 'activity'
                    ? currentReport.targetActivityId ?? 'Unavailable'
                    : currentReport.targetAccountId ?? 'Unavailable'
                }
              />
              <InfoRow label="Current action" value={formatEnum(currentReport.moderationAction)} last />
            </SectionCard>

            <TargetContextCard detail={detail} targetUnavailable={targetUnavailable} />

            {reviewedReport ? <ReviewedResultCard reviewedReport={reviewedReport} /> : null}

            {canReview ? (
              <SectionCard style={styles.card}>
                <Text style={styles.sectionTitle}>Submit review</Text>
                <Text style={styles.helperText}>Backend validation records the outcome and dispatches any moderation consequence.</Text>
                <Text style={styles.fieldLabel}>Outcome</Text>
                <View style={styles.chipRow}>
                  {OUTCOMES.map((item) => (
                    <Chip
                      key={item.value}
                      label={item.label}
                      selected={reviewOutcome === item.value}
                      onPress={() => selectOutcome(item.value)}
                      compact
                      tone={item.value === 'action_taken' ? 'coral' : 'muted'}
                    />
                  ))}
                </View>
                <Text style={styles.fieldLabel}>Moderation action</Text>
                <View style={styles.chipRow}>
                  {(reviewOutcome === 'action_taken' ? actionChoices : [{ value: 'none' as const, label: 'None' }]).map((item) => (
                    <Chip
                      key={item.value}
                      label={item.label}
                      selected={moderationAction === item.value}
                      onPress={() => setModerationAction(item.value)}
                      compact
                      tone={item.value === 'remove_activity' ? 'coral' : 'green'}
                    />
                  ))}
                </View>
                <TextField
                  label="Review notes"
                  value={reviewNotes}
                  onChangeText={setReviewNotes}
                  placeholder="Optional notes"
                  multiline
                  editable={!submitting}
                />
                <PrimaryButton label="Submit review" loading={submitting} onPress={submitReview} tone="danger" />
              </SectionCard>
            ) : (
              <SectionCard style={styles.card}>
                <Text style={styles.sectionTitle}>Review complete</Text>
                <InfoRow label="Outcome" value={formatEnum(currentReport.reviewOutcome ?? reviewedReport?.reviewOutcome ?? 'reviewed')} />
                <InfoRow label="Reviewed at" value={formatDate(currentReport.reviewedAt ?? reviewedReport?.reviewedAt ?? '')} last />
              </SectionCard>
            )}
          </>
        )}
      </ScrollView>
    </ScreenShell>
  );
}

function TargetContextCard({
  detail,
  targetUnavailable,
}: {
  detail: AdminReportDetail | null;
  targetUnavailable: boolean;
}) {
  if (targetUnavailable || !detail?.targetContext) {
    return (
      <SectionCard style={styles.card}>
        <Text style={styles.sectionTitle}>Target context</Text>
        <Text style={styles.helperText}>No target context is available from the backend response.</Text>
      </SectionCard>
    );
  }

  if (isActivityContext(detail.targetContext)) {
    return (
      <SectionCard style={styles.card}>
        <Text style={styles.sectionTitle}>Target activity</Text>
        <InfoRow label="Title" value={detail.targetContext.title} />
        <InfoRow label="Activity ID" value={detail.targetContext.activityId} />
        <InfoRow label="Host" value={detail.targetContext.hostAccountId} />
        <InfoRow label="Scheduled" value={formatDate(detail.targetContext.scheduledDateTime)} />
        <InfoRow label="Status" value={detail.targetContext.status} last />
      </SectionCard>
    );
  }

  return (
    <SectionCard style={styles.card}>
      <Text style={styles.sectionTitle}>Target student</Text>
      <InfoRow label="Student account" value={detail.targetContext.studentAccountId} />
      <InfoRow label="Selected campus" value={detail.targetContext.selectedCampusId ?? 'Unavailable'} last />
    </SectionCard>
  );
}

function ReviewedResultCard({ reviewedReport }: { reviewedReport: AdminReportReviewed }) {
  return (
    <SectionCard style={styles.card}>
      <Text style={styles.sectionTitle}>Latest review response</Text>
      <InfoRow label="Outcome" value={formatEnum(reviewedReport.reviewOutcome)} />
      <InfoRow label="Action" value={formatEnum(reviewedReport.moderationAction)} />
      <InfoRow label="Reviewed by" value={reviewedReport.reviewedByAdminId} />
      <InfoRow label="Command pending" value={reviewedReport.commandDispatchPending ? 'Yes' : 'No'} last />
    </SectionCard>
  );
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.infoRow, !last && styles.infoBorder]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
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

function buildCurrentReport(
  detail: AdminReportDetail | null,
  summary?: AdminReportListItem,
  reviewed?: AdminReportReviewed | null
): AdminReportListItem | null {
  if (detail) {
    return detail;
  }
  if (!summary) {
    return null;
  }
  if (!reviewed) {
    return summary;
  }
  return {
    ...summary,
    status: reviewed.status,
    moderationAction: reviewed.moderationAction,
    reviewOutcome: reviewed.reviewOutcome,
    reviewedAt: reviewed.reviewedAt,
    commandDispatchPending: reviewed.commandDispatchPending,
  };
}

function getActionChoices(targetType?: AdminReportListItem['targetType']): Array<{ value: ModerationAction; label: string }> {
  if (targetType === 'activity') {
    return [{ value: 'remove_activity', label: 'Remove activity' }];
  }
  if (targetType === 'student') {
    return [
      { value: 'warn_user', label: 'Warn user' },
      { value: 'suspend_user', label: 'Suspend user' },
      { value: 'ban_user', label: 'Ban user' },
    ];
  }
  return [{ value: 'none', label: 'None' }];
}

function isActivityContext(value: AdminReportDetail['targetContext']): value is ActivityReportTargetContext {
  return Boolean(value && 'activityId' in value);
}

function normalizedText(value: string): string | null {
  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

function formatEnum(value: string): string {
  return value.replace(/_/g, ' ');
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg },
  content: { padding: 16, gap: 12, paddingBottom: 30 },
  card: { padding: 14, gap: 10 },
  detailTop: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  detailTitleBlock: { flex: 1 },
  kicker: { color: colors.text2, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  title: { color: colors.text, fontSize: 21, fontWeight: '900', marginTop: 3 },
  reportId: { color: colors.text3, fontSize: 11, fontWeight: '700', marginTop: 4 },
  statusPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  pendingPill: { backgroundColor: colors.yellowSoft },
  reviewedPill: { backgroundColor: colors.primarySoft },
  statusText: { fontSize: 11, fontWeight: '900' },
  pendingText: { color: '#8A5B00' },
  reviewedText: { color: colors.primaryDeep },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  helperText: { color: colors.text2, fontSize: 13, fontWeight: '700', lineHeight: 19 },
  infoRow: { paddingVertical: 8, gap: 4 },
  infoBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  infoLabel: { color: colors.text3, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  infoValue: { color: colors.text, fontSize: 13, fontWeight: '800' },
  fieldLabel: { color: colors.text2, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
