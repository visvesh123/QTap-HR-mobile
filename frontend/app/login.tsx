import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../src/auth';
import { api } from '../src/api';
import { colors, radii, spacing, typo } from '../src/theme';
import { PrimaryButton } from '../src/ui';

export default function Login() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role?: string }>();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [demos, setDemos] = useState<any[]>([]);

  useEffect(() => {
    api.demoAccounts().then((d) => setDemos(d.filter((x) => !role || x.role === role))).catch(() => {});
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

  const roleLabel = role === 'student' ? 'Student' : role === 'staff' ? 'Staff' : role === 'admin' ? 'Admin' : 'User';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} testID="back-btn">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </TouchableOpacity>

          <LinearGradient
            colors={[colors.primaryDark, colors.primaryLight]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.heroBadge}
          >
            <MaterialCommunityIcons
              name={role === 'student' ? 'school' : role === 'admin' ? 'shield-crown' : 'account-tie'}
              size={40}
              color={colors.white}
            />
          </LinearGradient>

          <Text style={styles.title}>{roleLabel} Sign In</Text>
          <Text style={styles.subtitle}>Welcome back! Enter your credentials</Text>

          <View style={{ marginTop: spacing.lg }}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color={colors.textSecondary} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@mahindrauniversity.edu.in"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                testID="email-input"
              />
            </View>

            <Text style={[styles.label, { marginTop: spacing.md }]}>Password</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPw}
                testID="password-input"
              />
              <TouchableOpacity onPress={() => setShowPw(!showPw)} testID="toggle-password">
                <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {!!error && <Text style={styles.error} testID="login-error">{error}</Text>}

            <PrimaryButton
              label="Sign In"
              onPress={onSubmit}
              loading={loading}
              testID="login-button"
              style={{ marginTop: spacing.lg }}
            />
          </View>

          {demos.length > 0 && (
            <View style={styles.demoBox} testID="demo-accounts">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm }}>
                <Ionicons name="flash" size={16} color={colors.gold} />
                <Text style={styles.demoTitle}>Quick login (demo)</Text>
              </View>
              {demos.map((d) => (
                <TouchableOpacity
                  key={d.email}
                  style={styles.demoChip}
                  onPress={() => fillDemo(d)}
                  testID={`demo-${d.email}`}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.demoName}>{d.name}</Text>
                    <Text style={styles.demoEmail}>{d.email}</Text>
                  </View>
                  <Ionicons name="arrow-forward-circle" size={22} color={colors.primary} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  heroBadge: {
    width: 80, height: 80, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    marginTop: spacing.sm, marginBottom: spacing.md,
  },
  title: { ...typo.h1, color: colors.text },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radii.md, paddingHorizontal: spacing.md, height: 50, gap: 10,
  },
  input: { flex: 1, fontSize: 15, color: colors.text },
  error: { color: colors.sos, marginTop: spacing.sm, fontSize: 13 },
  demoBox: {
    marginTop: spacing.xl,
    backgroundColor: colors.goldLight,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  demoTitle: { fontSize: 13, fontWeight: '700', color: colors.gold },
  demoChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radii.md, padding: spacing.sm, marginTop: spacing.sm, gap: 8,
  },
  demoName: { fontSize: 13, fontWeight: '700', color: colors.text },
  demoEmail: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
});
