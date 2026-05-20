import React, { useLayoutEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getApiErrorMessage } from '../services/api';
import { blockStudent } from '../services/studentApi';
import {
  BottomActionBar,
  EmptyState,
  InlineBanner,
  PrimaryButton,
  ScreenShell,
  SectionCard,
  TopBar,
  colors,
} from '../components/InCampusUI';

const BLOCK_EFFECTS = [
  "You won't see each other's activities in the feed",
  "You won't be able to open each other's activity details",
  "You won't be able to join each other's activities",
  "Notifications involving each other will be stopped",
];

export default function BlockUserScreen({ navigation, route }: { navigation: any; route: any }) {
  const targetAccountId = getStringParam(route?.params?.targetAccountId);
  const returnToActivityId = getStringParam(route?.params?.returnToActivityId);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  async function handleBlock() {
    if (!targetAccountId) {
      setErrorMessage('Student not found');
      return;
    }
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await blockStudent(targetAccountId);
      setSuccessMessage('Student blocked.');
      setTimeout(() => {
        if (returnToActivityId) {
          navigation.navigate('ActivityFeed', { refreshAfterJoin: Date.now() });
          return;
        }
        navigation.goBack();
      }, 750);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error) ?? "Couldn't block this student. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!targetAccountId) {
    return (
      <ScreenShell padded={false} style={styles.screen}>
        <TopBar title="Block Student" onBack={() => navigation.goBack()} />
        <View style={styles.missingWrap}>
          <EmptyState title="Student not found" text="Open Block from a student or activity you'd like to block." primaryLabel="Back" onPrimary={() => navigation.goBack()} />
        </View>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell padded={false} style={styles.screen}>
      <TopBar title="Block Student" onBack={() => navigation.goBack()} rightLabel="Cancel" onRight={() => navigation.goBack()} />
      {successMessage ? <View style={styles.toastWrap}><InlineBanner tone="success" text={successMessage} /></View> : null}
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Block this student?</Text>
        <Text style={styles.subheading}>You're in control. Here's what changes.</Text>
        <SectionCard style={styles.targetCard}>
          <View style={styles.targetAvatar}><Text style={styles.targetAvatarText}>S</Text></View>
          <View style={styles.targetTextCol}>
            <Text style={styles.targetKicker}>Blocking</Text>
            <Text style={styles.targetTitle}>This student</Text>
            <Text style={styles.targetHelper}>From the activity you were viewing.</Text>
          </View>
        </SectionCard>
        <SectionCard style={styles.effectsCard}>
          <Text style={styles.effectsTitle}>What happens when you block</Text>
          {BLOCK_EFFECTS.map((effect) => (
            <View key={effect} style={styles.effectRow}>
              <View style={styles.effectDot}><Text style={styles.effectDotText}>OK</Text></View>
              <Text style={styles.effectText}>{effect}</Text>
            </View>
          ))}
        </SectionCard>
        <View style={styles.notes}>
          <Text style={styles.note}>The other student will not be notified that you blocked them.</Text>
          <Text style={styles.note}>Activities you're already sharing are not affected.</Text>
        </View>
      </ScrollView>
      <BottomActionBar>
        {errorMessage ? <InlineBanner tone="error" text={errorMessage} actionLabel="Retry" onAction={handleBlock} /> : null}
        <PrimaryButton label={errorMessage ? 'Try again' : 'Block'} tone="danger" loading={submitting} onPress={handleBlock} />
        <Pressable style={styles.reportButton} onPress={() => navigation.navigate('ReportSubmission', { targetType: 'student', targetAccountId })} disabled={submitting}>
          <Text style={styles.reportText}>Report this student too</Text>
        </Pressable>
        <Pressable style={styles.cancelButton} onPress={() => navigation.goBack()} disabled={submitting}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </BottomActionBar>
    </ScreenShell>
  );
}

function getStringParam(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg, paddingTop: 54 },
  toastWrap: { paddingHorizontal: 16, paddingTop: 8 },
  missingWrap: { flex: 1, padding: 24, justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 160 },
  heading: { color: colors.text, fontSize: 23, fontWeight: '900', letterSpacing: -0.4 },
  subheading: { color: colors.text2, fontSize: 14, fontWeight: '700', marginTop: 5, marginBottom: 14 },
  targetCard: { padding: 14, flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 14 },
  targetAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.borderSoft, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  targetAvatarText: { color: colors.text3, fontSize: 17, fontWeight: '900' },
  targetTextCol: { flex: 1 },
  targetKicker: { color: colors.text2, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  targetTitle: { color: colors.text, fontSize: 17, fontWeight: '900', marginTop: 2 },
  targetHelper: { color: colors.text2, fontSize: 12, fontWeight: '600', marginTop: 3 },
  effectsCard: { padding: 16, gap: 10 },
  effectsTitle: { color: colors.text, fontSize: 16, fontWeight: '900', marginBottom: 2 },
  effectRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  effectDot: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  effectDotText: { color: colors.primary, fontSize: 7, fontWeight: '900' },
  effectText: { flex: 1, color: colors.text, fontSize: 13, fontWeight: '700', lineHeight: 19 },
  notes: { gap: 7, marginTop: 14, paddingHorizontal: 4 },
  note: { color: colors.text2, fontSize: 12, fontWeight: '700', lineHeight: 18 },
  reportButton: { minHeight: 46, borderRadius: 16, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  reportText: { color: colors.text, fontSize: 14, fontWeight: '900' },
  cancelButton: { alignItems: 'center', paddingVertical: 10 },
  cancelText: { color: colors.text2, fontSize: 14, fontWeight: '900' },
});
