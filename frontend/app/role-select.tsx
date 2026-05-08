import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, radii, shadow, spacing } from '../src/theme';

const ROLES = [
  {
    key: 'student',
    label: 'Student',
    icon: 'school',
    iconLib: 'mci' as const,
    description: 'Hall tickets, library, hostel, events, wallet & more',
    gradient: [colors.primaryDark, colors.primaryLight] as [string, string],
  },
  {
    key: 'staff',
    label: 'Staff',
    icon: 'account-tie',
    iconLib: 'mci' as const,
    description: 'Faculty, Librarian, Warden, Security, Exam Cell',
    gradient: ['#0EA5E9', '#3B82F6'] as [string, string],
  },
  {
    key: 'admin',
    label: 'Admin',
    icon: 'shield-crown',
    iconLib: 'mci' as const,
    description: 'University-wide oversight, analytics & operations',
    gradient: ['#F59E0B', '#EF4444'] as [string, string],
  },
];

export default function RoleSelect() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <MaterialCommunityIcons name="school" size={28} color={colors.primary} />
          </View>
          <Text style={styles.brand}>Campus Hub</Text>
          <Text style={styles.welcome}>Welcome 👋</Text>
          <Text style={styles.tagline}>Sign in as</Text>
        </View>

        <View style={{ paddingHorizontal: spacing.md }}>
          {ROLES.map((r) => {
            const Icon = r.iconLib === 'mci' ? MaterialCommunityIcons : Ionicons;
            return (
              <TouchableOpacity
                key={r.key}
                activeOpacity={0.85}
                testID={`role-${r.key}`}
                onPress={() => router.push({ pathname: '/login', params: { role: r.key } })}
                style={styles.cardWrap}
              >
                <LinearGradient
                  colors={r.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.card}
                >
                  <View style={styles.iconWrap}>
                    <Icon name={r.icon as any} size={32} color={colors.white} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.roleLabel}>{r.label}</Text>
                    <Text style={styles.roleDesc}>{r.description}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={22} color={colors.white} />
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>By continuing, you agree to the University's</Text>
          <Text style={styles.footerLink}>Terms of Use & Privacy Policy</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  logoBadge: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: colors.primaryBg,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  brand: { fontSize: 14, fontWeight: '700', color: colors.primary, letterSpacing: 1.5 },
  welcome: { fontSize: 32, fontWeight: '800', color: colors.text, marginTop: spacing.sm, letterSpacing: -0.5 },
  tagline: { fontSize: 16, color: colors.textSecondary, marginTop: spacing.xs },
  cardWrap: {
    marginBottom: spacing.md,
    borderRadius: radii.xl,
    ...shadow.cardHeavy,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radii.xl,
    gap: spacing.md,
  },
  iconWrap: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center',
  },
  roleLabel: { fontSize: 20, fontWeight: '700', color: colors.white },
  roleDesc: { fontSize: 12, color: 'rgba(255,255,255,0.88)', marginTop: 2 },
  footer: {
    alignItems: 'center', marginTop: spacing.lg, paddingHorizontal: spacing.lg,
  },
  footerText: { fontSize: 12, color: colors.textSecondary },
  footerLink: { fontSize: 12, color: colors.primary, fontWeight: '600', marginTop: 2 },
});
