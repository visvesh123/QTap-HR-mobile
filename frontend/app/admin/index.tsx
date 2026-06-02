import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { AdminShell, useIsDesktop } from '../../src/components/AdminShell';
import { Surface, StatCard, SectionTitle, Pill } from '../../src/components/admin-ui';
import { TrendChart, BarChartH } from '../../src/components/MiniChart';
import { colors, radii, shadow } from '../../src/theme';
import { api } from '../../src/api';
import { useAuth } from '../../src/auth';

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [dash, setDash] = useState<any>(null);
  const [trend, setTrend] = useState<any[]>([]);
  const [byDept, setByDept] = useState<any[]>([]);
  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'admin') { router.replace('/(tabs)'); return; }
    (async () => {
      try {
        const [d, t, bd, tm] = await Promise.all([
          api.adminDashboard().catch(() => null),
          api.adminAttendanceTrend().catch(() => []),
          api.adminAttendanceByDept().catch(() => []),
          api.attendanceAdminToday().catch(() => null),
        ]);
        setDash(d); setTrend(t); setByDept(bd); setTeam(tm);
      } finally { setLoading(false); }
    })();
  }, [user]);

  if (loading) {
    return (
      <AdminShell title="Dashboard" subtitle="Loading…">
        <ActivityIndicator color={colors.primary} />
      </AdminShell>
    );
  }

  const s = team?.summary || { total: 0, present: 0, absent: 0, late: 0, remote: 0 };
  const pct = s.total ? Math.round((s.present / s.total) * 100) : 0;

  return (
    <AdminShell
      title="Dashboard"
      subtitle={`Welcome back, ${user?.name?.split(' ')[0] || 'Admin'} · ${new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}`}
    >
      {/* KPI cards */}
      <View style={styles.kpiRow}>
        <StatCard label="Total Employees" value={s.total} hint={`${dash?.total_students || 0} students`} icon="account-group-outline" color={colors.primary} testID="kpi-total" />
        <StatCard label="Present Today" value={s.present} hint={`${pct}% attendance`} icon="check-circle-outline" color="#16A34A" deltaPct={4} testID="kpi-present" />
        <StatCard label="Late Arrivals" value={s.late} hint="After 09:30 AM" icon="clock-alert-outline" color="#F59E0B" deltaPct={-2} testID="kpi-late" />
        <StatCard label="Remote / WFH" value={s.remote} hint="Off-campus today" icon="home-outline" color="#3B82F6" testID="kpi-wfh" />
        <StatCard label="Absent" value={s.absent} hint="Excludes leave" icon="close-circle-outline" color="#EF4444" deltaPct={1} testID="kpi-absent" />
      </View>

      {/* Chart + breakdown */}
      <View style={styles.row}>
        <Surface style={{ flex: 2 }}>
          <SectionTitle title="Attendance Trend — Last 14 days" />
          <TrendChart data={trend} />
        </Surface>
        <Surface style={{ flex: 1 }}>
          <SectionTitle title="By Department" />
          <BarChartH
            data={byDept.slice(0, 8).map((d: any) => ({
              label: d.department || 'Unassigned',
              value: d.pct,
              color: d.pct >= 80 ? '#16A34A' : d.pct >= 50 ? '#F59E0B' : '#EF4444',
            }))}
          />
          {byDept.length === 0 && <Text style={styles.empty}>No staff present today yet.</Text>}
        </Surface>
      </View>

      {/* Activity */}
      <View style={styles.row}>
        <Surface style={{ flex: 1 }}>
          <SectionTitle title="Live Staff Status" actionLabel="View all" onAction={() => router.push('/admin/attendance')} />
          {(team?.staff || []).slice(0, 6).map((p: any) => {
            const status = p.status === 'present' ? { l: 'Present', c: '#16A34A' } :
                           p.status === 'late' ? { l: 'Late', c: '#F59E0B' } :
                           { l: 'Absent', c: '#94A3B8' };
            return (
              <View key={p.id} style={styles.staffRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{(p.name || '?').split(' ').map((x: string) => x[0]).slice(0, 2).join('')}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{p.name}</Text>
                  <Text style={styles.meta}>{p.department || '—'} · {p.employee_id || ''}</Text>
                </View>
                <Text style={styles.timeText}>{p.check_in ? new Date(p.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</Text>
                <Pill label={status.l} color={status.c} />
              </View>
            );
          })}
          {!team?.staff?.length && <Text style={styles.empty}>No data yet.</Text>}
        </Surface>
        <Surface style={{ flex: 1 }}>
          <SectionTitle title="System Health" />
          <View style={styles.healthGrid}>
            <HealthBlock label="Face Verifications" value={dash?.total_visitors ?? 0} delta="+12%" />
            <HealthBlock label="Spoof Blocked" value={0} delta="0" />
            <HealthBlock label="Open Complaints" value={dash?.open_complaints ?? 0} delta="-3" />
            <HealthBlock label="Active SOS" value={dash?.active_sos ?? 0} delta="0" />
          </View>
        </Surface>
      </View>
    </AdminShell>
  );
}

const HealthBlock = ({ label, value, delta }: any) => (
  <View style={{ flex: 1, minWidth: 120 }}>
    <Text style={styles.healthVal}>{value}</Text>
    <Text style={styles.healthLabel}>{label}</Text>
    <Text style={styles.healthDelta}>{delta}</Text>
  </View>
);

const styles = StyleSheet.create({
  kpiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  row: { flexDirection: 'row', gap: 16, marginTop: 16, flexWrap: 'wrap' },
  empty: { color: colors.textMuted, fontSize: 12, padding: 12, textAlign: 'center' },
  staffRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: colors.primary, fontWeight: '800', fontSize: 11 },
  name: { fontSize: 13, fontWeight: '700', color: colors.text },
  meta: { fontSize: 11, color: colors.textMuted },
  timeText: { fontSize: 11, color: colors.textSecondary, marginRight: 4 },
  healthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  healthVal: { fontSize: 22, fontWeight: '800', color: colors.text },
  healthLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  healthDelta: { fontSize: 11, color: colors.success, fontWeight: '700', marginTop: 2 },
});
