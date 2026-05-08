import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
  const router = useRouter();
  const [data, setData] = useState<{ meal: string; messes: Mess[] } | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const d = await api.messList();
        if (mounted) setData(d);
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
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => router.push('/modules/mess')}
      style={styles.wrap}
      testID="mess-live-card"
    >
      <View style={styles.headRow}>
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
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </View>

      <View style={styles.row}>
        {messes.map((m) => (
          <MiniCapacityBar key={m.id} mess={m} closed={isClosed} />
        ))}
      </View>
    </TouchableOpacity>
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
