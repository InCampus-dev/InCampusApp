// Task: M03 | Path: mobile/src/screens/ProfileSetupScreen.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { getApiErrorCode, getApiErrorDetails } from '../services/api';

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
] as const;

export default function ProfileSetupScreen({ navigation }: { navigation: any }) {
  // Required fields
  const [displayName, setDisplayName] = useState('');
  const [major, setMajor] = useState('');

  // Optional fields (Entities & Attributes v1.2)
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<string | null>(null);
  const [interests, setInterests] = useState('');
  const [languages, setLanguages] = useState('');
  const [shortBio, setShortBio] = useState('');

  const [submitting, setSubmitting] = useState(false);

  // B.4 fix (permission): in-screen auth token check
  useEffect(() => {
    AsyncStorage.getItem('authToken').then((token) => {
      if (!token) {
        navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] });
      }
    });
  }, [navigation]);

  function parseTagList(raw: string): string[] {
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  async function handleSubmit() {
    // Client-side mandatory field check (FR-1401, NFR-27)
    if (!displayName.trim()) {
      Alert.alert('Required Field', 'Please enter a display name.');
      return;
    }
    if (!major.trim()) {
      Alert.alert('Required Field', 'Please enter your major.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        displayName: displayName.trim(),
        major: major.trim(),
      };
      if (dateOfBirth.trim()) payload.dateOfBirth = dateOfBirth.trim();
      if (gender) payload.gender = gender;
      if (interests.trim()) payload.interests = parseTagList(interests);
      if (languages.trim()) payload.languages = parseTagList(languages);
      if (shortBio.trim()) payload.shortBio = shortBio.trim();

      await api.post('/profiles', payload);

      // B.5 fix: success confirmation before navigation
      Alert.alert('Profile Created', 'Your profile has been set up successfully.', [
        { text: 'Continue', onPress: () => navigation.navigate('ConsentSettings') },
      ]);
    } catch (error: any) {
      const code = getApiErrorCode(error);
      const details = getApiErrorDetails(error);
      if (
        (code === 'CONFLICT' && details?.conflictResource === 'StudentProfile') ||
        code === 'ProfileAlreadyExists'
      ) {
        // B.4 fix: user already has a profile — navigate to main app, not ConsentSettings
        Alert.alert('Profile Exists', 'A profile already exists for your account.');
        navigation.reset({ index: 0, routes: [{ name: 'ActivityFeed' }] });
      } else if (code === 'MissingMandatoryFields') {
        Alert.alert('Missing Fields', 'Please fill in all required fields.');
      } else if (code === 'VALIDATION_ERROR' || code === 'InvalidFieldValues') {
        Alert.alert('Invalid Input', 'Some field values are not valid. Please check and try again.');
      } else {
        Alert.alert('Error', 'Could not create profile. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Set Up Your Profile</Text>
      <Text style={styles.subtitle}>
        Create a minimal profile so other students can recognize you in activities.
      </Text>

      {/* Required fields */}
      <Text style={styles.label}>Display Name *</Text>
      <TextInput
        style={styles.input}
        value={displayName}
        onChangeText={setDisplayName}
        placeholder="How other students will see you"
        maxLength={50}
      />

      <Text style={styles.label}>Major *</Text>
      <TextInput
        style={styles.input}
        value={major}
        onChangeText={setMajor}
        placeholder="Your field of study"
        maxLength={100}
      />

      {/* Optional fields */}
      <Text style={styles.label}>Date of Birth</Text>
      <TextInput
        style={styles.input}
        value={dateOfBirth}
        onChangeText={setDateOfBirth}
        placeholder="YYYY-MM-DD"
        maxLength={10}
      />

      <Text style={styles.label}>Gender</Text>
      <View style={styles.genderRow}>
        {GENDER_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.genderOption,
              gender === opt.value && styles.genderOptionSelected,
            ]}
            onPress={() => setGender(gender === opt.value ? null : opt.value)}
          >
            <Text
              style={[
                styles.genderText,
                gender === opt.value && styles.genderTextSelected,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Interests</Text>
      <TextInput
        style={styles.input}
        value={interests}
        onChangeText={setInterests}
        placeholder="e.g. sports, coffee, study, games"
        maxLength={200}
      />
      <Text style={styles.hint}>Separate with commas</Text>

      <Text style={styles.label}>Languages</Text>
      <TextInput
        style={styles.input}
        value={languages}
        onChangeText={setLanguages}
        placeholder="e.g. English, Mandarin, Italian"
        maxLength={200}
      />
      <Text style={styles.hint}>Separate with commas</Text>

      <Text style={styles.label}>Short Bio</Text>
      <TextInput
        style={[styles.input, styles.bioInput]}
        value={shortBio}
        onChangeText={setShortBio}
        placeholder="A short intro about yourself"
        multiline
        maxLength={300}
      />

      <TouchableOpacity
        style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Create Profile</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginTop: 16, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
  },
  bioInput: { height: 80, textAlignVertical: 'top' },
  hint: { fontSize: 12, color: '#999', marginTop: 4 },
  genderRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  genderOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
  },
  genderOptionSelected: { borderColor: '#4A90D9', backgroundColor: '#EBF4FF' },
  genderText: { fontSize: 14, color: '#666' },
  genderTextSelected: { color: '#4A90D9', fontWeight: '600' },
  submitButton: {
    backgroundColor: '#4A90D9',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 28,
  },
  submitButtonDisabled: { backgroundColor: '#B0C4DE' },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
