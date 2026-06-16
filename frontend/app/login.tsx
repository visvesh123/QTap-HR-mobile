import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, LayoutAnimation, UIManager, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/auth';
import { api } from '../src/api';
import { colors, radii, spacing, clay, BRAND } from '../src/theme';
import { ClayCard, ClayInput, ClayLabel } from '../src/components/Clay';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Local fallback so demo logins are always available even if /api is slow/down.
const FALLBACK_DEMOS = [
  { role: 'student', email: 'student@mahindrauniversity.edu.in',    password: 'student123',    name: 'Aarav Sharma' },
  { role: 'staff',   email: 'faculty@mahindrauniversity.edu.in',    password: 'faculty123',    name: 'Dr. Rajesh Kumar (Faculty)' },
  { role: 'staff',   email: 'librarian@mahindrauniversity.edu.in',  password: 'librarian123',  name: 'Mrs. Anita Nair (Librarian)' },
  { role: 'staff',   email: 'warden@mahindrauniversity.edu.in',     password: 'warden123',     name: 'Mr. Vikram Singh (Warden)' },
  { role: 'staff',   email: 'security@mahindrauniversity.edu.in',   password: 'security123',   name: 'Mr. Ramesh Kale (Security)' },
  { role: 'staff',   email: 'exam@mahindrauniversity.edu.in',       password: 'exam123',       name: 'Dr. Kavita Joshi (Exam Cell)' },
  { role: 'admin',   email: 'admin@mahindrauniversity.edu.in',      password: 'admin123',      name: 'Prof. Suresh Mehta' },
];

function MicrosoftLogo({ size = 18 }: { size?: number }) {
  const s = size / 2 - 1;
  return (
    <View style={{ width: size, height: size, flexDirection: 'row', flexWrap: 'wrap', gap: 2 }}>
      <View style={{ width: s, height: s, backgroundColor: '#F25022' }} />
      <View style={{ width: s, height: s, backgroundColor: '#7FBA00' }} />
      <View style={{ width: s, height: s, backgroundColor: '#00A4EF' }} />
      <View style={{ width: s, height: s, backgroundColor: '#FFB900' }} />
    </View>
  );
}

export default function Login() {
  const router = useRouter();
  const { login, setSession } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // otp
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpHint, setOtpHint] = useState('');

  // demo accounts
  const [demos, setDemos] = useState<any[]>(FALLBACK_DEMOS);
  const [demosOpen, setDemosOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await Promise.race([
          api.demoAccounts(),
          new Promise<any[]>((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000)),
        ]);
        if (!cancelled && (result as any[])?.length) setDemos(result as any[]);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  const goHome = () => router.replace('/(tabs)');

  const toggleDemos = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDemosOpen((o) => !o);
  };

  // ----- OTP -----
  const onSendOtp = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) { setError('Enter a valid 10-digit mobile number'); return; }
    setError(''); setLoading(true);
    try {
      const res = await api.otpRequest(digits);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setOtpSent(true);
      setOtp('');
      setOtpHint(res.message || 'OTP sent.');
    } catch (e: any) {
      setError(e.message || 'Could not send OTP');
    } finally { setLoading(false); }
  };

  const onVerifyOtp = async () => {
    if (otp.replace(/\D/g, '').length < 6) { setError('Enter the 6-digit OTP'); return; }
    setError(''); setLoading(true);
    try {
      const res = await api.otpVerify(phone.replace(/\D/g, ''), otp.trim());
      await setSession(res.token, res.user);
      goHome();
    } catch (e: any) {
      setError(e.message || 'OTP verification failed');
    } finally { setLoading(false); }
  };

  const resetOtp = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOtpSent(false); setOtp(''); setOtpHint(''); setError('');
  };

  // ----- Microsoft -----
  const onMicrosoft = async () => {
    setError(''); setLoading(true);
    try {
      const res = await api.microsoft();
      await setSession(res.token, res.user);
      goHome();
    } catch (e: any) {
      setError(e.message || 'Microsoft sign-in failed');
    } finally { setLoading(false); }
  };

  // ----- Demo one-tap -----
  const oneTapLogin = async (d: any) => {
    setError(''); setLoading(true);
    try {
      await login(d.email, d.password);
      goHome();
    } catch (e: any) {
      setError(e.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Hero — MUOne brand */}
          <View style={styles.heroWrap}>
            <View style={[styles.logoCard, clay.surface as any]}>
              <Image source={{ uri: BRAND.logoUrl }} style={styles.logoImg} resizeMode="contain" />
            </View>
            <View style={styles.wordmarkRow}>
              <Text style={styles.wmMU}>MU</Text>
              <Text style={styles.wmOne}>One</Text>
            </View>
            <Text style={styles.subtitle}>one app for everything campus</Text>
          </View>

          {/* Form card — OTP only */}
          <ClayCard style={{ marginTop: spacing.md }}>
            {!otpSent ? (
              <>
                <ClayLabel style={{ marginBottom: 6 }}>Mobile number</ClayLabel>
                <ClayInput>
                  <Text style={styles.cc}>+91</Text>
                  <TextInput
                    style={styles.input}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="98765 00010"
                    placeholderTextColor={colors.clayMuted}
                    keyboardType="number-pad"
                    maxLength={14}
                    testID="phone-input"
                  />
                </ClayInput>
                <Text style={styles.helper}>We&apos;ll text you a 6-digit verification code.</Text>

                {!!error && <Text style={styles.error} testID="login-error">{error}</Text>}

                <PrimaryButton label="Send OTP" loading={loading} onPress={onSendOtp} testID="send-otp-button" />
              </>
            ) : (
              <>
                <View style={styles.otpHeader}>
                  <ClayLabel>Enter OTP</ClayLabel>
                  <TouchableOpacity onPress={resetOtp} testID="change-number">
                    <Text style={styles.changeNum}>Change number</Text>
                  </TouchableOpacity>
                </View>
                <ClayInput style={{ marginTop: 6 }}>
                  <Ionicons name="keypad-outline" size={18} color={colors.clayMuted} />
                  <TextInput
                    style={[styles.input, styles.otpInput]}
                    value={otp}
                    onChangeText={setOtp}
                    placeholder="------"
                    placeholderTextColor={colors.clayMuted}
                    keyboardType="number-pad"
                    maxLength={6}
                    testID="otp-input"
                    onSubmitEditing={onVerifyOtp}
                  />
                </ClayInput>
                {!!otpHint && (
                  <View style={[styles.otpHintBox, clay.surfaceSoft as any]}>
                    <Ionicons name="information-circle" size={14} color={colors.primary} />
                    <Text style={styles.otpHintText}>{otpHint}</Text>
                  </View>
                )}

                {!!error && <Text style={styles.error} testID="login-error">{error}</Text>}

                <PrimaryButton label="Verify & Sign In" loading={loading} onPress={onVerifyOtp} testID="verify-otp-button" />
                <TouchableOpacity onPress={onSendOtp} disabled={loading} style={styles.resendBtn} testID="resend-otp">
                  <Text style={styles.resendText}>Didn&apos;t get it? Resend OTP</Text>
                </TouchableOpacity>
              </>
            )}
          </ClayCard>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.divider} />
          </View>

          {/* Microsoft */}
          <TouchableOpacity
            style={[styles.msBtn, clay.surface as any]}
            onPress={onMicrosoft}
            disabled={loading}
            activeOpacity={0.85}
            testID="microsoft-button"
          >
            <MicrosoftLogo size={18} />
            <Text style={styles.msText}>Sign in with Microsoft</Text>
          </TouchableOpacity>

          {/* Demo accounts (collapsible) */}
          <TouchableOpacity
            style={[styles.demoToggle, clay.surfaceSoft as any]}
            onPress={toggleDemos}
            activeOpacity={0.85}
            testID="demo-toggle"
          >
            <View style={[styles.demoBolt, clay.surface as any]}>
              <Ionicons name="flash" size={14} color={colors.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.demoTitle}>Demo logins</Text>
              <Text style={styles.demoHint}>Tap to view {demos.length} ready-to-use accounts</Text>
            </View>
            <Ionicons name={demosOpen ? 'chevron-up' : 'chevron-down'} size={20} color={colors.clayMuted} />
          </TouchableOpacity>

          {demosOpen && (
            <View style={{ gap: spacing.sm, marginTop: spacing.sm }} testID="demo-accounts">
              {demos.map((d) => (
                <TouchableOpacity
                  key={d.email}
                  onPress={() => oneTapLogin(d)}
                  style={[styles.demoCard, clay.surface as any]}
                  activeOpacity={0.7}
                  testID={`demo-go-${d.email}`}
                >
                  <View style={[styles.demoAvatar, clay.crimson as any]}>
                    <Text style={styles.demoAvatarText}>
                      {d.name.split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.demoName}>{d.name}</Text>
                    <Text style={styles.demoEmail} numberOfLines={1}>{d.email}</Text>
                  </View>
                  <View style={[styles.demoGoBtn, clay.crimson as any]}>
                    <Ionicons name="log-in-outline" size={15} color={colors.white} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.terms}>
            By continuing you agree to the University acceptable-use policy.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function PrimaryButton({ label, loading, onPress, testID }: { label: string; loading: boolean; onPress: () => void; testID: string }) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      disabled={loading}
      style={[styles.signInWrap, clay.crimson as any, loading && { opacity: 0.7 }]}
      testID={testID}
    >
      <LinearGradient
        colors={[colors.primaryLight, colors.primary, colors.primaryDark]}
        start={{ x: 0, y: 0 }} end={{ x: 0.5, y: 1 }}
        style={styles.signInBtn}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <>
            <Text style={styles.signInText}>{label}</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.white} />
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.clayBg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },

  heroWrap: { alignItems: 'center', marginTop: spacing.md, marginBottom: spacing.lg },
  logoCard: {
    width: 92, height: 92, borderRadius: 24,
    backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md,
  },
  logoImg: { width: 58, height: 58 },
  brandLogo: { width: 250, height: 74 },
  wordmarkRow: { flexDirection: 'row', alignItems: 'baseline' },
  wmMU: { fontSize: 38, fontWeight: '900', color: colors.primary, letterSpacing: -0.5 },
  wmOne: { fontSize: 38, fontWeight: '800', color: colors.clayDark, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: colors.clayMuted, marginTop: 6, fontWeight: '500', textAlign: 'center' },

  segment: {
    flexDirection: 'row', borderRadius: 22, padding: 5, gap: 4,
  },
  segBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 11, borderRadius: 18,
  },
  segBtnActive: { backgroundColor: colors.primary },
  segText: { fontSize: 14, fontWeight: '700', color: colors.clayMuted },
  segTextActive: { color: colors.white },

  input: { flex: 1, fontSize: 15, color: colors.clayDark, fontWeight: '500', height: '100%' },
  cc: { fontSize: 15, fontWeight: '700', color: colors.clayDark, marginRight: 2 },
  otpInput: { letterSpacing: 8, fontSize: 20, fontWeight: '800' },
  helper: { fontSize: 12, color: colors.clayMuted, marginTop: 8, fontWeight: '500' },
  error: { color: colors.sos, marginTop: spacing.sm, fontSize: 13, fontWeight: '600' },

  otpHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  changeNum: { fontSize: 12, fontWeight: '700', color: colors.primary },
  otpHintBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: spacing.sm, padding: 10, borderRadius: 14,
  },
  otpHintText: { flex: 1, fontSize: 12, color: colors.clayDark, fontWeight: '500' },
  resendBtn: { alignItems: 'center', marginTop: spacing.sm },
  resendText: { fontSize: 13, fontWeight: '600', color: colors.clayMuted },

  signInWrap: { marginTop: spacing.lg, borderRadius: 30, overflow: 'hidden' },
  signInBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16, paddingHorizontal: 24,
  },
  signInText: { color: colors.white, fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: spacing.lg },
  divider: { flex: 1, height: 1, backgroundColor: colors.clayShadow },
  dividerText: { fontSize: 12, color: colors.clayMuted, fontWeight: '600' },

  msBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 15, borderRadius: radii.clay, marginTop: spacing.md,
    backgroundColor: colors.claySurface,
  },
  msText: { fontSize: 15, fontWeight: '700', color: colors.clayDark },

  demoToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: spacing.md, borderRadius: radii.clay, marginTop: spacing.lg,
  },
  demoBolt: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  demoTitle: { fontSize: 14, fontWeight: '800', color: colors.clayDark },
  demoHint: { fontSize: 11, color: colors.clayMuted, marginTop: 1 },

  demoCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: spacing.md, paddingVertical: 12,
    borderRadius: radii.clay, backgroundColor: colors.claySurface,
  },
  demoAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  demoAvatarText: { fontSize: 13, fontWeight: '800', color: colors.white },
  demoName: { fontSize: 13, fontWeight: '800', color: colors.clayDark },
  demoEmail: { fontSize: 11, color: colors.clayMuted },
  demoGoBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },

  terms: { fontSize: 11, color: colors.clayMuted, textAlign: 'center', marginTop: spacing.lg, lineHeight: 16 },
});

