import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { getApiErrorMessage } from '../services/api';

type ReportTargetType = 'student' | 'activity';

const REASON_OPTIONS = [
  { code: 'unsafe_behavior', label: 'Unsafe behavior' },
  { code: 'harassment', label: 'Harassment or discrimination' },
  { code: 'misleading_activity', label: 'Misleading activity' },
  { code: 'other', label: 'Other' },
];

export default function ReportSubmissionScreen({ navigation, route }: { navigation: any; route: any }) {
  const initialTargetType = getValidReportTargetType(route?.params?.targetType);
  const [targetType, setTargetType] = useState<ReportTargetType>(initialTargetType ?? 'activity');
  const [targetActivityId, setTargetActivityId] = useState(getStringParam(route?.params?.targetActivityId));
  const [targetAccountId, setTargetAccountId] = useState(getStringParam(route?.params?.targetAccountId));
  const [reasonCode, setReasonCode] = useState(REASON_OPTIONS[0].code);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const validationMessage = validateReport({
      targetType,
      targetActivityId,
      targetAccountId,
      reasonCode,
    });

    if (validationMessage) {
      Alert.alert('Check report details', validationMessage);
      return;
    }

    setSubmitting(true);
    try {
      const campusId = await AsyncStorage.getItem('selectedCampusId');
      if (!campusId) {
        Alert.alert('Campus required', 'Select a campus before submitting a report.');
        return;
      }

      await api.post('/reports', {
        campusId,
        targetType,
        targetActivityId: targetType === 'activity' ? targetActivityId.trim() : undefined,
        targetAccountId: targetType === 'student' ? targetAccountId.trim() : undefined,
        reasonCode,
        description: description.trim() || undefined,
      });

      Alert.alert('Report submitted', 'Campus staff can review this report.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', getApiErrorMessage(error) ?? 'Could not submit report.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Report</Text>
      <Text style={styles.subtitle}>
        Reports are campus-scoped and create Safety & Moderation records only. They do not notify
        other students.
      </Text>

      <Text style={styles.label}>Target Type</Text>
      <View style={styles.segmentedRow}>
        <TouchableOpacity
          style={[styles.segment, targetType === 'activity' && styles.segmentSelected]}
          onPress={() => setTargetType('activity')}
          disabled={submitting}
        >
          <Text style={targetType === 'activity' ? styles.segmentTextSelected : styles.segmentText}>
            Activity
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segment, targetType === 'student' && styles.segmentSelected]}
          onPress={() => setTargetType('student')}
          disabled={submitting}
        >
          <Text style={targetType === 'student' ? styles.segmentTextSelected : styles.segmentText}>
            Student
          </Text>
        </TouchableOpacity>
      </View>

      {targetType === 'activity' ? (
        <>
          <Text style={styles.label}>Activity ID *</Text>
          <TextInput
            style={styles.input}
            value={targetActivityId}
            onChangeText={setTargetActivityId}
            placeholder="Activity ID"
            autoCapitalize="none"
            editable={!submitting}
          />
        </>
      ) : (
        <>
          <Text style={styles.label}>Student Account ID *</Text>
          <TextInput
            style={styles.input}
            value={targetAccountId}
            onChangeText={setTargetAccountId}
            placeholder="Student account ID"
            autoCapitalize="none"
            editable={!submitting}
          />
        </>
      )}

      <Text style={styles.label}>Reason</Text>
      <View style={styles.optionsContainer}>
        {REASON_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.code}
            style={[styles.optionBtn, reasonCode === option.code && styles.optionBtnSelected]}
            onPress={() => setReasonCode(option.code)}
            disabled={submitting}
          >
            <Text style={reasonCode === option.code ? styles.optionTextSelected : styles.optionText}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Details</Text>
      <TextInput
        style={[styles.input, styles.multilineInput]}
        value={description}
        onChangeText={setDescription}
        placeholder="Optional details for campus staff"
        multiline
        editable={!submitting}
      />

      <TouchableOpacity
        style={[styles.primaryButton, submitting && styles.primaryButtonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryButtonText}>Submit Report</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

function validateReport(args: {
  targetType: ReportTargetType;
  targetActivityId: string;
  targetAccountId: string;
  reasonCode: string;
}): string | null {
  if (!args.reasonCode) {
    return 'Choose a report reason.';
  }

  if (args.targetType === 'activity' && !args.targetActivityId.trim()) {
    return 'Activity reports need an activity ID.';
  }

  if (args.targetType === 'student' && !args.targetAccountId.trim()) {
    return 'Student reports need a student account ID.';
  }

  return null;
}

function getValidReportTargetType(value: unknown): ReportTargetType | undefined {
  return value === 'activity' || value === 'student' ? value : undefined;
}

function getStringParam(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '700', color: '#222', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 18 },
  label: { fontSize: 15, fontWeight: '700', color: '#333', marginTop: 16, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#d7dce2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#fafafa',
  },
  multilineInput: { minHeight: 100, textAlignVertical: 'top' },
  segmentedRow: { flexDirection: 'row', gap: 8 },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#d7dce2',
    borderRadius: 8,
    alignItems: 'center',
  },
  segmentSelected: { backgroundColor: '#1976d2', borderColor: '#1976d2' },
  segmentText: { color: '#333', fontWeight: '600' },
  segmentTextSelected: { color: '#fff', fontWeight: '700' },
  optionsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#d7dce2',
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  optionBtnSelected: { backgroundColor: '#1976d2', borderColor: '#1976d2' },
  optionText: { color: '#333' },
  optionTextSelected: { color: '#fff', fontWeight: '700' },
  primaryButton: {
    marginTop: 28,
    backgroundColor: '#1976d2',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonDisabled: { opacity: 0.65 },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
