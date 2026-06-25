import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/auth';

/* ───────────── Palette (matches Home / Services) ───────────── */
const C = {
  bg: '#FFFFFF',
  ink: '#15171C',
  inkSoft: '#3A3F47',
  muted: '#9AA0A8',
  field: '#F2F3F5',
  white: '#FFFFFF',
  red: '#DC143C',
  redDark: '#A8102F',
};

const SOFT = Platform.select({
  web: { boxShadow: '0 2px 4px rgba(20,23,28,0.04), 0 8px 22px rgba(20,23,28,0.10)' } as any,
  default: { shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 14, elevation: 4 },
});

export default function Profile() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  if (!user) return null;

  const performSignOut = async () => {
    setSigningOut(true);
    try { await logout(); } catch (e) { console.warn('logout error', e); }
    finally { setConfirmOpen(false); setSigningOut(false); }
    router.replace('/login');
  };

  const initials = user.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  // Name without honorific → first word bold, remainder muted.
  const clean = user.name.replace(/^(Dr\.?|Mr\.?|Mrs\.?|Ms\.?|Prof\.?|Mx\.?)\s+/i, '').trim();
  const parts = clean.split(' ');
  const firstName = parts[0] || user.name;
  const restName = parts.slice(1).join(' ');

  const idLabel = user.employee_id || user.qid || user.student_id;
  const idTitle = user.employee_id ? 'EID' : user.qid ? 'QID' : 'ROLE';
  const idValue = idLabel || (user.role ? user.role.toUpperCase() : '—');

  const profileRows = [
    { icon: 'person-circle-outline', label: 'Manage account', color: C.red, bg: '#FCE7EC', onPress: () => {} },
    { icon: 'qr-code-outline', label: 'My Gate Pass / RFID', color: '#0EA5E9', bg: '#E2F2FC', onPress: () => router.push('/modules/gate') },
    { icon: 'document-text-outline', label: 'Documents & Certificates', color: '#16A34A', bg: '#E6F4EA', onPress: () => router.push('/modules/certificates') },
  ];
  const settingsRows = [
    { icon: 'notifications-outline', label: 'Notifications', color: '#7C3AED', bg: '#EFEAFB', onPress: () => router.push('/(tabs)/alerts') },
    { icon: 'shield-checkmark-outline', label: 'Security & Privacy', color: '#F59E0B', bg: '#FFF3E0', onPress: () => {} },
    { icon: 'help-circle-outline', label: 'Help & Support', color: '#0EA5E9', bg: '#E2F2FC', onPress: () => {} },
    { icon: 'information-circle-outline', label: 'About MUOne', color: '#6E8493', bg: '#EEF1F4', onPress: () => {} },
  ];

  const Row = ({ r, testID }: { r: any; testID: string }) => (
    <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={r.onPress} testID={testID}>
      <View style={[styles.rowIcon, { backgroundColor: '#FCE7EC' }]}>
        <Ionicons name={r.icon} size={22} color={C.red} />
      </View>
      <Text style={styles.rowLabel}>{r.label}</Text>
      <View style={styles.chevBox}>
        <Ionicons name="chevron-forward" size={16} color={C.inkSoft} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()} testID="profile-back">
            <Ionicons name="chevron-back" size={24} color={C.ink} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setConfirmOpen(true)} testID="profile-more">
            <Ionicons name="ellipsis-vertical" size={20} color={C.ink} />
          </TouchableOpacity>
        </View>

        {/* Avatar + meta */}
        <View style={styles.headRow}>
          <View style={styles.avatar} testID="profile-avatar">
            {user.avatar
              ? <Image source={{ uri: user.avatar }} style={styles.avatarImg} />
              : <Text style={styles.avatarText}>{initials}</Text>}
          </View>
          <View style={styles.metaWrap}>
            <Text style={styles.metaLabel}>{idTitle}</Text>
            <Text style={styles.metaValue}>{idValue}</Text>
          </View>
        </View>

        {/* Name */}
        <View style={styles.nameWrap}>
          <Text style={styles.nameFirst}>{firstName}</Text>
          {!!restName && <Text style={styles.nameRest}>{restName}</Text>}
          {!!user.department && <Text style={styles.subRole}>{user.department}{user.role ? ` · ${user.role}` : ''}</Text>}
        </View>

        {/* Profile section */}
        <Text style={styles.sectionH}>Profile</Text>
        <View style={styles.section}>
          {profileRows.map((r, i) => <Row key={r.label} r={r} testID={`profile-row-${i}`} />)}
        </View>

        {/* Settings section */}
        <Text style={styles.sectionH}>Settings</Text>
        <View style={styles.section}>
          {settingsRows.map((r, i) => <Row key={r.label} r={r} testID={`settings-row-${i}`} />)}
        </View>

        {/* Sign out */}
        <TouchableOpacity onPress={() => setConfirmOpen(true)} activeOpacity={0.85} style={styles.signOut} testID="logout-btn">
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Confirm modal */}
      <Modal visible={confirmOpen} transparent animationType="fade" onRequestClose={() => setConfirmOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="log-out-outline" size={28} color={C.red} />
            </View>
            <Text style={styles.modalTitle}>Sign out?</Text>
            <Text style={styles.modalSub}>{"You'll need to sign in again to access MUOne."}</Text>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity onPress={() => setConfirmOpen(false)} style={[styles.modalBtn, styles.modalBtnCancel]} testID="logout-cancel">
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={performSignOut} disabled={signingOut} style={[styles.modalBtn, styles.modalBtnConfirm]} testID="logout-confirm">
                <Text style={styles.modalBtnConfirmText}>{signingOut ? 'Signing out…' : 'Sign Out'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 6, paddingBottom: 4 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },

  headRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, marginTop: 8 },
  avatar: {
    width: 116, height: 116, borderRadius: 58, backgroundColor: C.field,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarText: { fontSize: 40, fontWeight: '800', color: C.red },
  metaWrap: { flex: 1, paddingLeft: 24 },
  metaLabel: { fontSize: 16, fontWeight: '500', color: C.muted },
  metaValue: { fontSize: 22, fontWeight: '800', color: C.ink, marginTop: 2, letterSpacing: -0.4 },

  nameWrap: { paddingHorizontal: 24, marginTop: 18 },
  nameFirst: { fontSize: 42, fontWeight: '800', color: C.ink, letterSpacing: -1.2, lineHeight: 46 },
  nameRest: { fontSize: 40, fontWeight: '700', color: C.muted, letterSpacing: -1, lineHeight: 46, marginTop: -2 },
  subRole: { fontSize: 14, fontWeight: '600', color: C.inkSoft, marginTop: 8 },

  sectionH: { fontSize: 22, fontWeight: '800', color: C.ink, letterSpacing: -0.4, paddingHorizontal: 24, marginTop: 30, marginBottom: 12 },
  section: { paddingHorizontal: 24, gap: 18 },

  row: { flexDirection: 'row', alignItems: 'center' },
  rowIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 18, fontWeight: '700', color: C.ink, marginLeft: 16, letterSpacing: -0.3 },
  chevBox: { width: 44, height: 36, borderRadius: 12, backgroundColor: C.field, alignItems: 'center', justifyContent: 'center' },

  signOut: {
    marginHorizontal: 24, marginTop: 36, height: 56, borderRadius: 16,
    backgroundColor: C.field, alignItems: 'center', justifyContent: 'center',
  },
  signOutText: { fontSize: 17, fontWeight: '800', color: C.red, letterSpacing: -0.2 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { width: '100%', maxWidth: 380, backgroundColor: C.white, borderRadius: 24, padding: 24, alignItems: 'center', ...SOFT },
  modalIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FCE7EC', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 19, fontWeight: '800', color: C.ink },
  modalSub: { fontSize: 13.5, color: C.inkSoft, marginTop: 6, textAlign: 'center', lineHeight: 19 },
  modalBtnRow: { flexDirection: 'row', gap: 10, marginTop: 22, width: '100%' },
  modalBtn: { flex: 1, paddingVertical: 15, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  modalBtnCancel: { backgroundColor: C.field },
  modalBtnCancelText: { color: C.ink, fontWeight: '700', fontSize: 14.5 },
  modalBtnConfirm: { backgroundColor: C.red },
  modalBtnConfirmText: { color: C.white, fontWeight: '700', fontSize: 14.5 },
});
