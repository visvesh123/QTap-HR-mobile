import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/auth';
import { colors, radii, shadow, spacing, typo } from '../../src/theme';
import { Card, Badge } from '../../src/ui';

export default function Profile() {
  const router = useRouter();
  const { user, logout } = useAuth();
  if (!user) return null;

  const onLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => { await logout(); router.replace('/role-select'); },
      },
    ]);
  };

  const initials = user.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  const idLabel = user.role === 'student' ? user.student_id : user.employee_id;

  const menu = [
    { icon: 'person-outline', label: 'Account Information', onPress: () => {} },
    { icon: 'qr-code-outline', label: 'My Gate Pass / RFID', onPress: () => router.push('/modules/gate') },
    { icon: 'document-text-outline', label: 'Documents & Certificates', onPress: () => router.push('/modules/certificates') },
    { icon: 'lock-closed-outline', label: 'Security & Privacy', onPress: () => {} },
    { icon: 'help-circle-outline', label: 'Help & Support', onPress: () => {} },
    { icon: 'information-circle-outline', label: 'About Campus Hub', onPress: () => {} },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <LinearGradient
          colors={[colors.primaryDark, colors.primaryLight]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.avatar} testID="profile-avatar">
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <Badge label={user.role.toUpperCase()} color={colors.gold} bg="rgba(245,166,35,0.18)" />
            {!!user.department && <Badge label={user.department} color={colors.white} bg="rgba(255,255,255,0.22)" />}
          </View>
          {!!idLabel && (
            <View style={styles.idCard}>
              <Text style={styles.idLabel}>ID NUMBER</Text>
              <Text style={styles.idValue}>{idLabel}</Text>
            </View>
          )}
        </LinearGradient>

        <View style={{ padding: spacing.md, gap: spacing.sm }}>
          {menu.map((m, i) => (
            <TouchableOpacity
              key={m.label}
              activeOpacity={0.7}
              onPress={m.onPress}
              testID={`menu-${i}`}
            >
              <Card>
                <View style={styles.menuRow}>
                  <View style={styles.menuIcon}>
                    <Ionicons name={m.icon as any} size={20} color={colors.primary} />
                  </View>
                  <Text style={styles.menuLabel}>{m.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </View>
              </Card>
            </TouchableOpacity>
          ))}

          <TouchableOpacity onPress={onLogout} activeOpacity={0.8} testID="logout-btn" style={styles.logout}>
            <Ionicons name="log-out-outline" size={20} color={colors.sos} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  hero: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: colors.white },
  name: { fontSize: 22, fontWeight: '800', color: colors.white, marginTop: 12 },
  email: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  idCard: {
    marginTop: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: radii.md,
  },
  idLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.85)', letterSpacing: 1.5 },
  idValue: { fontSize: 16, fontWeight: '700', color: colors.white, marginTop: 2 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  menuIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primaryBg,
    alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text },
  logout: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#FEE2E2', borderRadius: radii.md, padding: spacing.md, marginTop: spacing.md,
  },
  logoutText: { color: colors.sos, fontWeight: '700', fontSize: 15 },
});
