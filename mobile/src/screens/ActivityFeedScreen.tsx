import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { getApiErrorMessage } from '../services/api';
import {
  BottomTabBar,
  InlineBanner,
  ModeBadge,
  PrimaryButton,
  SectionCard,
  SkeletonBlock,
  TinyIcon,
  categoryStyle,
  colors,
  metrics,
} from '../components/InCampusUI';
import {
  getDisplayParticipantCountIncludingHost,
  getJoinedCountLabel
} from '../services/activityCapacity';

type ParticipationMode = 'open' | 'approval_based';
type ActivityStatus = 'open' | 'full' | 'completed' | 'cancelled';

interface ActivityFeedItem {
  activityId: string;
  title: string;
  scheduledDateTime: string;
  categoryLabel: string;
  meetingPointLabel: string;
  currentParticipantCount: number;
  maxParticipants: number;
  participationMode: ParticipationMode;
  status?: ActivityStatus;
}

const ALL_CHIP = 'All';
const CAMPUS_LABEL = 'Selected campus';

export const ActivityFeedScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const [activities, setActivities] = useState<ActivityFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastCreatedActivityId, setLastCreatedActivityId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState(ALL_CHIP);

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

  const categoryChips = useMemo(() => {
    const categories = Array.from(new Set(activities.map((item) => item.categoryLabel).filter(Boolean)));
    return [ALL_CHIP, ...categories];
  }, [activities]);

  const visibleActivities = useMemo(() => {
    if (activeCategory === ALL_CHIP) {
      return activities;
    }
    return activities.filter((item) => item.categoryLabel === activeCategory);
  }, [activeCategory, activities]);

  const listBottomPadding = 104 + Math.max(insets.bottom, 10);

  return (
    <View style={styles.screen}>
      <FeedTopBar
        topInset={insets.top}
        campusLabel={CAMPUS_LABEL}
        onNotifications={() => navigation.navigate('NotificationList')}
      />
      <DiscoveryHeader
        chips={categoryChips}
        activeChip={activeCategory}
        onChip={setActiveCategory}
        count={activities.length}
      />

      {loading ? (
        <FeedSkeleton bottomPadding={listBottomPadding} />
      ) : (
        <FlatList
          data={visibleActivities}
          keyExtractor={(item) => item.activityId}
          renderItem={({ item }) => (
            <ActivityCard
              activity={item}
              highlighted={item.activityId === lastCreatedActivityId}
              onPress={() => navigation.navigate('ActivityDetails', { activityId: item.activityId })}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            visibleActivities.length === 0 && styles.listEmptyContent,
            { paddingBottom: listBottomPadding },
          ]}
          ListHeaderComponent={
            errorMessage ? (
              <View style={styles.bannerWrap}>
                <InlineBanner
                  tone="warning"
                  text="Something went wrong loading activities"
                  actionLabel="Retry"
                  onAction={() => fetchActivities('refresh')}
                />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              campusLabel={CAMPUS_LABEL}
              filtered={activities.length > 0}
              onCreate={() => navigation.navigate('CreateActivity')}
              onReset={() => setActiveCategory(ALL_CHIP)}
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchActivities('refresh')}
              tintColor={colors.green}
              colors={[colors.green]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <BottomTabBar
        active="feed"
        onCreate={() => navigation.navigate('CreateActivity')}
        onAccount={() => navigation.navigate('Mine')}
      />
    </View>
  );
};

function FeedTopBar({
  topInset,
  campusLabel,
  onNotifications,
}: {
  topInset: number;
  campusLabel: string;
  onNotifications: () => void;
}) {
  return (
    <View style={[styles.topBar, { paddingTop: topInset + 14 }]}>
      <Image
        source={require('../../assets/incampus-wordmark.png')}
        style={styles.wordmark}
        resizeMode="contain"
      />
      <View style={styles.topRightCluster}>
        <View style={styles.campusPill}>
          <Text style={styles.verifiedDot}>✓</Text>
          <Text style={styles.campusPillText}>Campus only - Verified</Text>
        </View>
        <Pressable style={styles.alertButton} onPress={onNotifications} accessibilityLabel="Notifications">
          <NotificationBellIcon />
        </Pressable>
      </View>
    </View>
  );
}

function NotificationBellIcon() {
  return (
    <View style={styles.bellIcon}>
      <View style={styles.bellKnob} />
      <View style={styles.bellDome} />
      <View style={styles.bellBase} />
      <View style={styles.bellClapper} />
    </View>
  );
}

function DiscoveryHeader({
  chips,
  activeChip,
  onChip,
  count,
}: {
  chips: string[];
  activeChip: string;
  onChip: (value: string) => void;
  count: number;
}) {
  return (
    <View style={styles.discovery}>
      <Text style={styles.discoveryTitle}>What's happening today?</Text>
      <Text style={styles.discoveryMeta}>
        {count === 1 ? '1 open activity near you' : `${count} open activities near you`}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {chips.map((chip) => {
          const active = chip === activeChip;
          return (
            <Pressable
              key={chip}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => onChip(chip)}
            >
              {active ? <View style={styles.filterChipDot} /> : null}
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]} numberOfLines={1}>
                {chip}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function ActivityCard({
  activity,
  highlighted,
  onPress,
}: {
  activity: ActivityFeedItem;
  highlighted: boolean;
  onPress: () => void;
}) {
  const cs = categoryStyle(activity.categoryLabel);
  const displayParticipantCount = getDisplayParticipantCountIncludingHost(activity);
  const isFull = activity.status === 'full' || displayParticipantCount >= activity.maxParticipants;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.activityCard,
        highlighted && styles.activityCardHighlighted,
        pressed && styles.activityCardPressed,
      ]}
    >
      <View style={[styles.coverBand, { backgroundColor: cs.bg }]}>
        <View style={styles.coverLeft}>
          <View style={styles.coverPill}>
            <View style={[styles.coverPillDot, { backgroundColor: cs.dot }]} />
            <Text style={[styles.coverPillText, { color: cs.fg }]} numberOfLines={1}>
              {activity.categoryLabel.toUpperCase()}
            </Text>
          </View>
        </View>
        <View style={styles.coverRight}>
          {highlighted ? <Text style={[styles.coverBadge, styles.newBadge]}>NEW</Text> : null}
          {isFull ? <Text style={[styles.coverBadge, styles.fullBadge]}>FULL</Text> : null}
          <Text style={[styles.coverTime, { color: cs.fg }]}>◷ {formatSmartDateTime(activity.scheduledDateTime)}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {activity.title}
        </Text>
        <View style={styles.metaRow}>
          <TinyIcon label="P" color={colors.text2} />
          <Text style={styles.metaText} numberOfLines={1}>
            {activity.meetingPointLabel}
          </Text>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <View style={styles.joinedBlock}>
          <SeatStrip current={displayParticipantCount} max={activity.maxParticipants} />
          <Text style={styles.joinedText}>{getJoinedCountLabel(activity)}</Text>
        </View>
        <ModeBadge mode={activity.participationMode} />
      </View>
    </Pressable>
  );
}

function SeatStrip({ current, max }: { current: number; max: number }) {
  const total = Math.min(Math.max(max, 1), 8);
  const filled = Math.min(current, total);
  return (
    <View style={styles.seatStrip}>
      {Array.from({ length: total }).map((_, index) => (
        <View
          key={index}
          style={[styles.seatDot, { backgroundColor: index < filled ? colors.green : colors.border }]}
        />
      ))}
    </View>
  );
}

function EmptyState({
  campusLabel,
  filtered,
  onCreate,
  onReset,
}: {
  campusLabel: string;
  filtered: boolean;
  onCreate: () => void;
  onReset: () => void;
}) {
  if (filtered) {
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIcon}>
          <Text style={styles.emptyIconText}>?</Text>
        </View>
        <Text style={styles.emptyTitle}>No matches here</Text>
        <Text style={styles.emptyText}>Try another category or show all activities.</Text>
        <PrimaryButton label="Show All" onPress={onReset} style={styles.emptyButton} />
      </View>
    );
  }

  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Text style={styles.emptyIconText}>+</Text>
      </View>
      <Text style={styles.emptyTitle}>No activities yet today</Text>
      <Text style={styles.emptyText}>Be the first to create something on campus</Text>
      <PrimaryButton label="Create Activity" onPress={onCreate} style={styles.emptyButton} />
      <Text style={styles.emptyFootnote}>{campusLabel} - campus only</Text>
    </View>
  );
}

function FeedSkeleton({ bottomPadding }: { bottomPadding: number }) {
  return (
    <ScrollView
      style={styles.skeletonScroll}
      contentContainerStyle={[styles.listContent, { paddingBottom: bottomPadding }]}
      showsVerticalScrollIndicator={false}
    >
      {Array.from({ length: 4 }).map((_, index) => (
        <SectionCard key={index} style={styles.skeletonCard}>
          <View style={styles.skeletonTop}>
            <SkeletonBlock width={72} height={20} radius={10} />
            <SkeletonBlock width={42} height={20} radius={10} />
          </View>
          <SkeletonBlock width="76%" height={18} radius={8} style={styles.skeletonLine} />
          <SkeletonBlock width="54%" height={14} radius={7} style={styles.skeletonLine} />
          <View style={styles.skeletonFooter}>
            <SkeletonBlock width={118} height={16} radius={8} />
            <SkeletonBlock width={74} height={24} radius={10} />
          </View>
        </SectionCard>
      ))}
    </ScrollView>
  );
}

function formatSmartDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (sameDay(date, now)) {
    return `Today ${time}`;
  }
  if (sameDay(date, tomorrow)) {
    return `Tomorrow ${time}`;
  }

  return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${time}`;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topBar: {
    paddingHorizontal: metrics.screenX,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg,
  },
  wordmark: {
    width: 84,
    height: 28,
  },
  topRightCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  campusPill: {
    height: 28,
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  campusPillText: {
    color: colors.primaryDeep,
    fontSize: 11.5,
    fontWeight: '800',
  },
  verifiedDot: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  alertButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellIcon: {
    width: 22,
    height: 22,
    alignItems: 'center',
  },
  bellKnob: {
    width: 5,
    height: 3,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    backgroundColor: colors.text,
    marginTop: 2,
  },
  bellDome: {
    width: 15,
    height: 12,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: colors.text,
    marginTop: 1,
  },
  bellBase: {
    width: 18,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.text,
    marginTop: -1,
  },
  bellClapper: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.text,
    marginTop: 1,
  },
  discovery: {
    paddingTop: 6,
    paddingBottom: 12,
  },
  discoveryTitle: {
    paddingHorizontal: metrics.screenX,
    color: colors.text,
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '900',
  },
  discoveryMeta: {
    paddingHorizontal: metrics.screenX,
    color: colors.text2,
    fontSize: 13,
    marginTop: 4,
    marginBottom: 12,
  },
  chipRow: {
    paddingHorizontal: metrics.screenX,
    gap: 8,
  },
  filterChip: {
    height: 34,
    maxWidth: 180,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  filterChipDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  filterChipText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  filterChipTextActive: {
    color: colors.card,
  },
  listContent: {
    paddingHorizontal: metrics.screenX,
    paddingTop: 2,
  },
  listEmptyContent: {
    flexGrow: 1,
  },
  bannerWrap: {
    marginBottom: 12,
  },
  activityCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: metrics.radius,
    marginBottom: 12,
    shadowColor: '#101828',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 1,
    overflow: 'hidden',
  },
  activityCardHighlighted: {
    borderColor: colors.green,
    shadowColor: colors.green,
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    elevation: 3,
  },
  activityCardPressed: {
    transform: [{ scale: 0.99 }],
  },
  coverBand: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  coverLeft: {
    flex: 1,
    minWidth: 0,
  },
  coverPill: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coverPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  coverPillText: {
    flexShrink: 1,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  coverRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  coverTime: {
    fontSize: 12,
    fontWeight: '900',
  },
  coverBadge: {
    overflow: 'hidden',
    borderRadius: 5,
    backgroundColor: colors.card,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  newBadge: {
    color: colors.greenDeep,
  },
  fullBadge: {
    color: colors.coral,
  },
  cardBody: {
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  metaText: {
    color: colors.text2,
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderTopColor: colors.borderSoft,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  joinedBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  joinedText: {
    color: colors.text2,
    fontSize: 13,
    fontWeight: '800',
  },
  seatStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  seatDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingBottom: 80,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  emptyIconText: {
    color: colors.primary,
    fontSize: 30,
    fontWeight: '900',
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptyText: {
    color: colors.text2,
    fontSize: 15,
    lineHeight: 21,
    marginTop: 10,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 24,
    minWidth: 184,
  },
  emptyFootnote: {
    color: colors.text3,
    fontSize: 12,
    marginTop: 18,
    fontWeight: '600',
  },
  skeletonScroll: {
    flex: 1,
  },
  skeletonCard: {
    padding: 14,
    marginBottom: 12,
  },
  skeletonTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skeletonLine: {
    marginTop: 14,
  },
  skeletonFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    marginTop: 18,
    paddingTop: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
