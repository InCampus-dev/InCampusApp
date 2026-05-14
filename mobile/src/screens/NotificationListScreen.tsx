// Task: M06 | Path: mobile/src/screens/NotificationListScreen.tsx

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

interface NotificationItem {
  notificationId: string;
  notificationType: string;
  notificationTitle: string;
  notificationMessage: string;
  relatedActivityId: string | null;
  triggeringAccountId: string | null; // C.1 fix: referenced user field
  createdAt: string;
}

interface NotificationContext {
  contextType: string;
  contextId: string | null;
  accessible: boolean;
}

// Map TargetContextType values to navigation screen names (DUC-NSF-06)
const CONTEXT_TYPE_TO_SCREEN: Record<string, string> = {
  ActivityDetails: 'ActivityDetails',
  JoinRequestReview: 'ManageJoinRequests',
  PersonalActivityContext: 'PersonalActivityList',
  CancelledActivityContext: 'ActivityDetails',
};

export default function NotificationListScreen({ navigation }: { navigation: any }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [tappedId, setTappedId] = useState<string | null>(null);

  const PAGE_SIZE = 20;

  // C.4 fix: in-screen auth token check — redirect to SignIn if session expired
  useEffect(() => {
    AsyncStorage.getItem('authToken').then((token) => {
      if (!token) {
        navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] });
      }
    });
  }, [navigation]);

  async function fetchNotifications(pageNum: number, append = false) {
    try {
      const response = await api.get('/notifications', {
        params: { page: pageNum, limit: PAGE_SIZE },
      });
      const data: NotificationItem[] = response.data.notifications || response.data;
      if (append) {
        setNotifications((prev) => [...prev, ...data]);
      } else {
        setNotifications(data);
      }
      setHasMore(data.length === PAGE_SIZE);
    } catch {
      Alert.alert('Error', 'Could not load notifications.');
    }
  }

  useEffect(() => {
    fetchNotifications(1).finally(() => setLoading(false));
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    await fetchNotifications(1);
    setRefreshing(false);
  }, []);

  async function onEndReached() {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchNotifications(nextPage, true);
    setLoadingMore(false);
  }

  async function handleTapNotification(notificationId: string) {
    setTappedId(notificationId);
    try {
      // DUC-NSF-06: GET /notifications/{id}/context — read-only, no state update
      const response = await api.get(`/notifications/${notificationId}/context`);
      const context: NotificationContext = response.data;

      if (context.accessible) {
        const screenName = CONTEXT_TYPE_TO_SCREEN[context.contextType];
        if (screenName && context.contextId) {
          navigation.navigate(screenName, {
            activityId: context.contextId,
          });
        } else if (screenName) {
          navigation.navigate(screenName);
        } else {
          navigation.navigate('NotificationFallback');
        }
      } else {
        // Target no longer exists or is inaccessible — fallback
        navigation.navigate('NotificationFallback');
      }
    } catch (error: any) {
      const code = error?.response?.data?.error;
      if (
        code === 'TargetActivityUnavailable' ||
        code === 'BlockRelationshipExists' ||
        code === 'NotificationNotFound'
      ) {
        navigation.navigate('NotificationFallback');
      } else {
        Alert.alert('Error', 'Could not open notification.');
      }
    } finally {
      setTappedId(null);
    }
  }

  function formatTime(iso: string): string {
    const date = new Date(iso);
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

  function getTypeIcon(type: string): string {
    switch (type) {
      case 'JoinEvent': return '\u{1F44B}';
      case 'ApplicationOutcome': return '\u{2709}\u{FE0F}';
      case 'ActivityCancellation': return '\u{274C}';
      case 'LeaveEvent': return '\u{1F6AA}';
      case 'ActivityReminder': return '\u{23F0}';
      default: return '\u{1F514}';
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Notifications</Text>

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
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>{getTypeIcon(item.notificationType)}</Text>
            </View>
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>{item.notificationTitle}</Text>
              <Text style={styles.notificationMessage} numberOfLines={2}>
                {item.notificationMessage}
              </Text>
              {/* C.1 fix: display referenced user when present */}
              {item.triggeringAccountId && (
                <Text style={styles.notificationUser}>
                  From: {item.triggeringAccountId}
                </Text>
              )}
              <Text style={styles.notificationTime}>{formatTime(item.createdAt)}</Text>
            </View>
            {tappedId === item.notificationId && (
              <ActivityIndicator size="small" style={styles.itemLoader} />
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>{'\u{1F514}'}</Text>
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? <ActivityIndicator style={styles.footer} /> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 22, fontWeight: '700', padding: 20, paddingBottom: 8 },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  icon: { fontSize: 18 },
  notificationContent: { flex: 1 },
  notificationTitle: { fontSize: 15, fontWeight: '600', color: '#222', marginBottom: 2 },
  notificationMessage: { fontSize: 14, color: '#555', lineHeight: 19, marginBottom: 4 },
  notificationUser: { fontSize: 12, color: '#4A90D9', marginBottom: 2 },
  notificationTime: { fontSize: 12, color: '#999' },
  itemLoader: { marginLeft: 8, alignSelf: 'center' },
  emptyContainer: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#999' },
  footer: { paddingVertical: 16 },
});
