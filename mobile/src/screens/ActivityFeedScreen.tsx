import React, { useCallback, useEffect, useState } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { getApiErrorMessage } from '../services/api';

interface ActivityFeedItem {
  activityId: string;
  title: string;
  scheduledDateTime: string;
  categoryLabel: string;
  meetingPointLabel: string;
  currentParticipantCount: number;
  maxParticipants: number;
  status?: 'open' | 'full' | 'completed' | 'cancelled';
}

export const ActivityFeedScreen = ({ navigation, route }: any) => {
  const [activities, setActivities] = useState<ActivityFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastCreatedActivityId, setLastCreatedActivityId] = useState<string | null>(null);

  const fetchActivities = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'refresh') {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setErrorMessage(null);

    try {
      const campusId = await AsyncStorage.getItem('selectedCampusId');
      const response = await api.get<ActivityFeedItem[]>('/activities', {
        params: campusId ? { campusId } : undefined,
      });
      setActivities(response.data);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error) ?? 'Could not load activities.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchActivities();
    }, [fetchActivities]),
  );

  useEffect(() => {
    const createdActivityId = route?.params?.createdActivityId;
    if (createdActivityId) {
      setLastCreatedActivityId(createdActivityId);
    }

    if (route?.params?.refreshAfterCreate || route?.params?.refreshAfterJoin) {
      fetchActivities('refresh');
    }
  }, [
    fetchActivities,
    route?.params?.createdActivityId,
    route?.params?.refreshAfterCreate,
    route?.params?.refreshAfterJoin,
  ]);

  const renderItem = ({ item }: { item: ActivityFeedItem }) => {
    const dateStr = formatDateTime(item.scheduledDateTime);
    const isFreshlyCreated = item.activityId === lastCreatedActivityId;

    return (
      <TouchableOpacity
        style={[styles.card, isFreshlyCreated && styles.highlightedCard]}
        onPress={() => navigation.navigate('ActivityDetails', { activityId: item.activityId })}
      >
        {isFreshlyCreated ? <Text style={styles.badge}>Just created</Text> : null}
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.details}>{dateStr}</Text>
        <Text style={styles.details}>
          {item.categoryLabel}  {item.meetingPointLabel}
        </Text>
        <Text style={styles.participants}>
          {item.currentParticipantCount} / {item.maxParticipants} Participants
        </Text>
        {item.status ? <Text style={styles.status}>Status: {formatStatus(item.status)}</Text> : null}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.stateText}>Loading campus activities...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {errorMessage ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity onPress={() => fetchActivities('refresh')}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <FlatList
        data={activities}
        keyExtractor={(item) => item.activityId}
        renderItem={renderItem}
        contentContainerStyle={activities.length === 0 ? styles.emptyList : styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchActivities('refresh')} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No activities yet</Text>
            <Text style={styles.emptyText}>
              Create the first campus activity or pull to refresh when someone publishes one.
            </Text>
          </View>
        }
      />
    </View>
  );
};

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
}

function formatStatus(value: ActivityFeedItem['status']): string {
  if (!value) {
    return '';
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  stateText: { fontSize: 14, color: '#666', marginTop: 8, textAlign: 'center' },
  list: { padding: 16 },
  emptyList: { flexGrow: 1, padding: 16, justifyContent: 'center' },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  highlightedCard: {
    borderWidth: 1,
    borderColor: '#1976d2',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: '#333' },
  details: { fontSize: 14, color: '#666', marginBottom: 8 },
  participants: { fontSize: 14, color: '#0066cc', fontWeight: '500' },
  status: { fontSize: 13, color: '#666', marginTop: 6 },
  errorBanner: {
    backgroundColor: '#ffebee',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ffcdd2',
  },
  errorText: { color: '#b71c1c', marginBottom: 4 },
  retryText: { color: '#1976d2', fontWeight: '700' },
  emptyContainer: { alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#666', lineHeight: 20, textAlign: 'center' },
});
