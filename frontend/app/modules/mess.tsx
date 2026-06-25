import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { api } from '../../src/api';

/* ───────────── Palette (matches app theme) ───────────── */
const C = {
  bg: '#FFFFFF', ink: '#15171C', inkSoft: '#3A3F47', muted: '#8A9099',
  field: '#F2F3F5', white: '#FFFFFF', red: '#DC143C', redTint: '#FCE7EC', line: '#EEEFF1',
};

const SOFT = Platform.select({
  web: { boxShadow: '0 2px 4px rgba(20,23,28,0.04), 0 8px 22px rgba(20,23,28,0.10)' } as any,
  default: { shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 14, elevation: 4 },
});

type Meal = { key: string; label: string; hours: string; icon: string };
type Mess = { id: string; name: string; location: string; capacity: number; occupancy: Record<string, number> };
type MessData = { meals: Meal[]; menu: Record<string, string[]>; messes: Mess[]; current_meal: string | null; server_time: string };

function crowdLevel(pct: number) {
  if (pct < 50) return { label: 'Low', color: '#16A34A' };
  if (pct <= 80) return { label: 'Moderate', color: '#F59E0B' };
  return { label: 'Packed', color: C.red };
}

export default function MessScreen() {
  const router = useRouter();
  const [data, setData] = useState<MessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [meal, setMeal] = useState<string>('lunch');
  const [touched, setTouched] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = (await api.messList()) as MessData;
      setData(res);
      // Default the selected meal to whatever is being served now (once).
      if (!touched) setMeal(res.current_meal || 'lunch');
    } catch {
      // swallow for MVP
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [touched]);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000); // live feel
    return () => clearInterval(t);
  }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  // Least-crowded mess for the selected meal.
  const leastCrowdedId = useMemo(() => {
    if (!data) return null;
    return [...data.messes].sort((a, b) => (a.occupancy[meal] ?? 999) - (b.occupancy[meal] ?? 999))[0]?.id ?? null;
  }, [data, meal]);

  const meals = data?.meals || [];
  const menuItems = data?.menu?.[meal] || [];
  const activeMealObj = meals.find((m) => m.key === meal);
  const isLive = data?.current_meal === meal;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()} testID="mess-back">
          <Ionicons name="chevron-back" size={24} color={C.ink} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.hTitle}>Campus Mess</Text>
          <Text style={styles.hSub}>{"Live crowd & today's menu"}</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={onRefresh} testID="mess-refresh">
          <Ionicons name="refresh" size={20} color={C.red} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.red} />}
      >
        {/* Meal selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
          {meals.map((m) => {
            const active = m.key === meal;
            const serving = data?.current_meal === m.key;
            return (
              <TouchableOpacity
                key={m.key}
                style={[styles.pill, active && styles.pillActive]}
                onPress={() => { setMeal(m.key); setTouched(true); }}
                testID={`meal-${m.key}`}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name={m.icon as any} size={16} color={active ? C.white : C.inkSoft} />
                <Text style={[styles.pillText, active && styles.pillTextActive]}>{m.label}</Text>
                {serving && <View style={[styles.liveDot, active && { backgroundColor: C.white }]} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {loading && !data && (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator color={C.red} />
          </View>
        )}

        {data && (
          <>
            {/* Today's menu (shared across all messes) */}
            <View style={styles.menuCard} testID="mess-menu-card">
              <View style={styles.menuHead}>
                <View style={styles.menuIcon}>
                  <MaterialCommunityIcons name={(activeMealObj?.icon || 'food-variant') as any} size={22} color={C.red} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuTitle}>{activeMealObj?.label} Menu</Text>
                  <Text style={styles.menuHours}>
                    <Ionicons name="time-outline" size={12} color={C.muted} /> {activeMealObj?.hours}
                    {isLive ? '  ·  Serving now' : ''}
                  </Text>
                </View>
                {isLive && (
                  <View style={styles.liveBadge}>
                    <View style={styles.liveBadgeDot} />
                    <Text style={styles.liveBadgeText}>LIVE</Text>
                  </View>
                )}
              </View>
              <View style={styles.menuItems}>
                {menuItems.map((item) => (
                  <View key={item} style={styles.menuItem}>
                    <View style={styles.menuDot} />
                    <Text style={styles.menuItemText}>{item}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.menuNote}>Same menu served across all three messes today.</Text>
            </View>

            {/* Live crowd */}
            <Text style={styles.sectionH}>Live crowd capacity</Text>
            {data.messes.map((m) => (
              <MessCard
                key={m.id}
                mess={m}
                meals={meals}
                selectedMeal={meal}
                servingMeal={data.current_meal}
                leastCrowded={m.id === leastCrowdedId}
              />
            ))}

            <Text style={styles.footer}>
              Crowd capacity is a placeholder — connect the live occupancy API to go live.
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MessCard({ mess, meals, selectedMeal, servingMeal, leastCrowded }: {
  mess: Mess; meals: Meal[]; selectedMeal: string; servingMeal: string | null; leastCrowded: boolean;
}) {
  const selPct = mess.occupancy[selectedMeal] ?? 0;
  const lvl = crowdLevel(selPct);
  return (
    <View style={styles.card} testID={`mess-card-${mess.id}`}>
      <View style={styles.cardHead}>
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={styles.messName}>{mess.name}</Text>
            {leastCrowded && (
              <View style={styles.recoBadge}>
                <MaterialCommunityIcons name="leaf" size={11} color="#16A34A" />
                <Text style={styles.recoText}>Least busy</Text>
              </View>
            )}
          </View>
          <View style={styles.locRow}>
            <Ionicons name="location-outline" size={13} color={C.muted} />
            <Text style={styles.messLoc} numberOfLines={1}>{mess.location}</Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.messLoc}>seats {mess.capacity}</Text>
          </View>
        </View>
        <View style={[styles.levelPill, { backgroundColor: `${lvl.color}1A` }]}>
          <Text style={[styles.levelText, { color: lvl.color }]}>{lvl.label}</Text>
        </View>
      </View>

      {/* Per-meal occupancy rows */}
      <View style={styles.rows}>
        {meals.map((m) => {
          const pct = mess.occupancy[m.key] ?? 0;
          const ml = crowdLevel(pct);
          const isSel = m.key === selectedMeal;
          const serving = m.key === servingMeal;
          return (
            <View key={m.key} style={[styles.row, isSel && styles.rowActive]} testID={`occ-${mess.id}-${m.key}`}>
              <View style={styles.rowLabelWrap}>
                <Text style={[styles.rowLabel, isSel && styles.rowLabelActive]}>{m.label}</Text>
                {serving && <View style={styles.rowLiveDot} />}
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: ml.color }]} />
              </View>
              <Text style={[styles.rowPct, { color: ml.color }]}>{pct}%</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  header: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingTop: 6, paddingBottom: 10 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  hTitle: { fontSize: 22, fontWeight: '800', color: C.ink, letterSpacing: -0.5 },
  hSub: { fontSize: 13, color: C.muted, fontWeight: '500', marginTop: 1 },

  pillRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingVertical: 8, paddingRight: 30 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, height: 42, borderRadius: 21, backgroundColor: C.field,
  },
  pillActive: { backgroundColor: C.red },
  pillText: { fontSize: 14, fontWeight: '700', color: C.inkSoft },
  pillTextActive: { color: C.white },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#16A34A', marginLeft: 1 },

  menuCard: { marginHorizontal: 20, marginTop: 6, backgroundColor: C.white, borderRadius: 22, padding: 18, borderWidth: 1, borderColor: C.line, ...SOFT },
  menuHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.redTint, alignItems: 'center', justifyContent: 'center' },
  menuTitle: { fontSize: 18, fontWeight: '800', color: C.ink, letterSpacing: -0.3 },
  menuHours: { fontSize: 12.5, color: C.muted, fontWeight: '500', marginTop: 2 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E6F4EA', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999 },
  liveBadgeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#16A34A' },
  liveBadgeText: { fontSize: 10, fontWeight: '800', color: '#16A34A', letterSpacing: 0.5 },
  menuItems: { marginTop: 14, gap: 9 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  menuDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.red },
  menuItemText: { fontSize: 14.5, color: C.ink, fontWeight: '600' },
  menuNote: { fontSize: 12, color: C.muted, marginTop: 14, fontStyle: 'italic' },

  sectionH: { fontSize: 20, fontWeight: '800', color: C.ink, letterSpacing: -0.4, paddingHorizontal: 20, marginTop: 28, marginBottom: 12 },

  card: { marginHorizontal: 20, marginBottom: 14, backgroundColor: C.white, borderRadius: 22, padding: 18, borderWidth: 1, borderColor: C.line, ...SOFT },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  messName: { fontSize: 17, fontWeight: '800', color: C.ink, letterSpacing: -0.3 },
  recoBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#E6F4EA', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  recoText: { fontSize: 10.5, fontWeight: '800', color: '#16A34A' },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  messLoc: { fontSize: 12.5, color: C.muted, flexShrink: 1, fontWeight: '500' },
  dot: { color: C.muted, fontSize: 12 },
  levelPill: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999 },
  levelText: { fontSize: 12, fontWeight: '800' },

  rows: { marginTop: 16, gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7, paddingHorizontal: 8, borderRadius: 12, marginHorizontal: -8 },
  rowActive: { backgroundColor: C.field },
  rowLabelWrap: { width: 78, flexDirection: 'row', alignItems: 'center', gap: 5 },
  rowLabel: { fontSize: 13, color: C.inkSoft, fontWeight: '600' },
  rowLabelActive: { color: C.ink, fontWeight: '800' },
  rowLiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16A34A' },
  barTrack: { flex: 1, height: 10, borderRadius: 5, backgroundColor: '#EAEBEE', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 5 },
  rowPct: { width: 42, textAlign: 'right', fontSize: 13, fontWeight: '800' },

  footer: { textAlign: 'center', color: C.muted, fontSize: 12, marginTop: 18, paddingHorizontal: 24, lineHeight: 17 },
});
