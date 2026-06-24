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
  container: { flex: 1, backgroundColor: colors.background },
  segment: { flexDirection: 'row', gap: 8, padding: spacing.md, paddingBottom: spacing.sm },
  segBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 11, borderRadius: 999, backgroundColor: colors.steel50,
    borderWidth: 1, borderColor: colors.border,
  },
  segBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  segText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },

  label: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 6, marginTop: spacing.sm },
  input: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.white, borderRadius: radii.md,
    paddingHorizontal: 12, height: 48, marginBottom: spacing.xs,
    borderWidth: 1, borderColor: colors.border,
  },
  inputText: { flex: 1, fontSize: 14, color: colors.text },
  lookupRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  lookupBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primary, paddingHorizontal: 16, height: 48, borderRadius: radii.md,
    justifyContent: 'center', minWidth: 100,
  },
  lookupBtnText: { color: colors.white, fontWeight: '800', fontSize: 13 },

  profileCard: {
    backgroundColor: colors.clayMint, borderRadius: radii.lg, padding: spacing.md,
    marginTop: spacing.sm, borderWidth: 1, borderColor: '#BFE6CB',
  },
  profileHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.sm },
  profileAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center' },
  profileAvatarText: { color: colors.white, fontWeight: '800', fontSize: 15 },
  profileName: { fontSize: 15, fontWeight: '800', color: colors.steel900 },
  profileId: { fontSize: 12, color: '#15803D', fontWeight: '700', marginTop: 1 },
  profileGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  pField: { width: '50%', marginBottom: 10 },
  pFieldLabel: { fontSize: 10, fontWeight: '700', color: '#15803D', letterSpacing: 0.4, textTransform: 'uppercase' },
  pFieldValue: { fontSize: 13, fontWeight: '600', color: colors.steel800, marginTop: 2 },

  attachRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.md, opacity: 0.7 },
  attachText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  soonPill: { backgroundColor: colors.textMuted, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  soonText: { fontSize: 8.5, fontWeight: '900', color: colors.white, letterSpacing: 0.5 },

  note: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#EFF6FF', borderRadius: radii.md, padding: 10, marginTop: spacing.md },
  noteText: { flex: 1, fontSize: 12, color: colors.steel700 },

  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 999, alignItems: 'center', backgroundColor: colors.steel50, borderWidth: 1, borderColor: colors.border },
  cancelText: { fontSize: 15, fontWeight: '700', color: colors.textSecondary },
  createBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 999, backgroundColor: colors.primary },
  createText: { color: colors.white, fontSize: 15, fontWeight: '800' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(30,42,51,0.45)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.md, paddingBottom: spacing.xl },
  modalTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: spacing.sm, paddingHorizontal: 4 },
  modalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: colors.divider },
  modalRowText: { fontSize: 14, color: colors.text },

  ticketCard: { backgroundColor: colors.white, borderRadius: radii.lg, padding: spacing.md, ...shadow.card },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: spacing.md, paddingTop: spacing.xs },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  filterCount: { minWidth: 20, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 999, backgroundColor: colors.steel100, alignItems: 'center' },
  filterCountActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  filterCountText: { fontSize: 11, fontWeight: '800', color: colors.textSecondary },
  unreadDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.primary },
  ticketFootRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  updatedWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  newBadge: {
    fontSize: 9, fontWeight: '900', color: colors.white, letterSpacing: 0.5,
    backgroundColor: colors.primary, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, overflow: 'hidden',
  },
  ticketTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ticketNo: { fontSize: 13, fontWeight: '800', color: colors.primary, letterSpacing: 0.5 },
  tag: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  tagText: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.3 },
  ticketSubject: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 8 },
  journeyRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, flexWrap: 'wrap' },
  journeyChip: { fontSize: 11, fontWeight: '700', color: colors.steel600, backgroundColor: colors.steel50, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, overflow: 'hidden' },
  ticketDate: { fontSize: 11, color: colors.textMuted, marginTop: 8 },
});
