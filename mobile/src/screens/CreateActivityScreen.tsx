import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import api, { getApiErrorMessage } from '../services/api';

type ParticipationMode = 'open' | 'approval_based';
type GenderPreference = 'all' | 'male_only' | 'female_only';

interface StructuredOptionChoice {
  id: string;
  name: string;
}

// Demo-seed fallback only. Replace with dynamic campus structured-option loading.
const FALLBACK_CATEGORIES: StructuredOptionChoice[] = [
  { id: '87fe4ec4-0d68-45c1-b7c2-0abef2e3ef70', name: 'Lunch' },
  { id: 'd5f86aa2-7d8a-4c83-8426-d6f6b7b0ad7a', name: 'Study' },
];

const FALLBACK_LOCATIONS: StructuredOptionChoice[] = [
  { id: 'f2af15aa-d347-4037-8f1e-f6b4e8616d06', name: 'Jiading Library' },
];

export const CreateActivityScreen = ({ navigation }: any) => {
  const categories = FALLBACK_CATEGORIES;
  const locations = FALLBACK_LOCATIONS;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const [meetingPointId, setMeetingPointId] = useState(locations[0]?.id ?? '');
  const [scheduledDateTime, setScheduledDateTime] = useState(defaultScheduledDateTime());
  const [maxParticipants, setMaxParticipants] = useState('5');
  const [participationMode, setParticipationMode] = useState<ParticipationMode>('open');
  const [maxRequests, setMaxRequests] = useState('');
  const [genderPreference, setGenderPreference] = useState<GenderPreference>('all');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    const validationMessage = validateForm({
      title,
      categoryId,
      meetingPointId,
      scheduledDateTime,
      maxParticipants,
      participationMode,
      maxRequests,
    });

    if (validationMessage) {
      Alert.alert('Check activity details', validationMessage);
      return;
    }

    const parsedMaxParticipants = Number.parseInt(maxParticipants.trim(), 10);
    const parsedMaxRequests = maxRequests.trim()
      ? Number.parseInt(maxRequests.trim(), 10)
      : undefined;

    setCreating(true);
    try {
      const createdActivity = await api.post<{ activityId?: string }>('/activities', {
        title: title.trim(),
        description: description.trim() || undefined,
        categoryId,
        meetingPointId,
        maxParticipants: parsedMaxParticipants,
        participationMode,
        maxRequests: participationMode === 'approval_based' ? parsedMaxRequests : undefined,
        genderPreference,
        scheduledDateTime: new Date(scheduledDateTime.trim()).toISOString(),
      });

      Alert.alert('Success', 'Activity published successfully.');
      navigation.navigate('ActivityFeed', {
        refreshAfterCreate: Date.now(),
        createdActivityId: createdActivity.data?.activityId,
      });
    } catch (error) {
      Alert.alert('Error', getApiErrorMessage(error) ?? 'Failed to create activity.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Create New Activity</Text>
      <Text style={styles.helperText}>
        Demo options come from the seeded campus configuration until a student-facing structured
        options endpoint is exposed.
      </Text>

      <Text style={styles.label}>Title *</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="e.g. Coffee at the library"
        editable={!creating}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.multilineInput]}
        value={description}
        onChangeText={setDescription}
        placeholder="Activity details..."
        multiline
        editable={!creating}
      />

      <Text style={styles.label}>Start Date and Time *</Text>
      <TextInput
        style={styles.input}
        value={scheduledDateTime}
        onChangeText={setScheduledDateTime}
        placeholder="2026-06-01T10:00:00.000Z"
        autoCapitalize="none"
        editable={!creating}
      />

      <Text style={styles.label}>Category</Text>
      <View style={styles.optionsContainer}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[styles.optionBtn, categoryId === category.id && styles.optionBtnSelected]}
            onPress={() => setCategoryId(category.id)}
            disabled={creating}
          >
            <Text style={categoryId === category.id ? styles.optionTextSelected : styles.optionText}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Meeting Point</Text>
      <View style={styles.optionsContainer}>
        {locations.map((location) => (
          <TouchableOpacity
            key={location.id}
            style={[styles.optionBtn, meetingPointId === location.id && styles.optionBtnSelected]}
            onPress={() => setMeetingPointId(location.id)}
            disabled={creating}
          >
            <Text style={meetingPointId === location.id ? styles.optionTextSelected : styles.optionText}>
              {location.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Maximum Participants</Text>
      <TextInput
        style={styles.input}
        value={maxParticipants}
        onChangeText={setMaxParticipants}
        keyboardType="numeric"
        editable={!creating}
      />

      {participationMode === 'approval_based' && (
        <>
          <Text style={styles.label}>Max Pending Requests (Optional)</Text>
          <TextInput
            style={styles.input}
            value={maxRequests}
            onChangeText={setMaxRequests}
            keyboardType="numeric"
            placeholder="e.g. 10"
            editable={!creating}
          />
        </>
      )}

      <Text style={styles.label}>Participation Mode</Text>
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[styles.optionBtn, participationMode === 'open' && styles.optionBtnSelected]}
          onPress={() => setParticipationMode('open')}
          disabled={creating}
        >
          <Text style={participationMode === 'open' ? styles.optionTextSelected : styles.optionText}>
            Open Access
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.optionBtn, participationMode === 'approval_based' && styles.optionBtnSelected]}
          onPress={() => setParticipationMode('approval_based')}
          disabled={creating}
        >
          <Text style={participationMode === 'approval_based' ? styles.optionTextSelected : styles.optionText}>
            Requires Approval
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Gender Preference</Text>
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[styles.optionBtn, genderPreference === 'all' && styles.optionBtnSelected]}
          onPress={() => setGenderPreference('all')}
          disabled={creating}
        >
          <Text style={genderPreference === 'all' ? styles.optionTextSelected : styles.optionText}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.optionBtn, genderPreference === 'male_only' && styles.optionBtnSelected]}
          onPress={() => setGenderPreference('male_only')}
          disabled={creating}
        >
          <Text style={genderPreference === 'male_only' ? styles.optionTextSelected : styles.optionText}>
            Male Only
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.optionBtn, genderPreference === 'female_only' && styles.optionBtnSelected]}
          onPress={() => setGenderPreference('female_only')}
          disabled={creating}
        >
          <Text style={genderPreference === 'female_only' ? styles.optionTextSelected : styles.optionText}>
            Female Only
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        {creating ? (
          <ActivityIndicator />
        ) : (
          <Button title="Publish Activity" onPress={handleCreate} />
        )}
      </View>
    </ScrollView>
  );
};

function validateForm(args: {
  title: string;
  categoryId: string;
  meetingPointId: string;
  scheduledDateTime: string;
  maxParticipants: string;
  participationMode: ParticipationMode;
  maxRequests: string;
}): string | null {
  if (!args.title.trim()) {
    return 'Title is required.';
  }

  if (!args.categoryId || !args.meetingPointId) {
    return 'Choose a category and meeting point.';
  }

  const scheduledDate = new Date(args.scheduledDateTime.trim());
  if (Number.isNaN(scheduledDate.getTime())) {
    return 'Enter the start time as a valid ISO date.';
  }

  if (scheduledDate.getTime() <= Date.now()) {
    return 'Start time must be in the future.';
  }

  if (!isPositiveIntegerString(args.maxParticipants)) {
    return 'Maximum participants must be a positive whole number.';
  }

  if (
    args.participationMode === 'approval_based' &&
    args.maxRequests.trim() &&
    !isPositiveIntegerString(args.maxRequests)
  ) {
    return 'Max pending requests must be a positive whole number.';
  }

  return null;
}

function isPositiveIntegerString(value: string): boolean {
  if (!/^[0-9]+$/.test(value.trim())) {
    return false;
  }

  return Number.parseInt(value.trim(), 10) > 0;
}

function defaultScheduledDateTime(): string {
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, color: '#333' },
  helperText: { fontSize: 13, lineHeight: 18, color: '#666', marginBottom: 12 },
  label: { fontSize: 16, fontWeight: '600', marginTop: 12, marginBottom: 8, color: '#555' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#fafafa' },
  multilineInput: { minHeight: 88, textAlignVertical: 'top' },
  optionsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  optionBtn: { paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 20, backgroundColor: '#fff' },
  optionBtnSelected: { backgroundColor: '#0066cc', borderColor: '#0066cc' },
  optionText: { color: '#333' },
  optionTextSelected: { color: '#fff', fontWeight: 'bold' },
  buttonContainer: { marginTop: 20, marginBottom: 40 },
});
