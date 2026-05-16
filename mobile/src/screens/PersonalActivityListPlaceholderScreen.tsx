import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api, { getApiErrorMessage } from '../services/api';

type PersonalActivityStatus = 'host' | 'pending_request' | 'confirmed_participant';

interface PersonalActivityItem {
  activityId: string;
  title: string;
  categoryLabel: string;
  meetingPointLabel: string;
  scheduledDateTime: string;
  status: string;
  personalActivityStatus: PersonalActivityStatus;
  currentParticipantCount: number;
  maxParticipants: number;
}

type PersonalActivityResponse =
  | PersonalActivityItem[]
  | { activities?: PersonalActivityItem[] };

export default function PersonalActivityListScreen({ navigation }: { navigation: any }) {
  const [activities, setActivities] = useState<PersonalActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    try {
      setErrorMessage(null);
      const response = await api.get<PersonalActivityResponse>('/profiles/me/activities');
      setActivities(normalizePersonalActivityResponse(response.data));
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error) ?? 'Could not load your activities.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchActivities();
    }, [fetchActivities]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchActivities();
    setRefreshing(false);
  }, [fetchActivities]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{errorMessage}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchActivities}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={activities}
        keyExtractor={(item) => item.activityId}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={activities.length === 0 ? styles.emptyList : styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ActivityDetails', { activityId: item.activityId })}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.badge}>{formatPersonalStatus(item.personalActivityStatus)}</Text>
            </View>
            <Text style={styles.detail}>{formatDateTime(item.scheduledDateTime)}</Text>
            <Text style={styles.detail}>
              {item.categoryLabel} at {item.meetingPointLabel}
            </Text>
            <View style={styles.footerRow}>
              <Text style={styles.status}>{formatActivityStatus(item.status)}</Text>
              <Text style={styles.participants}>
                {item.currentParticipantCount} / {item.maxParticipants}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No personal activities yet</Text>
          </View>
        }
      />
    </View>
  );
}

function normalizePersonalActivityResponse(
  response: PersonalActivityResponse,
): PersonalActivityItem[] {
  if (Array.isArray(response)) {
    return response;
  }

  return response.activities ?? [];
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

function formatPersonalStatus(value: PersonalActivityStatus): string {
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
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  list: { padding: 16 },
  emptyList: { flexGrow: 1, padding: 16 },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  title: { flex: 1, fontSize: 17, fontWeight: '700', color: '#222' },
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
  detail: { fontSize: 14, color: '#555', marginBottom: 6 },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  status: { fontSize: 13, color: '#444', fontWeight: '600' },
  participants: { fontSize: 13, color: '#0066cc', fontWeight: '600' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#222', marginBottom: 8 },
  errorText: { fontSize: 15, color: '#c62828', textAlign: 'center', marginBottom: 16 },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#1976d2',
  },
  retryText: { color: '#fff', fontWeight: '700' },
});
