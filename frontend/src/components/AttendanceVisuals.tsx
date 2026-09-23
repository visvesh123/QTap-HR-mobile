import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SLG, Stop, G, Text as SvgText } from 'react-native-svg';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radii, shadow, spacing } from '../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/* -------- Circular progress ring (used on Stats tab) -------- */
export function ProgressRing({
  value, size = 180, stroke = 16, label, sub,
}: { value: number; size?: number; stroke?: number; label?: string; sub?: string }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: Math.max(0, Math.min(100, value)),
      duration: 1100,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [value]);
  const offset = anim.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Defs>
          <SLG id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.primary} />
            <Stop offset="1" stopColor="#FF4D6D" />
          </SLG>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={stroke}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#ringGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset as any}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Text style={{ fontSize: 38, fontWeight: '800', color: colors.text, letterSpacing: -1 }}>
          {Math.round(value)}<Text style={{ fontSize: 18, color: colors.textSecondary }}>%</Text>
        </Text>
        {label ? <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '700', letterSpacing: 1, marginTop: 2 }}>{label}</Text> : null}
        {sub ? <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>{sub}</Text> : null}
      </View>
    </View>
  );
}

/* -------- Weekly streak strip (used on History tab) -------- */
type StreakDay = { date: string; status: 'present' | 'late' | 'wfh' | 'absent' | 'weekend' | 'future' };

export function WeekStreak({ days }: { days: StreakDay[] }) {
  return (
    <View style={s.weekRow}>
      {days.map((d, i) => {
        const label = new Date(d.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'narrow' });
        const dayNum = new Date(d.date + 'T00:00:00').getDate();
        const isFuture = d.status === 'future';
        const isWeekend = d.status === 'weekend';
        return (
          <View key={i} style={s.dayCol}>
            <Text style={[s.dayLetter, isFuture && { color: colors.textMuted }]}>{label}</Text>
            <View
              style={[
                s.dayDot,
                d.status === 'present' && { backgroundColor: '#16A34A' },
                d.status === 'late'    && { backgroundColor: '#F59E0B' },
                d.status === 'wfh'     && { backgroundColor: '#3B82F6' },
                d.status === 'absent'  && { backgroundColor: '#EF4444' },
                isWeekend              && { backgroundColor: 'transparent', borderWidth: 2, borderColor: colors.border },
                isFuture               && { backgroundColor: 'transparent', borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed' },
              ]}
            >
              {d.status === 'present' && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
              {d.status === 'late'    && <MaterialCommunityIcons name="clock-fast" size={13} color="#FFFFFF" />}
              {d.status === 'wfh'     && <MaterialCommunityIcons name="home" size={13} color="#FFFFFF" />}
              {d.status === 'absent'  && <Ionicons name="close" size={14} color="#FFFFFF" />}
              {(isWeekend || isFuture) && <Text style={s.dayNum}>{dayNum}</Text>}
            </View>
            {!isWeekend && !isFuture && <Text style={s.dayNum2}>{dayNum}</Text>}
          </View>
        );
      })}
    </View>
  );
}

/* -------- Today working time (used on Today tab) -------- */
export function TodayTimeline({
  checkIn, checkOut, workSeconds,
}: { checkIn?: string; checkOut?: string; workSeconds?: number; expectedStart?: string }) {
  // The dalmart `face_recognition_marked_at` is a UTC timestamp. Always render it in
  // IST (Asia/Kolkata) so the timeline matches the campus clock on every device/web.
  const normalize = (iso?: string) => {
    if (!iso) return null;
    let s = String(iso).trim().replace(' ', 'T');
    // Naive timestamps (no Z / no ±hh:mm offset) are treated as UTC.
    if (!/[zZ]$|[+-]\d{2}:?\d{2}$/.test(s)) s += 'Z';
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  };
  const fmt = (iso?: string) => {
    const d = normalize(iso);
    if (!d) return '—';
    try {
      return d.toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata',
      });
    } catch { return '—'; }
  };

  const liveSeconds = useMemo(() => {
    if (workSeconds != null && workSeconds > 0) return workSeconds;
    const inD = normalize(checkIn);
    if (!inD) return 0;
    const outD = normalize(checkOut);
    const end = outD ?? new Date();
    return Math.max(0, (end.getTime() - inD.getTime()) / 1000);
  }, [checkIn, checkOut, workSeconds]);

  const hours = Math.floor(liveSeconds / 3600);
  const mins = Math.floor((liveSeconds % 3600) / 60);
  const workLabel = checkIn
    ? (checkOut ? 'Worked today' : 'Working now')
    : 'Not started';

  // Position along the day from 06:00 to 22:00 (16h span), using IST hour-of-day.
  const toPct = (iso?: string) => {
    const d = normalize(iso);
    if (!d) return null;
    const hhmm = d.toLocaleTimeString('en-GB', {
      hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata',
    });
    const [hh, mm] = hhmm.split(':').map(Number);
    const h = hh + mm / 60;
    const pct = Math.max(0, Math.min(1, (h - 6) / 16));
    return pct * 100;
  };
  const inPct = toPct(checkIn);
  const outPct = toPct(checkOut);
  const nowPct = checkIn && !checkOut ? toPct(new Date().toISOString()) : null;

  return (
    <View style={s.timeline}>
      <View style={s.workHero}>
        <Text style={s.workLabel}>{workLabel}</Text>
        <View style={s.workTimeRow}>
          <Text style={s.workHours}>{hours}</Text>
          <Text style={s.workUnit}>h</Text>
          <Text style={[s.workHours, { marginLeft: 6 }]}>{String(mins).padStart(2, '0')}</Text>
          <Text style={s.workUnit}>m</Text>
        </View>
      </View>

      <View style={s.tlTrack}>
        {[6, 9, 12, 15, 18, 21].map((h) => (
          <View key={h} style={[s.tlTick, { left: `${((h - 6) / 16) * 100}%` }]}>
            <View style={s.tlTickLine} />
            <Text style={s.tlTickLabel}>{h === 12 ? '12p' : h < 12 ? `${h}a` : `${h - 12}p`}</Text>
          </View>
        ))}
        {inPct != null && outPct != null && (
          <View
            style={[
              s.tlFill,
              { left: `${inPct}%`, width: `${Math.max(0, outPct - inPct)}%` },
            ]}
          />
        )}
        {inPct != null && outPct == null && nowPct != null && (
          <View
            style={[
              s.tlFillLive,
              { left: `${inPct}%`, width: `${Math.max(2, nowPct - inPct)}%` },
            ]}
          />
        )}
        {inPct != null && (
          <View style={[s.tlMarker, { left: `${inPct}%`, backgroundColor: '#16A34A' }]}>
            <Ionicons name="log-in-outline" size={12} color="#FFFFFF" />
          </View>
        )}
        {outPct != null && (
          <View style={[s.tlMarker, { left: `${outPct}%`, backgroundColor: colors.primary }]}>
            <Ionicons name="log-out-outline" size={12} color="#FFFFFF" />
          </View>
        )}
      </View>

      <View style={s.tlRow}>
        <View style={s.tlChip}>
          <View style={[s.tlDot, { backgroundColor: '#16A34A' }]} />
          <View>
            <Text style={s.tlEvLabel}>In</Text>
            <Text style={s.tlEvTime}>{fmt(checkIn)}</Text>
          </View>
        </View>
        <View style={[s.tlChip, { justifyContent: 'flex-end' }]}>
          <View>
            <Text style={[s.tlEvLabel, { textAlign: 'right' }]}>Out</Text>
            <Text style={[s.tlEvTime, { textAlign: 'right' }]}>{fmt(checkOut)}</Text>
          </View>
          <View style={[s.tlDot, { backgroundColor: colors.primary }]} />
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  // Week streak
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  dayCol: { alignItems: 'center', flex: 1 },
  dayLetter: { fontSize: 10, color: colors.textMuted, fontWeight: '700', letterSpacing: 1 },
  dayDot: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 6, marginBottom: 4,
    backgroundColor: colors.background,
  },
  dayNum: { fontSize: 11, color: colors.textMuted, fontWeight: '700' },
  dayNum2: { fontSize: 10, color: colors.textMuted, fontWeight: '600' },

  // Timeline / working time
  timeline: { marginTop: 0 },
  workHero: { alignItems: 'center', marginBottom: 18 },
  workLabel: {
    fontSize: 12, fontWeight: '700', color: colors.textMuted,
    letterSpacing: 0.6, textTransform: 'uppercase',
  },
  workTimeRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
  workHours: { fontSize: 40, fontWeight: '800', color: colors.text, letterSpacing: -1.2 },
  workUnit: { fontSize: 16, fontWeight: '700', color: colors.textSecondary, marginLeft: 2 },
  tlTrack: {
    height: 22,
    backgroundColor: colors.background,
    borderRadius: 11,
    position: 'relative',
    marginBottom: 28,
  },
  tlTick: { position: 'absolute', top: 0, bottom: 0, alignItems: 'center' },
  tlTickLine: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: colors.border },
  tlTickLabel: { position: 'absolute', top: 26, fontSize: 9, color: colors.textMuted, fontWeight: '700' },
  tlFill: {
    position: 'absolute', top: 4, bottom: 4,
    backgroundColor: colors.primary, borderRadius: 7, opacity: 0.85,
  },
  tlFillLive: {
    position: 'absolute', top: 4, bottom: 4,
    backgroundColor: '#16A34A', borderRadius: 7, opacity: 0.45,
  },
  tlMarker: {
    position: 'absolute', top: -6,
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    transform: [{ translateX: -12 }],
    borderWidth: 3, borderColor: '#FFFFFF',
    ...shadow.card,
  },
  tlRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  tlChip: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  tlDot: { width: 8, height: 8, borderRadius: 4 },
  tlEvLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  tlEvTime: { fontSize: 17, fontWeight: '800', color: colors.text, marginTop: 1 },
});
