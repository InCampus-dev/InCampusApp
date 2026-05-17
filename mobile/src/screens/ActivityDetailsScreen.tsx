import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import api, { getApiErrorMessage } from '../services/api';

interface ActivityDetailsViewModel {
  activityId: string;
  title: string;
  description?: string | null;
  scheduledDateTime: string;
  meetingPointLabel: string;
  categoryLabel: string;
  currentParticipantCount: number;
  maxParticipants: number;
  hostAccountId: string;
  status: 'open' | 'full' | 'completed' | 'cancelled';
  canManageRequests?: boolean;
  hostProfile?: {
    displayName: string;
    shortBio?: string | null;
  };
  genderPreference: 'all' | 'male_only' | 'female_only';
  participationMode: 'open' | 'approval_based';
}

export const ActivityDetailsScreen = ({ route, navigation }: any) => {
  const { activityId } = route.params;
  const [activity, setActivity] = useState<ActivityDetailsViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchActivityDetails = async () => {
      try {
        const response = await api.get<ActivityDetailsViewModel>(`/activities/${activityId}`);
        if (mounted) {
          setActivity(response.data);
        }
      } catch (error) {
        Alert.alert('Error', getApiErrorMessage(error) ?? 'Failed to load activity details.');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchActivityDetails();

    return () => {
      mounted = false;
    };
  }, [activityId]);

  useEffect(() => {
    if (!activity?.canManageRequests) {
      navigation.setOptions({ headerRight: undefined });
      return;
    }

    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={() => navigation.navigate('ManageRequests', { activityId })}>
          <Text style={styles.headerActionText}>Requests</Text>
        </Pressable>
      ),
    });
  }, [activity?.canManageRequests, activityId, navigation]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      await api.post(`/activities/${activityId}/join`);
      Alert.alert('Success', getJoinSuccessMessage(activity?.participationMode));
      navigation.navigate('ActivityFeed', { refreshAfterJoin: Date.now() });
    } catch (error) {
      Alert.alert('Error', getApiErrorMessage(error) ?? 'Failed to join the activity.');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.stateText}>Loading activity details...</Text>
      </View>
    );
  }

  if (!activity) {
    return (
      <View style={styles.centered}>
        <Text style={styles.stateTitle}>Activity unavailable</Text>
        <Text style={styles.stateText}>This activity may have been removed or may no longer be accessible.</Text>
      </View>
    );
  }

  const isFull = activity.currentParticipantCount >= activity.maxParticipants;
  const canJoin = !activity.canManageRequests && activity.status === 'open' && !isFull;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{activity.title}</Text>
      {activity.description ? (
        <Text style={styles.description}>{activity.description}</Text>
      ) : (
        <Text style={styles.descriptionMuted}>No description provided.</Text>
      )}

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>When: {formatDateTime(activity.scheduledDateTime)}</Text>
        <Text style={styles.infoText}>Meeting Point: {activity.meetingPointLabel}</Text>
        <Text style={styles.infoText}>Category: {activity.categoryLabel}</Text>
        <Text style={styles.infoText}>
          Participants: {activity.currentParticipantCount} / {activity.maxParticipants}
        </Text>
        <Text style={styles.infoText}>Host: {activity.hostProfile?.displayName || 'Student'}</Text>
        {activity.hostProfile?.shortBio ? (
          <Text style={styles.hostBio}>"{activity.hostProfile.shortBio}"</Text>
        ) : null}
        <Text style={styles.infoText}>Status: {formatStatus(activity.status)}</Text>
        <Text style={styles.infoText}>Gender Pref: {formatGenderPreference(activity.genderPreference)}</Text>
        <Text style={styles.infoText}>Mode: {activity.participationMode === 'open' ? 'Direct Join' : 'Approval Required'}</Text>
      </View>

      <View style={styles.secondaryActions}>
        <Pressable
          style={styles.secondaryAction}
          onPress={() =>
            navigation.navigate('ReportSubmission', {
              targetType: 'activity',
              targetActivityId: activity.activityId,
            })
          }
        >
          <Text style={styles.secondaryActionText}>Report activity</Text>
        </Pressable>
        <Pressable
          style={styles.secondaryAction}
          onPress={() => navigation.navigate('BlockUser', { targetAccountId: activity.hostAccountId })}
        >
          <Text style={styles.secondaryActionText}>Block host</Text>
        </Pressable>
      </View>

      <View style={styles.buttonContainer}>
        {activity.canManageRequests ? (
          <Button
            title="Manage Requests"
            onPress={() => navigation.navigate('ManageRequests', { activityId })}
          />
        ) : (
          <Button
            title={
              joining
                ? 'Processing...'
                : isFull
                  ? 'Activity Full'
                  : activity.participationMode === 'open'
                    ? 'Join Activity'
                    : 'Request to Join'
            }
            onPress={handleJoin}
            disabled={!canJoin || joining}
          />
        )}
      </View>
    </View>
  );
};

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

function formatStatus(value: ActivityDetailsViewModel['status']): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatGenderPreference(value: ActivityDetailsViewModel['genderPreference']): string {
  switch (value) {
    case 'male_only':
      return 'Male Only';
    case 'female_only':
      return 'Female Only';
    default:
      return 'All';
  }
}

function getJoinSuccessMessage(participationMode?: ActivityDetailsViewModel['participationMode']): string {
  return participationMode === 'approval_based'
    ? 'Join request sent to the host.'
    : 'Successfully joined the activity.';
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  stateTitle: { fontSize: 18, fontWeight: '700', color: '#222', marginBottom: 8, textAlign: 'center' },
  stateText: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 8 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 12, color: '#000' },
  description: { fontSize: 16, color: '#444', marginBottom: 20 },
  descriptionMuted: { fontSize: 16, color: '#777', marginBottom: 20, fontStyle: 'italic' },
  infoBox: { backgroundColor: '#f0f0f0', padding: 16, borderRadius: 8, marginBottom: 20 },
  infoText: { fontSize: 15, marginBottom: 8, color: '#333' },
  hostBio: { fontSize: 14, fontStyle: 'italic', color: '#666', marginBottom: 8, marginLeft: 24 },
  secondaryActions: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  secondaryAction: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d7dce2',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  secondaryActionText: { color: '#1976d2', fontSize: 14, fontWeight: '600' },
  buttonContainer: { marginTop: 'auto', marginBottom: 20 },
  headerActionText: {
    color: '#1976d2',
    fontSize: 14,
    fontWeight: '600',
  },
});
