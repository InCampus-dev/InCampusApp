// Task: M06 | Path: mobile/src/screens/NotificationListScreen.tsx

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { getApiErrorCode, getApiErrorMessage } from '../services/api';

interface NotificationItem {
  notificationId: string;
  notificationType: string;
  notificationTitle: string;
  notificationMessage: string;
  relatedActivityId: string | null;
  triggeringAccountId: string | null;
  targetContextType?: string;
  createdAt: string;
}

interface NotificationContext {
  contextType: string;
  contextId: string | null;
  accessible: boolean;
  fallbackReason?: string;
}

type NotificationListResponse =
  | NotificationItem[]
  | {
      notifications?: NotificationItem[];
      total?: number;
    };

const PAGE_SIZE = 20;

const CONTEXT_TYPE_TO_SCREEN: Record<string, string> = {
  ActivityDetails: 'ActivityDetails',
  JoinRequestReview: 'ManageRequests',
  PersonalActivityContext: 'PersonalActivityList',
  CancelledActivityContext: 'ActivityDetails',
  NotificationFallbackView: 'NotificationFallback',
};

const ROUTES_REQUIRING_ACTIVITY_ID = new Set(['ActivityDetails', 'ManageRequests']);

export default function NotificationListScreen({ navigation }: { navigation: any }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [tappedId, setTappedId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('authToken').then((token) => {
      if (!token) {
        navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] });
      }
    });
  }, [navigation]);

  const fetchNotifications = useCallback(async (pageNum: number, append = false) => {
    setErrorMessage(null);

    try {
      const response = await api.get<NotificationListResponse>('/notifications', {
        params: { page: pageNum, limit: PAGE_SIZE },
      });
      const data = Array.isArray(response.data)
        ? response.data
        : response.data.notifications ?? [];
      const total = Array.isArray(response.data) ? undefined : response.data.total;

      if (append) {
        setNotifications((prev) => [...prev, ...data]);
      } else {
        setNotifications(data);
      }

      setHasMore(typeof total === 'number' ? pageNum * PAGE_SIZE < total : data.length === PAGE_SIZE);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error) ?? 'Could not load notifications.');
    }
  }, []);

  useEffect(() => {
    fetchNotifications(1).finally(() => setLoading(false));
  }, [fetchNotifications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    await fetchNotifications(1);
    setRefreshing(false);
  }, [fetchNotifications]);

  async function onEndReached() {
    if (!hasMore || loadingMore || loading) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchNotifications(nextPage, true);
    setLoadingMore(false);
  }

  async function handleTapNotification(notificationId: string) {
    setTappedId(notificationId);
    try {
      const response = await api.get<NotificationContext>(`/notifications/${notificationId}/context`);
      navigateToNotificationContext(response.data);
    } catch (error) {
      const code = getApiErrorCode(error);
      if (
        code === 'NOT_FOUND' ||
        code === 'TargetActivityUnavailable' ||
        code === 'BlockRelationshipExists' ||
        code === 'NotificationNotFound'
      ) {
        navigation.navigate('NotificationFallback');
      } else {
        Alert.alert('Error', getApiErrorMessage(error) ?? 'Could not open notification.');
      }
    } finally {
      setTappedId(null);
    }
  }

  function navigateToNotificationContext(context: NotificationContext) {
    if (!context.accessible) {
      navigation.navigate('NotificationFallback', { reason: context.fallbackReason });
      return;
    }

    const screenName = CONTEXT_TYPE_TO_SCREEN[context.contextType];
    if (!screenName) {
      navigation.navigate('NotificationFallback', { reason: 'UnknownNotificationTarget' });
      return;
    }

    if (screenName === 'NotificationFallback') {
      navigation.navigate('NotificationFallback', { reason: context.fallbackReason });
      return;
    }

    if (ROUTES_REQUIRING_ACTIVITY_ID.has(screenName)) {
      if (!context.contextId) {
        navigation.navigate('NotificationFallback', { reason: 'MissingActivityContext' });
        return;
      }

      navigation.navigate(screenName, { activityId: context.contextId });
      return;
    }

    if (screenName === 'PersonalActivityList') {
      navigation.navigate('PersonalActivityList', {
        activityId: context.contextId ?? undefined,
        source: 'notification',
      });
      return;
    }

    navigation.navigate(screenName);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.stateText}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Notifications</Text>
      <Text style={styles.subheader}>
        Opening a notification is read-only. Deleted, blocked, or unsupported targets go to a safe fallback.
      </Text>

      {errorMessage ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity onPress={onRefresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.notificationId}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.notificationItem}
            onPress={() => handleTapNotification(item.notificationId)}
            disabled={tappedId === item.notificationId}
          >
            <View style={styles.typePill}>
              <Text style={styles.typeText}>{formatNotificationType(item.notificationType)}</Text>
            </View>
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>{item.notificationTitle}</Text>
              <Text style={styles.notificationMessage} numberOfLines={2}>
                {item.notificationMessage}
              </Text>
              {item.triggeringAccountId ? (
                <Text style={styles.notificationUser}>
                  From: {item.triggeringAccountId}
                </Text>
              ) : null}
              <Text style={styles.notificationTime}>{formatTime(item.createdAt)}</Text>
            </View>
            {tappedId === item.notificationId ? (
              <ActivityIndicator size="small" style={styles.itemLoader} />
            ) : null}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptyText}>
              Join requests, approvals, cancellations, and reminders will appear here.
            </Text>
          </View>
        }
        ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footer} /> : null}
      />
    </View>
  );
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function formatNotificationType(type: string): string {
  switch (type) {
    case 'JoinEvent':
      return 'Join';
    case 'ApplicationOutcome':
      return 'Outcome';
    case 'ActivityCancellation':
      return 'Cancelled';
    case 'LeaveEvent':
      return 'Leave';
    case 'ActivityReminder':
      return 'Reminder';
    default:
      return 'Notice';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  stateText: { marginTop: 8, fontSize: 14, color: '#666' },
  header: { fontSize: 22, fontWeight: '700', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4 },
  subheader: { fontSize: 13, color: '#666', paddingHorizontal: 20, paddingBottom: 12, lineHeight: 18 },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  typePill: {
    minWidth: 74,
    borderRadius: 14,
    backgroundColor: '#eef5ff',
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  typeText: { fontSize: 12, color: '#1976d2', fontWeight: '700' },
  notificationContent: { flex: 1 },
  notificationTitle: { fontSize: 15, fontWeight: '600', color: '#222', marginBottom: 2 },
  notificationMessage: { fontSize: 14, color: '#555', lineHeight: 19, marginBottom: 4 },
  notificationUser: { fontSize: 12, color: '#4A90D9', marginBottom: 2 },
  notificationTime: { fontSize: 12, color: '#999' },
  itemLoader: { marginLeft: 8, alignSelf: 'center' },
  emptyContainer: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#666', lineHeight: 20, textAlign: 'center' },
  footer: { paddingVertical: 16 },
  errorBanner: {
    backgroundColor: '#ffebee',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#ffcdd2',
  },
  errorText: { color: '#b71c1c', marginBottom: 4 },
  retryText: { color: '#1976d2', fontWeight: '700' },
});
