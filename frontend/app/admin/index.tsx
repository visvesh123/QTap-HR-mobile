import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AdminShell, AdminStatCard } from '../../src/components/AdminShell';
import { TrendChart, BarChartH } from '../../src/components/MiniChart';
import { colors, clay } from '../../src/theme';
import { api } from '../../src/api';
import { useAuth } from '../../src/auth';

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [trend, setTrend] = useState<any[]>([]);
  const [byDept, setByDept] = useState<any[]>([]);
  const [team, setTeam] = useState<any>(null);
  const [dash, setDash] = useState<any>(null);
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
      <AdminShell title="Dashboard" subtitle="Loading…" breadcrumb="HR">
        <ActivityIndicator color={colors.primary} />
      </AdminShell>
    );
  }

  const s = team?.summary || { total: 0, present: 0, absent: 0, late: 0, remote: 0 };
  const pct = s.total ? Math.round((s.present / s.total) * 100) : 0;
  const latePeople = (team?.staff || []).filter((p: any) => p.status === 'late');

  return (
    <AdminShell
      title="Dashboard"
      subtitle={`Welcome back, ${user?.name?.split(' ')[0] || 'Admin'} · ${new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}`}
      breadcrumb="HR"
    >
      <View style={styles.sectionLabelRow}>
        <Text style={styles.sectionLabel}>TODAY AT A GLANCE</Text>
        <Text style={styles.updatedTag}>Updated just now</Text>
      </View>
      <Text style={styles.sectionTitle}>Live Operations · Mahindra University</Text>

      {/* KPI cards — reference design (white card / pink iconwell / big number) */}
      <View style={styles.kpiRow}>
        <AdminStatCard
          label="Total Staff"
          value={s.total}
          sub={`${dash?.total_students || 0} students enrolled`}
          icon="account-group-outline"
          iconColor={colors.primary}
          iconBg={colors.primaryBg}
          testID="kpi-total"
        />
        <AdminStatCard
          label="Present"
          value={s.present}
          sub={`${pct}% attendance`}
          icon="shield-check-outline"
          iconColor={colors.primary}
          iconBg={colors.primaryBg}
          testID="kpi-present"
        />
        <AdminStatCard
          label="Checked In"
          value={dash?.checked_in_today ?? s.present}
          sub="Today"
          icon="login-variant"
          iconColor={colors.primary}
          iconBg={colors.primaryBg}
          testID="kpi-in"
        />
        <AdminStatCard
          label="Currently Inside"
          value={Math.max(s.present - (dash?.checked_out_today || 0), 0)}
          sub="Live"
          icon="pulse"
          iconColor={colors.primary}
          iconBg={colors.primaryBg}
          tone="live"
          testID="kpi-inside"
        />
        <AdminStatCard
          label="Checked Out"
          value={dash?.checked_out_today ?? 0}
          sub="Today"
          icon="logout-variant"
          iconColor={colors.primary}
          iconBg={colors.primaryBg}
          testID="kpi-out"
        />
        <AdminStatCard
          label="Late Arrivals"
          value={s.late}
          sub={s.late > 0 ? 'Action needed' : 'All on time'}
          icon="alert"
          tone="alert"
          testID="kpi-late"
        />
      </View>

      {/* Recent activity + side alerts */}
      <View style={styles.bigRow}>
        {/* LEFT — Recent activity card */}
        <View style={[styles.bigCard, clay.surface as any, { flex: 2 }]}>
          <View style={styles.cardHead}>
            <View>
              <Text style={styles.cardTitle}>Recent Staff Activity</Text>
              <Text style={styles.cardSub}>Latest check-ins · {team?.staff?.length ?? 0} entries</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <DatePill icon="calendar-outline" label="Jun 15 → Jul 16" />
              <FilterPill label="All statuses" />
            </View>
          </View>

          <View style={styles.tHead}>
            <Text style={[styles.tCol, { width: 70 }]}>TIME</Text>
            <Text style={[styles.tCol, { flex: 1 }]}>STAFF NAME</Text>
            <Text style={[styles.tCol, { flex: 1 }]}>DEPARTMENT</Text>
            <Text style={[styles.tCol, { width: 160 }]}>STATUS</Text>
          </View>
          {(team?.staff || []).slice(0, 6).map((p: any) => {
            const status = p.status === 'present' ? { l: 'Checked In', c: '#0F9D58', bg: '#E6F4EA' }
                          : p.status === 'late' ? { l: 'Late Arrival', c: '#B45309', bg: '#FEF3C7' }
                          : p.status === 'remote' ? { l: 'Remote', c: '#1D4ED8', bg: '#DBEAFE' }
                          : { l: 'Absent', c: '#9CA3AF', bg: '#F3F4F6' };
            const time = p.check_in
              ? new Date(p.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '—';
            return (
              <View key={p.id} style={styles.tRow}>
                <Text style={[styles.tCell, styles.tTime, { width: 70 }]}>{time}</Text>
                <Text style={[styles.tCell, styles.tName, { flex: 1 }]}>{p.name}</Text>
                <Text style={[styles.tCell, { flex: 1, color: colors.textSecondary }]}>{p.department || '—'}</Text>
                <View style={{ width: 160 }}>
                  <View style={[styles.statusBadge, { backgroundColor: status.bg, borderColor: status.c + '40' }]}>
                    <View style={[styles.statusDot, { backgroundColor: status.c }]} />
                    <Text style={[styles.statusText, { color: status.c }]}>{status.l}</Text>
                  </View>
                </View>
              </View>
            );
          })}
          {!team?.staff?.length && <Text style={styles.empty}>No data yet.</Text>}
        </View>

        {/* RIGHT — Late arrivals alert card (mirrors "Overstayed Visitors") */}
        <View style={[styles.alertCard, clay.surface as any, { flex: 1 }]}>
          <View style={styles.alertHead}>
            <View style={styles.alertIcon}>
              <Ionicons name="warning" size={18} color={colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>Late Arrivals</Text>
              <Text style={styles.alertSub}>{latePeople.length || 'None'} require follow-up</Text>
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: colors.borderStrong, marginVertical: 4 }} />

          {latePeople.length === 0 ? (
            <View style={{ paddingVertical: 18, alignItems: 'center' }}>
              <MaterialCommunityIcons name="check-circle-outline" size={28} color={colors.success} />
              <Text style={styles.alertEmpty}>All staff arrived on time today.</Text>
            </View>
          ) : (
            latePeople.slice(0, 5).map((p: any) => {
              const ins = p.check_in
                ? Math.round((new Date(p.check_in).getTime() - new Date(new Date().toDateString() + ' 09:30').getTime()) / 60000)
                : 0;
              return (
                <View key={p.id} style={styles.alertItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.alertName} numberOfLines={1}>{p.name}</Text>
                    <Text style={styles.alertMeta} numberOfLines={1}>
                      {p.department || '—'} · Arrived {p.check_in
                        ? new Date(p.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </Text>
                  </View>
                  <View style={styles.alertTime}>
                    <Ionicons name="time-outline" size={11} color={colors.primary} />
                    <Text style={styles.alertTimeText}>+{ins}m</Text>
                  </View>
                </View>
              );
            })
          )}

          <TouchableOpacity
            onPress={() => router.push('/admin/attendance')}
            style={styles.alertFooterBtn}
          >
            <Text style={styles.alertFooterText}>NOTIFY ALL HRs</Text>
            <Ionicons name="arrow-forward" size={13} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Trend chart + by-dept */}
      <View style={styles.bigRow}>
        <View style={[styles.bigCard, clay.surface as any, { flex: 2 }]}>
          <View style={styles.cardHead}>
            <View>
              <Text style={styles.cardTitle}>Attendance Trend</Text>
              <Text style={styles.cardSub}>Last 14 days · all departments</Text>
            </View>
          </View>
          <TrendChart data={trend} />
        </View>
        <View style={[styles.bigCard, clay.surface as any, { flex: 1 }]}>
          <View style={styles.cardHead}>
            <View>
              <Text style={styles.cardTitle}>By Department</Text>
              <Text style={styles.cardSub}>Present % · today</Text>
            </View>
          </View>
          <BarChartH
            data={byDept.slice(0, 8).map((d: any) => ({
              label: d.department || 'Unassigned',
              value: d.pct,
              color: d.pct >= 80 ? '#16A34A' : d.pct >= 50 ? '#F59E0B' : '#EF4444',
            }))}
          />
          {byDept.length === 0 && <Text style={styles.empty}>No staff present today yet.</Text>}
        </View>
      </View>
    </AdminShell>
  );
}

const DatePill = ({ icon, label }: { icon: string; label: string }) => (
  <View style={styles.pill}>
    <Ionicons name={icon as any} size={14} color={colors.textSecondary} />
    <Text style={styles.pillText}>{label}</Text>
  </View>
);
const FilterPill = ({ label }: { label: string }) => (
  <View style={styles.pill}>
    <Ionicons name="funnel-outline" size={14} color={colors.textSecondary} />
    <Text style={styles.pillText}>{label}</Text>
    <Ionicons name="chevron-down" size={12} color={colors.textSecondary} />
  </View>
);

const styles = StyleSheet.create({
  sectionLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1.4 },
  updatedTag: { fontSize: 11, color: colors.textMuted, fontWeight: '500' },
  sectionTitle: { fontSize: 22, fontWeight: '700', color: colors.ink, marginTop: 6, marginBottom: 22, letterSpacing: -0.4 },

  kpiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },

  bigRow: { flexDirection: 'row', gap: 16, marginTop: 24, flexWrap: 'wrap' },
  bigCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 22,
    minWidth: 360,
  },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, gap: 12 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: colors.ink, letterSpacing: -0.3 },
  cardSub: { fontSize: 12, color: colors.textSecondary, marginTop: 3 },

  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  pillText: { fontSize: 12, fontWeight: '600', color: colors.text },

  // Table
  tHead: {
    flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  tCol: { fontSize: 10, fontWeight: '700', color: colors.textMuted, letterSpacing: 1.2 },
  tRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  tCell: { fontSize: 13, color: colors.text, fontWeight: '500' },
  tTime: { color: colors.textSecondary, fontWeight: '500' },
  tName: { color: colors.ink, fontWeight: '700' },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 999, borderWidth: 1,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },

  // Alert card
  alertCard: {
    backgroundColor: '#FCEEF1',
    borderRadius: 18,
    padding: 22,
    minWidth: 280,
  },
  alertHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  alertIcon: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  alertTitle: { fontSize: 16, fontWeight: '800', color: colors.ink, letterSpacing: -0.2 },
  alertSub: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  alertItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 13, gap: 12,
    borderBottomWidth: 1, borderBottomColor: '#F5D9DE',
  },
  alertName: { fontSize: 13, fontWeight: '700', color: colors.ink },
  alertMeta: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  alertTime: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 5,
    backgroundColor: colors.white,
    borderRadius: 6,
  },
  alertTimeText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  alertEmpty: { fontSize: 12, color: colors.textSecondary, marginTop: 8, textAlign: 'center' },
  alertFooterBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start',
    gap: 6, marginTop: 14, paddingTop: 14,
    borderTopWidth: 1, borderTopColor: '#F5D9DE',
  },
  alertFooterText: { fontSize: 11, fontWeight: '800', color: colors.primary, letterSpacing: 1.2 },

  empty: { color: colors.textMuted, fontSize: 12, padding: 16, textAlign: 'center' },
});
