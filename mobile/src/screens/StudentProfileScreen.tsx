import React, { useCallback, useLayoutEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  getPublicStudentProfile,
  type PublicStudentProfile,
} from '../services/studentApi';
import { getApiErrorCode, getApiErrorMessage } from '../services/api';
import {
  BottomActionBar,
  EmptyState,
  InlineBanner,
  LoadingRows,
  PrimaryButton,
  ScreenShell,
  SectionCard,
  TopBar,
  colors,
} from '../components/InCampusUI';

export default function StudentProfileScreen({ navigation, route }: { navigation: any; route: any }) {
  const studentAccountId = getStringParam(route?.params?.studentAccountId);
  const contextActivityId = getStringParam(route?.params?.contextActivityId);
  const [profile, setProfile] = useState<PublicStudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<'not_found' | 'forbidden' | 'generic' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setProfile(null);
    setErrorState(null);
    setErrorMessage(null);

    if (!studentAccountId || !contextActivityId) {
      setErrorState('not_found');
      setLoading(false);
      return;
    }

    try {
      const data = await getPublicStudentProfile(contextActivityId, studentAccountId);
      setProfile(data);
    } catch (error) {
      const code = getApiErrorCode(error);
      if (code === 'AUTH_FORBIDDEN' || code === 'BLOCK_RELATIONSHIP_EXISTS') {
        setErrorState('forbidden');
      } else if (code === 'NOT_FOUND' || code === 'TARGET_UNAVAILABLE') {
        setErrorState('not_found');
      } else {
        setErrorState('generic');
        setErrorMessage(getApiErrorMessage(error) ?? "Couldn't load this student profile.");
      }
    } finally {
      setLoading(false);
    }
  }, [contextActivityId, studentAccountId]);

  useFocusEffect(useCallback(() => { fetchProfile(); }, [fetchProfile]));

  const reportParams = {
    targetType: 'student' as const,
    targetAccountId: studentAccountId,
  };

  return (
    <ScreenShell padded={false} style={styles.screen}>
      <TopBar title="Student" onBack={() => navigation.goBack()} />
      {loading ? (
        <View style={styles.loadingWrap}>
          <LoadingRows count={2} />
        </View>
      ) : profile ? (
        <>
          <ScrollView contentContainerStyle={styles.content}>
            <SectionCard style={styles.profileCard}>
              <Text style={styles.name}>{profile.displayName}</Text>
              <Text style={styles.major}>{profile.major}</Text>
              {profile.shortBio ? <Text style={styles.bio}>{profile.shortBio}</Text> : null}
            </SectionCard>

            <ProfileList title="Interests" values={profile.interests} empty="No interests shared yet." />
            <ProfileList title="Languages" values={profile.languages} empty="No languages shared yet." />
          </ScrollView>
          <BottomActionBar>
            <PrimaryButton
              label="Report Student"
              tone="blue"
              onPress={() => navigation.navigate('ReportSubmission', reportParams)}
            />
            <Pressable
              style={styles.blockButton}
              onPress={() =>
                navigation.navigate('BlockUser', {
                  targetAccountId: studentAccountId,
                  returnToActivityId: contextActivityId,
                })
              }
            >
              <Text style={styles.blockButtonText}>Block Student</Text>
            </Pressable>
          </BottomActionBar>
        </>
      ) : (
        <View style={styles.emptyWrap}>
          {errorState === 'generic' ? (
            <InlineBanner
              tone="error"
              text={errorMessage ?? "Couldn't load this student profile."}
              actionLabel="Retry"
              onAction={fetchProfile}
            />
          ) : null}
          <EmptyState
            icon={errorState === 'forbidden' ? 'i' : '?'}
            title={errorState === 'forbidden' ? 'Profile not accessible' : 'Profile unavailable'}
            text={
              errorState === 'forbidden'
                ? 'This student profile cannot be shown from this context.'
                : 'The profile may be unavailable or outside this activity context.'
            }
            primaryLabel="Back"
            onPrimary={() => navigation.goBack()}
          />
        </View>
      )}
    </ScreenShell>
  );
}

function ProfileList({ title, values, empty }: { title: string; values: string[]; empty: string }) {
  return (
    <SectionCard style={styles.listCard}>
      <Text style={styles.listTitle}>{title}</Text>
      {values.length > 0 ? (
        <View style={styles.chipRow}>
          {values.map((value) => (
            <View key={value} style={styles.chip}>
              <Text style={styles.chipText}>{value}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.emptyText}>{empty}</Text>
      )}
    </SectionCard>
  );
}

function getStringParam(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg, paddingTop: 54 },
  loadingWrap: { padding: 16 },
  content: { padding: 16, paddingBottom: 150, gap: 14 },
  profileCard: { padding: 18 },
  name: { color: colors.text, fontSize: 24, fontWeight: '900' },
  major: { color: colors.text2, fontSize: 14, fontWeight: '800', marginTop: 5 },
  bio: { color: colors.text, fontSize: 14, lineHeight: 21, fontWeight: '600', marginTop: 14 },
  listCard: { padding: 16 },
  listTitle: { color: colors.text, fontSize: 15, fontWeight: '900', marginBottom: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 999, backgroundColor: colors.primarySoft, paddingHorizontal: 11, paddingVertical: 7 },
  chipText: { color: colors.primaryDeep, fontSize: 12, fontWeight: '900' },
  emptyText: { color: colors.text2, fontSize: 13, fontWeight: '600' },
  blockButton: { minHeight: 48, borderRadius: 16, borderWidth: 1.5, borderColor: colors.danger, alignItems: 'center', justifyContent: 'center' },
  blockButtonText: { color: colors.danger, fontSize: 14, fontWeight: '900' },
  emptyWrap: { flex: 1, padding: 24, justifyContent: 'center', gap: 14 },
});
