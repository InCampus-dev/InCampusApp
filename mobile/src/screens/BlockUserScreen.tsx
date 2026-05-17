import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import api, { getApiErrorMessage } from '../services/api';

export default function BlockUserScreen({ navigation, route }: { navigation: any; route: any }) {
  const [targetAccountId, setTargetAccountId] = useState(getStringParam(route?.params?.targetAccountId));
  const [submitting, setSubmitting] = useState(false);

  async function handleBlock() {
    if (!targetAccountId.trim()) {
      Alert.alert('Student required', 'Enter a student account ID to block.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/blocks', { targetAccountId: targetAccountId.trim() });
      Alert.alert('Student blocked', 'Future visibility and interaction are limited by block rules.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', getApiErrorMessage(error) ?? 'Could not block this student.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Block Student</Text>
      <Text style={styles.subtitle}>
        Blocks are stored as directed relationships but enforced reciprocally across visibility,
        interaction, and notifications where supported.
      </Text>

      <Text style={styles.label}>Student Account ID *</Text>
      <TextInput
        style={styles.input}
        value={targetAccountId}
        onChangeText={setTargetAccountId}
        placeholder="Student account ID"
        autoCapitalize="none"
        editable={!submitting}
      />

      <TouchableOpacity
        style={[styles.primaryButton, submitting && styles.primaryButtonDisabled]}
        onPress={handleBlock}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryButtonText}>Block Student</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.placeholderNote}>
        If this screen is opened without a profile context, enter the target ID manually. A full
        StudentProfileScreen launch context is not part of this mobile slice yet.
      </Text>
    </View>
  );
}

function getStringParam(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#222', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 22 },
  label: { fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#d7dce2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#fafafa',
  },
  primaryButton: {
    marginTop: 22,
    backgroundColor: '#1976d2',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonDisabled: { opacity: 0.65 },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  placeholderNote: {
    marginTop: 20,
    fontSize: 13,
    color: '#777',
    lineHeight: 19,
  },
});
