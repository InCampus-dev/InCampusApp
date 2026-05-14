import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import api from '../services/api';

export const ManageRequestsScreen = ({ route, navigation }: any) => {
  const { activityId } = route.params;
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, [activityId]);

  const fetchRequests = async () => {
    try {
      const response = await api.get(`/activities/${activityId}/requests`);
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
      Alert.alert('Error', 'Failed to load pending requests.');
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (requestId: string, decision: 'approve' | 'decline') => {
    try {
      await api.patch(`/activities/${activityId}/requests/${requestId}`, { decision });
      Alert.alert('Success', `Request ${decision}d successfully.`);
      
      // Rimuoviamo la richiesta dalla lista locale dopo la decisione
      setRequests(prev => prev.filter(req => req.participationId !== requestId));
    } catch (error: any) {
      console.error(`Error processing ${decision}:`, error);
      Alert.alert('Error', error.response?.data?.message || `Failed to ${decision} request.`);
    }
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.userInfo}>
        {/* Il DUC-HL-02 richiede di mostrare i dati minimi del profilo dell'applicant */}
        <Text style={styles.userName}>{item.studentDisplayName || 'Student Applicant'}</Text>
        <Text style={styles.requestDate}>
          Requested on: {new Date(item.createdAt).toLocaleDateString()}
        </Text>
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

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Pending Join Requests</Text>
      {loading ? (
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