import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Animated, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { api } from '../../src/api';
import { colors, radii, shadow, spacing } from '../../src/theme';
import { ScreenHeader, Pill, Badge } from '../../src/ui';

type Mess = {
  id: string;
  name: string;
  location: string;
  capacity: number;
  current: number;
  occupancy_pct: number;
  current_meal: string;
  next_meal: string;
  display_meal: string;
  today_menu: string[];
  next_meal_hours: string;
  status: { label: string; color: string; tone: string };
  wait_minutes: number;
  distance_m: number;
  hours: Record<string, string>;
  recommended: boolean;
  updated_at: string;
};

const MEAL_LABEL: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  snacks: 'Snacks',
  dinner: 'Dinner',
  closed: 'Between meals',
};

const MEAL_ICON: Record<string, string> = {
  breakfast: 'coffee-outline',
  lunch: 'food-variant',
  snacks: 'cookie-outline',
  dinner: 'food-turkey',
  closed: 'clock-outline',
};

export default function MessScreen() {
  const router = useRouter();
  const [data, setData] = useState<{ meal: string; messes: Mess[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [demo, setDemo] = useState<string | undefined>(undefined);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.messList(demo);
      setData(res);
    } catch (e) {
      // swallow for MVP
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [demo]);

  useEffect(() => {
    load();
    // auto-refresh every 30s for live feel
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const meal = (demo || data?.meal || 'closed') as string;
  const isClosed = data?.meal === 'closed' && !demo;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="Campus Mess"
        subtitle={isClosed ? `Closed • Next: ${MEAL_LABEL[data?.messes?.[0]?.next_meal || 'breakfast']}` : `Live • ${MEAL_LABEL[meal]}`}
        onBack={() => router.back()}
        right={
          <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn} testID="mess-refresh">
            <Ionicons name="refresh" size={20} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Hero info banner */}
        <LinearGradient
          colors={[colors.primaryDark, colors.primaryLight]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={styles.heroIcon}>
              <MaterialCommunityIcons name={MEAL_ICON[meal] as any} size={28} color={colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroKicker}>WHERE TO EAT?</Text>
              <Text style={styles.heroTitle}>
                {isClosed ? 'All messes are between meals' : `${MEAL_LABEL[meal]} is being served`}
              </Text>
              <Text style={styles.heroSub}>
                {isClosed
                  ? 'See menu & timings for the next meal below'
                  : 'Live capacity updates every 30 seconds'}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Demo meal switcher */}
        <View style={styles.pillRow}>
          <Pill label="Live" active={!demo} onPress={() => setDemo(undefined)} testID="meal-live" />
          {(['breakfast', 'lunch', 'snacks', 'dinner'] as const).map((m) => (
            <Pill
              key={m}
              label={MEAL_LABEL[m]}
              active={demo === m}
              onPress={() => setDemo(m)}
              testID={`meal-${m}`}
            />
          ))}
        </View>

        {loading && !data && (
          <View style={{ padding: spacing.xl, alignItems: 'center' }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        )}

        {data?.messes?.map((m) => (
          <MessCard
            key={m.id}
            mess={m}
            expanded={expandedId === m.id}
            onToggle={() => setExpandedId(expandedId === m.id ? null : m.id)}
          />
        ))}

        <Text style={styles.footer}>
          Capacity is simulated for demo. Updated {data ? new Date(data['server_time' as any] || Date.now()).toLocaleTimeString() : '—'}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const MessCard = ({ mess, expanded, onToggle }: { mess: Mess; expanded: boolean; onToggle: () => void }) => {
  const widthAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: mess.occupancy_pct,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [mess.occupancy_pct]);

  const widthInterp = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const isClosed = mess.current_meal === 'closed';

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onToggle} style={styles.card} testID={`mess-card-${mess.id}`}>
      {mess.recommended && !isClosed && (
        <View style={styles.recoBadge}>
          <MaterialCommunityIcons name="star" size={12} color={colors.white} />
          <Text style={styles.recoText}>RECOMMENDED — Lowest crowd</Text>
        </View>
      )}

      <View style={styles.cardHead}>
        <View style={{ flex: 1 }}>
          <Text style={styles.messName}>{mess.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 }}>
            <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
            <Text style={styles.messLoc} numberOfLines={1}>{mess.location}</Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.messLoc}>{mess.distance_m}m</Text>
          </View>
        </View>
        <Badge label={mess.status.label} color={mess.status.color} />
      </View>

      {/* Capacity bar */}
      <View style={styles.barWrap}>
        <View style={styles.barTrack}>
          <Animated.View
            style={[
              styles.barFill,
              { width: widthInterp, backgroundColor: mess.status.color },
            ]}
          />
        </View>
        <View style={styles.capRow}>
          <Text style={styles.capText}>
            <Text style={styles.capBig}>{mess.current}</Text>
            <Text style={styles.capSlash}> / {mess.capacity}</Text>
          </Text>
          <Text style={[styles.capPct, { color: mess.status.color }]}>{mess.occupancy_pct}% full</Text>
        </View>
      </View>

      {/* Wait time pill */}
      {!isClosed && mess.wait_minutes > 0 && (
        <View style={styles.waitRow}>
          <MaterialCommunityIcons name="timer-sand" size={14} color={colors.warning} />
          <Text style={styles.waitText}>~{mess.wait_minutes} min wait expected</Text>
        </View>
      )}

      {/* Quick menu preview (collapsed) */}
      {!expanded && mess.today_menu.length > 0 && (
        <View style={styles.menuPreview}>
          <Text style={styles.menuKicker}>
            {isClosed ? `NEXT: ${MEAL_LABEL[mess.display_meal].toUpperCase()}` : `TODAY'S ${MEAL_LABEL[mess.display_meal].toUpperCase()}`}
          </Text>
          <Text style={styles.menuLine} numberOfLines={2}>
            {mess.today_menu.slice(0, 4).join(' • ')}
            {mess.today_menu.length > 4 ? '…' : ''}
          </Text>
        </View>
      )}

      {/* Expanded view */}
      {expanded && (
        <View style={styles.expanded}>
          <View style={styles.menuBlock}>
            <Text style={styles.expandedHeader}>
              <MaterialCommunityIcons name={MEAL_ICON[mess.display_meal] as any} size={14} color={colors.primary} />
              {'  '}{MEAL_LABEL[mess.display_meal]} Menu
            </Text>
            {mess.today_menu.map((item, i) => (
              <View key={i} style={styles.menuItem}>
                <View style={styles.menuDot} />
                <Text style={styles.menuItemText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.hoursBlock}>
            <Text style={styles.expandedHeader}>
              <Ionicons name="time-outline" size={14} color={colors.primary} />
              {'  '}Today's Hours
            </Text>
            {(['breakfast', 'lunch', 'snacks', 'dinner'] as const).map((k) => (
              <View key={k} style={styles.hourRow}>
                <Text style={[
                  styles.hourLabel,
                  mess.current_meal === k && { color: colors.primary, fontWeight: '700' },
                ]}>
                  {MEAL_LABEL[k]}
                </Text>
                <Text style={[
                  styles.hourTime,
                  mess.current_meal === k && { color: colors.primary, fontWeight: '700' },
                ]}>
                  {mess.hours[k]}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.expandHint}>
        <Text style={styles.expandHintText}>
          {expanded ? 'Tap to collapse' : 'Tap for full menu & hours'}
        </Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.textMuted}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  refreshBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primaryBg,
    alignItems: 'center', justifyContent: 'center',
  },
  hero: {
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    ...shadow.cardHeavy,
  },
  heroIcon: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroKicker: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.6,
    color: 'rgba(255,255,255,0.85)',
  },
  heroTitle: { fontSize: 18, fontWeight: '800', color: colors.white, marginTop: 2 },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  pillRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: spacing.md, marginBottom: spacing.sm,
    gap: 6,
  },
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: radii.lg,
    padding: spacing.md,
    ...shadow.card,
  },
  recoBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#16A34A',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: radii.pill,
    marginBottom: spacing.sm,
  },
  recoText: { color: colors.white, fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  messName: { fontSize: 17, fontWeight: '800', color: colors.text },
  messLoc: { fontSize: 12, color: colors.textSecondary, flexShrink: 1 },
  dot: { color: colors.textMuted, fontSize: 12 },
  barWrap: { marginTop: spacing.md },
  barTrack: {
    height: 10,
    backgroundColor: colors.border,
    borderRadius: 5,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
  },
  capRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: 6,
  },
  capText: { color: colors.textSecondary },
  capBig: { fontSize: 16, fontWeight: '800', color: colors.text },
  capSlash: { fontSize: 13, color: colors.textMuted },
  capPct: { fontSize: 13, fontWeight: '700' },
  waitRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: radii.sm,
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  waitText: { fontSize: 12, fontWeight: '600', color: '#92400E' },
  menuPreview: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  menuKicker: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.2,
    color: colors.textMuted,
    marginBottom: 4,
  },
  menuLine: { fontSize: 13, color: colors.text, lineHeight: 18 },
  expanded: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  expandedHeader: {
    fontSize: 13, fontWeight: '700', color: colors.text,
    marginBottom: spacing.xs,
  },
  menuBlock: { gap: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3 },
  menuDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary },
  menuItemText: { fontSize: 13, color: colors.text },
  hoursBlock: { gap: 4 },
  hourRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 4,
  },
  hourLabel: { fontSize: 12, color: colors.textSecondary },
  hourTime: { fontSize: 12, color: colors.text, fontWeight: '600' },
  expandHint: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4,
    marginTop: spacing.sm,
  },
  expandHintText: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  footer: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 11,
    marginTop: spacing.md,
  },
});
