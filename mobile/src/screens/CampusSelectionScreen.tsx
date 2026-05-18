import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import api, { getApiErrorCode } from '../services/api';
import {
  BottomActionBar,
  EmptyState,
  InlineBanner,
  LoadingRows,
  PrimaryButton,
  ScreenShell,
  TitleBlock,
  colors,
} from '../components/InCampusUI';

interface Campus {
  campusId: string;
  campusName: string;
  universityName?: string;
  activationStatus: boolean;
}

interface CampusSelectionResponse {
  accessToken: string;
  selectedCampusId: string | null;
}

export default function CampusSelectionScreen({ navigation }: { navigation: any }) {
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    AsyncStorage.getItem('authToken').then((token) => {
      if (!token) navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] });
    });
    fetchCampuses();
  }, []);

  async function fetchCampuses() {
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await api.get<Campus[]>('/campuses');
      const activeCampuses = response.data.filter((campus) => campus.activationStatus === true);
      setCampuses(activeCampuses);
      setSelectedId(activeCampuses.length === 1 ? activeCampuses[0].campusId : null);
    } catch (error) {
      const code = getApiErrorCode(error);
      setErrorMessage(
        code === 'NOT_FOUND' || code === 'NoCampusesConfigured'
          ? 'No campuses available right now'
          : "Couldn't load campuses",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!selectedId) return;
    setSubmitting(true);
    setConfirmError(null);
    try {
      const response = await api.patch<CampusSelectionResponse>('/accounts/me/campus', { campusId: selectedId });
      const { accessToken, selectedCampusId } = response.data;
      if (!accessToken || !selectedCampusId) throw new Error('Missing updated session');
      await AsyncStorage.setItem('authToken', accessToken);
      await AsyncStorage.setItem('selectedCampusId', selectedCampusId);
      try {
        await api.get('/profiles/me');
        navigation.reset({ index: 0, routes: [{ name: 'ActivityFeed' }] });
      } catch {
        navigation.navigate('ProfileSetup');
      }
    } catch (error) {
      const code = getApiErrorCode(error);
      setConfirmError(
        code === 'NOT_FOUND' || code === 'CampusNotFound' || code === 'CampusNotActive'
          ? 'This campus is no longer available'
          : 'Could not select campus. Please try again.',
      );
      if (code === 'NOT_FOUND' || code === 'CampusNotFound' || code === 'CampusNotActive') fetchCampuses();
    } finally {
      setSubmitting(false);
    }
  }

  async function useAnotherAccount() {
    await AsyncStorage.multiRemove(['authToken', 'studentAccountId', 'selectedCampusId']);
    navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] });
  }

  return (
    <ScreenShell style={styles.screen}>
      <View style={styles.content}>
        <TitleBlock title="Choose your campus" subtitle="Your feed and activities will be scoped to this campus" />
        {errorMessage ? <InlineBanner tone="error" text={errorMessage} actionLabel="Retry" onAction={fetchCampuses} /> : null}
        {loading ? (
          <LoadingRows count={3} />
        ) : campuses.length === 0 ? (
          <EmptyState title="No campuses available right now" text="Check your connection and try again." primaryLabel="Retry" onPrimary={fetchCampuses} />
        ) : (
          <FlatList
            data={campuses}
            keyExtractor={(item) => item.campusId}
            contentContainerStyle={styles.list}
            renderItem={({ item, index }) => (
              <Pressable
                style={[styles.campusCard, selectedId === item.campusId && styles.campusCardSelected]}
                onPress={() => setSelectedId(item.campusId)}
              >
                <View style={[styles.campusIcon, { backgroundColor: CAMPUS_COLORS[index % CAMPUS_COLORS.length] }]}>
                  <Text style={styles.campusIconText}>T</Text>
                </View>
                <View style={styles.campusTextCol}>
                  <Text style={styles.campusName}>{item.campusName}</Text>
                  <Text style={styles.campusUniversity}>{item.universityName ?? 'Tongji University'}</Text>
                </View>
                <View style={[styles.checkCircle, selectedId === item.campusId && styles.checkCircleSelected]}>
                  {selectedId === item.campusId ? <Text style={styles.checkText}>OK</Text> : null}
                </View>
              </Pressable>
            )}
          />
        )}
      </View>
      <BottomActionBar>
        {confirmError ? <InlineBanner tone="error" text={confirmError} /> : null}
        <PrimaryButton label="Confirm campus" loading={submitting} disabled={!selectedId || loading} onPress={handleConfirm} />
        <Pressable style={styles.secondaryLink} onPress={useAnotherAccount} disabled={submitting}>
          <Text style={styles.secondaryText}>Use another account</Text>
        </Pressable>
      </BottomActionBar>
    </ScreenShell>
  );
}

const CAMPUS_COLORS = [colors.primarySoft, colors.skySoft, colors.coralSoft, colors.yellowSoft];

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg },
  content: { flex: 1, paddingHorizontal: 24 },
  list: { gap: 10, paddingBottom: 20 },
  campusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  campusCardSelected: { borderColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.12, shadowRadius: 12, elevation: 2 },
  campusIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  campusIconText: { color: colors.primaryDeep, fontSize: 18, fontWeight: '900' },
  campusTextCol: { flex: 1 },
  campusName: { color: colors.text, fontSize: 17, fontWeight: '900' },
  campusUniversity: { color: colors.text2, fontSize: 13, fontWeight: '700', marginTop: 2 },
  checkCircle: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkCircleSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  checkText: { color: colors.card, fontSize: 8, fontWeight: '900' },
  secondaryLink: { alignItems: 'center', paddingVertical: 12 },
  secondaryText: { color: colors.text2, fontSize: 14, fontWeight: '900' },
});
