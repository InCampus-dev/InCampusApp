import React, { useLayoutEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton, ScreenShell, TopBar, colors } from '../components/InCampusUI';

type NotificationFallbackReason =
  | 'TargetActivityUnavailable'
  | 'BlockRelationshipExists'
  | 'MissingActivityContext'
  | 'UnknownNotificationTarget';

export default function NotificationFallbackScreen({ navigation, route }: { navigation: any; route: any }) {
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);
  const copy = getFallbackCopy(route?.params?.reason);

  return (
    <ScreenShell style={styles.screen}>
      <TopBar onBack={() => navigation.goBack()} />
      <View style={styles.center}>
        <View style={styles.iconWrap}><Text style={styles.iconText}>{copy.icon}</Text></View>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.body}>{copy.body}</Text>
      </View>
      <View style={styles.footer}>
        <PrimaryButton label="Back to Alerts" onPress={() => navigation.navigate('NotificationList')} />
        <Pressable style={styles.secondary} onPress={() => navigation.reset({ index: 0, routes: [{ name: 'ActivityFeed' }] })}>
          <Text style={styles.secondaryText}>Go to Feed</Text>
        </Pressable>
      </View>
    </ScreenShell>
  );
}

function getFallbackCopy(reason: unknown): { title: string; body: string; icon: string } {
  switch (normalizeFallbackReason(reason)) {
    case 'TargetActivityUnavailable':
      return { title: 'Activity no longer available', body: 'This activity may have been removed or cancelled.', icon: 'x' };
    case 'BlockRelationshipExists':
      return { title: 'Content not accessible', body: 'This content is no longer available to you.', icon: '!' };
    case 'MissingActivityContext':
      return { title: 'Nothing to show here', body: "We couldn't find the activity linked to this notification.", icon: '?' };
    case 'UnknownNotificationTarget':
    default:
      return { title: 'Notification unavailable', body: 'This notification is no longer valid.', icon: 'i' };
  }
}

function normalizeFallbackReason(reason: unknown): NotificationFallbackReason | undefined {
  return reason === 'TargetActivityUnavailable' || reason === 'BlockRelationshipExists' || reason === 'MissingActivityContext' || reason === 'UnknownNotificationTarget' ? reason : undefined;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  iconWrap: { width: 96, height: 96, borderRadius: 28, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  iconText: { color: colors.text2, fontSize: 32, fontWeight: '900' },
  title: { color: colors.text, fontSize: 24, fontWeight: '900', textAlign: 'center' },
  body: { color: colors.text2, fontSize: 15, fontWeight: '600', lineHeight: 22, textAlign: 'center', marginTop: 10 },
  footer: { paddingHorizontal: 24, paddingBottom: 24 },
  secondary: { alignItems: 'center', paddingVertical: 14 },
  secondaryText: { color: colors.text2, fontSize: 14, fontWeight: '900' },
});
