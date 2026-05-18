import React, { useCallback, useLayoutEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api, { getApiErrorMessage } from '../services/api';
import {
  BottomTabBar,
  CategoryPill,
  EmptyState,
  InlineBanner,
  LoadingRows,
  ScreenShell,
  SectionCard,
  colors,
  metrics,
} from '../components/InCampusUI';

type PersonalActivityStatus = 'host' | 'pending_request' | 'confirmed_participant';
type ActivityLifecycleStatus = 'open' | 'full' | 'completed' | 'cancelled';
type Tab = 'upcoming' | 'history';

interface PersonalActivityItem {
  activityId: string;
  title: string;
  categoryLabel?: string;
  meetingPointLabel?: string;
  scheduledDateTime?: string;
  status?: ActivityLifecycleStatus | string;
  personalActivityStatus?: PersonalActivityStatus | string;
  participationStatus?: string;
  currentParticipantCount?: number;
  maxParticipants?: number;
}

type PersonalActivityResponse =
  | PersonalActivityItem[]
  | {
      activities?: PersonalActivityItem[];
      upcoming?: PersonalActivityItem[];
      history?: PersonalActivityItem[];
      past?: PersonalActivityItem[];
    };

export default function PersonalActivityListScreen({ navigation, route }: { navigation: any; route: any }) {
  const [tab, setTab] = useState<Tab>('upcoming');
  const [upcoming, setUpcoming] = useState<PersonalActivityItem[]>([]);
  const [history, setHistory] = useState<PersonalActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showNotificationBanner, setShowNotificationBanner] = useState(route?.params?.source === 'notification');

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const fetchPersonalActivities = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'refresh') setRefreshing(true);
    else setLoading(true);
    setErrorMessage(null);
    try {
      const response = await api.get<PersonalActivityResponse>('/profiles/me/activities');
      const split = splitPersonalActivities(response.data);
      setUpcoming(split.upcoming);
      setHistory(split.history);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error) ?? "Couldn't load your activities");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    fetchPersonalActivities();
  }, [fetchPersonalActivities]));

  const activities = tab === 'upcoming' ? upcoming : history;

  return (
    <ScreenShell padded={false} style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>My Activities</Text>
        <Text style={styles.subtitle}>Your hosted, joined, and pending activities</Text>
      </View>
      <View style={styles.tabs}>
        <SegmentButton label="Upcoming" active={tab === 'upcoming'} onPress={() => setTab('upcoming')} />
        <SegmentButton label="History" active={tab === 'history'} onPress={() => setTab('history')} />
      </View>
      {showNotificationBanner ? (
        <View style={styles.bannerWrap}>
          <InlineBanner tone="warning" text="Opened from a notification" actionLabel="Close" onAction={() => setShowNotificationBanner(false)} />
        </View>
      ) : null}
      {loading ? (
        <View style={styles.loadingWrap}><LoadingRows count={3} /></View>
      ) : (
        <FlatList
          data={activities}
          keyExtractor={(item) => item.activityId}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchPersonalActivities('refresh')} />}
          contentContainerStyle={styles.list}
          ListHeaderComponent={errorMessage ? <InlineBanner tone="error" text={errorMessage} actionLabel="Retry" onAction={() => fetchPersonalActivities('refresh')} /> : null}
          ListEmptyComponent={
            tab === 'upcoming' ? (
              <EmptyState title="Nothing coming up" text="Join an activity on campus or create your own." primaryLabel="Browse activities" secondaryLabel="Create activity" onPrimary={() => navigation.navigate('ActivityFeed')} onSecondary={() => navigation.navigate('CreateActivity')} />
            ) : (
              <EmptyState title="No activity history yet" text="Activities you've joined or hosted will show up here once they happen." primaryLabel="Browse activities" onPrimary={() => navigation.navigate('ActivityFeed')} />
            )
          }
          renderItem={({ item }) => (
            <PersonalActivityCard activity={item} muted={tab === 'history'} onPress={() => navigation.navigate('ActivityDetails', { activityId: item.activityId })} />
          )}
        />
      )}
      <BottomTabBar active="mine" onFeed={() => navigation.navigate('ActivityFeed')} onCreate={() => navigation.navigate('CreateActivity')} onAlerts={() => navigation.navigate('NotificationList')} onMine={() => navigation.navigate('Mine')} />
    </ScreenShell>
  );
}

function SegmentButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.segment, active && styles.segmentActive]} onPress={onPress}>
      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text>
    </Pressable>
  );
}

function PersonalActivityCard({ activity, muted, onPress }: { activity: PersonalActivityItem; muted?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <SectionCard style={[styles.card, muted && styles.cardMuted]}>
        <View style={styles.cardTop}>
          {activity.categoryLabel ? <CategoryPill label={activity.categoryLabel} compact /> : <View />}
          <PersonalStatusBadge value={activity.personalActivityStatus} />
        </View>
        <Text style={styles.cardTitle}>{activity.title}</Text>
        {activity.scheduledDateTime ? <Text style={styles.meta}>{formatDateTime(activity.scheduledDateTime)}</Text> : null}
        {activity.meetingPointLabel ? <Text style={styles.meta}>{activity.meetingPointLabel}</Text> : null}
        {typeof activity.currentParticipantCount === 'number' && typeof activity.maxParticipants === 'number' ? (
          <View style={styles.participantRow}>
            <View style={styles.participantTrack}><View style={[styles.participantFill, { width: `${Math.min(100, (activity.currentParticipantCount / Math.max(activity.maxParticipants, 1)) * 100)}%` }]} /></View>
            <Text style={styles.participantText}>{activity.currentParticipantCount}/{activity.maxParticipants} joined</Text>
          </View>
        ) : null}
        {activity.status && activity.status !== 'open' ? <LifecycleBadge value={activity.status} /> : null}
      </SectionCard>
    </Pressable>
  );
}

function PersonalStatusBadge({ value }: { value?: string }) {
  const config = value === 'host'
    ? { label: 'Host', bg: colors.yellowSoft, fg: '#8A5B00' }
    : value === 'pending_request'
      ? { label: 'Pending', bg: colors.skySoft, fg: colors.sky }
      : value === 'confirmed_participant'
        ? { label: 'Joined', bg: colors.primarySoft, fg: colors.primary }
        : { label: 'Activity', bg: colors.borderSoft, fg: colors.text2 };
  return <Text style={[styles.statusBadge, { backgroundColor: config.bg, color: config.fg }]}>{config.label}</Text>;
}

function LifecycleBadge({ value }: { value: string }) {
  const label = value === 'cancelled' ? 'Cancelled' : value === 'completed' ? 'Completed' : value === 'full' ? 'Full' : value;
  return <Text style={[styles.lifecycleBadge, value === 'cancelled' && styles.lifecycleCancelled]}>{label}</Text>;
}

function splitPersonalActivities(response: PersonalActivityResponse): { upcoming: PersonalActivityItem[]; history: PersonalActivityItem[] } {
  if (Array.isArray(response)) return splitFlatList(response);
  if (response.upcoming || response.history || response.past) {
    return { upcoming: response.upcoming ?? [], history: response.history ?? response.past ?? [] };
  }
  return splitFlatList(response.activities ?? []);
}

function splitFlatList(activities: PersonalActivityItem[]): { upcoming: PersonalActivityItem[]; history: PersonalActivityItem[] } {
  const now = Date.now();
  const upcoming: PersonalActivityItem[] = [];
  const history: PersonalActivityItem[] = [];
  activities.forEach((activity) => {
    const timestamp = activity.scheduledDateTime ? new Date(activity.scheduledDateTime).getTime() : Number.NaN;
    const isPast = Number.isFinite(timestamp) && timestamp < now;
    const isHistoricalStatus = activity.status === 'completed' || activity.status === 'cancelled';
    if (isPast || isHistoricalStatus) history.push(activity);
    else upcoming.push(activity);
  });
  return { upcoming, history };
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg, paddingTop: 54, paddingBottom: 84 },
  header: { paddingHorizontal: 20, paddingTop: 8 },
  title: { color: colors.text, fontSize: 26, fontWeight: '900', letterSpacing: -0.4 },
  subtitle: { color: colors.text2, fontSize: 13, fontWeight: '700', marginTop: 5 },
  tabs: { flexDirection: 'row', marginHorizontal: 20, marginTop: 14, padding: 4, height: 42, backgroundColor: '#EEF1F4', borderRadius: 13, gap: 4 },
  segment: { flex: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  segmentActive: { backgroundColor: colors.card },
  segmentText: { color: colors.text2, fontSize: 13, fontWeight: '900' },
  segmentTextActive: { color: colors.text },
  bannerWrap: { paddingHorizontal: 16, marginTop: 10 },
  loadingWrap: { padding: 16 },
  list: { padding: 16, gap: 10, paddingBottom: metrics.bottomTabContentPadding },
  card: { padding: 14 },
  cardMuted: { opacity: 0.82 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 8 },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: '900', lineHeight: 22 },
  meta: { color: colors.text2, fontSize: 13, fontWeight: '700', marginTop: 6 },
  statusBadge: { overflow: 'hidden', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, fontSize: 11, fontWeight: '900' },
  participantRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  participantTrack: { flex: 1, height: 5, borderRadius: 999, backgroundColor: colors.borderSoft, overflow: 'hidden' },
  participantFill: { height: '100%', borderRadius: 999, backgroundColor: colors.primary },
  participantText: { color: colors.text2, fontSize: 11, fontWeight: '900' },
  lifecycleBadge: { alignSelf: 'flex-start', marginTop: 10, overflow: 'hidden', borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: colors.borderSoft, color: colors.text2, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  lifecycleCancelled: { backgroundColor: colors.dangerSoft, color: colors.danger },
});
