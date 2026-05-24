import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import React, { useLayoutEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api, { getApiErrorCode } from '../services/api';
import { clearAdminContext, saveDemoAdminContext } from '../services/adminSession';
import {
  BrandHeader,
  InlineBanner,
  PasswordField,
  PrimaryButton,
  ScreenShell,
  TextField,
  TitleBlock,
  colors,
} from '../components/InCampusUI';

interface SignInResponse {
  accessToken: string;
  studentAccountId: string;
  selectedCampusId: string | null;
}

export default function SignInScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [universityEmail, setUniversityEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminMenuVisible, setAdminMenuVisible] = useState(false);
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  async function handleSignIn() {
    setEmailError(undefined);
    setPasswordError(undefined);
    setFormError(null);

    if (!universityEmail.trim()) {
      setEmailError('Please enter your university email');
      return;
    }
    if (!password.trim()) {
      setPasswordError('Please enter your password');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post<SignInResponse>('/auth/signin', {
        universityEmail: universityEmail.trim(),
        password,
      });
      const { accessToken, studentAccountId, selectedCampusId } = response.data;
      await clearAdminContext();
      await AsyncStorage.setItem('authToken', accessToken);
      await AsyncStorage.setItem('studentAccountId', studentAccountId);
      if (selectedCampusId) {
        await AsyncStorage.setItem('selectedCampusId', selectedCampusId);
      } else {
        await AsyncStorage.removeItem('selectedCampusId');
      }
      navigation.reset({
        index: 0,
        routes: [{ name: selectedCampusId ? 'ActivityFeed' : 'CampusSelection' }],
      });
    } catch (error) {
      const code = getApiErrorCode(error);
      if (code === 'INVALID_CREDENTIALS') {
        setPasswordError('Email or password is incorrect');
      } else if (code === 'ACCOUNT_NOT_VERIFIED') {
        setPasswordError('Check your inbox to verify your account');
      } else if (code === 'ACCOUNT_SUSPENDED' || code === 'ACCOUNT_BANNED') {
        setFormError('This account cannot sign in right now');
      } else {
        setFormError('Sign in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoAdmin() {
    setFormError(null);
    setAdminLoading(true);
    try {
      await saveDemoAdminContext();
      navigation.reset({
        index: 0,
        routes: [{ name: 'AdminDashboard' }],
      });
    } catch {
      setFormError('Could not start admin demo mode. Please try again.');
    } finally {
      setAdminLoading(false);
    }
  }

  function handleDemoAdminFromMenu() {
    setAdminMenuVisible(false);
    void handleDemoAdmin();
  }

  return (
    <ScreenShell style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.menuBar}>
          <Pressable
            style={({ pressed }) => [
              styles.menuButton,
              pressed && styles.menuButtonPressed,
              (loading || adminLoading) && styles.disabled,
            ]}
            onPress={() => setAdminMenuVisible(true)}
            disabled={loading || adminLoading}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="More sign in options"
          >
            <Text style={styles.menuButtonText}>...</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <BrandHeader />
          <View style={styles.motifCard}>
            <Text style={styles.motifText}>
              College is full of people just like you, looking for the same things you are.
            </Text>
            <Text style={styles.motifKicker}>InCampus - built by students, for students</Text>
            <View style={styles.motifCircle} />
            <View style={styles.motifSquare} />
          </View>
          <TitleBlock title="Welcome back" subtitle="Sign in with your university email" />
          {formError ? <InlineBanner tone="error" text={formError} /> : null}
          <TextField
            label="University email"
            placeholder="you@tongji.edu.cn"
            keyboardType="email-address"
            autoCapitalize="none"
            value={universityEmail}
            onChangeText={setUniversityEmail}
            editable={!loading}
            error={emailError}
          />
          <PasswordField
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            visible={passwordVisible}
            onToggleVisible={() => setPasswordVisible((value) => !value)}
            editable={!loading}
            error={passwordError}
          />
          <PrimaryButton label="Sign in" loading={loading} onPress={handleSignIn} style={styles.cta} disabled={adminLoading} />
          <Pressable style={styles.secondaryLink} onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.secondaryText}>Create account</Text>
          </Pressable>
          <View style={styles.trustLine}>
            <View style={styles.trustDot} />
            <Text style={styles.trustText}>Only verified students. No profile browsing.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Modal
        visible={adminMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAdminMenuVisible(false)}
      >
        <View style={styles.menuModalRoot}>
          <Pressable
            style={styles.menuScrim}
            onPress={() => setAdminMenuVisible(false)}
            accessibilityLabel="Close menu"
          />
          <View style={[styles.adminMenu, { top: Math.max(insets.top, 18) + 58 }]}>
            <Pressable
              style={({ pressed }) => [
                styles.adminMenuItem,
                pressed && styles.adminMenuItemPressed,
                (loading || adminLoading) && styles.disabled,
              ]}
              onPress={handleDemoAdminFromMenu}
              disabled={loading || adminLoading}
              accessibilityRole="button"
            >
              <Text style={styles.adminMenuText}>Try admin demo</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg },
  flex: { flex: 1 },
  menuBar: {
    minHeight: 44,
    paddingHorizontal: 24,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  menuButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButtonPressed: {
    backgroundColor: colors.primaryGhost,
  },
  menuButtonText: {
    color: colors.text2,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 22,
  },
  content: { flexGrow: 1, paddingHorizontal: 24, justifyContent: 'center', paddingBottom: 28 },
  motifCard: {
    borderRadius: 20,
    backgroundColor: '#EDF8F4',
    padding: 20,
    marginBottom: 28,
    overflow: 'hidden',
  },
  motifText: {
    maxWidth: 245,
    color: colors.text,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '800',
  },
  motifKicker: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 10,
  },
  motifCircle: {
    position: 'absolute',
    right: -12,
    top: -16,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.yellow,
    opacity: 0.5,
  },
  motifSquare: {
    position: 'absolute',
    right: 24,
    bottom: -22,
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.coral,
    opacity: 0.38,
    transform: [{ rotate: '20deg' }],
  },
  cta: { marginTop: 8 },
  secondaryLink: { alignItems: 'center', paddingVertical: 16 },
  secondaryText: { color: colors.primary, fontSize: 14, fontWeight: '900' },
  trustLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10 },
  trustDot: { width: 14, height: 14, borderRadius: 4, backgroundColor: colors.primaryGreen },
  trustText: { color: colors.text2, fontSize: 12, fontWeight: '700' },
  menuModalRoot: {
    flex: 1,
  },
  menuScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  adminMenu: {
    position: 'absolute',
    right: 24,
    minWidth: 166,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.card,
    shadowColor: '#101828',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 6,
    overflow: 'hidden',
  },
  adminMenuItem: {
    minHeight: 48,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  adminMenuItemPressed: {
    backgroundColor: colors.primaryGhost,
  },
  adminMenuText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  disabled: {
    opacity: 0.5,
  },
});
