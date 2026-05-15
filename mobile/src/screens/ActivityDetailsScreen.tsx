import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Pressable,
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
    const fetchActivityDetails = async () => {
      try {
        const response = await api.get<ActivityDetailsViewModel>(`/activities/${activityId}`);
        setActivity(response.data);
      } catch (error) {
        Alert.alert('Error', getApiErrorMessage(error) ?? 'Failed to load activity details.');
      } finally {
        setLoading(false);
      }
    };

    fetchActivityDetails();
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
      navigation.goBack();
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
      </View>
    );
  }

  if (!activity) {
    return (
      <View style={styles.centered}>
        <Text>Activity unavailable.</Text>
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
      ) : null}

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>When: {formatDateTime(activity.scheduledDateTime)}</Text>
        <Text style={styles.infoText}>Meeting Point: {activity.meetingPointLabel}</Text>
        <Text style={styles.infoText}>Category: {activity.categoryLabel}</Text>
        <Text style={styles.infoText}>
          Participants: {activity.currentParticipantCount} / {activity.maxParticipants}
        </Text>
        <Text style={styles.infoText}>Host: {activity.hostProfile?.displayName || 'Student'}</Text>
        {activity.hostProfile?.shortBio && (
          <Text style={styles.hostBio}>"{activity.hostProfile.shortBio}"</Text>
        )}
        <Text style={styles.infoText}>Status: {formatStatus(activity.status)}</Text>
        <Text style={styles.infoText}>Gender Pref: {formatGenderPreference(activity.genderPreference)}</Text>
        <Text style={styles.infoText}>Mode: {activity.participationMode === 'open' ? 'Direct Join' : 'Approval Required'}</Text>
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
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 12, color: '#000' },
  description: { fontSize: 16, color: '#444', marginBottom: 20 },
  infoBox: { backgroundColor: '#f0f0f0', padding: 16, borderRadius: 8, marginBottom: 20 },
  infoText: { fontSize: 15, marginBottom: 8, color: '#333' },
  hostBio: { fontSize: 14, fontStyle: 'italic', color: '#666', marginBottom: 8, marginLeft: 24 },
  buttonContainer: { marginTop: 'auto', marginBottom: 20 },
  headerActionText: {
    color: '#1976d2',
    fontSize: 14,
    fontWeight: '600',
  },
});
