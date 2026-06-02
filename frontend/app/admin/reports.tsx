import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AdminShell } from '../../src/components/AdminShell';
import { Surface, SectionTitle, Pill, OutlineButton, PrimaryButton } from '../../src/components/admin-ui';
import { BarChartH } from '../../src/components/MiniChart';
import { colors, radii } from '../../src/theme';
import { api } from '../../src/api';
import { useAuth } from '../../src/auth';

export default function AdminReports() {
  const router = useRouter();
  const { user } = useAuth();
  const [report, setReport] = useState<any>(null);
  const [byDept, setByDept] = useState<any[]>([]);
  const [month, setMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [r, d] = await Promise.all([
        api.adminMonthlyReport(month).catch(() => null),
        api.adminAttendanceByDept().catch(() => []),
      ]);
      setReport(r); setByDept(d);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'admin') { router.replace('/(tabs)'); return; }
    load();
  }, [user, month]);

  const exportCSV = () => {
    if (!report) return;
    const header = ['Employee', 'Department', 'Present Days', 'Late Arrivals', 'WFH Days'];
    const rows = (report.rows || []).map((r: any) => [r.name, r.department, r.present, r.late, r.wfh]);
    const csv = [header, ...rows].map((line) => line.map((c: any) => `"${(c ?? '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `monthly-${month}.csv`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <AdminShell title="Reports" subtitle={report?.month || month}>
      {/* Controls */}
      <Surface>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <View style={styles.monthBox}>
            <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
            <TextInput
              value={month} onChangeText={setMonth}
              placeholder="YYYY-MM" style={styles.monthInput}
              placeholderTextColor={colors.textMuted}
              testID="month-input"
            />
          </View>
          <OutlineButton label="Refresh" icon="refresh" onPress={load} />
          <View style={{ flex: 1 }} />
          <PrimaryButton label="Export CSV" icon="download" onPress={exportCSV} testID="report-export" />
        </View>
      </Surface>

      <View style={{ flexDirection: 'row', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
        <Surface style={{ flex: 1, minWidth: 300 }}>
          <SectionTitle title="Departments — Attendance %" />
          <BarChartH
            data={byDept.slice(0, 10).map((d: any) => ({
              label: d.department || 'Unassigned',
              value: d.pct,
              color: d.pct >= 80 ? '#16A34A' : d.pct >= 50 ? '#F59E0B' : '#EF4444',
            }))}
          />
          {!byDept.length && <Text style={styles.empty}>No department data yet.</Text>}
        </Surface>
        <Surface style={{ flex: 2, minWidth: 400 }}>
          <SectionTitle title="Monthly Attendance per Employee" />
          <View style={styles.thead}>
            <Text style={[styles.th, { flex: 2 }]}>Employee</Text>
            <Text style={[styles.th, { flex: 1.5 }]}>Department</Text>
            <Text style={[styles.th, { flex: 1 }]}>Present</Text>
            <Text style={[styles.th, { flex: 1 }]}>Late</Text>
            <Text style={[styles.th, { flex: 1 }]}>WFH</Text>
          </View>
          {(report?.rows || []).map((r: any, i: number) => (
            <View key={r.user_id} style={[styles.tr, i % 2 === 0 && { backgroundColor: '#F8FAFC' }]}>
              <Text style={[styles.tdName, { flex: 2 }]}>{r.name}</Text>
              <Text style={[styles.tdText, { flex: 1.5 }]}>{r.department || '—'}</Text>
              <View style={[styles.tdInline, { flex: 1 }]}><Pill label={String(r.present)} color="#16A34A" /></View>
              <View style={[styles.tdInline, { flex: 1 }]}><Pill label={String(r.late)} color="#F59E0B" /></View>
              <View style={[styles.tdInline, { flex: 1 }]}><Pill label={String(r.wfh)} color="#3B82F6" /></View>
            </View>
          ))}
          {!loading && !(report?.rows || []).length && (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <MaterialCommunityIcons name="file-document-outline" size={36} color={colors.textMuted} />
              <Text style={styles.empty}>No attendance recorded for {month} yet.</Text>
            </View>
          )}
        </Surface>
      </View>
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  monthBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.background, borderRadius: radii.md,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  monthInput: { fontSize: 13, color: colors.text, minWidth: 100, outlineStyle: 'none' as any },
  thead: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  th: { fontSize: 11, fontWeight: '800', color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' },
  tr: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  tdName: { fontSize: 13, fontWeight: '700', color: colors.text },
  tdText: { fontSize: 12, color: colors.textSecondary },
  tdInline: { flexDirection: 'row', alignItems: 'center' },
  empty: { color: colors.textMuted, marginTop: 8, fontSize: 13, textAlign: 'center' },
});
