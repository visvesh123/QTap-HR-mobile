import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  if (!user) return null;

  const performSignOut = async () => {
    setSigningOut(true);
    try {
      await logout();
    } catch (e) {
      console.warn('logout error', e);
    } finally {
      setConfirmOpen(false);
      setSigningOut(false);
    }
    router.replace('/login');
  };

  const onLogout = () => setConfirmOpen(true);

  const initials = user.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  const idLabel = user.role === 'student' ? user.student_id : user.employee_id;

  const menu = [
    { icon: 'person-outline', label: 'Account Information', onPress: () => {} },
    { icon: 'qr-code-outline', label: 'My Gate Pass / RFID', onPress: () => router.push('/modules/gate') },
    { icon: 'document-text-outline', label: 'Documents & Certificates', onPress: () => router.push('/modules/certificates') },
    { icon: 'lock-closed-outline', label: 'Security & Privacy', onPress: () => {} },
    { icon: 'help-circle-outline', label: 'Help & Support', onPress: () => {} },
    { icon: 'information-circle-outline', label: 'About MUOne', onPress: () => {} },
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

      <Modal
        visible={confirmOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="log-out-outline" size={28} color={colors.sos} />
            </View>
            <Text style={styles.modalTitle}>Sign out?</Text>
            <Text style={styles.modalSub}>You'll need to sign in again to access MUOne.</Text>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                onPress={() => setConfirmOpen(false)}
                style={[styles.modalBtn, styles.modalBtnCancel]}
                testID="logout-cancel"
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={performSignOut}
                disabled={signingOut}
                style={[styles.modalBtn, styles.modalBtnConfirm]}
                testID="logout-confirm"
              >
                <Text style={styles.modalBtnConfirmText}>
                  {signingOut ? 'Signing out…' : 'Sign Out'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadow.cardHeavy,
  },
  modalIconWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#FEE2E2',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: { fontSize: 19, fontWeight: '800', color: colors.text },
  modalSub: {
    fontSize: 13, color: colors.textSecondary,
    marginTop: 6, textAlign: 'center', lineHeight: 18,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancel: { backgroundColor: '#F1F5F9' },
  modalBtnCancelText: { color: colors.text, fontWeight: '700', fontSize: 14 },
  modalBtnConfirm: { backgroundColor: colors.sos },
  modalBtnConfirmText: { color: colors.white, fontWeight: '700', fontSize: 14 },
});
