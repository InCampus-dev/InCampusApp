import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import api, { getApiErrorMessage } from '../services/api';

interface JoinRequestItem {
  requestId: string;
  activityId: string;
  applicantId: string;
  status: string;
  createdAt: string;
  applicant: {
    applicantId: string;
    displayName: string;
    major: string;
    shortBio: string | null;
  };
}

export const ManageRequestsScreen = ({ route }: any) => {
  const activityId = route?.params?.activityId;
  const [requests, setRequests] = useState<JoinRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  useEffect(() => {
    if (!activityId) {
      setLoading(false);
      return;
    }

    fetchRequests();
  }, [activityId]);

  const fetchRequests = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await api.get<JoinRequestItem[]>(`/activities/${activityId}/requests`);
      setRequests(response.data);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error) ?? 'Failed to load pending requests.');
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (requestId: string, decision: 'approve' | 'decline') => {
    setProcessingRequestId(requestId);

    try {
      await api.patch(`/activities/${activityId}/requests/${requestId}`, { decision });
      Alert.alert('Success', `Request ${decision}d successfully.`);
      setRequests((prev) => prev.filter((request) => request.requestId !== requestId));
    } catch (error) {
      Alert.alert('Error', getApiErrorMessage(error) ?? `Failed to ${decision} request.`);
    } finally {
      setProcessingRequestId(null);
    }
  };

  const renderItem = ({ item }: { item: JoinRequestItem }) => {
    const processing = processingRequestId === item.requestId;

    return (
      <View style={styles.card}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.applicant.displayName}</Text>
          <Text style={styles.userMeta}>{item.applicant.major}</Text>
          {item.applicant.shortBio ? (
            <Text style={styles.userBio}>{item.applicant.shortBio}</Text>
          ) : null}
          <Text style={styles.requestDate}>
            Requested on: {formatRequestDate(item.createdAt)}
          </Text>
          <Text style={styles.requestMeta}>
            Applicant: {item.applicantId} · Status: {formatStatus(item.status)}
          </Text>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.button, styles.approveButton, processing && styles.buttonDisabled]}
            onPress={() => handleDecision(item.requestId, 'approve')}
            disabled={processing}
          >
            <Text style={styles.buttonText}>{processing ? 'Working...' : 'Approve'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.declineButton, processing && styles.buttonDisabled]}
            onPress={() => handleDecision(item.requestId, 'decline')}
            disabled={processing}
          >
            <Text style={styles.buttonText}>{processing ? 'Working...' : 'Decline'}</Text>
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
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.stateText}>Loading pending requests...</Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.centeredState}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchRequests}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : requests.length === 0 ? (
        <Text style={styles.emptyText}>No pending requests at the moment.</Text>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.requestId}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
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

function formatStatus(value: string): string {
  return value.replace(/_/g, ' ');
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, color: '#333' },
  list: { paddingBottom: 16 },
  centeredState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  stateText: { marginTop: 8, fontSize: 14, color: '#666', textAlign: 'center' },
  emptyText: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 32 },
  errorText: { color: '#b71c1c', fontSize: 15, lineHeight: 21, textAlign: 'center' },
  retryButton: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1976d2',
  },
  retryButtonText: { color: '#fff', fontWeight: '700' },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 12, elevation: 2 },
  userInfo: { marginBottom: 12 },
  userName: { fontSize: 18, fontWeight: '600', color: '#000' },
  userMeta: { fontSize: 14, color: '#1976d2', marginTop: 4 },
  userBio: { fontSize: 14, color: '#444', marginTop: 6, lineHeight: 20 },
  requestDate: { fontSize: 14, color: '#666', marginTop: 8 },
  requestMeta: { fontSize: 12, color: '#888', marginTop: 4, textTransform: 'capitalize' },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  button: { flex: 1, padding: 10, borderRadius: 6, alignItems: 'center', marginHorizontal: 4 },
  approveButton: { backgroundColor: '#28a745' },
  declineButton: { backgroundColor: '#dc3545' },
  buttonDisabled: { opacity: 0.65 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
