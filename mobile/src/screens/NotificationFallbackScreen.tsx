import React, { useLayoutEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton, ScreenShell, TopBar, colors } from '../components/InCampusUI';
import { getNotificationFallbackCopy } from '../services/notificationFallbackCopy';

export default function NotificationFallbackScreen({ navigation, route }: { navigation: any; route: any }) {
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);
  const rawReason = route?.params?.reason;
  const copy = getNotificationFallbackCopy(rawReason);

  return (
    <ScreenShell style={styles.screen}>
      <TopBar onBack={() => navigation.goBack()} />
      <View style={styles.center}>
        <View style={styles.iconWrap}><Text style={styles.iconText}>{copy.icon}</Text></View>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.body}>{copy.body}</Text>
        <Text style={styles.reason}>Reason: {typeof rawReason === 'string' ? copy.reasonLabel : 'Generic fallback'}</Text>
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

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  iconWrap: { width: 96, height: 96, borderRadius: 28, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  iconText: { color: colors.text2, fontSize: 32, fontWeight: '900' },
  title: { color: colors.text, fontSize: 24, fontWeight: '900', textAlign: 'center' },
  body: { color: colors.text2, fontSize: 15, fontWeight: '600', lineHeight: 22, textAlign: 'center', marginTop: 10 },
  reason: { color: colors.text3, fontSize: 12, fontWeight: '800', marginTop: 14, textAlign: 'center' },
  footer: { paddingHorizontal: 24, paddingBottom: 24 },
  secondary: { alignItems: 'center', paddingVertical: 14 },
  secondaryText: { color: colors.text2, fontSize: 14, fontWeight: '900' },
});
