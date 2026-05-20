import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  DEMO_ADMIN_CAMPUS_NAME,
  type AuthenticatedAdminContext,
  clearAdminContext,
  loadAdminContext,
} from '../../services/adminSession';
import {
  InlineBanner,
  LoadingRows,
  PrimaryButton,
  ScreenShell,
  SectionCard,
  colors,
} from '../../components/InCampusUI';
import type { RootStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminDashboard'>;

export default function AdminDashboardScreen({ navigation }: Props) {
  const [adminContext, setAdminContext] = useState<AuthenticatedAdminContext | null>(null);
  const [loading, setLoading] = useState(true);

  const loadContext = useCallback(async () => {
    setLoading(true);
    setAdminContext(await loadAdminContext());
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadContext();
    }, [loadContext])
  );

  async function exitAdminMode() {
    await clearAdminContext();
    navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] });
  }

  return (
    <ScreenShell style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.kicker}>Campus Admin</Text>
          <Text style={styles.title}>Admin Dashboard</Text>
          <Text style={styles.subtitle}>Demo controls for campus configuration, reports, and consent-based insights.</Text>
        </View>

        {loading ? (
          <LoadingRows count={2} />
        ) : !adminContext ? (
          <SectionCard style={styles.card}>
            <InlineBanner
              tone="error"
              text="Admin demo context is missing. Return to sign in and continue as demo admin."
            />
            <PrimaryButton label="Back to sign in" onPress={exitAdminMode} tone="muted" style={styles.cardButton} />
          </SectionCard>
        ) : (
          <>
            <SectionCard style={styles.identityCard}>
              <View style={styles.identityTop}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>CA</Text>
                </View>
                <View style={styles.identityText}>
                  <Text style={styles.email}>{adminContext.email}</Text>
                  <Text style={styles.meta}>{adminContext.adminId}</Text>
                </View>
              </View>
              <InfoRow label="Role" value={adminContext.role} />
              <InfoRow label="Selected campus" value={DEMO_ADMIN_CAMPUS_NAME} />
              <InfoRow label="Campus ID" value={adminContext.selectedCampusId} />
              <InfoRow label="Authorized campuses" value={adminContext.authorizedCampusIds.join(', ')} last />
            </SectionCard>

            <View style={styles.actionGrid}>
              <AdminActionCard
                title="Manage structured options"
                text="Maintain campus-specific categories and meeting points."
                accent={colors.primary}
                onPress={() => navigation.navigate('AdminStructuredOptions')}
              />
              <AdminActionCard
                title="Review reports"
                text="Open submitted safety reports and record moderation outcomes."
                accent={colors.coral}
                onPress={() => navigation.navigate('AdminReports')}
              />
              <AdminActionCard
                title="View student insights"
                text="Read only backend-returned consent-gated student-life insight data."
                accent={colors.sky}
                onPress={() => navigation.navigate('AdminInsights')}
              />
            </View>

            <PrimaryButton label="Exit admin demo mode" tone="muted" onPress={exitAdminMode} />
          </>
        )}
      </ScrollView>
    </ScreenShell>
  );
}

function InfoRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowBorder]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function AdminActionCard({
  title,
  text,
  accent,
  onPress,
}: {
  title: string;
  text: string;
  accent: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress}>
      <SectionCard style={styles.actionCard}>
        <View style={[styles.actionMark, { backgroundColor: accent }]} />
        <View style={styles.actionText}>
          <Text style={styles.actionTitle}>{title}</Text>
          <Text style={styles.actionBody}>{text}</Text>
        </View>
        <Text style={styles.chevron}>{'>'}</Text>
      </SectionCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg },
  content: { paddingHorizontal: 16, paddingBottom: 28, gap: 14 },
  header: { paddingHorizontal: 4, paddingTop: 6, paddingBottom: 4 },
  kicker: { color: colors.primary, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  title: { color: colors.text, fontSize: 28, fontWeight: '900', marginTop: 4 },
  subtitle: { color: colors.text2, fontSize: 14, fontWeight: '700', lineHeight: 20, marginTop: 6 },
  card: { padding: 14 },
  cardButton: { marginTop: 12 },
  identityCard: { padding: 16 },
  identityTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatar: { width: 52, height: 52, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.card, fontSize: 16, fontWeight: '900' },
  identityText: { flex: 1 },
  email: { color: colors.text, fontSize: 17, fontWeight: '900' },
  meta: { color: colors.text2, fontSize: 12, fontWeight: '800', marginTop: 2 },
  infoRow: { paddingVertical: 10, gap: 4 },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  infoLabel: { color: colors.text3, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  infoValue: { color: colors.text, fontSize: 13, fontWeight: '800' },
  actionGrid: { gap: 10 },
  actionCard: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionMark: { width: 12, height: 46, borderRadius: 6 },
  actionText: { flex: 1 },
  actionTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  actionBody: { color: colors.text2, fontSize: 12, fontWeight: '700', lineHeight: 18, marginTop: 4 },
  chevron: { color: colors.text3, fontSize: 20, fontWeight: '900' },
});
