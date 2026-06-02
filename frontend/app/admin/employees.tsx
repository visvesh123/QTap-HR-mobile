import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AdminShell } from '../../src/components/AdminShell';
import { Surface, Pill, OutlineButton } from '../../src/components/admin-ui';
import { colors, radii } from '../../src/theme';
import { api } from '../../src/api';
import { useAuth } from '../../src/auth';

const ROLE_COLOR: Record<string, string> = { student: '#3B82F6', staff: '#16A34A', admin: '#DC2626' };

export default function AdminEmployees() {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.q = search;
      if (roleFilter !== 'all') params.role = roleFilter;
      const r = await api.adminEmployees(params);
      setItems(r);
    } catch { setItems([]); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'admin') { router.replace('/(tabs)'); return; }
    load();
  }, [user]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [search, roleFilter]);

  const byRole = useMemo(() => {
    const m = { student: 0, staff: 0, admin: 0 };
    items.forEach((i) => { (m as any)[i.role] = ((m as any)[i.role] || 0) + 1; });
    return m;
  }, [items]);

  return (
    <AdminShell title="Employee Management" subtitle={`${items.length} records · ${byRole.student} students, ${byRole.staff} staff, ${byRole.admin} admins`}>
      <Surface>
        <View style={styles.toolbar}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={16} color={colors.textMuted} />
            <TextInput
              placeholder="Search by name, email, employee ID…"
              value={search} onChangeText={setSearch}
              style={styles.searchInput}
              placeholderTextColor={colors.textMuted}
              testID="emp-search"
            />
          </View>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {[
              { id: 'all', label: 'All', color: colors.text },
              { id: 'staff', label: 'Staff', color: '#16A34A' },
              { id: 'student', label: 'Students', color: '#3B82F6' },
              { id: 'admin', label: 'Admins', color: '#DC2626' },
            ].map((o) => {
              const active = roleFilter === o.id;
              return (
                <TouchableOpacity
                  key={o.id}
                  onPress={() => setRoleFilter(o.id)}
                  style={[styles.chip, active && { backgroundColor: o.color }]}
                  testID={`role-${o.id}`}
                >
                  <Text style={[styles.chipText, active && { color: colors.white }]}>{o.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={{ flex: 1 }} />
          <OutlineButton label="Refresh" icon="refresh" onPress={load} />
        </View>
      </Surface>

      <View style={{ flexDirection: 'row', gap: 16, marginTop: 16 }}>
        <Surface style={{ flex: 2 }}>
          <View style={styles.thead}>
            <Text style={[styles.th, { flex: 2 }]}>Name</Text>
            <Text style={[styles.th, { flex: 1 }]}>Role</Text>
            <Text style={[styles.th, { flex: 1.5 }]}>Department</Text>
            <Text style={[styles.th, { flex: 1 }]}>ID</Text>
            <Text style={[styles.th, { flex: 0.6 }]}></Text>
          </View>
          {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />}
          {items.map((r, i) => (
            <TouchableOpacity
              key={r.id}
              onPress={() => setSelected(r)}
              style={[styles.tr, i % 2 === 0 && { backgroundColor: '#F8FAFC' }, selected?.id === r.id && { backgroundColor: colors.primaryBg }]}
              activeOpacity={0.7}
              testID={`emp-row-${r.id}`}
            >
              <View style={[styles.td, { flex: 2 }]}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{(r.name || '?').split(' ').map((x: string) => x[0]).slice(0, 2).join('')}</Text>
                </View>
                <View>
                  <Text style={styles.tdName}>{r.name}</Text>
                  <Text style={styles.tdMeta}>{r.email}</Text>
                </View>
              </View>
              <View style={[styles.td, { flex: 1 }]}>
                <Pill label={r.role} color={ROLE_COLOR[r.role] || colors.primary} />
              </View>
              <Text style={[styles.tdText, { flex: 1.5 }]}>{r.department || '—'}</Text>
              <Text style={[styles.tdText, { flex: 1 }]}>{r.employee_id || r.student_id || '—'}</Text>
              <View style={[styles.td, { flex: 0.6, justifyContent: 'flex-end' }]}>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </View>
            </TouchableOpacity>
          ))}
          {!loading && !items.length && (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <MaterialCommunityIcons name="account-search-outline" size={36} color={colors.textMuted} />
              <Text style={styles.empty}>No employees match your filters.</Text>
            </View>
          )}
        </Surface>

        {/* Detail drawer */}
        <Surface style={{ flex: 1, minWidth: 280 }}>
          {selected ? (
            <View>
              <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                <View style={[styles.avatar, { width: 64, height: 64, borderRadius: 32, marginBottom: 8 }]}>
                  <Text style={[styles.avatarText, { fontSize: 20 }]}>{(selected.name || '?').split(' ').map((x: string) => x[0]).slice(0, 2).join('')}</Text>
                </View>
                <Text style={styles.detName}>{selected.name}</Text>
                <Text style={styles.detMeta}>{selected.email}</Text>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                  <Pill label={selected.role} color={ROLE_COLOR[selected.role] || colors.primary} />
                  {selected.department && <Pill label={selected.department} color={colors.textSecondary} />}
                </View>
              </View>
              <DetailRow label="Employee ID" value={selected.employee_id || selected.student_id || '—'} />
              <DetailRow label="Phone" value={selected.phone || '—'} />
              <DetailRow label="Joined" value={selected.joined_at?.slice(0, 10) || '—'} />
              <DetailRow label="Department" value={selected.department || '—'} />
              <DetailRow label="Wallet Balance" value={selected.wallet_balance != null ? `₹ ${selected.wallet_balance}` : '—'} />
              <DetailRow label="Reward Points" value={selected.reward_points ?? '—'} />
            </View>
          ) : (
            <View style={{ alignItems: 'center', padding: 30 }}>
              <MaterialCommunityIcons name="account-arrow-left-outline" size={36} color={colors.textMuted} />
              <Text style={styles.empty}>Select an employee to view details.</Text>
            </View>
          )}
        </Surface>
      </View>
    </AdminShell>
  );
}

const DetailRow = ({ label, value }: any) => (
  <View style={styles.detRow}>
    <Text style={styles.detLabel}>{label}</Text>
    <Text style={styles.detValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  toolbar: { flexDirection: 'row', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.background, borderRadius: radii.md,
    paddingHorizontal: 12, paddingVertical: 8, minWidth: 320, flex: 1,
  },
  searchInput: { flex: 1, fontSize: 13, color: colors.text, outlineStyle: 'none' as any },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  chipText: { color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  thead: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  th: { fontSize: 11, fontWeight: '800', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' },
  tr: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  td: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tdName: { fontSize: 13, fontWeight: '700', color: colors.text },
  tdMeta: { fontSize: 11, color: colors.textMuted },
  tdText: { fontSize: 12, color: colors.textSecondary },
  avatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 11, fontWeight: '800', color: colors.primary },
  empty: { color: colors.textMuted, marginTop: 8, fontSize: 13, textAlign: 'center' },
  detName: { fontSize: 16, fontWeight: '800', color: colors.text },
  detMeta: { fontSize: 11, color: colors.textMuted },
  detRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  detLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  detValue: { fontSize: 12, color: colors.text, fontWeight: '700' },
});
