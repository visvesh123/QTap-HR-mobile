import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/auth';
import { AB, AB_SHADOW } from '../../src/components/ExploreUI';

const PASS_STACK = [
  'https://images.unsplash.com/photo-1562774053-701939374585?w=400',
  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400',
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400',
];
const FACE_STACK = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120',
  'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=120',
];

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
  const clean = user.name.replace(/^(Dr\.?|Mr\.?|Mrs\.?|Ms\.?|Prof\.?|Mx\.?)\s+/i, '').trim();
  const parts = clean.split(' ');
  const firstName = parts[0] || user.name;
  const restName = parts.slice(1).join(' ');
  const location = [user.department || user.school, 'Mahindra University'].filter(Boolean)[0];
  const idLabel = user.employee_id || user.qid || user.student_id;
  const yearLabel = user.batch || (user.date_of_admission
    ? `${new Date().getFullYear() - new Date(user.date_of_admission).getFullYear() || 1} yrs`
    : 'MUOne');
  const roleLabel = user.role === 'admin' ? 'Admin' : user.role === 'student' ? 'Student' : 'Staff';

  const group1 = [
    { icon: 'settings-outline' as const, label: 'Account settings', onPress: () => {} },
    { icon: 'help-circle-outline' as const, label: 'Get help', onPress: () => {} },
    { icon: 'person-outline' as const, label: 'View profile', onPress: () => {} },
    { icon: 'hand-left-outline' as const, label: 'Privacy', onPress: () => {} },
  ];
  const group2 = [
    { icon: 'qr-code-outline' as const, label: 'Gate Pass / RFID', onPress: () => router.push('/modules/gate') },
    { icon: 'document-text-outline' as const, label: 'Documents & certificates', onPress: () => router.push('/modules/certificates') },
    { icon: 'notifications-outline' as const, label: 'Notifications', onPress: () => router.push('/(tabs)/alerts') },
    { icon: 'information-circle-outline' as const, label: 'About MUOne', onPress: () => {} },
    { icon: 'log-out-outline' as const, label: 'Log out', onPress: () => setConfirmOpen(true) },
  ];

  const Row = ({ r, testID, last }: { r: typeof group1[number]; testID: string; last?: boolean }) => (
    <TouchableOpacity
      style={[styles.row, last && { borderBottomWidth: 0 }]}
      activeOpacity={0.7}
      onPress={r.onPress}
      testID={testID}
    >
      <Ionicons name={r.icon} size={22} color={AB.ink} />
      <Text style={styles.rowLabel}>{r.label}</Text>
      <Ionicons name="chevron-forward" size={16} color={AB.muted} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Text style={styles.pageTitle}>Profile</Text>
          <TouchableOpacity style={styles.bell} onPress={() => router.push('/(tabs)/alerts')} testID="profile-more">
            <Ionicons name="notifications-outline" size={20} color={AB.ink} />
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard} testID="profile-avatar">
          <View style={styles.heroLeft}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatarClip}>
                {user.avatar
                  ? <Image source={{ uri: user.avatar }} style={styles.avatarImg} />
                  : <Text style={styles.avatarText}>{initials}</Text>}
              </View>
              <View style={styles.verified}>
                <Ionicons name="checkmark" size={12} color={AB.white} />
              </View>
            </View>
            <Text style={styles.heroName} numberOfLines={1}>{firstName}</Text>
            <Text style={styles.heroLoc} numberOfLines={1}>{location}</Text>
          </View>
          <View style={styles.heroStats}>
            <View style={styles.statBlock}>
              <Text style={styles.statNum}>{roleLabel}</Text>
              <Text style={styles.statLbl}>Role</Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={styles.statNum} numberOfLines={1}>{idLabel || '—'}</Text>
              <Text style={styles.statLbl}>{user.employee_id ? 'Employee ID' : user.student_id ? 'Student ID' : 'ID'}</Text>
            </View>
            <View style={[styles.statBlock, { borderBottomWidth: 0 }]}>
              <Text style={styles.statNum} numberOfLines={1}>{yearLabel}</Text>
              <Text style={styles.statLbl}>{user.batch ? 'Batch' : restName ? 'Campus' : 'On MUOne'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.miniRow}>
          <TouchableOpacity style={styles.miniCard} activeOpacity={0.85} onPress={() => router.push('/modules/gate')} testID="profile-row-1">
            <View style={styles.stack}>
              {PASS_STACK.map((uri, i) => (
                <Image key={uri} source={{ uri }} style={[styles.stackImg, { left: i * 10, zIndex: 3 - i, transform: [{ rotate: `${(i - 1) * 6}deg` }] }]} />
              ))}
            </View>
            <Text style={styles.miniLabel}>Campus pass</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.miniCard} activeOpacity={0.85} onPress={() => router.push('/modules/events')} testID="profile-row-2">
            <View style={styles.faces}>
              {FACE_STACK.map((uri, i) => (
                <Image key={uri} source={{ uri }} style={[styles.face, { marginLeft: i === 0 ? 0 : -10, zIndex: i }]} />
              ))}
            </View>
            <Text style={styles.miniLabel}>Connections</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.promo} activeOpacity={0.9} onPress={() => router.push('/modules/tickets')} testID="profile-row-0">
          <View style={styles.promoArt}>
            <Ionicons name="ticket-outline" size={28} color={AB.red} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.promoTitle}>Need campus help?</Text>
            <Text style={styles.promoSub}>Raise a ticket and we will get it sorted.</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.menu}>
          {group1.map((r, i) => (
            <Row key={r.label} r={r} testID={`settings-row-${i}`} last={i === group1.length - 1} />
          ))}
        </View>
        <View style={styles.menuDivider} />
        <View style={styles.menu}>
          {group2.map((r, i) => (
            <Row
              key={r.label}
              r={r}
              testID={r.label === 'Log out' ? 'logout-btn' : `settings-row-${i + 4}`}
              last={i === group2.length - 1}
            />
          ))}
        </View>
      </ScrollView>

      <Modal visible={confirmOpen} transparent animationType="fade" onRequestClose={() => setConfirmOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="log-out-outline" size={28} color={AB.red} />
            </View>
            <Text style={styles.modalTitle}>Log out?</Text>
            <Text style={styles.modalSub}>{"You'll need to sign in again to access MUOne."}</Text>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity onPress={() => setConfirmOpen(false)} style={[styles.modalBtn, styles.modalBtnCancel]} testID="logout-cancel">
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={performSignOut} disabled={signingOut} style={[styles.modalBtn, styles.modalBtnConfirm]} testID="logout-confirm">
                <Text style={styles.modalBtnConfirmText}>{signingOut ? 'Signing out…' : 'Log out'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const CARD = {
  backgroundColor: AB.white,
  borderRadius: 24,
  ...AB_SHADOW,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F7' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12, backgroundColor: '#F7F7F7',
  },
  pageTitle: { fontSize: 32, fontWeight: '700', color: AB.ink, letterSpacing: -0.8 },
  bell: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: AB.white,
    alignItems: 'center', justifyContent: 'center',
    ...AB_SHADOW,
  },

  heroCard: {
    ...CARD,
    marginHorizontal: 24, padding: 22,
    flexDirection: 'row', alignItems: 'center',
  },
  heroLeft: { width: 140, alignItems: 'center' },
  avatarWrap: {
    width: 88, height: 88, alignItems: 'center', justifyContent: 'center',
  },
  avatarClip: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: '#EEE',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatarImg: { width: 88, height: 88, borderRadius: 44 },
  avatarText: { fontSize: 32, fontWeight: '700', color: AB.red },
  verified: {
    position: 'absolute', right: 2, bottom: 2, width: 22, height: 22, borderRadius: 11,
    backgroundColor: AB.red, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: AB.white,
  },
  heroName: { fontSize: 18, fontWeight: '700', color: AB.ink, marginTop: 10 },
  heroLoc: { fontSize: 13, color: AB.muted, marginTop: 2, textAlign: 'center' },
  heroStats: { flex: 1, paddingLeft: 8 },
  statBlock: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: AB.line,
  },
  statNum: { fontSize: 16, fontWeight: '700', color: AB.ink },
  statLbl: { fontSize: 12, color: AB.muted, marginTop: 2 },

  miniRow: { flexDirection: 'row', gap: 12, marginHorizontal: 24, marginTop: 14 },
  miniCard: {
    ...CARD, flex: 1, padding: 16, minHeight: 132, justifyContent: 'space-between',
  },
  stack: { height: 56, marginLeft: 8, marginTop: 4 },
  stackImg: {
    position: 'absolute', width: 48, height: 48, borderRadius: 10, backgroundColor: AB.field,
    borderWidth: 1.5, borderColor: AB.white,
  },
  faces: { flexDirection: 'row', alignItems: 'center', height: 56, paddingTop: 8 },
  face: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: AB.white, backgroundColor: AB.field },
  miniLabel: { fontSize: 15, fontWeight: '700', color: AB.ink, marginTop: 12 },

  promo: {
    ...CARD, marginHorizontal: 24, marginTop: 14,
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16,
  },
  promoArt: {
    width: 56, height: 56, borderRadius: 16, backgroundColor: AB.redSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  promoTitle: { fontSize: 16, fontWeight: '700', color: AB.ink },
  promoSub: { fontSize: 13, color: AB.muted, marginTop: 4, lineHeight: 18 },

  menu: { marginTop: 8, paddingHorizontal: 24, backgroundColor: 'transparent' },
  menuDivider: { height: StyleSheet.hairlineWidth, backgroundColor: AB.line, marginHorizontal: 24, marginVertical: 4 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: AB.line,
  },
  rowLabel: { flex: 1, fontSize: 16, fontWeight: '400', color: AB.ink },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { width: '100%', maxWidth: 380, backgroundColor: AB.white, borderRadius: 16, padding: 24, alignItems: 'center', ...AB_SHADOW },
  modalIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: AB.redSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: AB.ink },
  modalSub: { fontSize: 14, color: AB.muted, marginTop: 6, textAlign: 'center', lineHeight: 20 },
  modalBtnRow: { flexDirection: 'row', gap: 10, marginTop: 22, width: '100%' },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  modalBtnCancel: { backgroundColor: AB.field },
  modalBtnCancelText: { color: AB.ink, fontWeight: '600', fontSize: 15 },
  modalBtnConfirm: { backgroundColor: AB.red },
  modalBtnConfirmText: { color: AB.white, fontWeight: '600', fontSize: 15 },
});
