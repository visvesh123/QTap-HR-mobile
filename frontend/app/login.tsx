import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, LayoutAnimation, UIManager, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth, type User } from '../src/auth';
import { api, setRefreshToken } from '../src/api';
import { colors, radii, spacing, clay, BRAND } from '../src/theme';
import { ClayCard, ClayInput, ClayLabel } from '../src/components/Clay';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function toRole(value?: string | null): 'student' | 'staff' | 'admin' {
  const v = String(value || '').toLowerCase();
  if (v === 'student' || v === 'staff' || v === 'admin') return v;
  return 'staff';
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string').map((v) => v.trim()).filter(Boolean);
}

function parseAuthResponse(res: any) {
  const payload = res?.data ?? res ?? {};
  return {
    success: res?.success,
    message: res?.message || payload?.message,
    token: payload?.access_token || payload?.token || res?.access_token || res?.token,
    refreshToken: payload?.refresh_token || res?.refresh_token,
    permissions: asStringArray(payload?.rbac ?? payload?.permissions ?? res?.rbac ?? res?.permissions),
    user: payload?.user ?? res?.user,
    qid: payload?.qid ?? res?.qid,
    role: payload?.type ?? payload?.role ?? payload?.user?.role ?? res?.type ?? res?.role ?? res?.user?.role,
  };
}

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
  const { setSession } = useAuth();
  const params = useLocalSearchParams<{ role?: string | string[] }>();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // otp
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpHint, setOtpHint] = useState('');
  const [resendIn, setResendIn] = useState(0);

  const goHome = () => router.replace('/(tabs)');
  const selectedRole = Array.isArray(params.role) ? params.role[0] : params.role;

  React.useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const establishSession = async (rawResponse: any) => {
    const parsed = parseAuthResponse(rawResponse);
    if (parsed.success === false) throw new Error(parsed.message || 'Authentication failed');
    if (!parsed.token) throw new Error('Missing access token in login response');

    let sessionUser: User | null = parsed.user ?? null;
    if (!sessionUser) {
      const fallbackId = parsed.qid || 'user';
      sessionUser = {
        id: fallbackId,
        qid: parsed.qid || fallbackId,
        email: `${String(fallbackId).toLowerCase()}@local.user`,
        // OTP verify only returns qid/tokens/rbac — never use QID as the greeting name.
        name: 'User',
        role: toRole(parsed.role || selectedRole),
      };
    } else if (
      sessionUser.name &&
      sessionUser.qid &&
      String(sessionUser.name).toLowerCase() === String(sessionUser.qid).toLowerCase()
    ) {
      sessionUser = { ...sessionUser, name: 'User' };
    }
    await setSession(parsed.token, sessionUser, parsed.permissions);
    if (parsed.refreshToken) {
      await setRefreshToken(parsed.refreshToken);
    }

    // Real display name comes from GET /staff/me/profile (`users.name`).
    try {
      const me = await api.me(true);
      if (me) await setSession(parsed.token, me, parsed.permissions);
    } catch (e: any) {
      console.warn('Profile load after login failed:', e?.message || e);
    }
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
      setResendIn(30);
    } catch (e: any) {
      setError(e.message || 'Could not send OTP');
    } finally { setLoading(false); }
  };

  const onVerifyOtp = async () => {
    if (otp.replace(/\D/g, '').length < 6) { setError('Enter the 6-digit OTP'); return; }
    setError(''); setLoading(true);
    try {
      const res = await api.otpVerify(phone.replace(/\D/g, ''), otp.trim());
      await establishSession(res);
      goHome();
    } catch (e: any) {
      setError(e.message || 'OTP verification failed');
    } finally { setLoading(false); }
  };

  const resetOtp = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOtpSent(false); setOtp(''); setOtpHint(''); setError(''); setResendIn(0);
  };

  // ----- Microsoft -----
  const onMicrosoft = async () => {
    setError(''); setLoading(true);
    try {
      const res = await api.microsoft();
      await establishSession(res);
      goHome();
    } catch (e: any) {
      setError(e.message || 'Microsoft sign-in failed');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Hero — MUOne brand lockup */}
          <View style={styles.heroWrap}>
            <Image
              source={BRAND.logo}
              style={styles.brandLogo}
              resizeMode="contain"
              accessibilityLabel="MUOne — Connected by One."
            />
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
                <TouchableOpacity onPress={onSendOtp} disabled={loading || resendIn > 0} style={styles.resendBtn} testID="resend-otp">
                  <Text style={[styles.resendText, (loading || resendIn > 0) && { opacity: 0.5 }]}>
                    {resendIn > 0 ? `Resend OTP in ${resendIn}s` : "Didn&apos;t get it? Resend OTP"}
                  </Text>
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
  brandLogo: { width: 260, height: 110 },
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

