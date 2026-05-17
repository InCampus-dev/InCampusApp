import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api, { getApiErrorMessage } from '../services/api';

type PersonalActivityStatus = 'host' | 'pending_request' | 'confirmed_participant';
type ActivityLifecycleStatus = 'open' | 'full' | 'completed' | 'cancelled';

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

export default function PersonalActivityListScreen({
  navigation,
  route,
}: {
  navigation: any;
  route: any;
}) {
  const activityId = route?.params?.activityId;
  const [upcoming, setUpcoming] = useState<PersonalActivityItem[]>([]);
  const [history, setHistory] = useState<PersonalActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchPersonalActivities = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'refresh') {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setErrorMessage(null);

    try {
      const response = await api.get<PersonalActivityResponse>('/profiles/me/activities');
      const split = splitPersonalActivities(response.data);
      setUpcoming(split.upcoming);
      setHistory(split.history);
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error) ??
          'Personal activity data is not available yet. This route remains safe for demo navigation.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPersonalActivities();
    }, [fetchPersonalActivities]),
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.stateText}>Loading your activity area...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchPersonalActivities('refresh')}
        />
      }
    >
      <Text style={styles.title}>My Activities</Text>
      <Text style={styles.body}>
        This MVP route separates upcoming/joined activity context from completed, cancelled, or
        past history. Backend support may return either split lists or the current flat list.
      </Text>

      {activityId ? (
        <Text style={styles.context}>Opened from notification context: {activityId}</Text>
      ) : null}

      {errorMessage ? (
        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>{errorMessage}</Text>
          <TouchableOpacity onPress={() => fetchPersonalActivities('refresh')}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <ActivitySection
        title="Upcoming and Joined"
        emptyText="No upcoming hosted, joined, or pending activities yet."
        activities={upcoming}
        navigation={navigation}
      />
      <ActivitySection
        title="History"
        emptyText="Completed, cancelled, or past activities will appear here when available."
        activities={history}
        navigation={navigation}
      />
    </ScrollView>
  );
}

function ActivitySection({
  title,
  emptyText,
  activities,
  navigation,
}: {
  title: string;
  emptyText: string;
  activities: PersonalActivityItem[];
  navigation: any;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {activities.length === 0 ? (
        <Text style={styles.emptyText}>{emptyText}</Text>
      ) : (
        activities.map((activity) => (
          <TouchableOpacity
            key={activity.activityId}
            style={styles.card}
            onPress={() => navigation.navigate('ActivityDetails', { activityId: activity.activityId })}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{activity.title}</Text>
              <Text style={styles.badge}>{formatPersonalStatus(activity.personalActivityStatus)}</Text>
            </View>
            {activity.scheduledDateTime ? (
              <Text style={styles.cardMeta}>{formatDateTime(activity.scheduledDateTime)}</Text>
            ) : null}
            <Text style={styles.cardMeta}>
              {activity.categoryLabel ?? 'Activity'} · {activity.meetingPointLabel ?? 'Campus'}
            </Text>
            <View style={styles.footerRow}>
              <Text style={styles.cardStatus}>
                {formatActivityStatus(activity.status ?? activity.participationStatus ?? 'active')}
              </Text>
              {typeof activity.currentParticipantCount === 'number' &&
              typeof activity.maxParticipants === 'number' ? (
                <Text style={styles.participants}>
                  {activity.currentParticipantCount} / {activity.maxParticipants}
                </Text>
              ) : null}
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

function splitPersonalActivities(
  response: PersonalActivityResponse,
): { upcoming: PersonalActivityItem[]; history: PersonalActivityItem[] } {
  if (Array.isArray(response)) {
    return splitFlatList(response);
  }

  if (response.upcoming || response.history || response.past) {
    return {
      upcoming: response.upcoming ?? [],
      history: response.history ?? response.past ?? [],
    };
  }

  return splitFlatList(response.activities ?? []);
}

function splitFlatList(
  activities: PersonalActivityItem[],
): { upcoming: PersonalActivityItem[]; history: PersonalActivityItem[] } {
  const now = Date.now();
  const upcoming: PersonalActivityItem[] = [];
  const history: PersonalActivityItem[] = [];

  activities.forEach((activity) => {
    const timestamp = activity.scheduledDateTime
      ? new Date(activity.scheduledDateTime).getTime()
      : Number.NaN;
    const isPast = Number.isFinite(timestamp) && timestamp < now;
    const isHistoricalStatus = activity.status === 'completed' || activity.status === 'cancelled';

    if (isPast || isHistoricalStatus) {
      history.push(activity);
    } else {
      upcoming.push(activity);
    }
  });

  return { upcoming, history };
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

function formatPersonalStatus(value?: string): string {
  switch (value) {
    case 'host':
      return 'Host';
    case 'pending_request':
      return 'Pending';
    case 'confirmed_participant':
      return 'Joined';
    default:
      return 'Activity';
  }
}

function formatActivityStatus(value: string): string {
  return value.replace(/_/g, ' ').replace(/^\w/, (char) => char.toUpperCase());
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  stateText: { marginTop: 8, fontSize: 14, color: '#666', textAlign: 'center' },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 10,
    color: '#222',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: '#555',
  },
  context: {
    marginTop: 16,
    fontSize: 13,
    color: '#777',
  },
  noticeBox: {
    marginTop: 18,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#fff8e1',
    borderWidth: 1,
    borderColor: '#ffecb3',
  },
  noticeText: { color: '#6d4c00', fontSize: 14, lineHeight: 20, marginBottom: 6 },
  retryText: { color: '#1976d2', fontSize: 14, fontWeight: '700' },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 10 },
  emptyText: { fontSize: 14, color: '#777', lineHeight: 20 },
  card: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#222' },
  badge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1976d2',
    backgroundColor: '#e8f2ff',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  cardMeta: { fontSize: 13, color: '#666', marginBottom: 4 },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  cardStatus: { fontSize: 12, color: '#1976d2', fontWeight: '700', textTransform: 'capitalize' },
  participants: { fontSize: 13, color: '#0066cc', fontWeight: '600' },
});
