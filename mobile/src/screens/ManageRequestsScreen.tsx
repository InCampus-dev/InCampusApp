import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import api, { getApiErrorMessage } from '../services/api';

interface RequestItem {
  participationId: string;
  studentDisplayName?: string;
  applicant?: {
    studentDisplayName?: string;
  };
  createdAt: string;
}

export const ManageRequestsScreen = ({ route, navigation }: any) => {
  const activityId = route?.params?.activityId;
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activityId) {
      setLoading(false);
      return;
    }

    fetchRequests();
  }, [activityId]);

  const fetchRequests = async () => {
    try {
      const response = await api.get<RequestItem[]>(`/activities/${activityId}/requests`);
      setRequests(response.data);
    } catch (error) {
      Alert.alert('Error', getApiErrorMessage(error) ?? 'Failed to load pending requests.');
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (requestId: string, decision: 'approve' | 'decline') => {
    try {
      await api.patch(`/activities/${activityId}/requests/${requestId}`, { decision });
      Alert.alert('Success', `Request ${decision}d successfully.`);
      setRequests(prev => prev.filter(req => req.participationId !== requestId));
    } catch (error) {
      Alert.alert('Error', getApiErrorMessage(error) ?? `Failed to ${decision} request.`);
    }
  };

  const renderItem = ({ item }: { item: RequestItem }) => {
    const applicantName =
      item.studentDisplayName ?? item.applicant?.studentDisplayName ?? 'Student Applicant';

    return (
      <View style={styles.card}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{applicantName}</Text>
          <Text style={styles.requestDate}>Requested on: {formatRequestDate(item.createdAt)}</Text>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.button, styles.approveButton]}
            onPress={() => handleDecision(item.participationId, 'approve')}
          >
            <Text style={styles.buttonText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.declineButton]}
            onPress={() => handleDecision(item.participationId, 'decline')}
          >
            <Text style={styles.buttonText}>Decline</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Pending Join Requests</Text>
      {!activityId ? (
        <Text style={styles.emptyText}>This screen needs an activity context to load requests.</Text>
      ) : loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : requests.length === 0 ? (
        <Text style={styles.emptyText}>No pending requests at the moment.</Text>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.participationId}
          renderItem={renderItem}
        />
      )}
    </View>
  );
};

function formatRequestDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, color: '#333' },
  emptyText: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 32 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 12, elevation: 2 },
  userInfo: { marginBottom: 12 },
  userName: { fontSize: 18, fontWeight: '600', color: '#000' },
  requestDate: { fontSize: 14, color: '#666', marginTop: 4 },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  button: { flex: 1, padding: 10, borderRadius: 6, alignItems: 'center', marginHorizontal: 4 },
  approveButton: { backgroundColor: '#28a745' },
  declineButton: { backgroundColor: '#dc3545' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
