import React, { useLayoutEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import api, { getApiErrorCode } from '../services/api';
import {
  BottomActionBar,
  InlineBanner,
  PrimaryButton,
  ScreenShell,
  TitleBlock,
  colors,
} from '../components/InCampusUI';

export default function ConsentSettingsScreen({ navigation }: { navigation: any }) {
  const [consentEnabled, setConsentEnabled] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  async function saveConsent(value: boolean) {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await api.patch('/accounts/me/consent', { campusInsightSharingConsent: value });
      navigation.reset({ index: 0, routes: [{ name: 'ActivityFeed' }] });
    } catch (error) {
      const code = getApiErrorCode(error);
      setErrorMessage(code === 'NOT_FOUND' || code === 'AccountNotFound' ? 'Account not found. Please sign in again.' : 'Could not save your choice. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScreenShell style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.motif}><View style={styles.motifInner} /></View>
        <TitleBlock title="Help improve campus life" subtitle="Campus staff can view anonymised activity trends to improve campus services. This does not affect your access to InCampus." />
        {errorMessage ? <InlineBanner tone="error" text={errorMessage} actionLabel="Retry" onAction={() => saveConsent(consentEnabled)} /> : null}
        <View style={[styles.toggleCard, consentEnabled && styles.toggleCardActive]}>
          <View style={styles.toggleTop}>
            <View style={styles.toggleTextCol}>
              <Text style={styles.toggleTitle}>Share activity insights with campus staff</Text>
              <Text style={styles.toggleHelper}>Only authorised campus staff can see this data.</Text>
            </View>
            <Switch
              value={consentEnabled}
              onValueChange={setConsentEnabled}
              disabled={submitting}
              trackColor={{ false: '#D0D5DD', true: colors.primary }}
              thumbColor={colors.card}
            />
          </View>
          <View style={styles.detailBox}>
            <Text style={styles.detailLine}><Text style={styles.detailKey}>Shared anonymously</Text> Peak meetup times and popular activity types</Text>
            <Text style={styles.detailLine}><Text style={styles.detailKeyMuted}>Not shared</Text> Your name, ID, friends, or individual activities</Text>
          </View>
        </View>
      </View>
      <BottomActionBar>
        <PrimaryButton label="Continue" loading={submitting} onPress={() => saveConsent(consentEnabled)} />
        <Pressable style={styles.skipLink} onPress={() => saveConsent(false)} disabled={submitting}>
          <Text style={styles.skipText}>Skip for now</Text>
        </Pressable>
      </BottomActionBar>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  motif: { width: 84, height: 84, borderRadius: 24, backgroundColor: colors.coralSoft, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 24 },
  motifInner: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.coral },
  toggleCard: { borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card, borderRadius: 18, padding: 18 },
  toggleCardActive: { borderColor: colors.primary },
  toggleTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  toggleTextCol: { flex: 1 },
  toggleTitle: { color: colors.text, fontSize: 16, fontWeight: '900', lineHeight: 21 },
  toggleHelper: { color: colors.text2, fontSize: 13, fontWeight: '600', marginTop: 6, lineHeight: 19 },
  detailBox: { backgroundColor: colors.bg, borderRadius: 12, padding: 12, marginTop: 14, gap: 6 },
  detailLine: { color: colors.text2, fontSize: 12, fontWeight: '600', lineHeight: 17 },
  detailKey: { color: colors.primary, fontWeight: '900' },
  detailKeyMuted: { color: colors.text3, fontWeight: '900' },
  skipLink: { alignItems: 'center', paddingVertical: 12 },
  skipText: { color: colors.text2, fontSize: 14, fontWeight: '900' },
});
