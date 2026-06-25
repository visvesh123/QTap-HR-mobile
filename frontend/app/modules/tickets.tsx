import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, Modal, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { api } from '../../src/api';
import { colors, radii, spacing, shadow } from '../../src/theme';
import { ScreenHeader, Empty } from '../../src/ui';

/* ───────────── Palette (matches Services / Home) ───────────── */
const C = {
  bg: '#FFFFFF',
  ink: '#15171C',
  inkSoft: '#3A3F47',
  muted: '#8A9099',
  field: '#F2F3F5',
  white: '#FFFFFF',
  red: '#DC143C',
  redDark: '#A8102F',
  line: '#ECEDEF',
};
const SOFT = Platform.select({
  web: { boxShadow: '0 4px 14px rgba(20,23,28,0.06)' } as any,
  default: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 2 },
});

export const STATUS_COLOR: Record<string, string> = {
  Open: '#3B82F6', 'In Progress': '#F59E0B', Resolved: '#16A34A', Closed: '#6E8493',
};
export const PRIORITY_COLOR: Record<string, string> = {
  Low: '#16A34A', Medium: '#3B82F6', High: '#F59E0B', Urgent: '#DC143C',
};

export function fmtDateTime(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
}

export function timeAgo(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso).getTime();
  if (isNaN(d)) return '';
  const s = Math.max(0, Math.floor((Date.now() - d) / 1000));
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const dd = Math.floor(h / 24); if (dd < 30) return `${dd}d ago`;
  const mo = Math.floor(dd / 30); if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

export default function Tickets() {
  const router = useRouter();
  const [tab, setTab] = useState<'raise' | 'my'>('raise');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Tickets" subtitle="Raise & track requests" onBack={() => router.back()} />
      <View style={styles.segment}>
        {(['raise', 'my'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.segBtn, tab === t && styles.segBtnActive]}
            onPress={() => setTab(t)}
            activeOpacity={0.85}
            testID={`tickets-tab-${t}`}
          >
            <MaterialCommunityIcons
              name={t === 'raise' ? 'plus-circle-outline' : 'ticket-confirmation-outline'}
              size={16}
              color={tab === t ? colors.white : colors.textSecondary}
            />
            <Text style={[styles.segText, tab === t && { color: colors.white }]}>
              {t === 'raise' ? 'Raise a Ticket' : 'My Tickets'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'raise' ? <RaiseForm onCreated={() => setTab('my')} /> : <MyTickets router={router} />}
    </SafeAreaView>
  );
}

// ---------------- Raise a Ticket ----------------
function RaiseForm({ onCreated }: { onCreated: () => void }) {
  const [profile, setProfile] = useState<any>(null);
  const [dept, setDept] = useState('');
  const [deptOpen, setDeptOpen] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try { setProfile(await api.ticketLookup()); } catch {}
      try { setDepartments(await api.ticketDepartments()); } catch {}
    })();
  }, []);

  const create = async () => {
    if (!dept) { Alert.alert('Department required', 'Please select a department.'); return; }
    if (!subject.trim()) { Alert.alert('Subject required', 'Please enter a subject.'); return; }
    if (!description.trim()) { Alert.alert('Description required', 'Please describe your issue.'); return; }
    setSubmitting(true);
    try {
      await api.createTicket({ subject: subject.trim(), description: description.trim(), department: dept, requester: profile });
      setSubject(''); setDescription(''); setDept('');
      Alert.alert('Ticket created', 'Your ticket has been raised successfully.');
      onCreated();
    } catch (e: any) {
      Alert.alert('Could not create', e.message || 'Please try again.');
    } finally { setSubmitting(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }} keyboardShouldPersistTaps="handled">
        {/* Requester — auto-loaded from your account */}
        <Text style={styles.label}>Requester</Text>
        {profile && (
          <View style={[styles.profileCard, { marginTop: 0 }]} testID="ticket-profile-card">
            <View style={styles.profileHead}>
              <View style={styles.profileAvatar}>
                <Text style={styles.profileAvatarText}>
                  {String(profile.name || '?').split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.profileName}>{profile.name}</Text>
                <Text style={styles.profileId}>{profile.id}</Text>
              </View>
              <Ionicons name="checkmark-circle" size={22} color="#16A34A" />
            </View>
            <View style={styles.profileGrid}>
              <ProfileField label="Program" value={profile.program} />
              <ProfileField label="Department" value={profile.department} />
              <ProfileField label="Year" value={profile.year} />
              <ProfileField label="Mobile" value={profile.mobile} />
              <ProfileField label="Email" value={profile.email} full />
            </View>
          </View>
        )}

        {/* Department */}
        <Text style={styles.label}>Department</Text>
        <TouchableOpacity style={styles.input} onPress={() => setDeptOpen(true)} activeOpacity={0.8} testID="ticket-dept-select">
          <MaterialCommunityIcons name="office-building-outline" size={16} color={colors.textMuted} />
          <Text style={[styles.inputText, { color: dept ? colors.text : colors.textMuted }]}>
            {dept || 'Select department'}
          </Text>
          <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Subject */}
        <Text style={styles.label}>Subject</Text>
        <View style={styles.input}>
          <MaterialCommunityIcons name="format-title" size={16} color={colors.textMuted} />
          <TextInput
            style={styles.inputText}
            value={subject}
            onChangeText={setSubject}
            placeholder="Brief subject"
            placeholderTextColor={colors.textMuted}
            testID="ticket-subject-input"
          />
        </View>

        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <View style={[styles.input, { alignItems: 'flex-start', height: 110, paddingVertical: 10 }]}>
          <TextInput
            style={[styles.inputText, { height: '100%' }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your issue in detail"
            placeholderTextColor={colors.textMuted}
            multiline
            testID="ticket-desc-input"
          />
        </View>

        {/* Attach file — soon */}
        <View style={styles.attachRow}>
          <Ionicons name="attach" size={18} color={colors.textMuted} />
          <Text style={styles.attachText}>Attach file</Text>
          <View style={styles.soonPill}><Text style={styles.soonText}>SOON</Text></View>
        </View>

        {/* Channel note */}
        <View style={styles.note}>
          <Ionicons name="information-circle-outline" size={16} color={colors.info} />
          <Text style={styles.noteText}>Channel is auto-set to <Text style={{ fontWeight: '800' }}>Portal</Text> for tickets raised here.</Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => { setSubject(''); setDescription(''); setDept(''); }} activeOpacity={0.85} testID="ticket-cancel-btn">
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.createBtn, submitting && { opacity: 0.7 }]} onPress={create} disabled={submitting} activeOpacity={0.9} testID="ticket-create-btn">
            {submitting ? <ActivityIndicator color={colors.white} /> : (
              <>
                <Ionicons name="add-circle-outline" size={17} color={colors.white} />
                <Text style={styles.createText}>Create Ticket</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Department picker modal */}
      <Modal visible={deptOpen} transparent animationType="fade" onRequestClose={() => setDeptOpen(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setDeptOpen(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Select Department</Text>
            <ScrollView style={{ maxHeight: 340 }}>
              {departments.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={styles.modalRow}
                  onPress={() => { setDept(d); setDeptOpen(false); }}
                  activeOpacity={0.7}
                  testID={`dept-option-${d}`}
                >
                  <Text style={[styles.modalRowText, dept === d && { color: colors.primary, fontWeight: '800' }]}>{d}</Text>
                  {dept === d && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function ProfileField({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <View style={[styles.pField, full && { width: '100%' }]}>
      <Text style={styles.pFieldLabel}>{label}</Text>
      <Text style={styles.pFieldValue} numberOfLines={1}>{value || '—'}</Text>
    </View>
  );
}

// ---------------- My Tickets ----------------
const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'closed', label: 'Closed' },
] as const;
type FilterKey = typeof FILTERS[number]['key'];

function MyTickets({ router }: { router: any }) {
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<any[]>([]);
  const [filter, setFilter] = useState<FilterKey>('all');

  const load = useCallback(async () => {
    try { setTickets(await api.ticketsList()); } catch {}
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) return <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />;

  const counts = {
    all: tickets.length,
    open: tickets.filter((t) => t.status !== 'Closed').length,
    closed: tickets.filter((t) => t.status === 'Closed').length,
  };
  const visible = tickets.filter((t) =>
    filter === 'all' ? true : filter === 'closed' ? t.status === 'Closed' : t.status !== 'Closed');

  return (
    <View style={{ flex: 1 }}>
      {/* Status filter */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
            activeOpacity={0.8}
            testID={`ticket-filter-${f.key}`}
          >
            <Text style={[styles.filterText, filter === f.key && { color: colors.white }]}>{f.label}</Text>
            <View style={[styles.filterCount, filter === f.key && styles.filterCountActive]}>
              <Text style={[styles.filterCountText, filter === f.key && { color: colors.white }]}>{counts[f.key]}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xxl, gap: spacing.sm }}>
        {visible.length === 0 ? (
          <Empty icon="ticket-outline" message={filter === 'all' ? 'No tickets yet. Raise one to get started.' : `No ${filter} tickets.`} />
        ) : visible.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={styles.ticketCard}
            onPress={() => router.push(`/modules/ticket-detail?id=${t.id}`)}
            activeOpacity={0.85}
            testID={`ticket-${t.id}`}
          >
            <View style={styles.ticketTop}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {t.unread && <View style={styles.unreadDot} testID={`ticket-unread-${t.id}`} />}
                <Text style={styles.ticketNo}>{t.ticket_no}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {!!t.priority && (
                  <View style={[styles.tag, { backgroundColor: `${PRIORITY_COLOR[t.priority] || colors.textMuted}1A` }]}>
                    <Text style={[styles.tagText, { color: PRIORITY_COLOR[t.priority] || colors.textMuted }]}>{t.priority}</Text>
                  </View>
                )}
                <View style={[styles.tag, { backgroundColor: `${STATUS_COLOR[t.status] || colors.textMuted}1A` }]}>
                  <Text style={[styles.tagText, { color: STATUS_COLOR[t.status] || colors.textMuted }]}>{t.status}</Text>
                </View>
              </View>
            </View>
            <Text style={[styles.ticketSubject, t.unread && { fontWeight: '800' }]} numberOfLines={1}>{t.subject}</Text>
            <View style={styles.journeyRow}>
              {(t.journey || []).map((j: string, i: number) => (
                <React.Fragment key={`${j}-${i}`}>
                  {i > 0 && <Ionicons name="chevron-forward" size={11} color={colors.textMuted} />}
                  <Text style={styles.journeyChip}>{j}</Text>
                </React.Fragment>
              ))}
            </View>
            <View style={styles.ticketFootRow}>
              <View style={styles.updatedWrap}>
                <Ionicons name="time-outline" size={12} color={t.unread ? colors.primary : colors.textMuted} />
                <Text style={[styles.ticketDate, t.unread && { color: colors.primary, fontWeight: '700' }]}>Updated {timeAgo(t.updated_at)}</Text>
              </View>
              {t.unread && <Text style={styles.newBadge}>NEW</Text>}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  segment: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: spacing.sm, paddingBottom: spacing.sm },
  segBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 13, borderRadius: 16, backgroundColor: C.field,
  },
  segBtnActive: { backgroundColor: C.red },
  segText: { fontSize: 13.5, fontWeight: '700', color: C.inkSoft },

  label: { fontSize: 12.5, fontWeight: '700', color: C.inkSoft, marginBottom: 8, marginTop: spacing.md },
  input: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.field, borderRadius: 16,
    paddingHorizontal: 14, height: 54, marginBottom: spacing.xs,
  },
  inputText: { flex: 1, fontSize: 15, color: C.ink },
  lookupRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  lookupBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.red, paddingHorizontal: 16, height: 54, borderRadius: 16,
    justifyContent: 'center', minWidth: 100,
  },
  lookupBtnText: { color: C.white, fontWeight: '800', fontSize: 13 },

  profileCard: {
    backgroundColor: C.field, borderRadius: 22, padding: spacing.md,
    marginTop: spacing.sm,
  },
  profileHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.sm },
  profileAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center' },
  profileAvatarText: { color: C.white, fontWeight: '800', fontSize: 16 },
  profileName: { fontSize: 16, fontWeight: '800', color: C.ink },
  profileId: { fontSize: 12.5, color: C.muted, fontWeight: '600', marginTop: 1 },
  profileGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  pField: { width: '50%', marginBottom: 10 },
  pFieldLabel: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 0.4, textTransform: 'uppercase' },
  pFieldValue: { fontSize: 13.5, fontWeight: '600', color: C.ink, marginTop: 2 },

  attachRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.md, opacity: 0.7 },
  attachText: { fontSize: 13, fontWeight: '600', color: C.muted },
  soonPill: { backgroundColor: C.muted, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  soonText: { fontSize: 8.5, fontWeight: '900', color: C.white, letterSpacing: 0.5 },

  note: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.field, borderRadius: 16, padding: 12, marginTop: spacing.md },
  noteText: { flex: 1, fontSize: 12.5, color: C.inkSoft },

  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  cancelBtn: { flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center', backgroundColor: C.field },
  cancelText: { fontSize: 15, fontWeight: '700', color: C.inkSoft },
  createBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 16, backgroundColor: C.red },
  createText: { color: C.white, fontSize: 15, fontWeight: '800' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(20,23,28,0.45)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: C.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: spacing.md, paddingBottom: spacing.xl },
  modalTitle: { fontSize: 17, fontWeight: '800', color: C.ink, marginBottom: spacing.sm, paddingHorizontal: 4 },
  modalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: C.line },
  modalRowText: { fontSize: 15, color: C.ink },

  ticketCard: { backgroundColor: C.white, borderRadius: 22, padding: spacing.md, ...SOFT },
  filterRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: spacing.xs },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999,
    backgroundColor: C.field,
  },
  filterChipActive: { backgroundColor: C.red },
  filterText: { fontSize: 13.5, fontWeight: '700', color: C.inkSoft },
  filterCount: { minWidth: 20, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 999, backgroundColor: '#E2E4E8', alignItems: 'center' },
  filterCountActive: { backgroundColor: 'rgba(255,255,255,0.28)' },
  filterCountText: { fontSize: 11, fontWeight: '800', color: C.inkSoft },
  unreadDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: C.red },
  ticketFootRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  updatedWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  newBadge: {
    fontSize: 9, fontWeight: '900', color: C.white, letterSpacing: 0.5,
    backgroundColor: C.red, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, overflow: 'hidden',
  },
  ticketTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ticketNo: { fontSize: 13, fontWeight: '800', color: C.red, letterSpacing: 0.5 },
  tag: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  tagText: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.3 },
  ticketSubject: { fontSize: 15.5, fontWeight: '700', color: C.ink, marginTop: 8 },
  journeyRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, flexWrap: 'wrap' },
  journeyChip: { fontSize: 11, fontWeight: '700', color: C.inkSoft, backgroundColor: C.field, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, overflow: 'hidden' },
  ticketDate: { fontSize: 11, color: colors.textMuted, marginTop: 8 },
});
