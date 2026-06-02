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
import { api } from '../../src/api';
import { useAuth } from '../../src/auth';
import { colors, radii, shadow, spacing } from '../../src/theme';
import { Card, Pill, Badge, ScreenHeader, Empty } from '../../src/ui';
import { ProgressRing, WeekStreak, TodayTimeline } from '../../src/components/AttendanceVisuals';

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

export default function StaffAttendanceScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [tab, setTab] = useState<'today' | 'history' | 'stats' | 'team'>('today');
  const [today, setToday] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [team, setTeam] = useState<any>(null);
  const [geofences, setGeofences] = useState<any[]>([]);
  const [attType, setAttType] = useState<AttType>('office');
  const [demoMode, setDemoMode] = useState(false);
  const [demoInsideFence, setDemoInsideFence] = useState(true);
  const [showCapture, setShowCapture] = useState(false);
  const [captureKind, setCaptureKind] = useState<'in' | 'out'>('in');

  const reload = useCallback(async () => {
    try {
      const [t, h, s, g] = await Promise.all([
        api.attendanceToday().catch(() => null),
        api.attendanceHistory().catch(() => []),
        api.attendanceStats().catch(() => null),
        api.attendanceGeofences().catch(() => []),
      ]);
      setToday(t); setHistory(h); setStats(s); setGeofences(g);
      if (isAdmin) {
        const tm = await api.attendanceAdminToday().catch(() => null);
        setTeam(tm);
      }
    } catch {}
  }, [isAdmin]);

  useEffect(() => { reload(); }, [reload]);

  const checkedIn = !!today?.check_in;
  const checkedOut = !!today?.check_out;
  const nextAction: 'in' | 'out' | 'done' = !checkedIn ? 'in' : (!checkedOut ? 'out' : 'done');

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
        subtitle="Geo + Face verified"
        onBack={() => router.back()}
      />

      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
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
            today={today}
            attType={attType}
            setAttType={setAttType}
            demoMode={demoMode}
            setDemoMode={setDemoMode}
            demoInsideFence={demoInsideFence}
            setDemoInsideFence={setDemoInsideFence}
            geofences={geofences}
            nextAction={nextAction}
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
          demoMode={demoMode}
          demoInsideFence={demoInsideFence}
          onDone={async () => {
            setShowCapture(false);
            await reload();
          }}
          onClose={() => setShowCapture(false)}
        />
      )}
    </SafeAreaView>
  );
}

// ---------- TODAY ----------
const TodayTab = ({
  today, attType, setAttType, demoMode, setDemoMode,
  demoInsideFence, setDemoInsideFence, geofences, nextAction, onCheck,
}: any) => {
  const status = today?.status || 'absent';
  const sm = STATUS_META[status] || STATUS_META.absent;
  const hours = today?.work_seconds ? (today.work_seconds / 3600).toFixed(1) : '0.0';

  return (
    <View>
      {/* Status hero */}
      <LinearGradient
        colors={[colors.primaryDark, colors.primaryLight]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <Text style={styles.heroKicker}>{new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}</Text>
            <Text style={styles.heroTitle}>
              {nextAction === 'in'   ? 'Ready to check in' :
               nextAction === 'out'  ? 'Currently checked in' :
                                       'Day complete ✓'}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, alignItems: 'center' }}>
              <Badge label={sm.label.toUpperCase()} color={sm.color} bg="rgba(255,255,255,0.2)" />
              {today?.check_in?.attendance_type && (
                <Badge
                  label={TYPE_META[today.check_in.attendance_type as AttType]?.label.toUpperCase() || ''}
                  color={colors.white}
                  bg="rgba(255,255,255,0.18)"
                />
              )}
            </View>
          </View>
          <MaterialCommunityIcons
            name={nextAction === 'done' ? 'check-circle-outline' : 'clock-time-four-outline'}
            size={56} color="rgba(255,255,255,0.9)"
          />
        </View>
      </LinearGradient>

      {/* Today's Timeline */}
      <Card style={{ marginTop: spacing.md }}>
        <TodayTimeline
          checkIn={today?.check_in?.timestamp}
          checkOut={today?.check_out?.timestamp}
          workSeconds={today?.work_seconds}
        />
      </Card>

      {/* Attendance type selector */}
      {nextAction === 'in' && (
        <Card style={{ marginTop: spacing.md }}>
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
                  style={[styles.typeBtn, active && styles.typeBtnActive]}
                >
                  <MaterialCommunityIcons name={m.icon as any} size={20} color={active ? colors.primary : colors.textSecondary} />
                  <Text style={[styles.typeBtnText, active && { color: colors.primary }]}>{m.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>
      )}

      {/* Action button */}
      {nextAction !== 'done' && (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => onCheck(nextAction)}
          testID={`action-${nextAction}`}
          style={styles.checkBtnWrap}
        >
          <LinearGradient
            colors={nextAction === 'in' ? ['#16A34A', '#15803D'] : [colors.primaryDark, colors.primary]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.checkBtn}
          >
            <MaterialCommunityIcons
              name={nextAction === 'in' ? 'login-variant' : 'logout-variant'}
              size={26} color="#FFFFFF"
            />
            <Text style={styles.checkBtnText}>
              {nextAction === 'in' ? 'Check In Now' : 'Check Out Now'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Demo mode toggle */}
      <Card style={{ marginTop: spacing.md }}>
        <View style={styles.demoRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardLabel}>DEMO MODE</Text>
            <Text style={styles.demoSub}>Simulate location for demo / testing</Text>
          </View>
          <Switch
            value={demoMode}
            onValueChange={setDemoMode}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
            testID="demo-toggle"
          />
        </View>
        {demoMode && (
          <View style={styles.demoBox}>
            <TouchableOpacity
              onPress={() => setDemoInsideFence(true)}
              style={[styles.demoChip, demoInsideFence && styles.demoChipActive]}
              testID="demo-inside"
            >
              <Ionicons name="checkmark-circle" size={16} color={demoInsideFence ? colors.success : colors.textMuted} />
              <Text style={[styles.demoChipText, demoInsideFence && { color: colors.success }]}>
                Inside Mahindra Univ
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setDemoInsideFence(false)}
              style={[styles.demoChip, !demoInsideFence && styles.demoChipActiveBad]}
              testID="demo-outside"
            >
              <Ionicons name="alert-circle" size={16} color={!demoInsideFence ? colors.sos : colors.textMuted} />
              <Text style={[styles.demoChipText, !demoInsideFence && { color: colors.sos }]}>
                Outside Geofence
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </Card>

      {/* Configured geofences */}
      <Card style={{ marginTop: spacing.md }}>
        <Text style={styles.cardLabel}>AUTHORIZED LOCATIONS</Text>
        {geofences.map((g: any) => (
          <View key={g.id} style={styles.fenceRow}>
            <View style={[styles.fenceIcon, { backgroundColor: g.type === 'wfh' ? '#DBEAFE' : `${colors.primary}15` }]}>
              <MaterialCommunityIcons
                name={g.type === 'wfh' ? 'home-outline' : g.type === 'branch' ? 'office-building-outline' : 'school-outline'}
                size={18}
                color={g.type === 'wfh' ? colors.info : colors.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fenceName}>{g.name}</Text>
              <Text style={styles.fenceAddr}>{g.address}</Text>
            </View>
            {g.type !== 'wfh' && (
              <Badge label={`${g.radius_m}m`} color={colors.primary} />
            )}
          </View>
        ))}
      </Card>
    </View>
  );
};

// ---------- HISTORY ----------
const HistoryTab = ({ items }: { items: any[] }) => {
  // group by date
  const byDay = useMemo(() => {
    const m: Record<string, any[]> = {};
    items.forEach((it) => {
      const d = (it.timestamp || '').slice(0, 10);
      (m[d] = m[d] || []).push(it);
    });
    return Object.entries(m).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [items]);

  // Build last-7-day streak strip
  const weekDays = useMemo(() => {
    const today = new Date();
    const days: { date: string; status: any }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const evts = byDay.find(([k]) => k === iso)?.[1] || [];
      const inE = evts.find((x: any) => x.type === 'in' && x.accepted);
      const dow = d.getDay();
      let status: any = 'absent';
      if (dow === 0 || dow === 6) status = inE ? (inE.attendance_type === 'wfh' ? 'wfh' : 'present') : 'weekend';
      else if (inE) {
        if (inE.attendance_type === 'wfh') status = 'wfh';
        else if (inE.status === 'late') status = 'late';
        else status = 'present';
      }
      days.push({ date: iso, status });
    }
    return days;
  }, [byDay]);

  // Compute streak
  const streak = useMemo(() => {
    let count = 0;
    for (let i = weekDays.length - 1; i >= 0; i--) {
      const st = weekDays[i].status;
      if (st === 'present' || st === 'late' || st === 'wfh') count++;
      else if (st === 'weekend') continue;
      else break;
    }
    return count;
  }, [weekDays]);

  if (!items.length) return <Empty icon="time-outline" message="No attendance records yet" />;

  return (
    <View>
      {/* Week streak header */}
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <View>
            <Text style={styles.cardLabel}>THIS WEEK</Text>
            <Text style={styles.weekTitle}>Your attendance streak</Text>
          </View>
          <View style={styles.streakChip}>
            <MaterialCommunityIcons name="fire" size={16} color="#F97316" />
            <Text style={styles.streakText}>{streak} day{streak === 1 ? '' : 's'}</Text>
          </View>
        </View>
        <WeekStreak days={weekDays} />
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

      <View style={{ height: spacing.md }} />

      {byDay.map(([day, evts]) => {
        const inE = evts.find((x) => x.type === 'in' && x.accepted);
        const outE = [...evts].reverse().find((x) => x.type === 'out' && x.accepted);
        const stat = inE?.status || 'absent';
        const sm = STATUS_META[stat];
        const att_type = inE?.attendance_type as AttType | undefined;
        const dur = (inE && outE)
          ? ((new Date(outE.timestamp).getTime() - new Date(inE.timestamp).getTime()) / 3600000).toFixed(1)
          : null;
        return (
          <Card key={day} style={{ marginBottom: spacing.sm }} testID={`day-${day}`}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <View style={[styles.dayBadge, { backgroundColor: `${sm.color}1A` }]}>
                <Text style={[styles.dayBadgeNum, { color: sm.color }]}>
                  {new Date(day + 'T00:00:00').getDate()}
                </Text>
                <Text style={[styles.dayBadgeMon, { color: sm.color }]}>
                  {new Date(day + 'T00:00:00').toLocaleDateString(undefined, { month: 'short' }).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.dayLabel}>
                  {new Date(day + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long' })}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
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
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Badge label={sm.label} color={sm.color} />
                {att_type && (
                  <Text style={styles.attTypeText}>{TYPE_META[att_type]?.label}</Text>
                )}
              </View>
            </View>
          </Card>
        );
      })}
    </View>
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
type CaptureStep = 'permissions' | 'camera' | 'verifying' | 'result';

const CaptureFlow = ({
  kind, attType, demoMode, demoInsideFence, onDone, onClose,
}: {
  kind: 'in' | 'out';
  attType: AttType;
  demoMode: boolean;
  demoInsideFence: boolean;
  onDone: () => void;
  onClose: () => void;
}) => {
  const [step, setStep] = useState<CaptureStep>('permissions');
  const [permission, requestPermission] = useCameraPermissions();
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const camRef = useRef<any>(null);

  useEffect(() => {
    (async () => {
      if (Platform.OS === 'web') {
        // Skip camera permission flow on web — use placeholder selfie
        setStep('camera');
        return;
      }
      if (!permission) return;
      if (!permission.granted) {
        const r = await requestPermission();
        if (!r.granted) { onClose(); return; }
      }
      setStep('camera');
    })();
  }, [permission]);

  const snap = async () => {
    if (Platform.OS === 'web') {
      // mock selfie on web
      setSelfieUri('placeholder');
      setTimeout(() => verify(null), 200);
      return;
    }
    try {
      const photo = await camRef.current?.takePictureAsync({ quality: 0.4, base64: true, skipProcessing: true });
      setSelfieUri(photo?.uri || null);
      verify(photo?.base64 || null);
    } catch (e) {
      verify(null);
    }
  };

  const verify = async (b64: string | null) => {
    setStep('verifying');
    try {
      // Get GPS
      let lat = MU_LAT, lon = MU_LON, accuracy = 8, mock = false;
      if (demoMode) {
        if (demoInsideFence) {
          lat = MU_LAT + (Math.random() - 0.5) * 0.001; // ~50m jitter
          lon = MU_LON + (Math.random() - 0.5) * 0.001;
        } else {
          lat = 17.43; // ~10km away
          lon = 78.50;
        }
      } else if (Platform.OS !== 'web') {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            lat = loc.coords.latitude;
            lon = loc.coords.longitude;
            accuracy = loc.coords.accuracy || 8;
            // @ts-ignore — mocked field on some devices
            mock = !!loc.mocked;
          }
        } catch {}
      }
      const res = await api.attendanceCheck({
        latitude: lat,
        longitude: lon,
        accuracy_m: accuracy,
        type: kind,
        attendance_type: attType,
        selfie_b64: b64 ? 'b64-' + (b64?.length || 1) : 'placeholder', // we don't ship the real bytes for size
        is_mock_location: mock,
      });
      // Give a short "scanning" animation feel
      setTimeout(() => { setResult(res); setStep('result'); }, 1100);
    } catch (e: any) {
      setResult({ accepted: false, rejection_reason: 'network_error', message: e?.message });
      setStep('result');
    }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <View style={styles.modalCard}>
          <View style={styles.modalHead}>
            <Text style={styles.modalTitle}>
              {kind === 'in' ? 'Check In' : 'Check Out'}
            </Text>
            <TouchableOpacity onPress={onClose} testID="capture-close">
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {step === 'permissions' && (
            <View style={styles.center}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.captureMsg}>Requesting camera & location…</Text>
            </View>
          )}

          {step === 'camera' && (
            <View>
              <View style={styles.cameraWrap}>
                {Platform.OS === 'web' || !permission?.granted ? (
                  <View style={[styles.cameraFallback]}>
                    <MaterialCommunityIcons name="face-recognition" size={64} color={colors.primary} />
                    <Text style={styles.captureMsg}>
                      Selfie capture preview{'\n'}(camera unavailable in web preview)
                    </Text>
                  </View>
                ) : (
                  <CameraView ref={camRef} style={styles.camera} facing="front" />
                )}
                <View style={styles.faceFrame} />
              </View>
              <Text style={styles.captureHint}>
                Center your face in the frame & ensure good lighting.
              </Text>
              <TouchableOpacity activeOpacity={0.85} onPress={snap} style={styles.snapBtn} testID="snap-btn">
                <MaterialCommunityIcons name="camera-iris" size={22} color="#FFFFFF" />
                <Text style={styles.snapText}>Capture & Verify</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 'verifying' && <VerifyingView selfieUri={selfieUri} />}

          {step === 'result' && result && (
            <ResultView result={result} kind={kind} onDone={onDone} />
          )}
        </View>
      </View>
    </Modal>
  );
};

const VerifyingView = ({ selfieUri }: { selfieUri: string | null }) => {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true }),
    ).start();
  }, []);
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] });

  return (
    <View style={styles.center}>
      <View style={styles.verifyImgWrap}>
        {selfieUri && selfieUri !== 'placeholder' ? (
          <Image source={{ uri: selfieUri }} style={styles.verifyImg} />
        ) : (
          <View style={[styles.verifyImg, { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryBg }]}>
            <MaterialCommunityIcons name="face-recognition" size={48} color={colors.primary} />
          </View>
        )}
        <Animated.View style={[styles.verifyPulse, { transform: [{ scale }], opacity }]} />
      </View>
      <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.md }} />
      <Text style={styles.captureMsg}>Verifying face & location…</Text>
      <Text style={styles.captureSub}>Anti-spoof scan · GPS check · Face match</Text>
    </View>
  );
};

const ResultView = ({ result, kind, onDone }: { result: any; kind: 'in' | 'out'; onDone: () => void }) => {
  const ok = !!result.accepted;
  const fScore = Math.round((result.face_score || 0) * 100);
  return (
    <View>
      <View style={[styles.resultBadge, { backgroundColor: ok ? '#DCFCE7' : '#FEE2E2' }]}>
        <Ionicons name={ok ? 'checkmark-circle' : 'close-circle'} size={56} color={ok ? '#16A34A' : '#DC2626'} />
        <Text style={[styles.resultTitle, { color: ok ? '#15803D' : '#991B1B' }]}>
          {ok
            ? `Check-${kind} recorded ✓`
            : labelReason(result.rejection_reason) + ' ✕'}
        </Text>
        {result.status && ok && (
          <Badge label={STATUS_META[result.status]?.label || result.status} color={STATUS_META[result.status]?.color || colors.text} />
        )}
      </View>

      <View style={styles.resultRows}>
        <ResultRow
          icon="face-recognition"
          label="Face match"
          value={`${fScore}%`}
          ok={result.face_passed}
        />
        <ResultRow
          icon="map-marker-radius"
          label="Location"
          value={
            result.inside_geofence
              ? (result.geofence_name || 'Authorized location')
              : (typeof result.distance_m === 'number'
                  ? `${(result.distance_m / 1000).toFixed(2)}km off`
                  : (result.rejection_reason === 'network_error' ? 'Cannot verify' : 'Out of range'))
          }
          ok={result.inside_geofence}
        />
        <ResultRow
          icon="shield-check-outline"
          label="Anti-spoof"
          value={result.spoof_detected ? 'Spoof detected' : 'Live person'}
          ok={!result.spoof_detected}
        />
        <ResultRow
          icon="cellphone-marker"
          label="Mock location"
          value={result.is_mock_location ? 'Detected!' : 'Not detected'}
          ok={!result.is_mock_location}
        />
      </View>

      <TouchableOpacity activeOpacity={0.85} onPress={onDone} style={styles.doneBtn} testID="result-done">
        <Text style={styles.doneText}>Done</Text>
      </TouchableOpacity>
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
  container: { flex: 1, backgroundColor: colors.background },
  tabRow: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: 6,
  },
  hero: {
    borderRadius: radii.xl,
    padding: spacing.md,
    ...shadow.cardHeavy,
  },
  heroKicker: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.85)', letterSpacing: 1.2 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: colors.white, marginTop: 4 },
  timeRow: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: spacing.md, backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: radii.md, padding: spacing.sm,
  },
  timeDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)', alignSelf: 'stretch' },
  timeVal: { fontSize: 17, fontWeight: '800', color: colors.white },
  timeLab: { fontSize: 10, color: 'rgba(255,255,255,0.85)', marginTop: 2, letterSpacing: 0.8, fontWeight: '600' },
  cardLabel: { fontSize: 10, fontWeight: '700', color: colors.textMuted, letterSpacing: 1.4 },
  typeRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10,
  },
  typeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: colors.background,
    borderRadius: radii.pill,
    borderWidth: 1, borderColor: colors.border,
  },
  typeBtnActive: {
    backgroundColor: colors.primaryBg,
    borderColor: colors.primary,
  },
  typeBtnText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  checkBtnWrap: { marginTop: spacing.md, borderRadius: radii.lg, overflow: 'hidden' },
  checkBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 18,
  },
  checkBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
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
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  center: { alignItems: 'center', paddingVertical: spacing.xl },
  captureMsg: { color: colors.textSecondary, marginTop: 10, textAlign: 'center', fontSize: 13 },
  captureSub: { color: colors.textMuted, marginTop: 4, fontSize: 11 },
  cameraWrap: {
    aspectRatio: 3 / 4,
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
  },
  camera: { flex: 1 },
  cameraFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F172A' },
  faceFrame: {
    position: 'absolute',
    top: '12%', left: '15%', right: '15%', bottom: '20%',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.7)',
    borderRadius: 999,
  },
  captureHint: { fontSize: 12, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' },
  snapBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: colors.primary,
    paddingVertical: 14, borderRadius: radii.lg,
    marginTop: spacing.md,
  },
  snapText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },

  verifyImgWrap: { width: 120, height: 120, borderRadius: 60, position: 'relative' },
  verifyImg: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: colors.primary },
  verifyPulse: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 60, borderWidth: 3, borderColor: colors.primary,
  },
  resultBadge: {
    alignItems: 'center', padding: spacing.md, borderRadius: radii.lg,
    gap: 6,
  },
  resultTitle: { fontSize: 17, fontWeight: '800', marginTop: 4 },
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
    marginTop: spacing.md, alignItems: 'center',
  },
  doneText: { color: '#FFFFFF', fontWeight: '800' },
});
