import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';

export const CreateActivityScreen = ({ navigation }: any) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('cat-1');
  const [meetingPointId, setMeetingPointId] = useState('loc-1');
  const [maxParticipants, setMaxParticipants] = useState('5');
  const [participationMode, setParticipationMode] = useState('open'); // 'open' | 'approval_based'
  const [maxRequests, setMaxRequests] = useState(''); // Optional, for approval_based
  const [genderPreference, setGenderPreference] = useState('all'); // 'all' | 'male_only' | 'female_only'

  // Mock options (simulating Campus Structured Options - DS-CA-002)
  const categories = [
    { id: 'cat-1', name: 'Coffee / Break' },
    { id: 'cat-2', name: 'Study Session' },
    { id: 'cat-3', name: 'Sports' }
  ];

  const locations = [
    { id: 'loc-1', name: 'Library Cafe' },
    { id: 'loc-2', name: 'Study Room B' },
    { id: 'loc-3', name: 'Main Campus Gym' }
  ];

  const handleCreate = () => {
    if (!title || !description) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    // TODO: Replace with real call to POST /activities
    const newActivity = {
      title,
      description,
      categoryId,
      meetingPointId,
      maxParticipants: parseInt(maxParticipants, 10),
      participationMode,
      maxRequests: maxRequests ? parseInt(maxRequests, 10) : undefined,
      genderPreference,
      // For the mockup we set the start date to "tomorrow"
      scheduledDateTime: new Date(Date.now() + 86400000).toISOString()
    };

    console.log('Creating activity...', newActivity);
    Alert.alert('Success', 'Activity published successfully!');
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Create New Activity</Text>

      <Text style={styles.label}>Title *</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g. Coffee at the library" />

      <Text style={styles.label}>Description *</Text>
      <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholder="Activity details..." multiline />

      <Text style={styles.label}>Category</Text>
      <View style={styles.optionsContainer}>
        {categories.map(cat => (
          <TouchableOpacity 
            key={cat.id} 
            style={[styles.optionBtn, categoryId === cat.id && styles.optionBtnSelected]}
            onPress={() => setCategoryId(cat.id)}
          >
            <Text style={categoryId === cat.id ? styles.optionTextSelected : styles.optionText}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Meeting Point</Text>
      <View style={styles.optionsContainer}>
        {locations.map(loc => (
          <TouchableOpacity 
            key={loc.id} 
            style={[styles.optionBtn, meetingPointId === loc.id && styles.optionBtnSelected]}
            onPress={() => setMeetingPointId(loc.id)}
          >
            <Text style={meetingPointId === loc.id ? styles.optionTextSelected : styles.optionText}>{loc.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Maximum Participants</Text>
      <TextInput style={styles.input} value={maxParticipants} onChangeText={setMaxParticipants} keyboardType="numeric" />

      {participationMode === 'approval_based' && (
        <>
          <Text style={styles.label}>Max Pending Requests (Optional)</Text>
          <TextInput style={styles.input} value={maxRequests} onChangeText={setMaxRequests} keyboardType="numeric" placeholder="e.g. 10" />
        </>
      )}

      <Text style={styles.label}>Participation Mode</Text>
      <View style={styles.optionsContainer}>
        <TouchableOpacity style={[styles.optionBtn, participationMode === 'open' && styles.optionBtnSelected]} onPress={() => setParticipationMode('open')}>
          <Text style={participationMode === 'open' ? styles.optionTextSelected : styles.optionText}>Open Access</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.optionBtn, participationMode === 'approval_based' && styles.optionBtnSelected]} onPress={() => setParticipationMode('approval_based')}>
          <Text style={participationMode === 'approval_based' ? styles.optionTextSelected : styles.optionText}>Requires Approval</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Gender Preference</Text>
      <View style={styles.optionsContainer}>
        <TouchableOpacity style={[styles.optionBtn, genderPreference === 'all' && styles.optionBtnSelected]} onPress={() => setGenderPreference('all')}>
          <Text style={genderPreference === 'all' ? styles.optionTextSelected : styles.optionText}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.optionBtn, genderPreference === 'male_only' && styles.optionBtnSelected]} onPress={() => setGenderPreference('male_only')}>
          <Text style={genderPreference === 'male_only' ? styles.optionTextSelected : styles.optionText}>Male Only</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.optionBtn, genderPreference === 'female_only' && styles.optionBtnSelected]} onPress={() => setGenderPreference('female_only')}>
          <Text style={genderPreference === 'female_only' ? styles.optionTextSelected : styles.optionText}>Female Only</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Publish Activity" onPress={handleCreate} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  label: { fontSize: 16, fontWeight: '600', marginTop: 12, marginBottom: 8, color: '#555' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#fafafa' },
  optionsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  optionBtn: { paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 20, backgroundColor: '#fff' },
  optionBtnSelected: { backgroundColor: '#0066cc', borderColor: '#0066cc' },
  optionText: { color: '#333' },
  optionTextSelected: { color: '#fff', fontWeight: 'bold' },
  buttonContainer: { marginTop: 20, marginBottom: 40 }
});