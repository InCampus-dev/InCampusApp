import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import api from '../services/api';

interface ActivityFeedItem {
  activityId: string;
  title: string;
  scheduledDateTime: string;
  categoryLabel: string;
  meetingPointLabel: string;
  currentParticipantCount: number;
  maxParticipants: number;
}

export const ActivityFeedScreen = ({ navigation }: any) => {
  const [activities, setActivities] = useState<ActivityFeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      // Note: Backend requires campusId to filter activities correctly. 
      // Using 'campus-abc' as default for testing until the real auth context is connected.
      const response = await api.get<ActivityFeedItem[]>('/activities', {
        params: { campusId: 'campus-abc' },
      });
      setActivities(response.data);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: any) => {
    const dateStr = new Date(item.scheduledDateTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('ActivityDetails', { activityId: item.activityId })}
      >
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.details}>📅 {dateStr}</Text>
        <Text style={styles.details}>🏷️ {item.categoryLabel}  📍 {item.meetingPointLabel}</Text>
        <Text style={styles.participants}>👥 {item.currentParticipantCount} / {item.maxParticipants} Participants</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
          data={activities}
          keyExtractor={(item) => item.activityId}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  list: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2
  },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: '#333' },
  details: { fontSize: 14, color: '#666', marginBottom: 8 },
  participants: { fontSize: 14, color: '#0066cc', fontWeight: '500' }
});
