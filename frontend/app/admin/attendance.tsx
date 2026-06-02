import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AdminShell } from '../../src/components/AdminShell';
import { Surface, SectionTitle, Pill, OutlineButton, PrimaryButton } from '../../src/components/admin-ui';
import { colors, radii, shadow } from '../../src/theme';
import { api } from '../../src/api';
import { useAuth } from '../../src/auth';

const STATUS_COLOR: Record<string, string> = {
  present: '#16A34A', late: '#F59E0B', half_day: '#F97316', absent: '#94A3B8',
};

export default function AdminAttendance() {
  const router = useRouter();
  const { user } = useAuth();
  const [team, setTeam] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'admin') { router.replace('/(tabs)'); return; }
    (async () => {
      try {
        const t = await api.attendanceAdminToday().catch(() => null);
        setTeam(t);
      } finally { setLoading(false); }
    })();
  }, [user]);

  const filtered = useMemo(() => {
    const rows = team?.staff || [];
    return rows.filter((r: any) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (typeFilter !== 'all' && r.attendance_type !== typeFilter) return false;
      if (search && !`${r.name} ${r.department} ${r.employee_id || ''}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [team, search, statusFilter, typeFilter]);

  const exportCSV = () => {
    const header = ['Name', 'Employee ID', 'Department', 'Status', 'Type', 'Check-In', 'Check-Out', 'Geofence'];
    const rows = filtered.map((r: any) => [
      r.name, r.employee_id || '', r.department || '', r.status, r.attendance_type,
      r.check_in ? new Date(r.check_in).toLocaleTimeString() : '',
      r.check_out ? new Date(r.check_out).toLocaleTimeString() : '',
      r.geofence_name || '',
    ]);
    const csv = [header, ...rows].map((line) => line.map((c) => `"${(c || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <AdminShell title="Attendance Monitoring" subtitle={`Today · ${filtered.length} of ${team?.staff?.length || 0} staff shown`}>
      <Surface>
        <View style={styles.toolbar}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={16} color={colors.textMuted} />
            <TextInput
              placeholder="Search name, department, employee ID…"
              value={search} onChangeText={setSearch}
              style={styles.searchInput}
              placeholderTextColor={colors.textMuted}
              testID="attendance-search"
            />
          </View>
          <FilterChips
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { id: 'all', label: 'All Status' },
              { id: 'present', label: 'Present', color: '#16A34A' },
              { id: 'late', label: 'Late', color: '#F59E0B' },
              { id: 'absent', label: 'Absent', color: '#94A3B8' },
            ]}
          />
          <FilterChips
            value={typeFilter}
            onChange={setTypeFilter}
            options={[
              { id: 'all', label: 'All Type' },
              { id: 'office', label: 'Office' },
              { id: 'wfh', label: 'WFH' },
              { id: 'client_visit', label: 'Client' },
              { id: 'field', label: 'Field' },
            ]}
          />
          <View style={{ flex: 1 }} />
          <OutlineButton label="Export CSV" icon="download" onPress={exportCSV} testID="export-csv" />
        </View>
      </Surface>

      <Surface style={{ marginTop: 16 }}>
        <View style={styles.thead}>
          <Text style={[styles.th, { flex: 2 }]}>Employee</Text>
          <Text style={[styles.th, { flex: 1.5 }]}>Department</Text>
          <Text style={[styles.th, { flex: 1 }]}>Type</Text>
          <Text style={[styles.th, { flex: 1 }]}>Status</Text>
          <Text style={[styles.th, { flex: 1 }]}>Check-In</Text>
          <Text style={[styles.th, { flex: 1 }]}>Check-Out</Text>
          <Text style={[styles.th, { flex: 1.4 }]}>Location</Text>
        </View>
        {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />}
        {filtered.map((r: any, i: number) => (
          <View key={r.id} style={[styles.tr, i % 2 === 0 && { backgroundColor: '#F8FAFC' }]}>
            <View style={[styles.td, { flex: 2 }]}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(r.name || '?').split(' ').map((x: string) => x[0]).slice(0, 2).join('')}</Text>
              </View>
              <View>
                <Text style={styles.tdName}>{r.name}</Text>
                <Text style={styles.tdMeta}>{r.employee_id || '—'}</Text>
              </View>
            </View>
            <Text style={[styles.tdText, { flex: 1.5 }]}>{r.department || '—'}</Text>
            <View style={[styles.td, { flex: 1 }]}>
              <Pill label={r.attendance_type === 'wfh' ? 'WFH' : (r.attendance_type || '—').replace('_', ' ').replace(/^./, (c: string) => c.toUpperCase())} color={r.attendance_type === 'wfh' ? '#3B82F6' : colors.primary} />
            </View>
            <View style={[styles.td, { flex: 1 }]}>
              <Pill
                label={(r.status || 'absent').replace('_', ' ').replace(/^./, (c: string) => c.toUpperCase())}
                color={STATUS_COLOR[r.status || 'absent']}
              />
            </View>
            <Text style={[styles.tdText, { flex: 1 }]}>
              {r.check_in ? new Date(r.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
            </Text>
            <Text style={[styles.tdText, { flex: 1 }]}>
              {r.check_out ? new Date(r.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
            </Text>
            <Text style={[styles.tdText, { flex: 1.4 }]} numberOfLines={1}>{r.geofence_name || '—'}</Text>
          </View>
        ))}
        {!loading && !filtered.length && (
          <View style={{ padding: 24, alignItems: 'center' }}>
            <MaterialCommunityIcons name="file-search-outline" size={36} color={colors.textMuted} />
            <Text style={styles.empty}>No matching records.</Text>
          </View>
        )}
      </Surface>
    </AdminShell>
  );
}

const FilterChips = ({ value, onChange, options }: any) => (
  <View style={{ flexDirection: 'row', gap: 6 }}>
    {options.map((o: any) => {
      const active = value === o.id;
      return (
        <TouchableOpacity
          key={o.id}
          onPress={() => onChange(o.id)}
          style={[styles.chip, active && { backgroundColor: o.color || colors.primary }]}
          testID={`filter-${o.id}`}
        >
          <Text style={[styles.chipText, active && { color: colors.white }]}>{o.label}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  toolbar: { flexDirection: 'row', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.background,
    borderRadius: radii.md,
    paddingHorizontal: 12, paddingVertical: 8, minWidth: 280, flex: 1,
  },
  searchInput: { flex: 1, fontSize: 13, color: colors.text, outlineStyle: 'none' as any },
  chip: {
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  chipText: { color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  thead: {
    flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  th: { fontSize: 11, fontWeight: '800', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' },
  tr: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  td: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tdName: { fontSize: 13, fontWeight: '700', color: colors.text },
  tdMeta: { fontSize: 11, color: colors.textMuted },
  tdText: { fontSize: 12, color: colors.textSecondary },
  avatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 10, fontWeight: '800', color: colors.primary },
  empty: { color: colors.textMuted, marginTop: 8, fontSize: 13 },
});
