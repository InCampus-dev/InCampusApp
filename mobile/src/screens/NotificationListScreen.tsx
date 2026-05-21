import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import api, { getApiErrorCode, getApiErrorMessage } from '../services/api';
import {
  BottomTabBar,
  EmptyState,
  InlineBanner,
  LoadingFooter,
  LoadingRows,
  ScreenShell,
  SectionCard,
  colors,
  metrics,
} from '../components/InCampusUI';

interface NotificationItem {
  notificationId: string;
  notificationType: 'JoinEvent' | 'ApplicationOutcome' | 'ActivityCancellation' | 'LeaveEvent' | 'ActivityReminder' | string;
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

type NotificationListResponse = NotificationItem[] | { notifications?: NotificationItem[]; total?: number; page?: number; limit?: number };
type NotificationFallbackReason = 'TargetActivityUnavailable' | 'BlockRelationshipExists' | 'MissingActivityContext' | 'UnknownNotificationTarget';

const PAGE_SIZE = 20;
const ROUTES_REQUIRING_ACTIVITY_ID = new Set(['ActivityDetails', 'ManageRequests']);
const CONTEXT_TYPE_TO_SCREEN: Record<string, string> = {
  ActivityDetails: 'ActivityDetails',
  JoinRequestReview: 'ManageRequests',
  PersonalActivityContext: 'PersonalActivityList',
  CancelledActivityContext: 'ActivityDetails',
  NotificationFallbackView: 'NotificationFallback',
};

export default function NotificationListScreen({ navigation }: { navigation: any }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [tappedId, setTappedId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    AsyncStorage.getItem('authToken').then((token) => {
      if (!token) navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] });
    });
  }, [navigation]);

  const fetchNotifications = useCallback(async (pageNum: number, append = false) => {
    setErrorMessage(null);
    try {
      const response = await api.get<NotificationListResponse>('/notifications', { params: { page: pageNum, limit: PAGE_SIZE } });
      const data = Array.isArray(response.data) ? response.data : response.data.notifications ?? [];
      const total = Array.isArray(response.data) ? undefined : response.data.total;
      setNotifications((prev) => append ? [...prev, ...data] : data);
      setHasMore(typeof total === 'number' ? pageNum * PAGE_SIZE < total : data.length === PAGE_SIZE);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error) ?? "Couldn't load notifications");
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
      navigation.navigate('NotificationFallback', { reason: getFallbackReasonFromErrorCode(getApiErrorCode(error)) });
    } finally {
      setTappedId(null);
    }
  }

  function navigateToNotificationContext(context: NotificationContext) {
    if (!context.accessible) {
      navigation.navigate('NotificationFallback', { reason: context.fallbackReason ?? 'UnknownNotificationTarget' });
      return;
    }
    const screenName = CONTEXT_TYPE_TO_SCREEN[context.contextType];
    if (!screenName || screenName === 'NotificationFallback') {
      navigation.navigate('NotificationFallback', { reason: context.fallbackReason ?? 'UnknownNotificationTarget' });
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
      navigation.navigate('PersonalActivityList', { activityId: context.contextId ?? undefined, source: 'notification' });
      return;
    }
    navigation.navigate(screenName);
  }

  return (
    <ScreenShell padded={false} style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        <Text style={styles.subtitle}>Updates from your campus activities</Text>
      </View>
      {loading ? (
        <View style={styles.loadingWrap}><LoadingRows count={4} /></View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.notificationId}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          ListHeaderComponent={errorMessage ? <InlineBanner tone="error" text={errorMessage} actionLabel="Retry" onAction={onRefresh} /> : null}
          ListEmptyComponent={<EmptyState icon="i" title="No notifications yet" text="When students join your activities or your requests get a response, you'll see it here." primaryLabel="Browse activities" primaryTone="green" onPrimary={() => navigation.navigate('ActivityFeed')} />}
          ListFooterComponent={loadingMore ? <LoadingFooter /> : null}
          renderItem={({ item }) => <NotificationCard item={item} loading={tappedId === item.notificationId} onPress={() => handleTapNotification(item.notificationId)} />}
        />
      )}
      <BottomTabBar active="account" onFeed={() => navigation.navigate('ActivityFeed')} onCreate={() => navigation.navigate('CreateActivity')} onAccount={() => navigation.navigate('Mine')} />
    </ScreenShell>
  );
}

function NotificationCard({ item, loading, onPress }: { item: NotificationItem; loading: boolean; onPress: () => void }) {
  const vis = notificationVisual(item);
  return (
    <Pressable onPress={onPress} disabled={loading} style={{ opacity: loading ? 0.6 : 1 }}>
      <SectionCard style={[styles.card, { borderLeftColor: vis.accent }]}> 
        <View style={[styles.typeIcon, { backgroundColor: vis.soft }]}><Text style={[styles.typeIconText, { color: vis.accent }]}>{vis.icon}</Text></View>
        <View style={styles.cardBody}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.notificationTitle}</Text>
            <Text style={styles.time}>{relativeTime(item.createdAt)}</Text>
          </View>
          <Text style={styles.message} numberOfLines={2}>{item.notificationMessage}</Text>
          <Text style={[styles.hint, { color: vis.accent }]}>{vis.hint}</Text>
        </View>
        {loading ? <ActivityIndicator color={vis.accent} size="small" /> : null}
      </SectionCard>
    </Pressable>
  );
}

function notificationVisual(item: NotificationItem) {
  if (item.notificationType === 'JoinEvent') return { accent: colors.primary, soft: colors.primarySoft, icon: '+', hint: 'Tap to review' };
  if (item.notificationType === 'ActivityCancellation') return { accent: colors.coral, soft: colors.coralSoft, icon: 'x', hint: 'Tap to see details' };
  if (item.notificationType === 'LeaveEvent') return { accent: colors.coral, soft: colors.coralSoft, icon: '-', hint: 'Tap to review' };
  if (item.notificationType === 'ActivityReminder') return { accent: '#8A5B00', soft: colors.yellowSoft, icon: 't', hint: 'Tap to view' };
  if (item.notificationType === 'ApplicationOutcome') {
    const text = `${item.notificationTitle} ${item.notificationMessage}`.toLowerCase();
    const approved = text.includes('approved') || text.includes('accepted');
    return approved
      ? { accent: colors.primaryGreen, soft: colors.successSoft, icon: 'ok', hint: 'Tap to view' }
      : { accent: colors.text2, soft: colors.borderSoft, icon: 'x', hint: 'Tap to view activities' };
  }
  return { accent: colors.primary, soft: colors.primarySoft, icon: 'i', hint: 'Tap to view' };
}

function relativeTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function getFallbackReasonFromErrorCode(code?: string): NotificationFallbackReason {
  switch (code) {
    case 'TargetActivityUnavailable':
    case 'BlockRelationshipExists':
    case 'MissingActivityContext':
      return code;
    default:
      return 'UnknownNotificationTarget';
  }
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg, paddingTop: 54, paddingBottom: 84 },
  header: { paddingHorizontal: 20, paddingTop: 8 },
  title: { color: colors.text, fontSize: 26, fontWeight: '900', letterSpacing: -0.4 },
  subtitle: { color: colors.text2, fontSize: 13, fontWeight: '700', marginTop: 5 },
  loadingWrap: { padding: 16 },
  list: { padding: 16, gap: 10, paddingBottom: metrics.bottomTabContentPadding },
  card: { padding: 14, flexDirection: 'row', gap: 12, alignItems: 'flex-start', borderLeftWidth: 4 },
  typeIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  typeIconText: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  cardBody: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', gap: 8, alignItems: 'baseline' },
  cardTitle: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '900' },
  time: { color: colors.text3, fontSize: 11, fontWeight: '900' },
  message: { color: colors.text2, fontSize: 13, fontWeight: '600', lineHeight: 19, marginTop: 4 },
  hint: { fontSize: 12, fontWeight: '900', marginTop: 8 },
});
