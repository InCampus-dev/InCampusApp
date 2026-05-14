import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import api from '../services/api';

export const ActivityDetailsScreen = ({ route, navigation }: any) => {
  const { activityId } = route.params;
  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivityDetails = async () => {
      try {
        const response = await api.get(`/activities/${activityId}`, { params: { campusId: 'campus-abc' } });
        setActivity(response.data);
      } catch (error) {
        console.error('Error fetching activity details:', error);
        Alert.alert('Error', 'Failed to load activity details.');
      } finally {
        setLoading(false);
      }
    };

    fetchActivityDetails();
  }, [activityId]);

  const handleJoin = async () => {
    try {
      await api.post(`/activities/${activityId}/join`, { campusId: 'campus-abc' });
      Alert.alert('Success', 'Successfully joined the activity!');
      navigation.goBack();
    } catch (error: any) {
      console.error('Error joining activity:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to join the activity.');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const isFull = activity.currentParticipantCount >= activity.maxParticipants;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{activity.title}</Text>
      <Text style={styles.description}>{activity.description}</Text>
      
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>📍 {activity.meetingPointLabel}</Text>
        <Text style={styles.infoText}>🏷️ {activity.categoryLabel}</Text>
        <Text style={styles.infoText}>👥 {activity.currentParticipantCount} / {activity.maxParticipants}</Text>
        <Text style={styles.infoText}>👤 Host: {activity.hostDisplayName || 'Student'}</Text>
        {activity.hostShortBio && (
          <Text style={styles.hostBio}>"{activity.hostShortBio}"</Text>
        )}
        <Text style={styles.infoText}>⚧️ Gender Pref: {activity.genderPreference === 'all' ? 'All' : (activity.genderPreference === 'male_only' ? 'Male Only' : 'Female Only')}</Text>
        <Text style={styles.infoText}>� Mode: {activity.participationMode === 'open' ? 'Direct Join' : 'Approval Required'}</Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button 
          title={isFull ? "Activity Full" : (activity.participationMode === 'open' ? "Join Activity" : "Request to Join")} 
          onPress={handleJoin} 
          disabled={isFull}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 12, color: '#000' },
  description: { fontSize: 16, color: '#444', marginBottom: 20 },
  infoBox: { backgroundColor: '#f0f0f0', padding: 16, borderRadius: 8, marginBottom: 20 },
  infoText: { fontSize: 15, marginBottom: 8, color: '#333' },
  hostBio: { fontSize: 14, fontStyle: 'italic', color: '#666', marginBottom: 8, marginLeft: 24 },
  buttonContainer: { marginTop: 'auto', marginBottom: 20 }
});