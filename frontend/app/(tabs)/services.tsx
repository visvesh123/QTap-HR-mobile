import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions,
  Animated, Easing, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/auth';
import { TAB_SERVICES, tabServicesForUser } from '../../src/services-catalog';
import { ServicePermissionGate } from '../../src/components/PermissionGate';

/* ───────────── Palette (matches Home) ───────────── */
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

const UPCOMING = new Set(['leave', 'visitor']);

const GAP = 12;
const H_PAD = 20;

const SOFT = Platform.select({
  web: { boxShadow: '0 2px 4px rgba(20,23,28,0.04), 0 8px 22px rgba(20,23,28,0.10)' } as any,
  default: { shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.10, shadowRadius: 14, elevation: 4 },
});

function UpcomingBadge({ testID }: { testID?: string }) {
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
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.7] });
  return (
    <Animated.View style={[styles.badge, { transform: [{ scale }], opacity }]} testID={testID}>
      <View style={styles.badgeDot} />
    </Animated.View>
  );
}

function ServiceTile({ s, tileW, onPress }: { s: any; tileW: number; onPress: () => void }) {
  const Icon = s.iconLib === 'mci' ? MaterialCommunityIcons : Ionicons;
  const upcoming = UPCOMING.has(s.key);
  return (
    <TouchableOpacity
      style={[styles.tile, { width: tileW, height: tileW * 1.08 }, upcoming && styles.tileDim]}
      activeOpacity={upcoming ? 1 : 0.85}
      disabled={upcoming}
      onPress={onPress}
      testID={`service-tile-${s.key}`}
    >
      {upcoming && <UpcomingBadge testID={`upcoming-badge-${s.key}`} />}
      <Icon name={s.icon as any} size={30} color={upcoming ? C.muted : C.red} />
      <Text style={[styles.tileLabel, upcoming && { color: C.muted }]} numberOfLines={2}>{s.label}</Text>
    </TouchableOpacity>
  );
}

export default function Services() {
  const router = useRouter();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  if (!user) return null;

  const firstName = user.role === 'admin'
    ? 'Admin'
    : user.name.replace(/^(Dr\.?|Mr\.?|Mrs\.?|Ms\.?|Prof\.?)\s+/i, '').split(' ')[0];

  const tileW = (Math.min(width, 720) - H_PAD * 2 - GAP * 2) / 3;
  const enabledServices = tabServicesForUser(user.role, user.department, user.permissions ?? []);

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

        {/* Minimalist 3-column grid — tile shown when user has ANY child RBAC permission */}
        <View style={styles.grid}>
          {TAB_SERVICES.map((s) => (
            <ServicePermissionGate key={s.key} service={s}>
              <ServiceTile
                s={s}
                tileW={tileW}
                onPress={() => { if (!UPCOMING.has(s.key)) router.push(s.route as any); }}
              />
            </ServicePermissionGate>
          ))}
          {enabledServices.length === 0 && (
            <Text style={styles.emptyText}>No services are enabled for your account yet.</Text>
          )}
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
    backgroundColor: C.white, borderRadius: 24, padding: 16,
    justifyContent: 'space-between',
    borderWidth: 1, borderColor: '#EEEFF1',
    ...SOFT,
  },
  tileDim: { opacity: 0.55 },
  tileLabel: { fontSize: 13.5, fontWeight: '700', color: C.ink, letterSpacing: -0.2 },

  badge: {
    position: 'absolute', top: 12, right: 12, zIndex: 2,
    width: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.red },

  emptyText: { width: '100%', textAlign: 'center', color: C.muted, fontSize: 13, paddingVertical: 16 },
  footnote: { fontSize: 13, color: C.muted, textAlign: 'center', marginTop: 28, paddingHorizontal: H_PAD },
});
