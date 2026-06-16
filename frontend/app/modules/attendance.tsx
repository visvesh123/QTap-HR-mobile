import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal,
  ActivityIndicator, Animated, Easing, Platform, Switch, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { api, dalmartGeoValidate, dalmartFaceValidate } from '../../src/api';
import { useAuth } from '../../src/auth';
import { colors, radii, shadow, spacing, clay } from '../../src/theme';
import { Card, Pill, Badge, ScreenHeader, Empty } from '../../src/ui';
import { ProgressRing, TodayTimeline } from '../../src/components/AttendanceVisuals';

type AttType = 'office' | 'wfh' | 'client_visit' | 'field';
const TYPE_META: Record<AttType, { label: string; icon: string }> = {
  office:       { label: 'Office',        icon: 'office-building-outline' },
  wfh:          { label: 'Work From Home',icon: 'home-outline' },
  client_visit: { label: 'Client Visit',  icon: 'briefcase-outline' },
  field:        { label: 'Field Ops',     icon: 'map-marker-path' },
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  present:  { label: 'Present',  color: '#16A34A' },
  late:     { label: 'Late',     color: '#F59E0B' },
  half_day: { label: 'Half Day', color: '#F97316' },
  absent:   { label: 'Absent',   color: '#94A3B8' },
};

// Mahindra Univ Bahadurpally — demo coordinates
const MU_LAT = 17.5234;
const MU_LON = 78.3941;

// dalmart face_recognition_marked_at is UTC — always render in IST (Asia/Kolkata).
function normalizeUtc(iso?: string): Date | null {
  if (!iso) return null;
  let s = String(iso).trim().replace(' ', 'T');
  if (!/[zZ]$|[+-]\d{2}:?\d{2}$/.test(s)) s += 'Z';
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}
function fmtISTTime(iso?: string) {
  const d = normalizeUtc(iso);
  if (!d) return '—';
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
}
function fmtISTDate(iso?: string) {
  const d = normalizeUtc(iso);
  if (!d) return '';
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });
}

export default function StaffAttendanceScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [tab, setTab] = useState<'today' | 'history' | 'stats' | 'team'>('today');
  const [history, setHistory] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [team, setTeam] = useState<any>(null);
  const [geofences, setGeofences] = useState<any[]>([]);
  const [attType, setAttType] = useState<AttType>('office');
  const [demoMode, setDemoMode] = useState(false);
  const [demoInsideFence, setDemoInsideFence] = useState(true);
  const [showCapture, setShowCapture] = useState(false);
  const [captureKind, setCaptureKind] = useState<'in' | 'out'>('in');

  // ---- Dalmart-driven "today" (NO FastAPI, NO local storage). In-memory only. ----
  type DToday = {
    checkInAt?: string;
    checkOutAt?: string;
    venue?: string;
    faceResponse?: any;           // entire dalmart face-recognition JSON response (session-only)
  };
  const [dalmartToday, setDalmartToday] = useState<DToday | null>(null);

  // Updates the timeline in-memory after a successful dalmart face recognition.
  // `status` comes directly from the button the user pressed (IN / OUT).
  const applyDalmartPunch = useCallback((payload: {
    status: 'IN' | 'OUT';
    markedAt: string;
    venue?: string;
    faceResponse: any;
  }) => {
    setDalmartToday((prev) => {
      const next: DToday = { ...(prev || {}) };
      if (payload.status === 'IN') next.checkInAt = payload.markedAt;
      else next.checkOutAt = payload.markedAt;
      next.faceResponse = payload.faceResponse;
      if (payload.venue) next.venue = payload.venue;
      return next;
    });
  }, []);

  // History / Stats / Geofences only (Today timeline & button are dalmart-driven, no FastAPI).
  const reload = useCallback(async () => {
    try {
      const [h, s, g] = await Promise.all([
        api.attendanceHistory().catch(() => []),
        api.attendanceStats().catch(() => null),
        api.attendanceGeofences().catch(() => []),
      ]);
      setHistory(h); setStats(s); setGeofences(g);
      if (isAdmin) {
        const tm = await api.attendanceAdminToday().catch(() => null);
        setTeam(tm);
      }
    } catch {}
  }, [isAdmin]);

  useEffect(() => { reload(); }, [reload]);

  const onCheckPress = (kind: 'in' | 'out') => {
    setCaptureKind(kind);
    setShowCapture(true);
  };

  const tabs = useMemo(
    () => ([
      { id: 'today',   label: 'Today',   icon: 'today-outline' },
      { id: 'history', label: 'History', icon: 'time-outline' },
      { id: 'stats',   label: 'Stats',   icon: 'stats-chart-outline' },
      ...(isAdmin ? [{ id: 'team', label: 'Team', icon: 'people-outline' }] : []),
    ]),
    [isAdmin],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="Attendance"
        onBack={() => router.back()}
      />

      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabRow}
      >
        {tabs.map((t: any) => (
          <Pill
            key={t.id}
            label={t.label}
            active={tab === t.id}
            onPress={() => setTab(t.id)}
            testID={`tab-${t.id}`}
          />
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}>
        {tab === 'today' && (
          <TodayTab
            checkInAt={dalmartToday?.checkInAt}
            checkOutAt={dalmartToday?.checkOutAt}
            attType={attType}
            setAttType={setAttType}
            geofences={geofences}
            designatedLocations={user?.designated_locations || []}
            onCheck={onCheckPress}
          />
        )}
        {tab === 'history' && <HistoryTab items={history} />}
        {tab === 'stats' && <StatsTab stats={stats} />}
        {tab === 'team' && <TeamTab team={team} />}
      </ScrollView>

      {showCapture && (
        <CaptureFlow
          kind={captureKind}
          attType={attType}
          qid={user?.qid}
          demoMode={demoMode}
          demoInsideFence={demoInsideFence}
          onSuccess={applyDalmartPunch}
          onDone={() => { setShowCapture(false); reload(); }}
          onClose={() => setShowCapture(false)}
        />
      )}
    </SafeAreaView>
  );
}

// ---------- TODAY ----------
const TodayTab = ({
  checkInAt, checkOutAt, attType, setAttType, geofences, designatedLocations, onCheck,
}: any) => {
  return (
    <View>
      {/* Check In */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onCheck('in')}
        testID="action-in"
        style={[styles.toggleWrap, clay.crimson as any, { marginTop: 0 }]}
      >
        <LinearGradient
          colors={['#22C55E', '#16A34A', '#15803D']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.toggleBtn}
        >
          <View style={[styles.toggleIconWrap, clay.surfaceSoft as any]}>
            <MaterialCommunityIcons name="login-variant" size={30} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleTitle}>Check In</Text>
            <Text style={styles.toggleSub}>Mark your arrival</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="rgba(255,255,255,0.85)" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Check Out — directly under Check In */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onCheck('out')}
        testID="action-out"
        style={[styles.toggleWrap, clay.crimson as any, { marginTop: spacing.sm }]}
      >
        <LinearGradient
          colors={[colors.primaryLight, colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.toggleBtn}
        >
          <View style={[styles.toggleIconWrap, clay.surfaceSoft as any]}>
            <MaterialCommunityIcons name="logout-variant" size={30} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleTitle}>Check Out</Text>
            <Text style={styles.toggleSub}>Mark your departure</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="rgba(255,255,255,0.85)" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Today's Timeline */}
      <View style={[styles.clayBlock]}>
        <Text style={styles.cardLabel}>TODAY&apos;S TIMELINE</Text>
        <TodayTimeline
          checkIn={checkInAt}
          checkOut={checkOutAt}
          workSeconds={(checkInAt && checkOutAt) ? Math.max(0, (new Date(checkOutAt).getTime() - new Date(checkInAt).getTime()) / 1000) : undefined}
        />
      </View>

      {/* Attendance type selector — always visible */}
      <View style={[styles.clayBlock, { marginTop: spacing.md }]}>
        <Text style={styles.cardLabel}>ATTENDANCE TYPE</Text>
        <View style={styles.typeRow}>
          {(Object.keys(TYPE_META) as AttType[]).map((t) => {
            const m = TYPE_META[t];
            const active = attType === t;
            return (
              <TouchableOpacity
                key={t}
                onPress={() => setAttType(t)}
                activeOpacity={0.7}
                testID={`atttype-${t}`}
                style={[styles.typeBtn, active && styles.typeBtnActive, active && (clay.crimson as any)]}
              >
                <MaterialCommunityIcons name={m.icon as any} size={18} color={active ? colors.white : colors.clayMuted} />
                <Text style={[styles.typeBtnText, active && { color: colors.white }]}>{m.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Authorized / designated locations */}
      <View style={[styles.clayBlock, { marginTop: spacing.md }]}>
        <Text style={styles.cardLabel}>AUTHORIZED LOCATIONS</Text>
        {(() => {
          const fmtRadius = (r: number) => (r >= 1000 ? `${+(r / 1000).toFixed(r % 1000 ? 1 : 0)} km` : `${r} m`);
          const locs = (designatedLocations || []).map((loc: any, i: number) => ({
            id: loc.venue_id ?? `dl-${i}`,
            name: loc.venue_name || `Location ${i + 1}`,
            address: (loc.latitude != null && loc.longitude != null)
              ? `${Number(loc.latitude).toFixed(5)}, ${Number(loc.longitude).toFixed(5)}`
              : 'Designated location',
            radius_m: loc.radius,
          }));
          if (!locs.length) {
            return <Text style={styles.fenceAddr}>No locations assigned yet.</Text>;
          }
          return locs.map((g: any) => (
            <View key={g.id} style={styles.fenceRow}>
              <View style={[styles.fenceIcon, { backgroundColor: colors.clayBlush }, clay.surfaceSoft as any]}>
                <MaterialCommunityIcons name="map-marker-radius-outline" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fenceName}>{g.name}</Text>
                <Text style={styles.fenceAddr}>{g.address}</Text>
              </View>
              {!!g.radius_m && <Badge label={fmtRadius(g.radius_m)} color={colors.primary} />}
            </View>
          ));
        })()}
      </View>
    </View>
  );
};

// ---------- HISTORY (Apple-style month calendar) ----------
const CAL_STATUS_COLOR: Record<string, string> = {
  present: '#16A34A',
  late:    '#F59E0B',
  half_day:'#F97316',
  wfh:     '#3B82F6',
  absent:  '#EF4444',
};
const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function pad2(n: number) { return String(n).padStart(2, '0'); }
function isoFor(y: number, m: number, d: number) { return `${y}-${pad2(m + 1)}-${pad2(d)}`; }

const HistoryTab = ({ items }: { items: any[] }) => {
  const todayISO = useMemo(() => {
    const t = new Date();
    return isoFor(t.getFullYear(), t.getMonth(), t.getDate());
  }, []);

  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState<string>(todayISO);

  // group accepted events by date
  const byDay = useMemo(() => {
    const m: Record<string, any[]> = {};
    items.forEach((it) => {
      const d = (it.timestamp || '').slice(0, 10);
      if (!d) return;
      (m[d] = m[d] || []).push(it);
    });
    return m;
  }, [items]);

  // derive a single status for any date
  const statusFor = useCallback((iso: string): string | null => {
    const evts = byDay[iso] || [];
    const inE = evts.find((x: any) => x.type === 'in' && x.accepted);
    const d = new Date(iso + 'T00:00:00');
    const dow = d.getDay();
    if (iso > todayISO) return null; // future
    if (inE) {
      if (inE.attendance_type === 'wfh') return 'wfh';
      if (inE.status === 'late') return 'late';
      if (inE.status === 'half_day') return 'half_day';
      return 'present';
    }
    if (dow === 0 || dow === 6) return null; // weekend, no dot
    return 'absent';
  }, [byDay, todayISO]);

  // build month grid cells
  const cells = useMemo(() => {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    const startDow = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const arr: ({ day: number; iso: string } | null)[] = [];
    for (let i = 0; i < startDow; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push({ day: d, iso: isoFor(y, m, d) });
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [cursor]);

  const monthLabel = cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const goMonth = (delta: number) => {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
  };

  if (!items.length) return <Empty icon="calendar-outline" message="No attendance records yet" />;

  return (
    <View>
      <Card>
        {/* Month header */}
        <View style={styles.calHead}>
          <TouchableOpacity onPress={() => goMonth(-1)} testID="cal-prev" style={styles.calNavBtn} hitSlop={10}>
            <Ionicons name="chevron-back" size={22} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.calMonth}>{monthLabel}</Text>
          <TouchableOpacity onPress={() => goMonth(1)} testID="cal-next" style={styles.calNavBtn} hitSlop={10}>
            <Ionicons name="chevron-forward" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Weekday labels */}
        <View style={styles.calWeekRow}>
          {WEEKDAY_LABELS.map((w, i) => (
            <Text key={i} style={styles.calWeekday}>{w}</Text>
          ))}
        </View>

        {/* Day grid */}
        <View style={styles.calGrid}>
          {cells.map((cell, i) => {
            if (!cell) return <View key={`e${i}`} style={styles.calCell} />;
            const isToday = cell.iso === todayISO;
            const isSelected = cell.iso === selected;
            const st = statusFor(cell.iso);
            const dotColor = st ? CAL_STATUS_COLOR[st] : null;
            return (
              <TouchableOpacity
                key={cell.iso}
                style={styles.calCell}
                activeOpacity={0.7}
                onPress={() => setSelected(cell.iso)}
                testID={`cal-day-${cell.iso}`}
              >
                <View style={[
                  styles.calDayCircle,
                  isToday && styles.calDayToday,
                  !isToday && isSelected && styles.calDaySelected,
                ]}>
                  <Text style={[
                    styles.calDayNum,
                    isToday && styles.calDayNumToday,
                    !isToday && isSelected && styles.calDayNumSelected,
                  ]}>{cell.day}</Text>
                </View>
                <View style={[styles.calDot, dotColor ? { backgroundColor: dotColor } : { backgroundColor: 'transparent' }]} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Legend */}
        <View style={styles.legendRow}>
          {[
            { c: '#16A34A', l: 'Present' },
            { c: '#F59E0B', l: 'Late' },
            { c: '#3B82F6', l: 'WFH' },
            { c: '#EF4444', l: 'Absent' },
          ].map((x) => (
            <View key={x.l} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: x.c }} />
              <Text style={styles.legendText}>{x.l}</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Selected day detail */}
      <View style={{ height: spacing.md }} />
      <DayDetail iso={selected} evts={byDay[selected] || []} status={statusFor(selected)} />
    </View>
  );
};

const DayDetail = ({ iso, evts, status }: { iso: string; evts: any[]; status: string | null }) => {
  const dateObj = new Date(iso + 'T00:00:00');
  const inE = evts.find((x) => x.type === 'in' && x.accepted);
  const outE = [...evts].reverse().find((x) => x.type === 'out' && x.accepted);
  const att_type = inE?.attendance_type as AttType | undefined;
  const dur = (inE && outE)
    ? ((new Date(outE.timestamp).getTime() - new Date(inE.timestamp).getTime()) / 3600000).toFixed(1)
    : null;
  const sm = status ? (STATUS_META[status] || { label: status, color: colors.textMuted }) : null;
  const color = sm?.color || colors.textMuted;

  return (
    <Card testID={`day-detail-${iso}`}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <View style={[styles.dayBadge, { backgroundColor: `${color}1A` }]}>
          <Text style={[styles.dayBadgeNum, { color }]}>{dateObj.getDate()}</Text>
          <Text style={[styles.dayBadgeMon, { color }]}>
            {dateObj.toLocaleDateString(undefined, { month: 'short' }).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.dayLabel}>
            {dateObj.toLocaleDateString(undefined, { weekday: 'long' })}
          </Text>
          {inE ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
              <Ionicons name="log-in-outline" size={11} color={colors.textMuted} />
              <Text style={styles.daySub}>{fmtTime(inE?.timestamp)}</Text>
              <Text style={styles.daySub}>·</Text>
              <Ionicons name="log-out-outline" size={11} color={colors.textMuted} />
              <Text style={styles.daySub}>{fmtTime(outE?.timestamp)}</Text>
              {dur && (
                <>
                  <Text style={styles.daySub}>·</Text>
                  <Text style={[styles.daySub, { color: colors.primary, fontWeight: '700' }]}>{dur}h</Text>
                </>
              )}
            </View>
          ) : (
            <Text style={[styles.daySub, { marginTop: 2 }]}>
              {status === 'absent' ? 'No check-in recorded' : 'Weekend / no working record'}
            </Text>
          )}
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          {sm && <Badge label={sm.label} color={sm.color} />}
          {att_type && <Text style={styles.attTypeText}>{TYPE_META[att_type]?.label}</Text>}
        </View>
      </View>
    </Card>
  );
};

// ---------- STATS ----------
const StatsTab = ({ stats }: { stats: any }) => {
  if (!stats) return <Empty icon="stats-chart-outline" message="No data yet" />;
  const cards: { label: string; value: string | number; color: string; icon: string }[] = [
    { label: 'Present Days', value: stats.present_days, color: '#16A34A', icon: 'check-circle-outline' },
    { label: 'Late Arrivals', value: stats.late_days, color: '#F59E0B', icon: 'clock-alert-outline' },
    { label: 'WFH Days', value: stats.wfh_days, color: '#3B82F6', icon: 'home-outline' },
    { label: 'Absent', value: stats.absent_days, color: '#EF4444', icon: 'close-circle-outline' },
  ];
  return (
    <View>
      <Card>
        <Text style={styles.cardLabel}>{stats.month?.toUpperCase()} · MONTHLY SUMMARY</Text>
        <View style={styles.ringWrap}>
          <ProgressRing
            value={stats.attendance_pct}
            label="ATTENDANCE"
            sub={`${stats.present_days}/${stats.working_days_so_far} working days`}
          />
        </View>
        <View style={styles.ringFooter}>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={styles.ringFootVal}>{stats.total_work_hours}h</Text>
            <Text style={styles.ringFootLab}>Total Hours</Text>
          </View>
          <View style={styles.ringFootDiv} />
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={styles.ringFootVal}>{stats.avg_work_hours}h</Text>
            <Text style={styles.ringFootLab}>Avg / Day</Text>
          </View>
          <View style={styles.ringFootDiv} />
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={[styles.ringFootVal, { color: '#F59E0B' }]}>{stats.late_days}</Text>
            <Text style={styles.ringFootLab}>Late Days</Text>
          </View>
        </View>
      </Card>

      <View style={styles.statsGrid}>
        {cards.map((c) => (
          <View key={c.label} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${c.color}1A` }]}>
              <MaterialCommunityIcons name={c.icon as any} size={20} color={c.color} />
            </View>
            <Text style={styles.statValue}>{c.value}</Text>
            <Text style={styles.statLabel}>{c.label}</Text>
          </View>
        ))}
      </View>

      <Card style={{ marginTop: spacing.md }}>
        <Text style={styles.cardLabel}>WORK HOURS</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
          <View>
            <Text style={styles.kpiBig}>{stats.total_work_hours}h</Text>
            <Text style={styles.kpiLabel}>Total this month</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.kpiBig}>{stats.avg_work_hours}h</Text>
            <Text style={styles.kpiLabel}>Avg / day</Text>
          </View>
        </View>
      </Card>

      <Card style={{ marginTop: spacing.md }}>
        <Text style={styles.cardLabel}>FACE RECOGNITION</Text>
        <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: 6 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.kpiBig}>{stats.failed_face_verifications}</Text>
            <Text style={styles.kpiLabel}>Failed</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.kpiBig, { color: colors.sos }]}>{stats.spoof_attempts}</Text>
            <Text style={styles.kpiLabel}>Spoofs blocked</Text>
          </View>
        </View>
      </Card>
    </View>
  );
};

// ---------- TEAM (Admin) ----------
const TeamTab = ({ team }: { team: any }) => {
  if (!team) return <Empty icon="people-outline" message="No data" />;
  const s = team.summary;
  return (
    <View>
      <View style={styles.statsGrid}>
        <SummaryCard label="Total" value={s.total} color={colors.text} icon="account-group-outline" />
        <SummaryCard label="Present" value={s.present} color="#16A34A" icon="check-circle-outline" />
        <SummaryCard label="Late" value={s.late} color="#F59E0B" icon="clock-alert-outline" />
        <SummaryCard label="Absent" value={s.absent} color="#EF4444" icon="close-circle-outline" />
      </View>
      <Card style={{ marginTop: spacing.md }}>
        <Text style={styles.cardLabel}>STAFF STATUS — TODAY</Text>
        {team.staff.map((p: any) => {
          const sm = STATUS_META[p.status] || STATUS_META.absent;
          return (
            <View key={p.id} style={styles.staffRow}>
              <View style={styles.staffAvatar}>
                <Text style={styles.staffInit}>{(p.name || '?').split(' ').map((x: string) => x[0]).slice(0, 2).join('')}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.staffName}>{p.name}</Text>
                <Text style={styles.staffMeta}>{p.department || '—'} · {p.employee_id || '—'}</Text>
                <Text style={styles.staffMeta}>
                  In {fmtTime(p.check_in)} · Out {fmtTime(p.check_out)}
                </Text>
              </View>
              <Badge label={sm.label} color={sm.color} />
            </View>
          );
        })}
      </Card>
    </View>
  );
};

const SummaryCard = ({ label, value, color, icon }: any) => (
  <View style={styles.statCard}>
    <View style={[styles.statIcon, { backgroundColor: `${color}1A` }]}>
      <MaterialCommunityIcons name={icon} size={20} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// ---------- CAPTURE FLOW (modal) ----------
type CaptureStep = 'permissions' | 'location' | 'camera' | 'verifying' | 'result';
type DemoOutcome = 'success' | 'low_confidence' | 'spoof';

const CaptureFlow = ({
  kind, attType, qid, demoMode, demoInsideFence, onSuccess, onDone, onClose,
}: {
  kind: 'in' | 'out';
  attType: AttType;
  qid?: string;
  demoMode: boolean;
  demoInsideFence: boolean;
  onSuccess: (payload: { status: 'IN' | 'OUT'; markedAt: string; venue?: string; faceResponse: any }) => void;
  onDone: () => void;
  onClose: () => void;
}) => {
  const [step, setStep] = useState<CaptureStep>('permissions');
  const [permission, requestPermission] = useCameraPermissions();
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [demoOutcome, setDemoOutcome] = useState<DemoOutcome>('success');
  const [coords, setCoords] = useState<{ lat: number; lon: number; accuracy: number; mock: boolean } | null>(null);
  const [geoState, setGeoState] = useState<'fetching' | 'validating' | 'valid' | 'invalid'>('fetching');
  const [geoError, setGeoError] = useState<string>('');
  const [venueName, setVenueName] = useState<string | null>(null);
  const camRef = useRef<any>(null);
  const started = useRef(false);

  // Sequence: ensure camera permission → fetch geolocation FIRST → then face verification
  useEffect(() => {
    (async () => {
      if (started.current) return;
      if (Platform.OS !== 'web') {
        if (!permission) return;
        if (!permission.granted) {
          const r = await requestPermission();
          if (!r.granted) { onClose(); return; }
        }
      }
      started.current = true;
      setStep('location');
      fetchLocation();
    })();
  }, [permission]);

  const fetchLocation = async () => {
    setGeoState('fetching');
    setGeoError('');
    let lat = MU_LAT, lon = MU_LON, accuracy = 8, mock = false;
    if (Platform.OS !== 'web') {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
          lat = loc.coords.latitude;
          lon = loc.coords.longitude;
          accuracy = loc.coords.accuracy || 8;
          // @ts-ignore
          mock = !!loc.mocked;
        }
      } catch {}
    }
    setCoords({ lat, lon, accuracy, mock });

    // Step 1: validate geolocation by calling the dalmart MU service DIRECTLY.
    // Only open the face/camera screen when geo_validation === true.
    setGeoState('validating');
    if (!qid) {
      setGeoError('Your account is not enabled for geo attendance (no QID).');
      setGeoState('invalid');
      return;
    }
    try {
      const json = await dalmartGeoValidate(qid, lat, lon, kind === 'in' ? 'IN' : 'OUT');
      const inner = json?.data || {};
      const geoOk =
        inner?.attendance?.geo_validation === true || inner?.status?.geo_validation === true;
      const msg = String(json?.message || '');
      // Already geo-validated and only awaiting face → go straight to the camera.
      const pendingFace =
        inner?.status?.current_state === 'PENDING_FACE' ||
        /complete face recognition/i.test(msg);

      if ((json?.success && geoOk) || pendingFace) {
        setVenueName(inner?.venue?.venue_name || null);
        setGeoState('valid');
        setTimeout(() => setStep('camera'), 1100);
      } else {
        setGeoError(json?.message || 'You are not within an authorized location.');
        setGeoState('invalid');
      }
    } catch (e: any) {
      setGeoError(e?.message || 'Could not validate your location. Please try again.');
      setGeoState('invalid');
    }
  };

  const snap = async () => {
    try {
      const photo = await camRef.current?.takePictureAsync({ quality: 0.5, base64: true, skipProcessing: true });
      setSelfieUri(photo?.uri || null);
      verify(photo?.base64 || null, photo?.uri || null);
    } catch (e) {
      verify(null, null);
    }
  };

  const verify = async (b64: string | null, uri?: string | null) => {
    setStep('verifying');
    try {
      if (!qid) throw new Error('Your account is not enabled for face attendance (no QID).');
      if (!b64 && !uri) {
        setResult({ accepted: false, rejection_reason: 'face_mismatch', message: 'Could not capture your photo. Please retake.' });
        setStep('result');
        return;
      }
      // Step 2: face recognition — call the dalmart service DIRECTLY (multipart).
      const fr = await dalmartFaceValidate(qid, { base64: b64, uri });
      const root = fr?.data || fr || {};
      const att = root.attendance || {};
      const st = root.status || {};
      const fm = root.face_match || root.faceMatch || {};
      const markedAt =
        att.face_recognition_marked_at || st.face_recognition_marked_at ||
        root.face_recognition_marked_at || null;
      const faceFlag =
        att.face_recognition === true || st.face_recognition === true ||
        root.face_recognition === true;
      // Face is accepted if dalmart flags it OR returns a marked-at timestamp.
      const faceOk = (!!fr?.success && (faceFlag || !!markedAt)) || faceFlag || !!markedAt;

      if (faceOk) {
        const ts = markedAt || new Date().toISOString();
        // Status is driven by the button the user pressed:
        // Check In -> IN, Check Out -> OUT.
        const status: 'IN' | 'OUT' = kind === 'in' ? 'IN' : 'OUT';
        const recType: 'in' | 'out' = kind;
        // Update the timeline in-memory from the dalmart result (no FastAPI, no storage).
        onSuccess({
          status,
          markedAt: ts,
          venue: venueName || undefined,
          faceResponse: fr,
        });
        const rec = {
          accepted: true,
          type: recType,
          timestamp: ts,
          geofence_name: venueName,
          inside_geofence: true,
          face_passed: true,
          face_score: typeof fm.confidence === 'number' ? fm.confidence / 100 : null,
          spoof_detected: false,
          is_mock_location: false,
        };
        setTimeout(() => { setResult(rec); setStep('result'); }, 1500);
      } else {
        setResult({ accepted: false, rejection_reason: 'face_mismatch', message: fr?.message || 'Face not recognized. Please try again.' });
        setStep('result');
      }
    } catch (e: any) {
      setResult({ accepted: false, rejection_reason: 'network_error', message: e?.message });
      setStep('result');
    }
  };

  const retry = () => {
    setResult(null);
    setSelfieUri(null);
    setStep('camera');
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <View style={styles.modalCard}>
          <View style={styles.modalHead}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalKicker}>{
                step === 'location' ? 'STEP 1 OF 2 · LOCATION' :
                step === 'camera' ? 'STEP 2 OF 2 · FACE' :
                step === 'verifying' ? 'ALMOST DONE' :
                step === 'result' ? '✓ DONE' : '…'
              }</Text>
              <Text style={styles.modalTitle}>
                {step === 'location' ? 'Confirm your location' :
                 step === 'camera' ? `Face check · Check-${kind}` :
                 step === 'verifying' ? 'Verifying you…' :
                 step === 'result' ? (result?.accepted ? 'Verified ✓' : 'Verification failed') :
                 'Preparing…'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} testID="capture-close" style={styles.modalCloseX}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {step === 'permissions' && (
            <View style={styles.center}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.captureMsg}>Preparing…</Text>
            </View>
          )}

          {step === 'location' && (
            <LocationStep
              coords={coords}
              geoState={geoState}
              venueName={venueName}
              geoError={geoError}
              kind={kind}
              onRetry={fetchLocation}
              onClose={onClose}
            />
          )}

          {step === 'camera' && (
            <View>
              <View style={styles.cameraWrap}>
                {Platform.OS === 'web' || !permission?.granted ? (
                  <View style={styles.cameraFallback}>
                    {/* Animated demo avatar */}
                    <DemoFaceAvatar />
                  </View>
                ) : (
                  <CameraView ref={camRef} style={styles.camera} facing="front" />
                )}
                <View style={styles.faceFrame} />
                <View style={styles.faceFrameCorners}>
                  <View style={[styles.cornerTL]} />
                  <View style={[styles.cornerTR]} />
                  <View style={[styles.cornerBL]} />
                  <View style={[styles.cornerBR]} />
                </View>
              </View>
              <Text style={styles.captureHint}>
                Center your face in the frame & ensure good lighting.
              </Text>

              {demoMode && (
                <View style={styles.demoOutcomeBox}>
                  <Text style={styles.demoOutcomeLabel}>DEMO · FACE OUTCOME</Text>
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                    {[
                      { id: 'success', label: 'Success', color: '#16A34A', icon: 'check-circle' },
                      { id: 'low_confidence', label: 'Low Match', color: '#F59E0B', icon: 'alert-circle' },
                      { id: 'spoof', label: 'Spoof', color: '#DC2626', icon: 'shield-alert' },
                    ].map((o) => {
                      const active = demoOutcome === o.id;
                      return (
                        <TouchableOpacity
                          key={o.id}
                          onPress={() => setDemoOutcome(o.id as DemoOutcome)}
                          style={[
                            styles.demoOutcomeChip,
                            active && { backgroundColor: o.color, borderColor: o.color },
                          ]}
                          testID={`outcome-${o.id}`}
                        >
                          <MaterialCommunityIcons name={o.icon as any} size={14} color={active ? colors.white : o.color} />
                          <Text style={[
                            styles.demoOutcomeText,
                            active && { color: colors.white },
                            !active && { color: o.color },
                          ]}>{o.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              <TouchableOpacity activeOpacity={0.85} onPress={snap} style={styles.snapBtn} testID="snap-btn">
                <MaterialCommunityIcons name="camera-iris" size={22} color="#FFFFFF" />
                <Text style={styles.snapText}>Capture & Verify</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 'verifying' && <VerifyingView selfieUri={selfieUri} />}

          {step === 'result' && result && (
            <ResultView result={result} kind={kind} selfieUri={selfieUri} onDone={onDone} onRetry={retry} />
          )}
        </View>
      </View>
    </Modal>
  );
};

const LocationStep = ({ coords, geoState, venueName, geoError, kind, onRetry, onClose }: {
  coords: { lat: number; lon: number; accuracy: number; mock: boolean } | null;
  geoState: 'fetching' | 'validating' | 'valid' | 'invalid';
  venueName: string | null;
  geoError: string;
  kind: 'in' | 'out';
  onRetry: () => void;
  onClose: () => void;
}) => {
  const pulse = useRef(new Animated.Value(0)).current;
  const animating = geoState === 'fetching' || geoState === 'validating';
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 1600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    );
    if (animating) loop.start();
    return () => loop.stop();
  }, [animating]);
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.3] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] });

  const invalid = geoState === 'invalid';
  const valid = geoState === 'valid';

  const pinColor = invalid ? colors.sos : valid ? colors.success : colors.primary;
  const pinIcon = invalid ? 'map-marker-off' : valid ? 'map-marker-check' : 'map-marker-radius';

  const title =
    geoState === 'fetching' ? 'Pinpointing your location…' :
    geoState === 'validating' ? 'Validating your location…' :
    valid ? 'Location verified' :
    'Location check failed';

  const sub =
    geoState === 'fetching' ? 'Make sure GPS / location services are enabled' :
    geoState === 'validating' ? 'Checking you are within an authorized location' :
    valid ? (venueName ? `You are at ${venueName}` : 'You are within an authorized location') :
    geoError;

  return (
    <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
      <View style={styles.locPinWrap}>
        {animating && <Animated.View style={[styles.locPulse, { transform: [{ scale }], opacity }]} />}
        <View style={[styles.locPin, { backgroundColor: pinColor }]}>
          <MaterialCommunityIcons name={pinIcon as any} size={44} color="#FFFFFF" />
        </View>
      </View>
      <Text style={styles.locTitle}>{title}</Text>
      <Text style={[styles.locSub, invalid && { color: colors.sos, fontWeight: '600' }]}>{sub}</Text>

      {coords?.mock && (
        <View style={styles.locWarn}>
          <Ionicons name="warning" size={13} color={colors.sos} />
          <Text style={styles.locWarnText}>Mock location detected</Text>
        </View>
      )}

      {invalid ? (
        <View style={styles.locActions}>
          <TouchableOpacity onPress={onRetry} style={styles.locRetryBtn} testID="geo-retry">
            <Ionicons name="refresh" size={16} color="#FFFFFF" />
            <Text style={styles.locRetryText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.locCancelBtn} testID="geo-cancel">
            <Text style={styles.locCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.locNextHint}>
          {valid ? (
            <>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.locNextText}>Starting face verification…</Text>
            </>
          ) : (
            <Text style={styles.locNextText}>Step 1 of 2 · Geo validation for Check-{kind}</Text>
          )}
        </View>
      )}
    </View>
  );
};

const DemoFaceAvatar = () => {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 1800, easing: Easing.linear, useNativeDriver: true }),
    ).start();
  }, []);
  const scale = pulse.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.12, 1] });
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[styles.demoFaceCircle, { transform: [{ scale }] }]}>
        <MaterialCommunityIcons name="face-man-outline" size={90} color="#FFFFFF" />
      </Animated.View>
      <Text style={[styles.captureMsg, { color: 'rgba(255,255,255,0.85)' }]}>
        Demo selfie preview{'\n'}(open on phone for live camera)
      </Text>
    </View>
  );
};

const VerifyingView = ({ selfieUri }: { selfieUri: string | null }) => {
  const scanY = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(scanY, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
    ).start();
    Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true }),
    ).start();
  }, []);

  const scanTranslate = scanY.interpolate({ inputRange: [0, 0.5, 1], outputRange: [-90, 90, -90] });
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.22] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });

  const checklist = [
    { icon: 'face-recognition',  label: 'Detecting facial landmarks',  delay: 0 },
    { icon: 'magnify-scan',      label: 'Computing match score',       delay: 800 },
    { icon: 'shield-search',     label: 'Anti-spoof verification',     delay: 1500 },
    { icon: 'map-marker-radius', label: 'GPS geofence check',          delay: 2100 },
  ];

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={styles.verifyImgWrap}>
        <Animated.View style={[styles.verifyPulse, { transform: [{ scale: pulseScale }], opacity: pulseOpacity }]} />
        <View style={styles.verifyImgInner}>
          {selfieUri && selfieUri !== 'placeholder' ? (
            <Image source={{ uri: selfieUri }} style={styles.verifyImg} />
          ) : (
            <View style={[styles.verifyImg, styles.demoFacePlaceholder]}>
              <MaterialCommunityIcons name="face-man-outline" size={80} color="#FFFFFF" />
            </View>
          )}
          {/* Scan line */}
          <Animated.View
            style={[
              styles.scanLine,
              { transform: [{ translateY: scanTranslate }] },
            ]}
          >
            <LinearGradient
              colors={['transparent', colors.primary, '#FF4D6D', 'transparent']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ flex: 1 }}
            />
          </Animated.View>
          {/* Landmark dots */}
          {[[35, 40], [85, 40], [60, 65], [40, 90], [80, 90]].map((p, i) => (
            <FaceDot key={i} cx={p[0]} cy={p[1]} delay={i * 180} />
          ))}
        </View>
      </View>

      <View style={styles.checklistBox}>
        {checklist.map((c, i) => <ChecklistRow key={i} {...c} />)}
      </View>
    </View>
  );
};

const FaceDot = ({ cx, cy, delay }: { cx: number; cy: number; delay: number }) => {
  const op = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(op, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(op, { toValue: 0, duration: 450, useNativeDriver: true }),
        Animated.delay(800),
      ]),
    ).start();
  }, []);
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: `${cx}%`,
        top: `${cy}%`,
        width: 8, height: 8, borderRadius: 4,
        backgroundColor: '#22D3EE',
        opacity: op,
        transform: [{ translateX: -4 }, { translateY: -4 }],
        shadowColor: '#22D3EE',
        shadowOpacity: 0.8,
        shadowRadius: 6,
      }}
    />
  );
};

const ChecklistRow = ({ icon, label, delay }: { icon: string; label: string; delay: number }) => {
  const op = useRef(new Animated.Value(0)).current;
  const [done, setDone] = useState(false);
  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(op, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(() => setDone(true), delay + 700);
    return () => clearTimeout(t);
  }, []);
  return (
    <Animated.View style={[styles.checkRow, { opacity: op }]}>
      <View style={[styles.checkIcon, done && { backgroundColor: '#DCFCE7' }]}>
        {done ? (
          <Ionicons name="checkmark" size={14} color="#16A34A" />
        ) : (
          <ActivityIndicator size="small" color={colors.primary} />
        )}
      </View>
      <Text style={[styles.checkText, done && { color: colors.text, fontWeight: '700' }]}>{label}</Text>
      {done && <MaterialCommunityIcons name={icon as any} size={16} color={colors.textMuted} />}
    </Animated.View>
  );
};

const ResultView = ({ result, kind, selfieUri, onDone, onRetry }: {
  result: any; kind: 'in' | 'out'; selfieUri: string | null; onDone: () => void; onRetry: () => void;
}) => {
  const ok = !!result.accepted;
  const fScore = Math.round((result.face_score || 0) * 100);
  const scale = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue: 1, friction: 4, tension: 80, useNativeDriver: true }).start();
  }, []);

  return (
    <View>
      <Animated.View style={[
        styles.resultBadge,
        { backgroundColor: ok ? '#DCFCE7' : '#FEE2E2', transform: [{ scale }] },
      ]}>
        <View style={styles.resultSelfieWrap}>
          {selfieUri && selfieUri !== 'placeholder' ? (
            <Image source={{ uri: selfieUri }} style={styles.resultSelfie} />
          ) : (
            <View style={[styles.resultSelfie, styles.demoFacePlaceholder]}>
              <MaterialCommunityIcons name="face-man-outline" size={48} color="#FFFFFF" />
            </View>
          )}
          <View style={[styles.resultIconBadge, { backgroundColor: ok ? '#16A34A' : '#DC2626' }]}>
            <Ionicons name={ok ? 'checkmark' : 'close'} size={20} color="#FFFFFF" />
          </View>
        </View>
        <Text style={[styles.resultTitle, { color: ok ? '#15803D' : '#991B1B' }]}>
          {ok ? `Check-${kind} recorded` : labelReason(result.rejection_reason)}
        </Text>
        {ok && result.status && (
          <Badge label={STATUS_META[result.status]?.label || result.status} color={STATUS_META[result.status]?.color || colors.text} />
        )}
        {ok && (
          <Text style={styles.resultTime}>
            {fmtISTTime(result.timestamp)}
            {' · '}
            {fmtISTDate(result.timestamp)}
          </Text>
        )}
      </Animated.View>

      <View style={styles.resultRows}>
        <ResultRow icon="face-recognition" label="Face match" value={`${fScore}%`} ok={result.face_passed} />
        <ResultRow
          icon="map-marker-radius"
          label="Location"
          value={
            result.inside_geofence
              ? (result.geofence_name || 'Authorized')
              : (typeof result.distance_m === 'number'
                  ? `${(result.distance_m / 1000).toFixed(2)}km off`
                  : (result.rejection_reason === 'network_error' ? 'Cannot verify' : 'Out of range'))
          }
          ok={result.inside_geofence}
        />
        <ResultRow icon="shield-check-outline" label="Anti-spoof" value={result.spoof_detected ? 'Spoof detected' : 'Live person'} ok={!result.spoof_detected} />
        <ResultRow icon="cellphone-marker" label="Mock location" value={result.is_mock_location ? 'Detected!' : 'Not detected'} ok={!result.is_mock_location} />
      </View>

      <View style={{ flexDirection: 'row', gap: 8, marginTop: spacing.md }}>
        {!ok && (
          <TouchableOpacity activeOpacity={0.85} onPress={onRetry} style={[styles.doneBtn, { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.primary, flex: 1 }]} testID="result-retry">
            <Text style={[styles.doneText, { color: colors.primary }]}>Try Again</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity activeOpacity={0.85} onPress={onDone} style={[styles.doneBtn, { flex: 1 }]} testID="result-done">
          <Text style={styles.doneText}>{ok ? 'Done' : 'Close'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const ResultRow = ({ icon, label, value, ok }: any) => (
  <View style={styles.resRow}>
    <MaterialCommunityIcons name={icon} size={18} color={ok ? colors.success : colors.sos} />
    <Text style={styles.resLabel}>{label}</Text>
    <Text style={[styles.resValue, { color: ok ? colors.success : colors.sos }]}>{value}</Text>
    <Ionicons name={ok ? 'checkmark' : 'close'} size={16} color={ok ? colors.success : colors.sos} />
  </View>
);

const TimeBlock = ({ label, value }: { label: string; value: string }) => (
  <View style={{ flex: 1, alignItems: 'center' }}>
    <Text style={styles.timeVal}>{value || '—'}</Text>
    <Text style={styles.timeLab}>{label}</Text>
  </View>
);

function fmtTime(iso?: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch { return '—'; }
}

function labelReason(r?: string) {
  if (!r) return 'Rejected';
  return ({
    outside_geofence: 'Outside Geofence',
    face_mismatch: 'Face Mismatch',
    spoof_attempt: 'Spoof Detected',
    mock_location_detected: 'Mock Location',
    network_error: 'Network Error',
  } as any)[r] || r;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.clayBg },
  tabScroll: { flexGrow: 0, flexShrink: 0 },
  tabRow: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: 6,
    alignItems: 'center',
  },
  heroWrap: {
    borderRadius: radii.clay,
  },
  hero: {
    borderRadius: radii.clay,
    padding: spacing.md + 2,
  },
  heroOrb: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroKicker: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.9)', letterSpacing: 1.2 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: colors.white, marginTop: 4 },
  heroLastPunch: { marginTop: 10, fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  clayBlock: {
    backgroundColor: colors.claySurface,
    borderRadius: radii.clay,
    padding: spacing.md,
    marginTop: spacing.md,
    ...(clay.surface as any),
  },
  toggleWrap: {
    marginTop: spacing.md,
    borderRadius: radii.clay,
    overflow: 'hidden',
  },
  toggleBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 18, paddingHorizontal: 18,
    gap: 14,
  },
  toggleIconWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  toggleTitle: { fontSize: 19, fontWeight: '900', color: colors.white, letterSpacing: 0.3 },
  toggleSub: { fontSize: 12, color: 'rgba(255,255,255,0.92)', marginTop: 2, fontWeight: '600' },
  multiPunchHint: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 10,
    paddingHorizontal: spacing.md,
  },
  multiPunchText: { fontSize: 11, color: colors.clayMuted, fontWeight: '600' },
  timeRow: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: spacing.md, backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: radii.md, padding: spacing.sm,
  },
  timeDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)', alignSelf: 'stretch' },
  timeVal: { fontSize: 17, fontWeight: '800', color: colors.white },
  timeLab: { fontSize: 10, color: 'rgba(255,255,255,0.85)', marginTop: 2, letterSpacing: 0.8, fontWeight: '600' },
  cardLabel: { fontSize: 10, fontWeight: '800', color: colors.clayMuted, letterSpacing: 1.4 },
  typeRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12,
  },
  typeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: colors.clayBgSoft,
    borderRadius: radii.pill,
  },
  typeBtnActive: {
    backgroundColor: colors.primary,
  },
  typeBtnText: { fontSize: 12, fontWeight: '700', color: colors.clayDark },
  checkBtnWrap: { marginTop: spacing.md, borderRadius: radii.lg, overflow: 'hidden' },
  checkBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 18,
  },
  checkBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  actionRow: {
    flexDirection: 'row', gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionBtnWrap: {
    borderRadius: radii.lg, overflow: 'hidden',
    ...shadow.card,
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16, paddingHorizontal: 10,
  },
  actionBtnTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  actionBtnSub: { color: 'rgba(255,255,255,0.85)', fontSize: 10, fontWeight: '600', marginTop: 1 },
  demoRow: { flexDirection: 'row', alignItems: 'center' },
  demoSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  demoBox: {
    flexDirection: 'row', gap: 8, marginTop: 10,
  },
  demoChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: radii.md,
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
  },
  demoChipActive: { backgroundColor: '#DCFCE7', borderColor: colors.success },
  demoChipActiveBad: { backgroundColor: '#FEE2E2', borderColor: colors.sos },
  demoChipText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  fenceRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: 10,
  },
  fenceIcon: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  fenceName: { fontSize: 13, fontWeight: '700', color: colors.text },
  fenceAddr: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  dayBadge: {
    width: 52, height: 56, borderRadius: radii.md,
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 4,
  },
  dayBadgeNum: { fontSize: 22, fontWeight: '800', lineHeight: 24 },
  dayBadgeMon: { fontSize: 9, fontWeight: '800', letterSpacing: 1.2, marginTop: 2 },
  dayLabel: { fontSize: 14, fontWeight: '700', color: colors.text },
  daySub: { fontSize: 11, color: colors.textSecondary },
  attTypeText: { fontSize: 10, color: colors.textMuted, fontWeight: '600' },
  weekTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 2 },
  // Apple-style month calendar
  calHead: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  calNavBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primaryBg,
  },
  calMonth: { fontSize: 18, fontWeight: '800', color: colors.text },
  calWeekRow: { flexDirection: 'row', marginBottom: 4 },
  calWeekday: {
    flex: 1, textAlign: 'center',
    fontSize: 11, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.5,
  },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: {
    width: `${100 / 7}%`,
    alignItems: 'center', justifyContent: 'flex-start',
    paddingVertical: 4, height: 52,
  },
  calDayCircle: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
  },
  calDayToday: { backgroundColor: colors.primary },
  calDaySelected: { borderWidth: 1.5, borderColor: colors.primary },
  calDayNum: { fontSize: 15, fontWeight: '600', color: colors.text },
  calDayNumToday: { color: colors.white, fontWeight: '800' },
  calDayNumSelected: { color: colors.primary, fontWeight: '800' },
  calDot: { width: 6, height: 6, borderRadius: 3, marginTop: 3 },
  streakChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: radii.pill,
  },
  streakText: { fontSize: 13, fontWeight: '800', color: '#C2410C' },
  legendRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.border,
    justifyContent: 'center',
  },
  legendText: { fontSize: 10, color: colors.textSecondary, fontWeight: '600' },
  ringWrap: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  ringFooter: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  ringFootDiv: { width: 1, height: 36, backgroundColor: colors.border },
  ringFootVal: { fontSize: 18, fontWeight: '800', color: colors.text },
  ringFootLab: { fontSize: 10, color: colors.textMuted, fontWeight: '700', letterSpacing: 1, marginTop: 2 },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm,
    marginTop: spacing.md,
  },
  statCard: {
    flex: 1, minWidth: '47%',
    backgroundColor: colors.surface, borderRadius: radii.lg,
    padding: spacing.md, ...shadow.card,
  },
  statIcon: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2, fontWeight: '600' },
  kpiBig: { fontSize: 22, fontWeight: '800', color: colors.text },
  kpiLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  staffRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  staffAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primaryBg,
    alignItems: 'center', justifyContent: 'center',
  },
  staffInit: { fontWeight: '700', color: colors.primary, fontSize: 13 },
  staffName: { fontSize: 13, fontWeight: '700', color: colors.text },
  staffMeta: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },

  // Modal
  modalRoot: {
    flex: 1, backgroundColor: 'rgba(15,23,42,0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: spacing.md, paddingBottom: spacing.lg,
    maxHeight: '92%',
  },
  modalHead: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalKicker: { fontSize: 10, fontWeight: '800', letterSpacing: 1.4, color: colors.textMuted },
  modalTitle: { fontSize: 19, fontWeight: '800', color: colors.text, marginTop: 2 },
  modalCloseX: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center',
  },
  center: { alignItems: 'center', paddingVertical: spacing.xl },
  captureMsg: { color: colors.textSecondary, marginTop: 10, textAlign: 'center', fontSize: 13 },
  // Location step
  locPinWrap: {
    width: 120, height: 120, alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  locPulse: {
    position: 'absolute',
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: colors.primary,
  },
  locPin: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  locTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  locSub: { fontSize: 12.5, color: colors.textSecondary, marginTop: 6, textAlign: 'center', paddingHorizontal: spacing.lg },
  locWarn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginTop: 10, paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: '#FEE2E2', borderRadius: radii.pill,
  },
  locWarnText: { fontSize: 11, fontWeight: '700', color: colors.sos },
  locNextHint: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: spacing.lg,
  },
  locNextText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  locActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg },
  locRetryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg, paddingVertical: 11, borderRadius: radii.pill,
  },
  locRetryText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  locCancelBtn: { paddingHorizontal: spacing.lg, paddingVertical: 11 },
  locCancelText: { color: colors.textMuted, fontWeight: '700', fontSize: 14 },
  captureSub: { color: colors.textMuted, marginTop: 4, fontSize: 11 },
  cameraWrap: {
    aspectRatio: 3 / 4,
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
  },
  camera: { flex: 1 },
  cameraFallback: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#0F172A',
  },
  demoFaceCircle: {
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(227,24,55,0.6)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)',
  },
  faceFrame: {
    position: 'absolute',
    top: '12%', left: '15%', right: '15%', bottom: '20%',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.7)',
    borderRadius: 999,
  },
  faceFrameCorners: {
    position: 'absolute',
    top: 14, left: 14, right: 14, bottom: 14,
  },
  cornerTL: { position: 'absolute', top: 0, left: 0, width: 26, height: 26, borderTopWidth: 4, borderLeftWidth: 4, borderColor: colors.primary, borderTopLeftRadius: 4 },
  cornerTR: { position: 'absolute', top: 0, right: 0, width: 26, height: 26, borderTopWidth: 4, borderRightWidth: 4, borderColor: colors.primary, borderTopRightRadius: 4 },
  cornerBL: { position: 'absolute', bottom: 0, left: 0, width: 26, height: 26, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: colors.primary, borderBottomLeftRadius: 4 },
  cornerBR: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderBottomWidth: 4, borderRightWidth: 4, borderColor: colors.primary, borderBottomRightRadius: 4 },
  captureHint: { fontSize: 12, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' },

  demoOutcomeBox: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  demoOutcomeLabel: {
    fontSize: 10, fontWeight: '800', letterSpacing: 1.3, color: colors.textMuted,
  },
  demoOutcomeChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: 8, borderRadius: radii.md,
    backgroundColor: colors.background,
    borderWidth: 1, borderColor: colors.border,
  },
  demoOutcomeText: { fontSize: 11, fontWeight: '800' },

  snapBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: colors.primary,
    paddingVertical: 14, borderRadius: radii.lg,
    marginTop: spacing.md,
  },
  snapText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },

  verifyImgWrap: {
    width: 180, height: 180, alignItems: 'center', justifyContent: 'center',
    marginTop: spacing.md,
  },
  verifyImgInner: {
    width: 160, height: 160, borderRadius: 80,
    borderWidth: 4, borderColor: colors.primary,
    overflow: 'hidden', position: 'relative',
    backgroundColor: '#000',
  },
  verifyImg: { width: '100%', height: '100%' },
  demoFacePlaceholder: {
    backgroundColor: 'rgba(227,24,55,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  verifyPulse: {
    position: 'absolute',
    width: 180, height: 180, borderRadius: 90,
    borderWidth: 3, borderColor: colors.primary,
  },
  scanLine: {
    position: 'absolute',
    left: 0, right: 0,
    height: 4,
    top: '50%',
  },
  checklistBox: {
    marginTop: spacing.lg,
    width: '100%',
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: radii.lg,
    gap: 8,
  },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkIcon: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  checkText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600', flex: 1 },

  resultBadge: {
    alignItems: 'center', padding: spacing.md, borderRadius: radii.lg,
    gap: 8,
  },
  resultSelfieWrap: {
    width: 100, height: 100, borderRadius: 50,
    position: 'relative',
  },
  resultSelfie: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 4, borderColor: '#FFFFFF',
  },
  resultIconBadge: {
    position: 'absolute',
    right: -4, bottom: -4,
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#FFFFFF',
  },
  resultTitle: { fontSize: 17, fontWeight: '800', marginTop: 6 },
  resultTime: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  resultRows: { marginTop: spacing.md, gap: 4 },
  resRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  resLabel: { flex: 1, fontSize: 13, color: colors.text, fontWeight: '600' },
  resValue: { fontSize: 12, fontWeight: '700' },
  doneBtn: {
    backgroundColor: colors.primary,
    padding: 14, borderRadius: radii.md,
    alignItems: 'center',
  },
  doneText: { color: '#FFFFFF', fontWeight: '800' },
});
