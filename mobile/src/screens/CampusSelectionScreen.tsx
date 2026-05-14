// Task: M03 | Path: mobile/src/screens/CampusSelectionScreen.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { getApiErrorCode } from '../services/api';

interface Campus {
  campusId: string;
  campusName: string;
  activationStatus: boolean;
}

export default function CampusSelectionScreen({ navigation }: { navigation: any }) {
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // A.4 fix: in-screen auth token check — redirect to SignIn if token is missing
  useEffect(() => {
    AsyncStorage.getItem('authToken').then((token) => {
      if (!token) {
        navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] });
      }
    });
  }, [navigation]);

  useEffect(() => {
    fetchCampuses();
  }, []);

  async function fetchCampuses() {
    try {
      const response = await api.get<Campus[]>('/campuses');
      const list: Campus[] = response.data;
      // A.1 fix: client-side defensive filter — only show campuses confirmed active
      const activeCampuses = list.filter((c) => c.activationStatus === true);
      setCampuses(activeCampuses);
      // DUC-AP-03 alternate scenario: if only one campus, pre-select it
      if (activeCampuses.length === 1) {
        setSelectedId(activeCampuses[0].campusId);
      }
    } catch (error: any) {
      const code = getApiErrorCode(error);
      if (code === 'NOT_FOUND' || code === 'NoCampusesConfigured') {
        Alert.alert(
          'No Campuses Available',
          'No campuses are configured for your university yet. Please contact your university.',
        );
      } else {
        Alert.alert('Error', 'Could not load campuses. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!selectedId) return;
    setSubmitting(true);
    try {
      await api.patch('/accounts/me/campus', { campusId: selectedId });
      await AsyncStorage.setItem('selectedCampusId', selectedId);
      // TODO: Replace this client-side storage fallback once the backend exposes
      // a secure way to refresh the authenticated token after campus selection.

      try {
        await api.get('/profiles/me');
        navigation.reset({ index: 0, routes: [{ name: 'ActivityFeed' }] });
      } catch {
        navigation.navigate('ProfileSetup');
      }
    } catch (error: any) {
      const code = getApiErrorCode(error);
      if (code === 'NOT_FOUND' || code === 'CampusNotFound' || code === 'CampusNotActive') {
        Alert.alert('Campus Unavailable', 'This campus is no longer available. Please select another.');
        fetchCampuses();
      } else {
        Alert.alert('Error', 'Could not select campus. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading campuses…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Your Campus</Text>
      <Text style={styles.subtitle}>
        Choose the campus you belong to. This determines the activities and content you see.
      </Text>

      <FlatList
        data={campuses}
        keyExtractor={(item) => item.campusId}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.campusItem,
              selectedId === item.campusId && styles.campusItemSelected,
            ]}
            onPress={() => setSelectedId(item.campusId)}
          >
            <Text
              style={[
                styles.campusName,
                selectedId === item.campusId && styles.campusNameSelected,
              ]}
            >
              {item.campusName}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No campuses available.</Text>
        }
      />

      <TouchableOpacity
        style={[styles.confirmButton, !selectedId && styles.confirmButtonDisabled]}
        onPress={handleConfirm}
        disabled={!selectedId || submitting}
      >
        <Text style={styles.confirmButtonText}>
          {submitting ? 'Confirming…' : 'Confirm Campus'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#666' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
  campusItem: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 10,
  },
  campusItemSelected: {
    borderColor: '#4A90D9',
    backgroundColor: '#EBF4FF',
  },
  campusName: { fontSize: 16, color: '#333' },
  campusNameSelected: { color: '#4A90D9', fontWeight: '600' },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 40 },
  confirmButton: {
    backgroundColor: '#4A90D9',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  confirmButtonDisabled: { backgroundColor: '#B0C4DE' },
  confirmButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
