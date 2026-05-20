import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useLayoutEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getApiErrorMessage } from '../services/api';
import { buildSubmitReportPayload, submitReport } from '../services/studentApi';
import {
  BottomActionBar,
  CategoryPill,
  EmptyState,
  FieldError,
  InlineBanner,
  PrimaryButton,
  ScreenShell,
  SectionCard,
  TextField,
  TopBar,
  colors,
} from '../components/InCampusUI';

type ReportTargetType = 'student' | 'activity';

const REASON_OPTIONS = [
  { code: 'unsafe_behavior', label: 'Unsafe behavior', description: 'Threatening, dangerous, or harmful behavior' },
  { code: 'harassment', label: 'Harassment', description: 'Bullying, unwanted contact, or hostile behavior' },
  { code: 'misleading_activity', label: 'Misleading activity', description: 'False or misleading activity details' },
  { code: 'other', label: 'Other', description: 'Something else not listed' },
];

export default function ReportSubmissionScreen({ navigation, route }: { navigation: any; route: any }) {
  const targetType = getValidReportTargetType(route?.params?.targetType) ?? 'activity';
  const targetActivityId = getStringParam(route?.params?.targetActivityId);
  const targetAccountId = getStringParam(route?.params?.targetAccountId);
  const activityTitle = getStringParam(route?.params?.activityTitle) || 'Selected activity';
  const categoryLabel = getStringParam(route?.params?.categoryLabel);
  const [reasonCode, setReasonCode] = useState<string>('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const missingTarget = targetType === 'activity' ? !targetActivityId : !targetAccountId;

  async function handleSubmit() {
    setValidationError(null);
    setErrorMessage(null);
    if (!reasonCode) {
      setValidationError('Please choose a reason for your report');
      return;
    }
    if (missingTarget) {
      setErrorMessage('Nothing to report yet. Open Report from an activity or student.');
      return;
    }

    setSubmitting(true);
    try {
      const campusId = await AsyncStorage.getItem('selectedCampusId');
      if (!campusId) {
        setErrorMessage('Select a campus before submitting a report.');
        return;
      }
      await submitReport(buildSubmitReportPayload({
        campusId,
        targetType,
        targetActivityId,
        targetAccountId,
        reasonCode,
        description,
      }));
      setSuccessMessage('Report submitted. Campus staff will review it.');
      setTimeout(() => navigation.goBack(), 800);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error) ?? "Couldn't submit report. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScreenShell padded={false} style={styles.screen}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TopBar title="Report" onBack={() => navigation.goBack()} rightLabel="Cancel" onRight={() => navigation.goBack()} />
        {successMessage ? <View style={styles.toastWrap}><InlineBanner tone="success" text={successMessage} /></View> : null}
        {missingTarget ? (
          <View style={styles.missingWrap}>
            <EmptyState title="Debug target missing" text="Normal demo reporting opens from an activity or student profile, with a target already attached." primaryLabel="Back" onPrimary={() => navigation.goBack()} />
          </View>
        ) : (
          <>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
              <Text style={styles.sectionLabel}>Reporting</Text>
              <TargetSummary targetType={targetType} activityTitle={activityTitle} categoryLabel={categoryLabel} />
              <Text style={styles.sectionLabel}>What's the issue?</Text>
              <View style={styles.reasonList}>
                {REASON_OPTIONS.map((option) => (
                  <Pressable
                    key={option.code}
                    style={[styles.reasonCard, reasonCode === option.code && styles.reasonCardSelected]}
                    onPress={() => setReasonCode(option.code)}
                    disabled={submitting}
                  >
                    <View style={[styles.reasonRadio, reasonCode === option.code && styles.reasonRadioSelected]} />
                    <View style={styles.reasonTextCol}>
                      <Text style={[styles.reasonTitle, reasonCode === option.code && styles.reasonTitleSelected]}>{option.label}</Text>
                      <Text style={styles.reasonDescription}>{option.description}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
              {validationError ? <FieldError message={validationError} /> : null}
              <TextField
                label="Add details"
                placeholder="Anything else you'd like campus staff to know"
                value={description}
                onChangeText={setDescription}
                multiline
                maxLength={300}
                editable={!submitting}
                inputStyle={styles.detailsInput}
                helper={`${description.length}/300`}
              />
              <SectionCard style={styles.reassuranceCard}>
                <Text style={styles.reassuranceTitle}>Reports are private. Campus staff will review this.</Text>
                <Text style={styles.reassuranceBody}>The other student will not be notified.</Text>
                <Pressable onPress={() => navigation.navigate('CommunityRules')}>
                  <Text style={styles.guidelinesLink}>Read community guidelines</Text>
                </Pressable>
              </SectionCard>
            </ScrollView>
            <BottomActionBar>
              {errorMessage ? <InlineBanner tone="error" text={errorMessage} actionLabel="Retry" onAction={handleSubmit} /> : null}
              <PrimaryButton label="Submit report" loading={submitting} disabled={!reasonCode} onPress={handleSubmit} />
              <Pressable style={styles.cancelLink} onPress={() => navigation.goBack()} disabled={submitting}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            </BottomActionBar>
          </>
        )}
      </KeyboardAvoidingView>
    </ScreenShell>
  );
}

function TargetSummary({ targetType, activityTitle, categoryLabel }: { targetType: ReportTargetType; activityTitle: string; categoryLabel: string }) {
  if (targetType === 'activity') {
    return (
      <SectionCard style={styles.targetCard}>
        <View style={styles.targetIcon}><Text style={styles.targetIconText}>A</Text></View>
        <View style={styles.targetTextCol}>
          <Text style={styles.targetKicker}>Reporting activity</Text>
          <Text style={styles.targetTitle} numberOfLines={1}>{activityTitle}</Text>
          {categoryLabel ? <CategoryPill label={categoryLabel} compact /> : null}
        </View>
      </SectionCard>
    );
  }
  return (
    <SectionCard style={styles.targetCard}>
      <View style={styles.targetIconMuted}><Text style={styles.targetIconMutedText}>S</Text></View>
      <View style={styles.targetTextCol}>
        <Text style={styles.targetKicker}>Reporting a student</Text>
        <Text style={styles.targetTitle}>A verified student</Text>
        <Text style={styles.targetHelper}>Only campus staff will see your report.</Text>
      </View>
    </SectionCard>
  );
}

function getValidReportTargetType(value: unknown): ReportTargetType | undefined {
  return value === 'activity' || value === 'student' ? value : undefined;
}

function getStringParam(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg, paddingTop: 54 },
  flex: { flex: 1 },
  toastWrap: { paddingHorizontal: 16, paddingTop: 8 },
  missingWrap: { flex: 1, padding: 24, justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 132 },
  sectionLabel: { color: colors.text, fontSize: 14, fontWeight: '900', marginTop: 18, marginBottom: 10 },
  targetCard: { padding: 14, flexDirection: 'row', gap: 12, alignItems: 'center' },
  targetIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.skySoft, alignItems: 'center', justifyContent: 'center' },
  targetIconText: { color: colors.sky, fontSize: 16, fontWeight: '900' },
  targetIconMuted: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.borderSoft, alignItems: 'center', justifyContent: 'center' },
  targetIconMutedText: { color: colors.text3, fontSize: 16, fontWeight: '900' },
  targetTextCol: { flex: 1, gap: 4 },
  targetKicker: { color: colors.text2, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  targetTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  targetHelper: { color: colors.text2, fontSize: 12, fontWeight: '600' },
  reasonList: { gap: 8 },
  reasonCard: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card },
  reasonCardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryGhost },
  reasonRadio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: colors.border },
  reasonRadioSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  reasonTextCol: { flex: 1 },
  reasonTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  reasonTitleSelected: { color: colors.primary },
  reasonDescription: { color: colors.text2, fontSize: 12, fontWeight: '600', lineHeight: 17, marginTop: 2 },
  detailsInput: { minHeight: 88, textAlignVertical: 'top' },
  reassuranceCard: { padding: 14, backgroundColor: '#F4F8F6' },
  reassuranceTitle: { color: colors.text, fontSize: 13, fontWeight: '800', lineHeight: 19 },
  reassuranceBody: { color: colors.text2, fontSize: 12, fontWeight: '600', marginTop: 4 },
  guidelinesLink: { color: colors.primary, fontSize: 13, fontWeight: '900', marginTop: 10 },
  cancelLink: { alignItems: 'center', paddingVertical: 10 },
  cancelText: { color: colors.text2, fontSize: 14, fontWeight: '900' },
});
