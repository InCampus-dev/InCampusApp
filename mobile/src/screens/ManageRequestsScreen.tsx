import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import api, { getApiErrorMessage } from '../services/api';
import {
  EmptyState,
  InlineBanner,
  LoadingRows,
  PrimaryButton,
  ScreenShell,
  SectionCard,
  TopBar,
  colors,
} from '../components/InCampusUI';

interface JoinRequestItem {
  requestId: string;
  activityId: string;
  applicantId: string;
  status: string;
  createdAt: string;
  applicant: {
    applicantId: string;
    displayName: string;
    major: string;
    shortBio: string | null;
  };
}

type Decision = 'approve' | 'decline';

export const ManageRequestsScreen = ({ route, navigation }: any) => {
  const activityId = route?.params?.activityId;
  const [requests, setRequests] = useState<JoinRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [processing, setProcessing] = useState<Record<string, Decision | undefined>>({});
  const [decided, setDecided] = useState<Record<string, Decision | undefined>>({});

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const fetchRequests = useCallback(async () => {
    if (!activityId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await api.get<JoinRequestItem[]>(`/activities/${activityId}/requests`);
      setRequests(response.data);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error) ?? "Couldn't load requests");
    } finally {
      setLoading(false);
    }
  }, [activityId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  async function handleDecision(requestId: string, decision: Decision) {
    if (!activityId) return;
    setProcessing((prev) => ({ ...prev, [requestId]: decision }));
    try {
      await api.patch(`/activities/${activityId}/requests/${requestId}`, { decision });
      setDecided((prev) => ({ ...prev, [requestId]: decision }));
      setTimeout(() => {
        setRequests((prev) => prev.filter((request) => request.requestId !== requestId));
        setDecided((prev) => ({ ...prev, [requestId]: undefined }));
      }, 450);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error) ?? `Failed to ${decision} request.`);
    } finally {
      setProcessing((prev) => ({ ...prev, [requestId]: undefined }));
    }
  }

  return (
    <ScreenShell style={styles.screen}>
      <TopBar title="Join Requests" onBack={() => navigation.goBack()} rightLabel={activityId ? 'View activity' : undefined} onRight={() => activityId && navigation.navigate('ActivityDetails', { activityId })} />
      <View style={styles.contextCard}>
        <Text style={styles.contextTitle}>{activityId ? 'Review pending requests' : 'This screen needs an activity context'}</Text>
        <Text style={styles.contextBody}>{activityId ? 'Approve or decline each request below.' : 'Open Join Requests from an activity or notification.'}</Text>
      </View>
      {!activityId ? (
        <View style={styles.content}>
          <EmptyState title="This screen needs an activity context" text="Open Join Requests from an activity or notification." primaryLabel="Back" onPrimary={() => navigation.goBack()} />
        </View>
      ) : loading ? (
        <View style={styles.content}><LoadingRows count={3} /></View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.requestId}
          contentContainerStyle={styles.list}
          ListHeaderComponent={errorMessage ? <InlineBanner tone="error" text={errorMessage} actionLabel="Retry" onAction={fetchRequests} /> : null}
          ListEmptyComponent={<EmptyState icon="OK" title="All caught up" text="No pending requests" primaryLabel="View activity" onPrimary={() => navigation.navigate('ActivityDetails', { activityId })} />}
          renderItem={({ item, index }) => (
            <JoinRequestCard
              request={item}
              index={index}
              processing={processing[item.requestId]}
              decided={decided[item.requestId]}
              onApprove={() => handleDecision(item.requestId, 'approve')}
              onDecline={() => handleDecision(item.requestId, 'decline')}
            />
          )}
        />
      )}
    </ScreenShell>
  );
};

function JoinRequestCard({
  request,
  index,
  processing,
  decided,
  onApprove,
  onDecline,
}: {
  request: JoinRequestItem;
  index: number;
  processing?: Decision;
  decided?: Decision;
  onApprove: () => void;
  onDecline: () => void;
}) {
  const initial = request.applicant.displayName.trim().charAt(0).toUpperCase() || '?';
  const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
  return (
    <SectionCard style={[styles.requestCard, decided && styles.requestCardDecided]}>
      <View style={styles.requestTop}>
        <View style={[styles.avatar, { backgroundColor: avatarColor.bg }]}><Text style={[styles.avatarText, { color: avatarColor.fg }]}>{initial}</Text></View>
        <View style={styles.requestInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{request.applicant.displayName}</Text>
            <Text style={styles.time}>{relativeTime(request.createdAt)}</Text>
          </View>
          <Text style={styles.major}>{request.applicant.major}</Text>
          {request.applicant.shortBio ? <Text style={styles.bio} numberOfLines={2}>{request.applicant.shortBio}</Text> : null}
        </View>
      </View>
      {processing ? (
        <View style={[styles.processingRow, processing === 'approve' ? styles.processingApprove : styles.processingDecline]}>
          <ActivityIndicator color={processing === 'approve' ? colors.primary : colors.coral} size="small" />
          <Text style={[styles.processingText, { color: processing === 'approve' ? colors.primary : colors.coral }]}>{processing === 'approve' ? 'Approving...' : 'Declining...'}</Text>
        </View>
      ) : decided ? (
        <View style={styles.decidedRow}><Text style={styles.decidedText}>{decided === 'approve' ? 'Approved' : 'Declined'}</Text></View>
      ) : (
        <View style={styles.actions}>
          <Pressable style={styles.declineButton} onPress={onDecline}><Text style={styles.declineText}>Decline</Text></Pressable>
          <PrimaryButton label="Approve" onPress={onApprove} style={styles.approveButton} />
        </View>
      )}
    </SectionCard>
  );
}

function relativeTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  return `${Math.floor(hours / 24)} days ago`;
}

const AVATAR_COLORS = [
  { bg: colors.skySoft, fg: colors.sky },
  { bg: colors.primarySoft, fg: colors.primary },
  { bg: colors.coralSoft, fg: colors.coral },
  { bg: colors.yellowSoft, fg: '#8A5B00' },
];

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg },
  content: { padding: 16 },
  contextCard: { marginHorizontal: 16, marginTop: 8, padding: 16, borderRadius: 18, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  contextTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  contextBody: { color: colors.text2, fontSize: 13, fontWeight: '600', marginTop: 4 },
  list: { padding: 16, gap: 12, paddingBottom: 28 },
  requestCard: { padding: 14 },
  requestCardDecided: { opacity: 0.56 },
  requestTop: { flexDirection: 'row', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '900' },
  requestInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  name: { flex: 1, color: colors.text, fontSize: 16, fontWeight: '900' },
  time: { color: colors.text3, fontSize: 11, fontWeight: '900' },
  major: { color: colors.text2, fontSize: 13, fontWeight: '800', marginTop: 2 },
  bio: { color: colors.text, fontSize: 13, fontWeight: '600', lineHeight: 19, marginTop: 8, opacity: 0.84 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 14 },
  declineButton: { flex: 1, minHeight: 52, borderRadius: 16, borderWidth: 1.5, borderColor: colors.coral, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card },
  declineText: { color: colors.coral, fontSize: 15, fontWeight: '900' },
  approveButton: { flex: 1 },
  processingRow: { marginTop: 14, minHeight: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 },
  processingApprove: { backgroundColor: colors.primarySoft },
  processingDecline: { backgroundColor: colors.coralSoft },
  processingText: { fontSize: 13, fontWeight: '900' },
  decidedRow: { marginTop: 14, minHeight: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.borderSoft },
  decidedText: { color: colors.text2, fontSize: 13, fontWeight: '900' },
});
