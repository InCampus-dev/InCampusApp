import { useNavigation } from '@react-navigation/native';
import React, { useLayoutEffect, useState } from 'react';
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
  BrandHeader,
  InlineBanner,
  PasswordField,
  PrimaryButton,
  ScreenShell,
  StepIndicator,
  TextField,
  TitleBlock,
  TopBar,
  colors,
} from '../components/InCampusUI';

type SignUpStep = 'register' | 'verify';

export default function SignUpScreen() {
  const navigation = useNavigation<any>();
  const [step, setStep] = useState<SignUpStep>('register');
  const [universityEmail, setUniversityEmail] = useState('');
  const [universityStudentId, setUniversityStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [token, setToken] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  async function handleRegister() {
    setErrors({});
    setFormError(null);
    const nextErrors: Record<string, string> = {};
    if (!universityEmail.trim()) nextErrors.universityEmail = 'Please enter your university email';
    if (!universityStudentId.trim()) nextErrors.universityStudentId = 'Please enter your student ID';
    if (!password.trim()) nextErrors.password = 'Please create a password';
    if (password !== confirmPassword) nextErrors.confirmPassword = "Passwords don't match";
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/signup', {
        universityEmail: universityEmail.trim(),
        universityStudentId: universityStudentId.trim(),
        password,
      });
      setStep('verify');
      setSuccessMessage(null);
    } catch (error) {
      const code = getApiErrorCode(error);
      if (code === 'UNSUPPORTED_EMAIL_DOMAIN') {
        setErrors({ universityEmail: 'Use your university email' });
      } else if (code === 'CONFLICT') {
        setErrors({ universityEmail: 'An account with this email already exists' });
      } else {
        setFormError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    setErrors({});
    setFormError(null);
    if (!token.trim()) {
      setErrors({ token: 'Please enter the verification code' });
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/verify-email', {
        email: universityEmail.trim(),
        token: token.trim(),
      });
      setSuccessMessage('Account verified. Please sign in.');
      setTimeout(() => navigation.navigate('SignIn'), 700);
    } catch (error) {
      const code = getApiErrorCode(error);
      if (code === 'INVALID_VERIFICATION_TOKEN') {
        setErrors({ token: "That code isn't valid. Please try again" });
      } else if (code === 'NOT_FOUND') {
        setErrors({ token: 'Account not found. Please sign up again' });
      } else {
        setFormError('Verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenShell style={styles.screen}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TopBar onBack={() => (step === 'verify' ? setStep('register') : navigation.goBack())} />
          <BrandHeader />
          <StepIndicator step={step === 'register' ? 1 : 2} />
          {step === 'register' ? (
            <>
              <TitleBlock title="Create your account" subtitle="Use your university email to join your campus" />
              {formError ? <InlineBanner tone="error" text={formError} /> : null}
              <TextField
                label="University email"
                placeholder="you@tongji.edu.cn"
                keyboardType="email-address"
                autoCapitalize="none"
                value={universityEmail}
                onChangeText={setUniversityEmail}
                editable={!loading}
                error={errors.universityEmail}
              />
              <TextField
                label="Student ID"
                placeholder="Your university student ID"
                helper="We use this to verify you're enrolled"
                value={universityStudentId}
                onChangeText={setUniversityStudentId}
                editable={!loading}
                error={errors.universityStudentId}
              />
              <PasswordField
                label="Password"
                placeholder="At least 8 characters"
                value={password}
                onChangeText={setPassword}
                visible={passwordVisible}
                onToggleVisible={() => setPasswordVisible((value) => !value)}
                editable={!loading}
                error={errors.password}
              />
              <PasswordField
                label="Confirm password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                visible={confirmVisible}
                onToggleVisible={() => setConfirmVisible((value) => !value)}
                editable={!loading}
                error={errors.confirmPassword}
              />
              <PrimaryButton label="Create account" loading={loading} onPress={handleRegister} style={styles.cta} />
            </>
          ) : (
            <>
              <View style={styles.envelope}>
                <Text style={styles.envelopeText}>@</Text>
              </View>
              <TitleBlock
                center
                title="Check your inbox"
                subtitle={`We sent a verification code to ${universityEmail.trim() || 'your university email'}`}
              />
              {successMessage ? <InlineBanner tone="success" text={successMessage} /> : null}
              {formError ? <InlineBanner tone="error" text={formError} /> : null}
              <TextField
                label="Verification code"
                placeholder="Enter code"
                value={token}
                onChangeText={setToken}
                autoCapitalize="none"
                keyboardType="number-pad"
                editable={!loading}
                error={errors.token}
                inputStyle={styles.otpInput}
              />
              <PrimaryButton label="Verify" loading={loading} onPress={handleVerify} style={styles.cta} />
              <Pressable style={styles.secondaryLink} onPress={() => setStep('register')} disabled={loading}>
                <Text style={styles.secondaryText}>Back to account details</Text>
              </Pressable>
              <Text style={styles.resendText}>Resend code unavailable</Text>
            </>
          )}
          <Pressable style={styles.signInLink} onPress={() => navigation.navigate('SignIn')}>
            <Text style={styles.signInText}>Already have an account? Sign in</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg },
  flex: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 28 },
  cta: { marginTop: 8 },
  secondaryLink: { alignItems: 'center', paddingVertical: 14 },
  secondaryText: { color: colors.text2, fontSize: 14, fontWeight: '900' },
  signInLink: { alignItems: 'center', paddingVertical: 16 },
  signInText: { color: colors.primary, fontSize: 14, fontWeight: '900' },
  envelope: {
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 22,
    backgroundColor: colors.skySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  envelopeText: { color: colors.sky, fontSize: 30, fontWeight: '900' },
  otpInput: { textAlign: 'center', fontSize: 22, letterSpacing: 6, fontWeight: '900' },
  resendText: { color: colors.text3, fontSize: 12, fontWeight: '800', textAlign: 'center', marginTop: 4 },
});
