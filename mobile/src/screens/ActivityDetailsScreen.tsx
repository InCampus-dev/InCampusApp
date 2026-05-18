import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { getApiErrorMessage } from '../services/api';
import {
  CategoryPill,
  InlineBanner,
  PrimaryButton,
  ProgressStrip,
  SectionCard,
  SkeletonBlock,
  StatusBadge,
  TinyIcon,
  colors,
  metrics,
} from '../components/InCampusUI';

type ParticipationMode = 'open' | 'approval_based';
type GenderPreference = 'all' | 'male_only' | 'female_only';
type ActivityStatus = 'open' | 'full' | 'completed' | 'cancelled';

interface ActivityDetailsViewModel {
  activityId: string;
  title: string;
  description?: string | null;
  scheduledDateTime: string;
  scheduledEndDateTime?: string | null;
  meetingPointLabel: string;
  categoryLabel: string;
  currentParticipantCount: number;
  maxParticipants: number;
  hostAccountId: string;
  status: ActivityStatus;
  canManageRequests?: boolean;
  hostProfile?: {
    displayName: string;
    major?: string;
    interests?: string[];
    languages?: string[];
    shortBio?: string | null;
  };
  genderPreference: GenderPreference;
  participationMode: ParticipationMode;
  maxRequests?: number | null;
  currentRequestCount: number;
}

export const ActivityDetailsScreen = ({ route, navigation }: any) => {
  const { activityId } = route.params;
  const insets = useSafeAreaInsets();
  const [activity, setActivity] = useState<ActivityDetailsViewModel | null>(null);
  const [studentAccountId, setStudentAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchActivityDetails = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [accountId, response] = await Promise.all([
        AsyncStorage.getItem('studentAccountId'),
        api.get<ActivityDetailsViewModel>(`/activities/${activityId}`),
      ]);
      setStudentAccountId(accountId);
      setActivity(response.data);
    } catch (error) {
      setActivity(null);
      setLoadError(getApiErrorMessage(error) ?? 'Failed to load activity details.');
    } finally {
      setLoading(false);
    }
  }, [activityId]);

  useEffect(() => {
    fetchActivityDetails();
  }, [fetchActivityDetails]);

  useEffect(() => {
    if (!activity?.canManageRequests) {
      navigation.setOptions({ headerRight: undefined });
      return;
    }

    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={() => navigation.navigate('ManageRequests', { activityId })}>
          <Text style={styles.nativeHeaderAction}>Requests</Text>
        </Pressable>
      ),
    });
  }, [activity?.canManageRequests, activityId, navigation]);

  const isHost = Boolean(studentAccountId && activity?.hostAccountId === studentAccountId);
  const isFull = Boolean(
    activity && (activity.status === 'full' || activity.currentParticipantCount >= activity.maxParticipants),
  );

  const cta = useMemo(() => {
    if (!activity) {
      return { label: 'Back to Feed', tone: 'green' as const, disabled: false };
    }
    if (activity.canManageRequests) {
      return { label: 'Manage Requests', tone: 'green' as const, disabled: false };
    }
    if (isHost) {
      return { label: 'You are hosting', tone: 'muted' as const, disabled: true };
    }
    if (isFull) {
      return { label: 'Activity Full', tone: 'muted' as const, disabled: true };
    }
    if (activity.status !== 'open') {
      return { label: formatStatus(activity.status), tone: 'muted' as const, disabled: true };
    }
    if (activity.participationMode === 'approval_based') {
      return { label: 'Request to Join', tone: 'blue' as const, disabled: false };
    }
    return { label: 'Join', tone: 'green' as const, disabled: false };
  }, [activity, isFull, isHost]);

  const handlePrimaryAction = async () => {
    if (!activity) {
      navigation.navigate('ActivityFeed');
      return;
    }

    if (activity.canManageRequests) {
      navigation.navigate('ManageRequests', { activityId });
      return;
    }

    if (cta.disabled) {
      return;
    }

    setJoining(true);
    setJoinError(null);
    try {
      await api.post(`/activities/${activityId}/join`);
      const message = activity.participationMode === 'approval_based' ? 'Request sent!' : "You're in!";
      setSuccessMessage(message);
      setTimeout(() => {
        navigation.navigate('ActivityFeed', { refreshAfterJoin: Date.now() });
      }, 1200);
    } catch (error) {
      setJoinError(getApiErrorMessage(error) ?? 'Something went wrong. Try again.');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.screen}>
        <DetailTopBar onBack={() => navigation.goBack()} />
        <DetailLoading bottomInset={insets.bottom} />
      </View>
    );
  }

  if (!activity) {
    return (
      <View style={styles.screen}>
        <DetailTopBar onBack={() => navigation.goBack()} />
        <UnavailableState
          error={loadError}
          onRetry={fetchActivityDetails}
          onFeed={() => navigation.reset({ index: 0, routes: [{ name: 'ActivityFeed' }] })}
          onAlerts={() => navigation.navigate('NotificationList')}
        />
      </View>
    );
  }

  const showGuestSafety = !isHost && !activity.canManageRequests;

  return (
    <View style={styles.screen}>
      <DetailTopBar
        onBack={() => navigation.goBack()}
        trailing={
          activity.canManageRequests ? (
            <Pressable
              style={styles.requestsButton}
              onPress={() => navigation.navigate('ManageRequests', { activityId })}
            >
              <Text style={styles.requestsButtonText}>Requests</Text>
            </Pressable>
          ) : null
        }
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 124 + Math.max(insets.bottom, 10) },
        ]}
      >
        {loadError ? (
          <View style={styles.topBanner}>
            <InlineBanner
              tone="error"
              text="Couldn't load this activity"
              actionLabel="Retry"
              onAction={fetchActivityDetails}
            />
          </View>
        ) : null}
        {joinError ? (
          <View style={styles.topBanner}>
            <InlineBanner tone="error" text="Something went wrong. Try again." />
          </View>
        ) : null}
        {/* success toast rendered as PostActionToast overlay below */}

        <View style={styles.headerSection}>
          <View style={styles.headerRow}>
            <CategoryPill label={activity.categoryLabel} />
            <StatusBadge status={activity.status} />
          </View>
          <Text style={styles.title}>{activity.title}</Text>
        </View>

        <InfoBlock activity={activity} />

        {activity.description ? <DescriptionSection text={activity.description} /> : null}

        <HostTrustSection host={activity.hostProfile} />

        {showGuestSafety ? (
          <SafetyActions
            onReport={() =>
              navigation.navigate('ReportSubmission', {
                targetType: 'activity',
                targetActivityId: activity.activityId,
              })
            }
            onBlock={() => navigation.navigate('BlockUser', { targetAccountId: activity.hostAccountId })}
          />
        ) : null}
      </ScrollView>

      <StickyDetailCTA
        bottomInset={insets.bottom}
        current={activity.currentParticipantCount}
        max={activity.maxParticipants}
        ctaLabel={cta.label}
        tone={cta.tone}
        disabled={cta.disabled}
        loading={joining}
        onPress={handlePrimaryAction}
      />
      {successMessage ? (
        <PostActionToast
          message={successMessage}
          tone={activity.participationMode === 'approval_based' ? 'blue' : 'green'}
        />
      ) : null}
    </View>
  );
};

function DetailTopBar({
  onBack,
  trailing,
}: {
  onBack: () => void;
  trailing?: React.ReactNode;
}) {
  return (
    <View style={styles.topBar}>
      <Pressable style={styles.backButton} onPress={onBack}>
        <Text style={styles.backIcon}>‹</Text>
      </Pressable>
      <Text style={styles.topTitle}>Activity</Text>
      <View style={styles.topTrailing}>{trailing}</View>
    </View>
  );
}

function InfoBlock({ activity }: { activity: ActivityDetailsViewModel }) {
  return (
    <SectionCard style={styles.infoCard}>
      <InfoRow label="When" value={formatDetailTime(activity.scheduledDateTime, activity.scheduledEndDateTime)} icon="T" />
      <Divider />
      <InfoRow label="Where" value={activity.meetingPointLabel} icon="P" />
      <Divider />
      <View style={styles.infoRow}>
        <TinyIcon label="S" />
        <View style={styles.infoTextBlock}>
          <Text style={styles.infoLabel}>Spots</Text>
          <View style={styles.spotsLine}>
            <Text style={styles.infoValue}>
              {activity.currentParticipantCount}/{activity.maxParticipants} joined
            </Text>
            <ProgressStrip current={activity.currentParticipantCount} max={activity.maxParticipants} />
          </View>
        </View>
      </View>
      <Divider />
      <InfoRow label="How to join" value={formatJoinMode(activity.participationMode)} icon={activity.participationMode === 'open' ? 'O' : 'A'} />
      {activity.genderPreference !== 'all' ? (
        <>
          <Divider />
          <InfoRow label="Preference" value={formatGenderPreference(activity.genderPreference)} icon="G" />
        </>
      ) : null}
    </SectionCard>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <TinyIcon label={icon} />
      <View style={styles.infoTextBlock}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function DescriptionSection({ text }: { text: string }) {
  return (
    <SectionCard style={styles.section}>
      <Text style={styles.sectionTitle}>About</Text>
      <Text style={styles.description}>{text}</Text>
    </SectionCard>
  );
}

function HostTrustSection({ host }: { host?: ActivityDetailsViewModel['hostProfile'] }) {
  const name = host?.displayName || 'Verified student';
  const initial = name.trim().charAt(0).toUpperCase() || 'S';
  const interests = host?.interests?.slice(0, 2) ?? [];

  return (
    <SectionCard style={styles.section}>
      <Text style={styles.sectionTitle}>Hosted by</Text>
      <View style={styles.hostRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={styles.hostContent}>
          <Text style={styles.hostName}>{name}</Text>
          {host?.major ? <Text style={styles.hostMajor}>{host.major}</Text> : <Text style={styles.hostMajor}>Campus verified</Text>}
          {interests.length > 0 ? (
            <View style={styles.hostTags}>
              {interests.map((interest) => (
                <View key={interest} style={styles.hostTag}>
                  <Text style={styles.hostTagText}>{interest}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </View>
      {host?.shortBio ? <Text style={styles.hostBio} numberOfLines={2}>{host.shortBio}</Text> : null}
    </SectionCard>
  );
}

function SafetyActions({ onReport, onBlock }: { onReport: () => void; onBlock: () => void }) {
  return (
    <SectionCard style={styles.safetySection}>
      <View style={styles.trustLine}>
        <Text style={styles.trustMark}>✓</Text>
        <Text style={styles.trustText}>Campus only - Verified students</Text>
      </View>
      <View style={styles.safetyButtons}>
        <Pressable style={styles.safetyButton} onPress={onReport}>
          <Text style={styles.safetyButtonText}>Report activity</Text>
        </Pressable>
        <Pressable style={styles.safetyButton} onPress={onBlock}>
          <Text style={styles.safetyButtonText}>Block host</Text>
        </Pressable>
      </View>
    </SectionCard>
  );
}

function StickyDetailCTA({
  bottomInset,
  current,
  max,
  ctaLabel,
  tone,
  disabled,
  loading,
  onPress,
}: {
  bottomInset: number;
  current: number;
  max: number;
  ctaLabel: string;
  tone: 'green' | 'blue' | 'muted' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
}) {
  return (
    <View style={[styles.stickyBar, { paddingBottom: Math.max(bottomInset, 10) }]}>
      <View style={styles.stickyRow}>
        <View style={styles.stickySummaryBlock}>
          <Text style={styles.stickySummaryCount}>
            {current}
            <Text style={styles.stickySummaryOf}> of {max}</Text>
          </Text>
          <Text style={styles.stickySummaryLabel}>spots filled</Text>
        </View>
        <View style={styles.stickyCTAButton}>
          <PrimaryButton label={ctaLabel} tone={tone} disabled={disabled} loading={loading} onPress={onPress} />
        </View>
      </View>
    </View>
  );
}

function PostActionToast({
  message,
  tone,
}: {
  message: string;
  tone: 'green' | 'blue';
}) {
  const bg = tone === 'blue' ? colors.sky : colors.primary;
  return (
    <View style={styles.toastOverlay}>
      <View style={[styles.toastCard, { borderColor: `${bg}33` }]}>
        <View style={[styles.toastIcon, { backgroundColor: bg }]}>
          <Text style={styles.toastIconText}>✓</Text>
        </View>
        <View style={styles.toastContent}>
          <Text style={[styles.toastTitle, { color: tone === 'blue' ? colors.skyDeep : colors.primaryDeep }]}>
            {message}
          </Text>
          <Text style={styles.toastSub}>
            {tone === 'blue' ? 'The host will review and let you know.' : 'Returning to your feed…'}
          </Text>
        </View>
      </View>
    </View>
  );
}

function DetailLoading({ bottomInset }: { bottomInset: number }) {
  return (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 + Math.max(bottomInset, 10) }]}
      showsVerticalScrollIndicator={false}
    >
      <SkeletonBlock width={88} height={26} radius={13} />
      <SkeletonBlock width="82%" height={32} radius={12} style={styles.loadingLine} />
      <SkeletonBlock width="58%" height={32} radius={12} style={styles.loadingLineSmall} />
      <SectionCard style={styles.loadingCard}>
        {Array.from({ length: 4 }).map((_, index) => (
          <View key={index}>
            <SkeletonBlock width="100%" height={24} radius={10} />
            {index < 3 ? <View style={styles.loadingDivider} /> : null}
          </View>
        ))}
      </SectionCard>
      <SectionCard style={styles.loadingCard}>
        <SkeletonBlock width="42%" height={18} radius={8} />
        <SkeletonBlock width="90%" height={16} radius={8} style={styles.loadingLine} />
        <SkeletonBlock width="70%" height={16} radius={8} style={styles.loadingLineSmall} />
      </SectionCard>
      <SectionCard style={styles.loadingCard}>
        <SkeletonBlock width="65%" height={48} radius={18} />
      </SectionCard>
    </ScrollView>
  );
}

function UnavailableState({
  error,
  onRetry,
  onFeed,
  onAlerts,
}: {
  error: string | null;
  onRetry: () => void;
  onFeed: () => void;
  onAlerts: () => void;
}) {
  return (
    <View style={styles.unavailable}>
      {error ? (
        <InlineBanner tone="error" text="Couldn't load this activity" actionLabel="Retry" onAction={onRetry} />
      ) : null}
      <View style={styles.unavailableIcon}>
        <Text style={styles.unavailableIconText}>?</Text>
      </View>
      <Text style={styles.unavailableTitle}>This activity is no longer available</Text>
      <Text style={styles.unavailableText}>
        It may have been removed or you no longer have access.
      </Text>
      <PrimaryButton label="Back to Feed" onPress={onFeed} style={styles.unavailableButton} />
      <Pressable style={styles.alertsLink} onPress={onAlerts}>
        <Text style={styles.alertsLinkText}>Go to Alerts</Text>
      </Pressable>
    </View>
  );
}

function formatDetailTime(startValue: string, endValue?: string | null): string {
  const start = new Date(startValue);
  if (Number.isNaN(start.getTime())) {
    return startValue;
  }

  const startLabel = `${formatDayLabel(start)}, ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  if (!endValue) {
    return startLabel;
  }

  const end = new Date(endValue);
  if (Number.isNaN(end.getTime())) {
    return startLabel;
  }
  return `${startLabel} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

function formatDayLabel(date: Date): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (sameDay(date, today)) {
    return 'Today';
  }
  if (sameDay(date, tomorrow)) {
    return 'Tomorrow';
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatJoinMode(mode: ParticipationMode): string {
  return mode === 'open' ? 'Open - join instantly' : 'Approval needed - host reviews requests';
}

function formatGenderPreference(value: GenderPreference): string {
  switch (value) {
    case 'male_only':
      return 'For male students';
    case 'female_only':
      return 'For female students';
    default:
      return 'Open to all';
  }
}

function formatStatus(value: ActivityStatus): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  nativeHeaderAction: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  topBar: {
    paddingTop: 54,
    paddingHorizontal: 8,
    paddingBottom: 10,
    minHeight: 96,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '500',
    marginTop: -3,
  },
  topTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  topTrailing: {
    width: 92,
    alignItems: 'flex-end',
  },
  requestsButton: {
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  requestsButtonText: {
    color: colors.primaryDeep,
    fontSize: 13,
    fontWeight: '900',
  },
  scrollContent: {
    paddingHorizontal: metrics.screenX,
    paddingTop: 2,
  },
  topBanner: {
    marginBottom: 12,
  },
  headerSection: {
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    marginTop: 12,
  },
  infoCard: {
    padding: 14,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 2,
  },
  infoTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  infoLabel: {
    color: colors.text3,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 3,
  },
  infoValue: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
  },
  spotsLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderSoft,
    marginVertical: 12,
  },
  section: {
    padding: 14,
    marginBottom: 14,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 8,
  },
  description: {
    color: colors.text2,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  hostRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 17,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.primaryDeep,
    fontSize: 18,
    fontWeight: '900',
  },
  hostContent: {
    flex: 1,
    minWidth: 0,
  },
  hostName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  hostMajor: {
    color: colors.text2,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  hostTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  hostTag: {
    borderRadius: 999,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  hostTagText: {
    color: colors.text2,
    fontSize: 11,
    fontWeight: '800',
  },
  hostBio: {
    color: colors.text2,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 12,
  },
  safetySection: {
    padding: 14,
    marginBottom: 14,
  },
  trustLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  trustMark: {
    color: colors.sky,
    fontSize: 14,
    fontWeight: '900',
  },
  trustText: {
    color: colors.skyDeep,
    fontSize: 13,
    fontWeight: '800',
  },
  safetyButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  safetyButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  safetyButtonText: {
    color: colors.text2,
    fontSize: 13,
    fontWeight: '800',
  },
  stickyBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    paddingTop: 12,
    paddingHorizontal: metrics.screenX,
    shadowColor: '#101828',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 10,
    elevation: 8,
  },
  stickyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stickySummaryBlock: {
    flexShrink: 0,
    gap: 2,
  },
  stickySummaryCount: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  stickySummaryOf: {
    color: colors.text3,
  },
  stickySummaryLabel: {
    color: colors.text2,
    fontSize: 11,
    fontWeight: '500',
  },
  stickyCTAButton: {
    flex: 1,
  },
  toastOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 96,
    zIndex: 25,
  },
  toastCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#101828',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 28,
    elevation: 10,
  },
  toastIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastIconText: {
    color: colors.card,
    fontSize: 18,
    fontWeight: '900',
  },
  toastContent: {
    flex: 1,
    minWidth: 0,
  },
  toastTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  toastSub: {
    color: colors.text2,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  loadingLine: {
    marginTop: 12,
  },
  loadingLineSmall: {
    marginTop: 8,
  },
  loadingCard: {
    padding: 14,
    marginTop: 14,
  },
  loadingDivider: {
    height: 18,
  },
  unavailable: {
    flex: 1,
    paddingHorizontal: metrics.screenX,
    paddingTop: 26,
    alignItems: 'center',
  },
  unavailableIcon: {
    width: 92,
    height: 92,
    borderRadius: 28,
    backgroundColor: colors.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 46,
    marginBottom: 22,
  },
  unavailableIconText: {
    color: colors.text3,
    fontSize: 32,
    fontWeight: '900',
  },
  unavailableTitle: {
    color: colors.text,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '900',
    textAlign: 'center',
  },
  unavailableText: {
    color: colors.text2,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 10,
  },
  unavailableButton: {
    minWidth: 190,
    marginTop: 24,
  },
  alertsLink: {
    padding: 16,
  },
  alertsLinkText: {
    color: colors.skyDeep,
    fontSize: 14,
    fontWeight: '900',
  },
});
