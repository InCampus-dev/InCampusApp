import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import api, { getApiErrorCode } from '../services/api';
import {
  BottomActionBar,
  Chip,
  FieldError,
  InlineBanner,
  PrimaryButton,
  ScreenShell,
  SectionCard,
  TextField,
  TitleBlock,
  colors,
} from '../components/InCampusUI';

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
] as const;

const INTEREST_TAGS = ['Sports', 'Lunch', 'Coffee', 'Study', 'Language Exchange', 'Gaming', 'Music', 'Travel'];
const LANGUAGE_TAGS = ['Chinese', 'English', 'Japanese', 'French', 'Spanish', 'German', 'Korean'];
const DEFAULT_BIRTH_DATE = new Date(2003, 0, 1);

interface StudentProfileResponse {
  displayName: string;
  major: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  interests?: string[];
  languages?: string[];
  shortBio?: string | null;
}

function formatDateOnly(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateLabel(date: Date) {
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function parseDateOnly(value?: string | null): Date | null {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.slice(0, 10).split('-').map((part) => Number.parseInt(part, 10));
  if (!year || !month || !day) {
    return null;
  }

  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

export default function ProfileSetupScreen({ navigation, route }: { navigation: any; route?: { params?: { mode?: 'create' | 'edit' } } }) {
  const requestedMode = route?.params?.mode === 'edit' ? 'edit' : 'create';
  const [mode, setMode] = useState<'create' | 'edit'>(requestedMode);
  const [displayName, setDisplayName] = useState('');
  const [major, setMajor] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [gender, setGender] = useState<string | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [shortBio, setShortBio] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(requestedMode === 'edit');
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const isEditMode = mode === 'edit';
  const formLocked = submitting || loadingProfile;

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    AsyncStorage.getItem('authToken').then((token) => {
      if (!token) navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] });
    });
  }, [navigation]);

  useEffect(() => {
    let cancelled = false;

    if (requestedMode !== 'edit') {
      setLoadingProfile(false);
      return () => {
        cancelled = true;
      };
    }

    async function loadProfile() {
      setLoadingProfile(true);
      setApiError(null);
      setWarningMessage(null);

      try {
        const response = await api.get<StudentProfileResponse>('/profiles/me');
        if (cancelled) return;
        setDisplayName(response.data.displayName ?? '');
        setMajor(response.data.major ?? '');
        setDateOfBirth(parseDateOnly(response.data.dateOfBirth));
        setGender(response.data.gender ?? null);
        setInterests(Array.isArray(response.data.interests) ? response.data.interests : []);
        setLanguages(Array.isArray(response.data.languages) ? response.data.languages : []);
        setShortBio(response.data.shortBio ?? '');
      } catch (error) {
        if (cancelled) return;
        const code = getApiErrorCode(error);
        if (code === 'NOT_FOUND' || code === 'ProfileNotFound') {
          setMode('create');
          setWarningMessage("We couldn't find your existing profile. Create one here to return to Mine.");
        } else {
          setApiError('Could not load profile. Please try again.');
        }
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [requestedMode]);

  function toggleTag(value: string, selected: string[], setter: (next: string[]) => void) {
    setter(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
  }

  function handleDateChange(_event: DateTimePickerEvent, selectedDate?: Date) {
    if (Platform.OS !== 'ios') {
      setDatePickerVisible(false);
    }
    if (selectedDate) {
      setDateOfBirth(selectedDate);
      setErrors((current) => ({ ...current, dateOfBirth: undefined }));
    }
  }

  async function handleSubmit() {
    setErrors({});
    setApiError(null);
    const nextErrors: Record<string, string> = {};
    if (!displayName.trim()) nextErrors.displayName = 'Please add your name';
    if (!major.trim()) nextErrors.major = 'Please add your major';
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        displayName: displayName.trim(),
        major: major.trim(),
      };
      if (isEditMode) {
        payload.dateOfBirth = dateOfBirth ? formatDateOnly(dateOfBirth) : null;
        payload.gender = gender ?? null;
        payload.interests = interests;
        payload.languages = languages;
        payload.shortBio = shortBio.trim() ? shortBio.trim() : null;
        await api.patch('/profiles/me', payload);
        setSuccessMessage('Profile saved');
        setTimeout(() => navigation.reset({ index: 0, routes: [{ name: 'Mine' }] }), 650);
      } else {
        if (dateOfBirth) payload.dateOfBirth = formatDateOnly(dateOfBirth);
        if (gender) payload.gender = gender;
        if (interests.length > 0) payload.interests = interests;
        if (languages.length > 0) payload.languages = languages;
        if (shortBio.trim()) payload.shortBio = shortBio.trim();
        await api.post('/profiles', payload);
        setSuccessMessage('Profile created');
        setTimeout(() => {
          if (requestedMode === 'edit') {
            navigation.reset({ index: 0, routes: [{ name: 'Mine' }] });
          } else {
            navigation.navigate('ConsentSettings');
          }
        }, 650);
      }
    } catch (error) {
      const code = getApiErrorCode(error);
      if (!isEditMode && (code === 'CONFLICT' || code === 'ProfileAlreadyExists')) {
        navigation.reset({ index: 0, routes: [{ name: requestedMode === 'edit' ? 'Mine' : 'ActivityFeed' }] });
      } else if (code === 'MissingMandatoryFields') {
        setErrors({ displayName: 'Please add your name', major: 'Please add your major' });
      } else {
        setApiError(isEditMode ? 'Could not save profile. Please try again.' : 'Could not create profile. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScreenShell padded={false} style={styles.screen}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TitleBlock
            title={isEditMode ? 'Edit your profile' : 'Set up your profile'}
            subtitle={isEditMode ? 'Keep your student profile up to date' : 'Only shown to other students in activity contexts'}
          />
          {loadingProfile ? <InlineBanner tone="warning" text="Loading your profile..." /> : null}
          {successMessage ? <InlineBanner tone="success" text={successMessage} /> : null}
          {warningMessage ? <InlineBanner tone="warning" text={warningMessage} /> : null}
          {apiError ? <InlineBanner tone="error" text={apiError} /> : null}
          <SectionCard style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>About you</Text>
              <Text style={styles.requiredBadge}>Required</Text>
            </View>
            <TextField label="Your name" placeholder="How others will see you" value={displayName} onChangeText={setDisplayName} editable={!formLocked} error={errors.displayName} />
            <TextField label="Major" placeholder="Mechanical Engineering" value={major} onChangeText={setMajor} editable={!formLocked} error={errors.major} />
          </SectionCard>

          <SectionCard style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>A bit more</Text>
              <Text style={styles.optionalBadge}>Optional</Text>
            </View>
            <Text style={styles.fieldLabel}>Date of birth</Text>
            <Pressable
              accessibilityRole="button"
              disabled={formLocked}
              onPress={() => setDatePickerVisible(true)}
              style={[styles.dateField, errors.dateOfBirth && styles.dateFieldError, formLocked && styles.dateFieldDisabled]}
            >
              <Text style={[styles.dateFieldText, !dateOfBirth && styles.dateFieldPlaceholder]}>
                {dateOfBirth ? formatDateLabel(dateOfBirth) : 'Pick your date of birth'}
              </Text>
              <Text style={styles.dateActionText}>{dateOfBirth ? 'Change' : 'Pick'}</Text>
            </Pressable>
            {errors.dateOfBirth ? <FieldError message={errors.dateOfBirth} /> : <Text style={styles.dateHelper}>Optional</Text>}
            {datePickerVisible ? (
              <View style={styles.datePickerWrap}>
                <DateTimePicker
                  value={dateOfBirth ?? DEFAULT_BIRTH_DATE}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  maximumDate={new Date()}
                  onChange={handleDateChange}
                />
                {Platform.OS === 'ios' ? (
                  <View style={styles.datePickerActions}>
                    {dateOfBirth ? (
                      <Pressable onPress={() => setDateOfBirth(null)} disabled={formLocked}>
                        <Text style={styles.clearDateText}>Clear</Text>
                      </Pressable>
                    ) : <View />}
                    <Pressable onPress={() => setDatePickerVisible(false)} disabled={formLocked}>
                      <Text style={styles.doneDateText}>Done</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            ) : null}
            {dateOfBirth && Platform.OS !== 'ios' ? (
              <Pressable onPress={() => setDateOfBirth(null)} disabled={formLocked} style={styles.clearDateButton}>
                <Text style={styles.clearDateText}>Clear date</Text>
              </Pressable>
            ) : null}
            <Text style={styles.fieldLabel}>Gender</Text>
            <View style={styles.chipWrap}>
              {GENDER_OPTIONS.map((option) => (
                <Chip
                  key={option.value}
                  label={option.label}
                  selected={gender === option.value}
                  tone="blue"
                  compact
                  onPress={() => setGender(gender === option.value ? null : option.value)}
                  disabled={formLocked}
                />
              ))}
            </View>
            <Text style={styles.fieldLabel}>Interests</Text>
            <View style={styles.chipWrap}>
              {INTEREST_TAGS.map((tag) => (
                <Chip key={tag} label={tag} selected={interests.includes(tag)} onPress={() => toggleTag(tag, interests, setInterests)} disabled={formLocked} />
              ))}
            </View>
            <Text style={styles.fieldLabel}>Languages</Text>
            <View style={styles.chipWrap}>
              {LANGUAGE_TAGS.map((tag) => (
                <Chip key={tag} label={tag} selected={languages.includes(tag)} tone="coral" onPress={() => toggleTag(tag, languages, setLanguages)} disabled={formLocked} />
              ))}
            </View>
            <TextField
              label="Bio"
              placeholder="A short note about yourself"
              value={shortBio}
              onChangeText={setShortBio}
              multiline
              maxLength={150}
              editable={!formLocked}
              inputStyle={styles.bioInput}
            />
            {shortBio.length > 130 ? <FieldError message={`${shortBio.length}/150`} /> : <Text style={styles.countText}>{shortBio.length}/150</Text>}
          </SectionCard>
        </ScrollView>
        <BottomActionBar>
          <PrimaryButton label={isEditMode ? 'Save profile' : 'Create profile'} loading={submitting || loadingProfile} disabled={loadingProfile} onPress={handleSubmit} />
        </BottomActionBar>
      </KeyboardAvoidingView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg },
  flex: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 64, paddingBottom: 128 },
  sectionCard: { padding: 18, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  requiredBadge: { color: colors.text2, backgroundColor: colors.borderSoft, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  optionalBadge: { color: '#8A5B00', backgroundColor: colors.yellowSoft, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  fieldLabel: { color: colors.text, fontSize: 13, fontWeight: '800', marginBottom: 8, marginTop: 8 },
  dateField: { minHeight: 52, borderWidth: 1, borderColor: colors.border, borderRadius: 14, backgroundColor: colors.card, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateFieldError: { borderColor: colors.danger },
  dateFieldDisabled: { opacity: 0.6 },
  dateFieldText: { color: colors.text, fontSize: 15, fontWeight: '800' },
  dateFieldPlaceholder: { color: colors.text3, fontWeight: '700' },
  dateActionText: { color: colors.primaryDeep, fontSize: 12, fontWeight: '900' },
  dateHelper: { color: colors.text3, fontSize: 11, fontWeight: '700', marginTop: 6, marginBottom: 8 },
  datePickerWrap: { borderWidth: 1, borderColor: colors.borderSoft, borderRadius: 16, backgroundColor: colors.card, marginTop: 10, marginBottom: 12, overflow: 'hidden' },
  datePickerActions: { borderTopWidth: 1, borderTopColor: colors.borderSoft, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clearDateButton: { alignSelf: 'flex-start', marginTop: 8, marginBottom: 10 },
  clearDateText: { color: colors.text2, fontSize: 12, fontWeight: '800' },
  doneDateText: { color: colors.primaryDeep, fontSize: 13, fontWeight: '900' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  bioInput: { minHeight: 80, textAlignVertical: 'top' },
  countText: { alignSelf: 'flex-end', color: colors.text3, fontSize: 11, fontWeight: '800', marginTop: -6 },
});
