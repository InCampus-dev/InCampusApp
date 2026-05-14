// Task: M03 | Path: mobile/src/screens/ConsentSettingsScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import api, { getApiErrorCode } from '../services/api';

export default function ConsentSettingsScreen({ navigation }: { navigation: any }) {
  // Default consent is false (Entities & Attributes v1.2: StudentAccount.CampusInsightSharingConsent default=false)
  const [consentEnabled, setConsentEnabled] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleContinue() {
    setSubmitting(true);
    try {
      // DUC-AP-07: PATCH /accounts/me/consent
      await api.patch('/accounts/me/consent', {
        campusInsightSharingConsent: consentEnabled,
      });
      // Navigate to main app — onboarding complete
      navigation.reset({
        index: 0,
        routes: [{ name: 'ActivityFeed' }],
      });
    } catch (error: any) {
      const code = getApiErrorCode(error);
      if (code === 'NOT_FOUND' || code === 'AccountNotFound') {
        Alert.alert('Error', 'Account not found. Please sign in again.');
      } else {
        Alert.alert('Error', 'Could not save consent preference. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleSkip() {
    // FR-2901: refusing consent does not block normal app use
    // Save as false (default) and proceed
    handleContinue();
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Campus Insights</Text>
        <Text style={styles.description}>
          You can choose to share your profile interests and activity participation data with
          authorized campus staff. This helps your university understand student interests
          and improve campus life.
        </Text>
        <Text style={styles.note}>
          You can change this setting at any time. Refusing does not affect your use of the app.
        </Text>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Share my data with campus staff</Text>
          <Switch
            value={consentEnabled}
            onValueChange={setConsentEnabled}
            trackColor={{ false: '#ddd', true: '#4A90D9' }}
            thumbColor={consentEnabled ? '#fff' : '#f4f4f4'}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueButton, submitting && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.continueButtonText}>Continue</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipButton} onPress={handleSkip} disabled={submitting}>
          <Text style={styles.skipButtonText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'space-between' },
  content: { padding: 20, paddingTop: 40 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
  description: { fontSize: 15, color: '#444', lineHeight: 22, marginBottom: 12 },
  note: { fontSize: 13, color: '#888', fontStyle: 'italic', marginBottom: 28 },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  toggleLabel: { fontSize: 16, color: '#333', flex: 1, marginRight: 12 },
  footer: { padding: 20, paddingBottom: 36 },
  continueButton: {
    backgroundColor: '#4A90D9',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: { backgroundColor: '#B0C4DE' },
  continueButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  skipButton: { alignItems: 'center', paddingVertical: 10 },
  skipButtonText: { color: '#888', fontSize: 14 },
});
