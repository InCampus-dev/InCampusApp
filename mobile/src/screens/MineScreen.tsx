import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useLayoutEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api, { getApiErrorCode, getApiErrorMessage } from '../services/api';
import {
  BottomTabBar,
  EmptyState,
  InlineBanner,
  LoadingRows,
  ScreenShell,
  SectionCard,
  colors,
} from '../components/InCampusUI';

interface ProfileResponse {
  displayName: string;
  major?: string;
  shortBio?: string | null;
}

interface CampusResponse {
  campusId: string;
  campusName?: string | null;
  universityName?: string | null;
}

export default function MineScreen({ navigation }: { navigation: any }) {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [missingProfile, setMissingProfile] = useState(false);
  const [campusLabel, setCampusLabel] = useState('Campus selected');
  const [signingOut, setSigningOut] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    setMissingProfile(false);
    try {
      const response = await api.get<ProfileResponse>('/profiles/me');
      setProfile(response.data);
    } catch (error) {
      const code = getApiErrorCode(error);
      if (code === 'NOT_FOUND' || code === 'ProfileNotFound') {
        setMissingProfile(true);
      } else {
        setErrorMessage(getApiErrorMessage(error) ?? "Couldn't load profile");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCampusLabel = useCallback(async () => {
    setCampusLabel('Campus selected');
    try {
      const selectedCampusId = await AsyncStorage.getItem('selectedCampusId');
      if (!selectedCampusId) {
        return;
      }

      const response = await api.get<CampusResponse[]>('/campuses');
      const selectedCampus = response.data.find((campus) => campus.campusId === selectedCampusId);
      if (selectedCampus) {
        setCampusLabel(formatCampusLabel(selectedCampus));
      }
    } catch {
      setCampusLabel('Campus selected');
    }
  }, []);

  useFocusEffect(useCallback(() => {
    fetchProfile();
    fetchCampusLabel();
  }, [fetchCampusLabel, fetchProfile]));

  async function signOut() {
    setSigningOut(true);
    await AsyncStorage.multiRemove(['authToken', 'studentAccountId', 'selectedCampusId']);
    navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] });
  }

  return (
    <ScreenShell padded={false} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Account</Text>
          <Text style={styles.subtitle}>Your personal hub</Text>
        </View>
        {loading ? (
          <LoadingRows count={1} />
        ) : errorMessage ? (
          <SectionCard style={styles.profileErrorCard}>
            <InlineBanner tone="error" text={errorMessage} actionLabel="Retry" onAction={fetchProfile} />
          </SectionCard>
        ) : missingProfile ? (
          <EmptyState title="Complete your profile" text="Add your name, major, and a short bio so others can find you." primaryLabel="Set up profile" onPrimary={() => navigation.navigate('ProfileSetup')} />
        ) : profile ? (
          <ProfileCard profile={profile} campusLabel={campusLabel} />
        ) : null}

        <Pressable onPress={() => navigation.navigate('PersonalActivityList')}>
          <SectionCard style={styles.primaryActionCard}>
            <View style={styles.primaryIcon}><Text style={styles.primaryIconText}>A</Text></View>
            <View style={styles.primaryTextCol}>
              <Text style={styles.primaryTitle}>My Activities</Text>
              <Text style={styles.primarySubtitle}>Hosting, joined, and pending</Text>
            </View>
            <Text style={styles.chevron}>{'>'}</Text>
          </SectionCard>
        </Pressable>

        <SettingsGroup title="Account">
          <SettingsRow label="Edit profile" value="" onPress={() => navigation.navigate('ProfileSetup', { mode: 'edit' })} />
          <SettingsRow label="Campus" value={campusLabel} disabled />
          <SettingsRow label="Consent settings" onPress={() => navigation.navigate('ConsentSettings')} last />
        </SettingsGroup>
        <SettingsGroup title="Community">
          <SettingsRow label="Community rules" onPress={() => navigation.navigate('CommunityRules')} />
          <SettingsRow label="Safety" value="Soon" disabled last />
        </SettingsGroup>
        <SettingsGroup title="App">
          <SettingsRow label="Language" value="English" disabled last />
        </SettingsGroup>
        <SettingsGroup title="">
          <SettingsRow label={signingOut ? 'Signing out...' : 'Sign out'} danger disabled={signingOut} onPress={signOut} last />
        </SettingsGroup>
      </ScrollView>
      <BottomTabBar active="account" onFeed={() => navigation.navigate('ActivityFeed')} onCreate={() => navigation.navigate('CreateActivity')} onAccount={() => navigation.navigate('Mine')} />
    </ScreenShell>
  );
}

function ProfileCard({ profile, campusLabel }: { profile: ProfileResponse; campusLabel: string }) {
  const initials = profile.displayName.trim().split(/\s+/).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('') || '?';
  return (
    <SectionCard style={styles.profileCard}>
      <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
      <View style={styles.profileTextCol}>
        <Text style={styles.profileName}>{profile.displayName}</Text>
        {profile.major ? <Text style={styles.profileMajor}>{profile.major}</Text> : null}
        <View style={styles.badgeRow}>
          <Text style={styles.campusBadge} numberOfLines={1}>{campusLabel}</Text>
          <Text style={styles.verifiedBadge}>Verified student</Text>
        </View>
        {profile.shortBio ? <Text style={styles.bio} numberOfLines={1}>{profile.shortBio}</Text> : null}
      </View>
    </SectionCard>
  );
}

function formatCampusLabel(campus: CampusResponse): string {
  const campusName = campus.campusName?.trim();
  const universityName = campus.universityName?.trim();

  if (universityName && campusName) {
    return `${universityName} / ${campusName}`;
  }

  return campusName || universityName || 'Campus selected';
}

function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.groupWrap}>
      {title ? <Text style={styles.groupTitle}>{title}</Text> : null}
      <SectionCard style={styles.groupCard}>{children}</SectionCard>
    </View>
  );
}

function SettingsRow({ label, value, onPress, disabled, danger, last }: { label: string; value?: string; onPress?: () => void; disabled?: boolean; danger?: boolean; last?: boolean }) {
  return (
    <Pressable style={[styles.row, !last && styles.rowBorder, disabled && styles.disabledRow]} onPress={onPress} disabled={disabled}>
      <Text style={[styles.rowLabel, danger && styles.dangerText]}>{label}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      {!danger && !disabled ? <Text style={styles.chevron}>{'>'}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg, paddingTop: 54, paddingBottom: 84 },
  content: { padding: 16, paddingBottom: 110, gap: 14 },
  header: { paddingHorizontal: 4, paddingBottom: 2 },
  title: { color: colors.text, fontSize: 26, fontWeight: '900', letterSpacing: -0.4 },
  subtitle: { color: colors.text2, fontSize: 13, fontWeight: '700', marginTop: 5 },
  profileErrorCard: { padding: 12 },
  profileCard: { padding: 18, flexDirection: 'row', gap: 14 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.card, fontSize: 22, fontWeight: '900' },
  profileTextCol: { flex: 1 },
  profileName: { color: colors.text, fontSize: 20, fontWeight: '900' },
  profileMajor: { color: colors.text2, fontSize: 13, fontWeight: '800', marginTop: 3 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 9 },
  campusBadge: { flexShrink: 1, overflow: 'hidden', borderRadius: 999, backgroundColor: colors.primarySoft, color: colors.primary, paddingHorizontal: 9, paddingVertical: 4, fontSize: 11, fontWeight: '900' },
  verifiedBadge: { overflow: 'hidden', borderRadius: 999, backgroundColor: colors.successSoft, color: colors.primaryGreenPressed, paddingHorizontal: 9, paddingVertical: 4, fontSize: 11, fontWeight: '900' },
  bio: { color: colors.text2, fontSize: 12, fontWeight: '700', marginTop: 10 },
  primaryActionCard: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  primaryIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  primaryIconText: { color: colors.primary, fontSize: 16, fontWeight: '900' },
  primaryTextCol: { flex: 1 },
  primaryTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  primarySubtitle: { color: colors.text2, fontSize: 12, fontWeight: '700', marginTop: 3 },
  chevron: { color: colors.text3, fontSize: 18, fontWeight: '900' },
  groupWrap: { gap: 8 },
  groupTitle: { color: colors.text2, fontSize: 10, fontWeight: '900', letterSpacing: 1.1, textTransform: 'uppercase', paddingLeft: 6 },
  groupCard: { overflow: 'hidden' },
  row: { minHeight: 52, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '800' },
  rowValue: { color: colors.text2, fontSize: 13, fontWeight: '700' },
  disabledRow: { opacity: 0.65 },
  dangerText: { color: colors.danger },
});
