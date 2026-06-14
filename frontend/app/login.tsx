import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../src/auth';
import { api } from '../src/api';
import { colors, radii, spacing, typo, clay } from '../src/theme';
import { ClayCard, ClayButton, ClayInput, ClayLabel } from '../src/components/Clay';

// Local fallback so demo logins are always available even if /api is slow/down.
const FALLBACK_DEMOS = [
  { role: 'student', email: 'student@mahindrauniversity.edu.in',    password: 'student123',    name: 'Aarav Sharma' },
  { role: 'student', email: 'student2@mahindrauniversity.edu.in',   password: 'student123',    name: 'Ananya Verma' },
  { role: 'staff',   email: 'faculty@mahindrauniversity.edu.in',    password: 'faculty123',    name: 'Dr. Rajesh Kumar (Faculty)' },
  { role: 'staff',   email: 'librarian@mahindrauniversity.edu.in',  password: 'librarian123',  name: 'Mrs. Anita Nair (Librarian)' },
  { role: 'staff',   email: 'warden@mahindrauniversity.edu.in',     password: 'warden123',     name: 'Mr. Vikram Singh (Warden)' },
  { role: 'staff',   email: 'security@mahindrauniversity.edu.in',   password: 'security123',   name: 'Mr. Ramesh Kale (Security)' },
  { role: 'staff',   email: 'exam@mahindrauniversity.edu.in',       password: 'exam123',       name: 'Dr. Kavita Joshi (Exam Cell)' },
  { role: 'admin',   email: 'admin@mahindrauniversity.edu.in',      password: 'admin123',      name: 'Mr. Suresh Iyer (Administrator)' },
];

export default function Login() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role?: string }>();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [demos, setDemos] = useState<any[]>(FALLBACK_DEMOS.filter((x) => !role || x.role === role));

  useEffect(() => {
    let cancelled = false;
    const fetchDemos = async () => {
      try {
        const result = await Promise.race([
          api.demoAccounts(),
          new Promise<any[]>((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000)),
        ]);
        if (cancelled) return;
        const filtered = (result as any[]).filter((x) => !role || x.role === role);
        if (filtered.length) setDemos(filtered);
      } catch {}
    };
    fetchDemos();
    return () => { cancelled = true; };
  }, [role]);

  const onSubmit = async () => {
    if (!email || !password) { setError('Please enter email and password'); return; }
    setError(''); setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password, role);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (d: any) => { setEmail(d.email); setPassword(d.password); };

  const oneTapLogin = async (d: any) => {
    setEmail(d.email);
    setPassword(d.password);
    setError(''); setLoading(true);
    try {
      await login(d.email, d.password, role);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const roleLabel = role === 'student' ? 'Student' : role === 'staff' ? 'Staff' : role === 'admin' ? 'Admin' : 'User';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, clay.surfaceSoft as any]} testID="back-btn">
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>

          {/* Hero badge */}
          <View style={[styles.heroBadgeWrap, clay.crimson as any]}>
            <LinearGradient
              colors={[colors.primaryLight, colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.heroBadge}
            >
              <MaterialCommunityIcons
                name={role === 'student' ? 'school' : role === 'admin' ? 'shield-crown' : 'account-tie'}
                size={42}
                color={colors.white}
              />
            </LinearGradient>
          </View>

          <Text style={styles.title}>{roleLabel} Sign In</Text>
          <Text style={styles.subtitle}>Welcome to Mahindra University Campus Hub</Text>

          {/* Form card */}
          <ClayCard style={{ marginTop: spacing.lg }}>
            <ClayLabel style={{ marginBottom: 6 }}>Email</ClayLabel>
            <ClayInput style={{ marginBottom: spacing.md }}>
              <Ionicons name="mail-outline" size={18} color={colors.clayMuted} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@mahindrauniversity.edu.in"
                placeholderTextColor={colors.clayMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                testID="email-input"
              />
            </ClayInput>

            <ClayLabel style={{ marginBottom: 6 }}>Password</ClayLabel>
            <ClayInput>
              <Ionicons name="lock-closed-outline" size={18} color={colors.clayMuted} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.clayMuted}
                secureTextEntry={!showPw}
                testID="password-input"
              />
              <TouchableOpacity onPress={() => setShowPw(!showPw)} testID="toggle-password">
                <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.clayMuted} />
              </TouchableOpacity>
            </ClayInput>

            {!!error && <Text style={styles.error} testID="login-error">{error}</Text>}

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={onSubmit}
              disabled={loading}
              style={[styles.signInWrap, clay.crimson as any, loading && { opacity: 0.7 }]}
              testID="login-button"
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
                    <Text style={styles.signInText}>Sign In</Text>
                    <Ionicons name="arrow-forward" size={18} color={colors.white} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </ClayCard>

          {/* Demo accounts */}
          {demos.length > 0 && (
            <View style={{ marginTop: spacing.lg }} testID="demo-accounts">
              <View style={styles.demoHeaderRow}>
                <View style={[styles.demoBolt, clay.surfaceSoft as any]}>
                  <Ionicons name="flash" size={14} color={colors.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.demoTitle}>Quick demo login</Text>
                  <Text style={styles.demoHint}>Tap any account to instantly sign in.</Text>
                </View>
              </View>

              <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
                {demos.map((d) => (
                  <View
                    key={d.email}
                    style={[styles.demoCard, clay.surface as any]}
                    testID={`demo-${d.email}`}
                  >
                    <TouchableOpacity
                      onPress={() => oneTapLogin(d)}
                      style={styles.demoMain}
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
                        <View style={styles.demoPwRow}>
                          <Ionicons name="key-outline" size={11} color={colors.clayMuted} />
                          <Text style={styles.demoPw}>{d.password}</Text>
                        </View>
                      </View>
                      <View style={[styles.demoGoBtn, clay.crimson as any]}>
                        <Ionicons name="log-in-outline" size={14} color={colors.white} />
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => fillDemo(d)}
                      style={styles.demoFillBtn}
                      testID={`demo-fill-${d.email}`}
                    >
                      <Ionicons name="arrow-up-circle-outline" size={20} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.clayBg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  backBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.claySurface,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  heroBadgeWrap: {
    width: 92, height: 92, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    marginTop: spacing.sm, marginBottom: spacing.md,
  },
  heroBadge: {
    width: 92, height: 92, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { ...typo.h1, color: colors.clayDark, fontSize: 32 },
  subtitle: { fontSize: 14, color: colors.clayMuted, marginTop: 6, fontWeight: '500' },
  input: { flex: 1, fontSize: 15, color: colors.clayDark, fontWeight: '500', height: '100%' },
  error: { color: colors.sos, marginTop: spacing.sm, fontSize: 13, fontWeight: '600' },

  signInWrap: {
    marginTop: spacing.lg, borderRadius: 30, overflow: 'hidden',
  },
  signInBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16, paddingHorizontal: 24,
  },
  signInText: { color: colors.white, fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },

  demoHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  demoBolt: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.goldLight,
    alignItems: 'center', justifyContent: 'center',
  },
  demoTitle: { fontSize: 14, fontWeight: '800', color: colors.clayDark },
  demoHint: { fontSize: 11, color: colors.clayMuted, marginTop: 1 },

  demoCard: {
    flexDirection: 'row', alignItems: 'stretch',
    backgroundColor: colors.claySurface,
    borderRadius: radii.clay,
    overflow: 'hidden',
  },
  demoMain: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 12,
    gap: 12,
  },
  demoAvatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  demoAvatarText: { fontSize: 14, fontWeight: '800', color: colors.white },
  demoName: { fontSize: 13, fontWeight: '800', color: colors.clayDark },
  demoEmail: { fontSize: 11, color: colors.clayMuted },
  demoPwRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  demoPw: {
    fontSize: 11, fontWeight: '700', color: colors.clayDark,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    backgroundColor: colors.goldLight,
    paddingHorizontal: 6, paddingVertical: 1,
    borderRadius: 4,
  },
  demoGoBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  demoFillBtn: {
    width: 44,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.goldLight,
  },
});
