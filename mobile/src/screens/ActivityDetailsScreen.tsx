import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiErrorMessage } from '../services/api';
import {
  deleteHostedActivity,
  getActivityDetails,
  joinActivity,
  leaveActivity,
  withdrawActivityRequest,
  type ActivityDetailsViewModel,
} from '../services/studentApi';
import { getActivityDetailsActionModel } from '../services/activityDetailsActions';
import {
  getDisplayParticipantCountIncludingHost,
  getJoinedCountLabel
} from '../services/activityCapacity';
import {
  InlineBanner,
  PrimaryButton,
  ProgressStrip,
  SectionCard,
  SkeletonBlock,
  TinyIcon,
  categoryStyle,
  colors,
  metrics,
} from '../components/InCampusUI';

type ParticipationMode = 'open' | 'approval_based';
type GenderPreference = 'all' | 'male_only' | 'female_only';
export const ActivityDetailsScreen = ({ route, navigation }: any) => {
  const { activityId } = route.params;
  const insets = useSafeAreaInsets();
  const [activity, setActivity] = useState<ActivityDetailsViewModel | null>(null);
  const [studentAccountId, setStudentAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchActivityDetails = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [accountId, details] = await Promise.all([
        AsyncStorage.getItem('studentAccountId'),
        getActivityDetails(activityId),
      ]);
      setStudentAccountId(accountId);
      setActivity(details);
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
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

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

  const isHost = Boolean(
    activity?.personalActivityStatus === 'host' ||
      (studentAccountId && activity?.hostAccountId === studentAccountId)
  );
  const isFull = Boolean(
    activity && (activity.status === 'full' || getDisplayParticipantCountIncludingHost(activity) >= activity.maxParticipants),
  );

  const cta = useMemo(() => {
    if (!activity) {
      return { kind: 'join' as const, label: 'Back to Feed', tone: 'blue' as const, disabled: false };
    }
    return getActivityDetailsActionModel(activity, isFull);
  }, [activity, isFull]);

  const handlePrimaryAction = async () => {
    if (actionLoading) {
      return;
    }

    if (!activity) {
      navigation.reset({ index: 0, routes: [{ name: 'ActivityFeed' }] });
      return;
    }

    if (activity.canManageRequests) {
      navigation.navigate('ManageRequests', { activityId });
      return;
    }

    if (cta.disabled) {
      return;
    }

    setActionLoading(true);
    setJoinError(null);
    setSuccessMessage(null);
    try {
      if (cta.kind === 'pending_request') {
        await withdrawActivityRequest(activityId);
        await fetchActivityDetails();
        setSuccessMessage('Request withdrawn.');
        return;
      }

      if (cta.kind === 'confirmed_participant') {
        await leaveActivity(activityId);
        await fetchActivityDetails();
        setSuccessMessage('You left this activity.');
        return;
      }

      await joinActivity(activityId);
      await fetchActivityDetails();
      setSuccessMessage(activity.participationMode === 'approval_based' ? 'Request sent.' : "You're in.");
    } catch (error) {
      setJoinError(getApiErrorMessage(error) ?? 'Something went wrong. Try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const performDeleteActivity = async () => {
    if (deleteLoading) {
      return;
    }

    setDeleteLoading(true);
    setJoinError(null);
    setSuccessMessage(null);
    try {
      await deleteHostedActivity(activityId);
      navigation.reset({ index: 0, routes: [{ name: 'ActivityFeed' }] });
    } catch (error) {
      setJoinError(getApiErrorMessage(error) ?? 'Could not delete this activity.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const confirmDeleteActivity = () => {
    if (deleteLoading) {
      return;
    }

    Alert.alert(
      'Delete activity?',
      'This removes the activity from the feed. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void performDeleteActivity();
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.screen}>
        <DetailTopBar topInset={insets.top} onBack={() => navigation.goBack()} />
        <DetailLoading bottomInset={insets.bottom} />
      </View>
    );
  }

  if (!activity) {
    return (
      <View style={styles.screen}>
        <DetailTopBar topInset={insets.top} onBack={() => navigation.goBack()} />
        <UnavailableState
          error={loadError}
          onRetry={fetchActivityDetails}
          onFeed={() => navigation.reset({ index: 0, routes: [{ name: 'ActivityFeed' }] })}
          onNotifications={() => navigation.navigate('NotificationList')}
        />
      </View>
    );
  }

  const relationshipStatus = getRelationshipStatusText(activity);
  const showGuestSafety = !isHost && !activity.canManageRequests;

  return (
    <View style={styles.screen}>
      <DetailTopBar
        topInset={insets.top}
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
            <InlineBanner tone="error" text={joinError} />
          </View>
        ) : null}
        {/* success toast rendered as PostActionToast overlay below */}

        <ActivityHeader activity={activity} when={formatDetailTime(activity.scheduledDateTime, activity.scheduledEndDateTime)} />

        <InfoBlock activity={activity} />

        {relationshipStatus ? <RelationshipStatusBanner text={relationshipStatus} /> : null}

        {isHost ? (
          <HostManagementSection
            loading={deleteLoading}
            onDelete={confirmDeleteActivity}
          />
        ) : null}

        {activity.description ? <DescriptionSection text={activity.description} /> : null}

        <HostTrustSection
          host={activity.hostProfile}
          hostAccountId={activity.hostAccountId}
          onOpenProfile={
            activity.hostAccountId
              ? () =>
                  navigation.navigate('StudentProfile', {
                    studentAccountId: activity.hostAccountId,
                    contextActivityId: activity.activityId,
                  })
              : undefined
          }
        />

        {showGuestSafety ? (
          <SafetyActions
            onReport={() =>
              navigation.navigate('ReportSubmission', {
                targetType: 'activity',
                targetActivityId: activity.activityId,
                activityTitle: activity.title,
                categoryLabel: activity.categoryLabel,
              })
            }
            onReportHost={() =>
              navigation.navigate('ReportSubmission', {
                targetType: 'student',
                targetAccountId: activity.hostAccountId,
              })
            }
            onBlock={() =>
              navigation.navigate('BlockUser', {
                targetAccountId: activity.hostAccountId,
                returnToActivityId: activity.activityId,
              })
            }
          />
        ) : null}
      </ScrollView>

      <StickyDetailCTA
        bottomInset={insets.bottom}
        current={getDisplayParticipantCountIncludingHost(activity)}
        max={activity.maxParticipants}
        ctaLabel={cta.label}
        tone={cta.tone}
        disabled={cta.disabled}
        loading={actionLoading}
        onPress={handlePrimaryAction}
      />
      {successMessage ? <PostActionToast message={successMessage} tone={getToastTone(cta.kind)} /> : null}
    </View>
  );
};


function ActivityHeader({ activity, when }: { activity: ActivityDetailsViewModel; when: string }) {
  const cs = categoryStyle(activity.categoryLabel);
  const useWhite = cs.fg === '#FFFFFF';
  const pillBg = useWhite ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.08)';
  return (
    <View style={[styles.heroHeader, { backgroundColor: cs.bg, shadowColor: cs.bg }]}>
      <View style={styles.heroTopRow}>
        <View style={styles.heroBadges}>
          <View style={[styles.heroPill, { backgroundColor: pillBg }]}>
            <View style={[styles.heroPillDot, { backgroundColor: cs.dot }]} />
            <Text style={[styles.heroPillText, { color: cs.fg }]} numberOfLines={1}>
              {activity.categoryLabel.toUpperCase()}
            </Text>
          </View>
          {activity.status && activity.status !== 'open' ? (
            <View style={[styles.heroStatus, { backgroundColor: pillBg }]}>
              <Text style={[styles.heroStatusText, { color: cs.fg }]}>{formatStatusLabel(activity.status)}</Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.heroWhen, { color: cs.fg }]} numberOfLines={2}>{when}</Text>
      </View>
      <Text style={[styles.heroTitle, { color: cs.fg }]}>{activity.title}</Text>
    </View>
  );
}

function DetailTopBar({
  topInset,
  onBack,
  trailing,
}: {
  topInset: number;
  onBack: () => void;
  trailing?: React.ReactNode;
}) {
  return (
    <View style={[styles.topBar, { paddingTop: topInset + 14 }]}>
      <Pressable style={styles.backButton} onPress={onBack}>
        <Text style={styles.backIcon}>‹</Text>
      </Pressable>
      <Text style={styles.topTitle}>Activity</Text>
      <View style={styles.topTrailing}>{trailing}</View>
    </View>
  );
}

function InfoBlock({ activity }: { activity: ActivityDetailsViewModel }) {
  const displayParticipantCount = getDisplayParticipantCountIncludingHost(activity);
  const isFull = activity.status === 'full' || displayParticipantCount >= activity.maxParticipants;
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
            <Text style={styles.infoValue}>{getJoinedCountLabel(activity)}</Text>
            <ProgressStrip current={displayParticipantCount} max={activity.maxParticipants} full={isFull} />
          </View>
        </View>
      </View>
      <Divider />
      <InfoRow
        label="How to join"
        value={formatJoinMode(activity.participationMode)}
        icon={activity.participationMode === 'open' ? 'O' : 'A'}
        tone={activity.participationMode === 'open' ? 'open' : 'default'}
      />
      {activity.genderPreference !== 'all' ? (
        <>
          <Divider />
          <InfoRow label="Preference" value={formatGenderPreference(activity.genderPreference)} icon="G" />
        </>
      ) : null}
    </SectionCard>
  );
}

function InfoRow({ icon, label, value, tone = 'default' }: { icon: string; label: string; value: string; tone?: 'default' | 'open' }) {
  const open = tone === 'open';
  return (
    <View style={styles.infoRow}>
      <TinyIcon label={icon} color={open ? colors.greenDeep : colors.text2} />
      <View style={styles.infoTextBlock}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, open && styles.openInfoValue]}>{value}</Text>
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

function RelationshipStatusBanner({ text }: { text: string }) {
  return (
    <SectionCard style={styles.relationshipCard}>
      <Text style={styles.relationshipText}>{text}</Text>
    </SectionCard>
  );
}

function HostManagementSection({
  loading,
  onDelete,
}: {
  loading?: boolean;
  onDelete: () => void;
}) {
  return (
    <SectionCard style={styles.hostManagementCard}>
      <Text style={styles.sectionTitle}>Host controls</Text>
      <PrimaryButton
        label={loading ? 'Deleting...' : 'Delete activity'}
        tone="danger"
        loading={loading}
        onPress={onDelete}
        style={styles.deleteActivityButton}
      />
    </SectionCard>
  );
}

function HostTrustSection({
  host,
  hostAccountId,
  onOpenProfile,
}: {
  host?: ActivityDetailsViewModel['hostProfile'];
  hostAccountId: string;
  onOpenProfile?: () => void;
}) {
  const name = host?.displayName || 'Verified student';
  const interests = host?.interests?.slice(0, 2) ?? [];

  return (
    <SectionCard style={styles.section}>
      <Text style={styles.sectionTitle}>Hosted by</Text>
      <Pressable style={styles.hostRow} onPress={onOpenProfile} disabled={!onOpenProfile}>
        <View style={styles.hostAvatar}>
          <Text style={styles.hostAvatarText}>{name.charAt(0).toUpperCase()}</Text>
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
        {hostAccountId ? <Text style={styles.profileChevron}>{'>'}</Text> : null}
      </Pressable>
      {host?.shortBio ? <Text style={styles.hostBio} numberOfLines={2}>{host.shortBio}</Text> : null}
    </SectionCard>
  );
}

function SafetyActions({
  onReport,
  onReportHost,
  onBlock,
}: {
  onReport: () => void;
  onReportHost: () => void;
  onBlock: () => void;
}) {
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
        <Pressable style={styles.safetyButton} onPress={onReportHost}>
          <Text style={styles.safetyButtonText}>Report host</Text>
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
          <PrimaryButton
            label={ctaLabel}
            tone={tone}
            disabled={disabled}
            loading={loading}
            onPress={onPress}
            style={tone === 'green' ? styles.joinCTAButton : tone === 'blue' ? styles.brandCTAButton : undefined}
          />
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
  const bg = tone === 'blue' ? colors.skyBlue : colors.green;
  return (
    <View style={styles.toastOverlay}>
      <View style={[styles.toastCard, { borderColor: `${bg}33` }]}>
        <View style={[styles.toastIcon, { backgroundColor: bg }]}>
          <Text style={styles.toastIconText}>✓</Text>
        </View>
        <View style={styles.toastContent}>
          <Text style={[styles.toastTitle, { color: tone === 'blue' ? colors.skyDeep : colors.greenDeep }]}>
            {message}
          </Text>
          <Text style={styles.toastSub}>
            {message === 'Request withdrawn.'
              ? 'Your request has been cancelled.'
              : tone === 'blue'
                ? 'The host will review and let you know.'
                : 'Returning to your feed…'}
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
  onNotifications,
}: {
  error: string | null;
  onRetry: () => void;
  onFeed: () => void;
  onNotifications: () => void;
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
      <Pressable style={styles.alertsLink} onPress={onNotifications}>
        <Text style={styles.alertsLinkText}>Go to Notifications</Text>
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

function getRelationshipStatusText(activity: ActivityDetailsViewModel): string | null {
  switch (activity.personalActivityStatus) {
    case 'host':
      return 'You are hosting this activity.';
    case 'pending_request':
      return 'Pending request';
    case 'confirmed_participant':
      return 'Joined';
    default:
      return null;
  }
}

function getToastTone(kind: string): 'green' | 'blue' {
  return kind === 'request_to_join' || kind === 'pending_request' ? 'blue' : 'green';
}

function formatStatusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
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
  heroHeader: {
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 22,
    marginBottom: 14,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 28,
    elevation: 4,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroBadges: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 7,
  },
  heroPill: {
    maxWidth: '100%',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  heroPillText: {
    flexShrink: 1,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  heroStatus: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  heroStatusText: {
    fontSize: 11,
    fontWeight: '900',
  },
  heroWhen: {
    maxWidth: 112,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
    textAlign: 'right',
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginTop: 18,
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
  openInfoValue: {
    alignSelf: 'flex-start',
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: colors.greenSoft,
    color: colors.greenDeep,
    paddingHorizontal: 9,
    paddingVertical: 4,
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
  relationshipCard: {
    padding: 14,
    marginBottom: 14,
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  relationshipText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  hostManagementCard: {
    padding: 14,
    marginBottom: 14,
    borderColor: '#F8C9CB',
  },
  deleteActivityButton: {
    minHeight: 46,
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
  hostAvatar: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.28,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  hostAvatarText: {
    color: colors.card,
    fontSize: 17,
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
  profileChevron: {
    color: colors.text3,
    fontSize: 18,
    fontWeight: '900',
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
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  trustText: {
    color: colors.primaryDeep,
    fontSize: 13,
    fontWeight: '800',
  },
  safetyButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  safetyButton: {
    flexGrow: 1,
    minWidth: '30%',
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
  joinCTAButton: {
    shadowColor: colors.green,
    shadowOpacity: 0.22,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 4,
  },
  brandCTAButton: {
    shadowColor: colors.primary,
    shadowOpacity: 0.22,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 4,
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
    shadowColor: colors.primary,
    shadowOpacity: 0.22,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 4,
  },
  alertsLink: {
    padding: 16,
  },
  alertsLinkText: {
    color: colors.primaryDeep,
    fontSize: 14,
    fontWeight: '900',
  },
});
