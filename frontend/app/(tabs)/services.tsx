import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions,
  Animated, Easing, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/auth';
import { TAB_SERVICES } from '../../src/services-catalog';

/* ───────────── Palette (matches Home screen) ───────────── */
const C = {
  bg: '#FFFFFF',
  ink: '#15171C',
  inkSoft: '#3A3F47',
  muted: '#8A9099',
  field: '#F2F3F5',
  white: '#FFFFFF',
  red: '#DC143C',
  redDark: '#A8102F',
};

const CAPTION: Record<string, string> = {
  attendance: 'Geo + face check-in',
  tickets: 'Raise & track issues',
  leave: 'Apply & track',
  visitor: 'Invite guests',
  mess: "Today's menu",
};

// Soft pastel tints per tile (Nixtio-style), neutral enough to match the palette.
const TINT: Record<string, { bg: string; icon: string }> = {
  attendance: { bg: C.red, icon: C.red },          // featured (filled crimson)
  tickets: { bg: '#EFEAFB', icon: '#7C3AED' },
  leave: { bg: '#E6EFFB', icon: '#2563EB' },
  visitor: { bg: '#E6F4EA', icon: '#16A34A' },
  mess: { bg: '#FFF3E0', icon: '#D97706' },
};

const UPCOMING = new Set(['leave', 'visitor', 'mess']);

const GAP = 14;
const H_PAD = 20;

const SOFT = Platform.select({
  web: { boxShadow: '0 4px 14px rgba(20,23,28,0.06)' } as any,
  default: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 2 },
});

function UpcomingBadge({ testID, dark }: { testID?: string; dark?: boolean }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(pulse, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: Platform.OS !== 'web' }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.74] });
  return (
    <Animated.View style={[styles.badge, { transform: [{ scale }], opacity }]} testID={testID}>
      <MaterialCommunityIcons name="clock-outline" size={10} color={C.white} />
      <Text style={styles.badgeText}>UPCOMING</Text>
    </Animated.View>
  );
}

function ServiceTile({ s, tileW, onPress }: { s: any; tileW: number; onPress: () => void }) {
  const Icon = s.iconLib === 'mci' ? MaterialCommunityIcons : Ionicons;
  const upcoming = UPCOMING.has(s.key);
  const tint = TINT[s.key] || { bg: C.field, icon: C.ink };
  const featured = s.key === 'attendance';

  return (
    <TouchableOpacity
      style={[
        styles.tile,
        { width: tileW, backgroundColor: tint.bg },
        featured && styles.tileFeatured,
        upcoming && styles.tileDim,
      ]}
      activeOpacity={upcoming ? 1 : 0.88}
      disabled={upcoming}
      onPress={onPress}
      testID={`service-tile-${s.key}`}
    >
      {upcoming && <UpcomingBadge testID={`upcoming-badge-${s.key}`} />}

      <View style={styles.iconChip}>
        <Icon name={s.icon as any} size={24} color={upcoming ? C.muted : tint.icon} />
      </View>

      <View>
        <Text style={[styles.tileLabel, featured && styles.tileLabelLight]} numberOfLines={1}>{s.label}</Text>
        <Text style={[styles.tileCaption, featured && styles.tileCaptionLight]} numberOfLines={1}>
          {upcoming ? 'Coming soon' : CAPTION[s.key]}
        </Text>
      </View>

      {featured && (
        <View style={styles.featArrow}>
          <Ionicons name="arrow-forward" size={16} color={C.red} />
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function Services() {
  const router = useRouter();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  if (!user) return null;

  const tileW = (Math.min(width, 720) - H_PAD * 2 - GAP) / 2;

  const firstName = user.role === 'admin'
    ? 'Admin'
    : user.name.replace(/^(Dr\.?|Mr\.?|Mrs\.?|Ms\.?|Prof\.?)\s+/i, '').split(' ')[0];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Greeting */}
        <View style={styles.header}>
          <Text style={styles.hi}>Hi {firstName},</Text>
          <Text style={styles.heading}>What would you{'\n'}like to do today?</Text>
        </View>

        {/* Search field (matches Home) */}
        <TouchableOpacity activeOpacity={0.7} style={styles.search} onPress={() => {}} testID="services-search">
          <Ionicons name="search" size={20} color={C.muted} />
          <Text style={styles.searchText}>Search a service…</Text>
        </TouchableOpacity>

        {/* Bento grid */}
        <View style={styles.grid}>
          {TAB_SERVICES.map((s) => (
            <ServiceTile
              key={s.key}
              s={s}
              tileW={tileW}
              onPress={() => { if (!UPCOMING.has(s.key)) router.push(s.route as any); }}
            />
          ))}
        </View>

        <Text style={styles.footnote}>More services rolling out across Mahindra University soon.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  header: { paddingHorizontal: H_PAD, paddingTop: 8, paddingBottom: 18 },
  hi: { fontSize: 16, fontWeight: '600', color: C.muted },
  heading: { fontSize: 30, fontWeight: '800', color: C.ink, letterSpacing: -0.8, lineHeight: 36, marginTop: 4 },

  search: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: H_PAD, backgroundColor: C.field, borderRadius: 16,
    paddingHorizontal: 16, height: 54, marginBottom: 22,
  },
  searchText: { fontSize: 15, color: C.muted, fontWeight: '500' },

  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: H_PAD, gap: GAP,
  },
  tile: {
    height: 156, borderRadius: 26, padding: 18,
    justifyContent: 'space-between', overflow: 'hidden',
    ...SOFT,
  },
  tileFeatured: {
    shadowColor: C.redDark,
    ...Platform.select({
      web: { boxShadow: '0 10px 26px rgba(168,16,47,0.28)' } as any,
      default: { shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
    }),
  },
  tileDim: { opacity: 0.6 },

  iconChip: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: C.white,
    alignItems: 'center', justifyContent: 'center',
  },
  tileLabel: { fontSize: 17, fontWeight: '800', color: C.ink, letterSpacing: -0.3 },
  tileLabelLight: { color: C.white },
  tileCaption: { fontSize: 12.5, fontWeight: '500', color: C.inkSoft, marginTop: 2, opacity: 0.75 },
  tileCaptionLight: { color: 'rgba(255,255,255,0.9)', opacity: 1 },

  featArrow: {
    position: 'absolute', right: 16, bottom: 16,
    width: 40, height: 40, borderRadius: 20, backgroundColor: C.white,
    alignItems: 'center', justifyContent: 'center',
  },

  badge: {
    position: 'absolute', top: 14, right: 14, zIndex: 2,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.red, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999,
  },
  badgeText: { fontSize: 9, fontWeight: '800', color: C.white, letterSpacing: 0.5 },

  footnote: { fontSize: 13, color: C.muted, textAlign: 'center', marginTop: 26, paddingHorizontal: H_PAD },
});
