import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, radii, shadow, spacing, BRAND } from '../src/theme';

const ROLES = [
  {
    key: 'student',
    label: 'Student',
    icon: 'school',
    iconLib: 'mci' as const,
    description: 'Hall tickets, library, hostel, events, wallet & more',
    gradient: ['#B71429', '#E31837'] as [string, string],
  },
  {
    key: 'staff',
    label: 'Staff',
    icon: 'account-tie',
    iconLib: 'mci' as const,
    description: 'Faculty, Librarian, Warden, Security, Exam Cell',
    gradient: ['#1F2937', '#374151'] as [string, string],
  },
  {
    key: 'admin',
    label: 'Admin',
    icon: 'shield-crown',
    iconLib: 'mci' as const,
    description: 'University-wide oversight, analytics & operations',
    gradient: ['#92400E', '#D4A017'] as [string, string],
  },
];

export default function RoleSelect() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Image source={{ uri: BRAND.logoUrl }} style={styles.muLogo} resizeMode="contain" />
          </View>
          <Text style={styles.brand}>{BRAND.name.toUpperCase()}</Text>
          <Text style={styles.welcome}>Welcome 👋</Text>
          <Text style={styles.tagline}>Sign in to continue as</Text>
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
          <View style={styles.poweredRow}>
            <Text style={styles.poweredText}>Powered by</Text>
            <Image source={{ uri: BRAND.poweredByLogoUrl }} style={styles.qtapLogo} resizeMode="contain" />
          </View>
          <Text style={styles.deptText}>{BRAND.poweredByDescription}</Text>
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
    width: 72, height: 72, borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  muLogo: { width: 50, height: 50 },
  logoLetter: { fontSize: 38, fontWeight: '900', color: colors.white, letterSpacing: -1, marginTop: -4 },
  brand: { fontSize: 13, fontWeight: '800', color: colors.primary, letterSpacing: 2 },
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
  poweredRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.border,
    width: '100%', justifyContent: 'center',
  },
  poweredText: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  qtapLogo: { width: 60, height: 20 },
  deptText: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
});
