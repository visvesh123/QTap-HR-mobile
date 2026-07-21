import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from '../api';
import { colors, radii, shadow, spacing } from '../theme';

const MEAL_LABEL: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  snacks: 'Snacks',
  dinner: 'Dinner',
  closed: 'Closed',
};

type Mess = {
  id: string;
  name: string;
  current: number;
  capacity: number;
  occupancy_pct: number;
  status: { label: string; color: string };
  recommended: boolean;
  current_meal: string;
  next_meal: string;
};

export default function MessLiveCard() {
  const [data, setData] = useState<{ meal: string; messes: Mess[] } | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const d: any = await api.messList();
        if (!mounted) return;
        // Support both legacy live-mess shape and the newer meals/menu/occupancy shape.
        if (d?.meal != null && Array.isArray(d?.messes) && d.messes[0]?.occupancy_pct != null) {
          setData(d);
          return;
        }
        const meal = d?.current_meal || 'closed';
        const messes = (d?.messes || []).map((m: any) => {
          const pct = typeof m.occupancy?.[meal] === 'number' ? m.occupancy[meal] : 0;
          return {
            id: m.id,
            name: m.name,
            current: Math.round((pct / 100) * (m.capacity || 0)),
            capacity: m.capacity || 0,
            occupancy_pct: pct,
            status: {
              label: pct < 50 ? 'Low' : pct <= 80 ? 'Moderate' : 'Packed',
              color: pct < 50 ? '#16A34A' : pct <= 80 ? '#F59E0B' : '#DC143C',
            },
            recommended: false,
            current_meal: meal === 'closed' ? 'closed' : meal,
            next_meal: meal,
          } as Mess;
        });
        if (messes.length) {
          const best = [...messes].sort((a, b) => a.occupancy_pct - b.occupancy_pct)[0];
          if (best) best.recommended = true;
        }
        setData({ meal: meal || 'closed', messes });
      } catch {}
    };
    load();
    const t = setInterval(load, 60000);
    return () => { mounted = false; clearInterval(t); };
  }, []);

  if (!data) return null;
  const isClosed = data.meal === 'closed';
  const messes = data.messes || [];
  const recommended = messes.find((m) => m.recommended);

  return (
    <View style={styles.wrap} testID="mess-live-card">
      <View style={[styles.headRow, styles.dim]}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="silverware-fork-knife" size={18} color={colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>
            {isClosed ? `MESS • NEXT: ${MEAL_LABEL[messes[0]?.next_meal || 'breakfast'].toUpperCase()}` : `MESS • LIVE ${MEAL_LABEL[data.meal].toUpperCase()}`}
          </Text>
          <Text style={styles.title}>
            {isClosed
              ? 'All messes are between meals'
              : recommended
                ? `${recommended.name} — least crowded`
                : 'Check capacity before you go'}
          </Text>
        </View>
        <View style={styles.upcomingBadge} testID="mess-live-upcoming-badge">
          <Text style={styles.upcomingBadgeText}>Upcoming</Text>
        </View>
      </View>

      <View style={[styles.row, styles.dim]}>
        {messes.map((m) => (
          <MiniCapacityBar key={m.id} mess={m} closed={isClosed} />
        ))}
      </View>
    </View>
  );
}

const MiniCapacityBar = ({ mess, closed }: { mess: Mess; closed: boolean }) => {
  const w = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(w, {
      toValue: closed ? 5 : mess.occupancy_pct,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [mess.occupancy_pct, closed]);

  const wi = w.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });
  const shortName = mess.name.replace(' Mess', '');
  const fillColor = closed ? colors.textMuted : mess.status.color;

  return (
    <View style={styles.col}>
      <View style={styles.colHead}>
        <Text style={styles.colName} numberOfLines={1}>{shortName}</Text>
        {mess.recommended && !closed && (
          <MaterialCommunityIcons name="star" size={11} color="#16A34A" />
        )}
      </View>
      <View style={styles.bar}>
        <Animated.View style={[styles.barFill, { width: wi, backgroundColor: fillColor }]} />
      </View>
      <Text style={[styles.pct, { color: fillColor }]}>
        {closed ? '—' : `${Math.round(mess.occupancy_pct)}%`}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    ...shadow.card,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: '#16A34A',
    alignItems: 'center', justifyContent: 'center',
  },
  kicker: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: colors.textMuted },
  title: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: 1 },
  dim: { opacity: 0.55 },
  upcomingBadge: {
    backgroundColor: '#F59E0B',
    borderRadius: 9,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  upcomingBadgeText: { fontSize: 9.5, fontWeight: '800', color: colors.white, letterSpacing: 0.3 },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginTop: spacing.md,
  },
  col: { flex: 1 },
  colHead: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 4,
  },
  colName: { fontSize: 11, fontWeight: '600', color: colors.text, flex: 1 },
  bar: {
    height: 6, backgroundColor: colors.border,
    borderRadius: 3, overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 3 },
  pct: { fontSize: 11, fontWeight: '700', marginTop: 4 },
});
