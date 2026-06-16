import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ImageBackground, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/auth';
import { api } from '../../src/api';
import { colors, radii, spacing, BRAND, clay } from '../../src/theme';
import { ServiceTile, SectionHeader, Card } from '../../src/ui';
import { SECTIONED_SERVICES } from '../../src/services-catalog';
import MessLiveCard from '../../src/components/MessLiveCard';

const CAMPUS_IMG = 'https://customer-assets.emergentagent.com/job_6e34b5bc-d1ea-497f-9b38-6e61f8c9d982/artifacts/08bgdgj4_image.png';

function weatherIconForCode(code: number | null): keyof typeof MaterialCommunityIcons.glyphMap {
  if (code == null) return 'weather-partly-cloudy';
  if (code === 0) return 'weather-sunny';
  if ([1, 2].includes(code)) return 'weather-partly-cloudy';
  if (code === 3) return 'weather-cloudy';
  if ([45, 48].includes(code)) return 'weather-fog';
  if ([51, 53, 55, 56, 57].includes(code)) return 'weather-partly-rainy';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'weather-pouring';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'weather-snowy';
  if ([95, 96, 99].includes(code)) return 'weather-lightning-rainy';
  return 'weather-partly-cloudy';
}

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [weather, setWeather] = useState<any>(null);

  const load = async () => {
    try { setWeather(await api.weather()); } catch {}
    if (user?.role === 'admin') {
      try { setStats(await api.adminDashboard()); } catch {}
    }
  };

  useEffect(() => { load(); }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (!user) return null;
  const sections = SECTIONED_SERVICES(user.role, user.department);

  const now = new Date();
  const hour = now.getHours();
  const timeGreet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const HONORIFICS = ['dr', 'dr.', 'mr', 'mr.', 'mrs', 'mrs.', 'ms', 'ms.', 'prof', 'prof.', 'mx', 'mx.'];
  const nameParts = user.name.split(' ').filter(Boolean);
  const firstName = user.role === 'admin'
    ? 'Administrator'
    : (HONORIFICS.includes((nameParts[0] || '').toLowerCase()) ? (nameParts[1] || nameParts[0]) : nameParts[0]);
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const weatherText = weather && weather.temp_c != null
    ? `It's currently ${weather.temp_c}°C${weather.condition ? ` · ${weather.condition.toLowerCase()}` : ''} at ${weather.city}${weather.high_c != null ? `, with a high of ${weather.high_c}°C today.` : '.'}`
    : 'Welcome to your campus — everything in one app.';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Campus weather hero */}
        <ImageBackground source={{ uri: CAMPUS_IMG }} style={styles.hero} imageStyle={styles.heroImg}>
          <LinearGradient
            colors={['rgba(0,0,0,0.10)', 'rgba(0,0,0,0.45)', 'rgba(0,0,0,0.85)']}
            style={styles.heroOverlay}
          >
            <View style={styles.heroBrandPill}>
              <Image source={{ uri: BRAND.logoUrl }} style={styles.heroLogo} resizeMode="contain" />
              <Text style={styles.wmMU}>MU<Text style={styles.wmOne}>One</Text></Text>
            </View>

            <View style={styles.heroBottom}>
              <Text style={styles.heroDate}>{dateStr}</Text>
              <Text style={styles.heroGreet}>{timeGreet}, {firstName}!</Text>
              <View style={styles.heroWeatherRow}>
                <MaterialCommunityIcons
                  name={weatherIconForCode(weather?.code ?? null)}
                  size={18}
                  color="rgba(255,255,255,0.92)"
                  style={{ marginTop: 2 }}
                />
                <Text style={styles.heroWeather}>{weatherText}</Text>
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>

        {/* Quick Actions */}
        {user.role === 'student' && (
          <View style={styles.quickRow} testID="quick-actions">
            <QuickAction icon="qrcode" label="Gate Pass" onPress={() => router.push('/modules/gate')} />
            <QuickAction icon="package-variant-closed" label="My Parcels" onPress={() => router.push('/modules/parcel')} />
            <QuickAction icon="bed" label="My Hostel" onPress={() => router.push('/modules/hostel')} />
            <QuickAction icon="wallet" iconLib="ion" label="Wallet" onPress={() => router.push('/(tabs)/wallet')} />
          </View>
        )}

        {/* Role action card (moved down from the banner) */}
        <View style={styles.actionWrap}>
          {user.role === 'student' && (
            <Card style={styles.actionCard} testID="welcome-card">
              <View style={{ flex: 1 }}>
                <Text style={styles.actionKicker}>Mid-Sem Exams</Text>
                <Text style={styles.actionTitle}>Hall Ticket Released</Text>
                <TouchableOpacity
                  onPress={() => router.push('/modules/examinations')}
                  style={styles.actionBtn}
                  testID="open-hallticket-btn"
                >
                  <Text style={styles.actionBtnText}>View Hall Ticket</Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.white} />
                </TouchableOpacity>
              </View>
              <View style={styles.actionImg}>
                <MaterialCommunityIcons name="ticket-confirmation" size={56} color={colors.primary} />
              </View>
            </Card>
          )}

          {user.role === 'staff' && (
            <Card style={styles.actionCard} testID="welcome-card">
              <View style={{ flex: 1 }}>
                <Text style={styles.actionKicker}>{user.department}</Text>
                <Text style={styles.actionTitle}>Mark Your Attendance</Text>
                <TouchableOpacity
                  onPress={() => router.push('/modules/attendance')}
                  style={styles.actionBtn}
                  testID="open-attendance-btn"
                >
                  <Text style={styles.actionBtnText}>Check-in Now</Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.white} />
                </TouchableOpacity>
              </View>
              <View style={styles.actionImg}>
                <MaterialCommunityIcons name="map-marker-account" size={56} color={colors.primary} />
              </View>
            </Card>
          )}

          {user.role === 'admin' && stats && (
            <Card style={styles.actionCard} testID="welcome-card">
              <View style={{ flex: 1 }}>
                <Text style={styles.actionKicker}>University Snapshot</Text>
                <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: 8 }}>
                  <Stat label="Students" value={stats.total_students} />
                  <Stat label="Staff" value={stats.total_staff} />
                  <Stat label="Active SOS" value={stats.active_sos} color={colors.sos} />
                </View>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: spacing.md }}>
                  <TouchableOpacity
                    onPress={() => router.push('/admin')}
                    style={styles.actionBtn}
                    testID="open-web-portal"
                  >
                    <MaterialCommunityIcons name="monitor-dashboard" size={16} color={colors.white} />
                    <Text style={styles.actionBtnText}>Open HR Portal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => router.push('/modules/admin')}
                    style={[styles.actionBtn, { backgroundColor: colors.clayDark }]}
                    testID="open-admin-btn"
                  >
                    <Text style={styles.actionBtnText}>Mobile Console</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          )}
        </View>

        {/* Promotional banner */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.promoWrap}
          onPress={() => router.push('/modules/events')}
          testID="promo-events"
        >
          <Image
            source={{ uri: 'https://images.pexels.com/photos/32213218/pexels-photo-32213218.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940' }}
            style={styles.promoImg}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.85)']}
            style={styles.promoOverlay}
          >
            <Text style={styles.promoKicker}>EVENTS & CLUBS</Text>
            <Text style={styles.promoTitle}>TechFest 2026 — Registrations Open</Text>
            <View style={styles.promoBtn}>
              <Text style={styles.promoBtnText}>Explore</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.primary} />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Mess live capacity */}
        <MessLiveCard />

        {/* Sectioned services */}
        {sections.map((section) => (
          <View key={section.title}>
            <SectionHeader title={section.title} />
            <View style={styles.grid}>
              {section.items.map((s) => (
                <ServiceTile
                  key={s.key}
                  label={s.label}
                  icon={s.icon}
                  iconLib={s.iconLib}
                  color={s.color}
                  onPress={() => router.push(s.route as any)}
                  testID={`service-tile-${s.key}`}
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const Stat = ({ label, value, color }: { label: string; value: any; color?: string }) => (
  <View>
    <Text style={[styles.statValue, color ? { color } : null]}>{value ?? '—'}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const QuickAction = ({ icon, label, onPress, iconLib = 'mci' }: any) => {
  const Icon = iconLib === 'ion' ? Ionicons : MaterialCommunityIcons;
  return (
    <TouchableOpacity style={styles.quickItem} onPress={onPress} activeOpacity={0.8} testID={`quick-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <View style={styles.quickIcon}>
        <Icon name={icon} size={22} color={colors.primary} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.clayBg },

  hero: {
    height: 300,
    justifyContent: 'flex-end',
    backgroundColor: colors.clayDark,
  },
  heroImg: { borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  heroOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  heroBrandPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.white,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 14, alignSelf: 'flex-start',
    ...(clay.surface as any),
  },
  heroLogo: { width: 20, height: 20 },
  wmMU: { fontSize: 18, fontWeight: '900', color: colors.primary, letterSpacing: -0.3 },
  wmOne: { fontSize: 18, fontWeight: '800', color: colors.clayDark, letterSpacing: -0.3 },

  heroBottom: { gap: 4 },
  heroDate: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
  heroGreet: { fontSize: 32, fontWeight: '900', color: colors.white, letterSpacing: -0.5 },
  heroWeatherRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, marginTop: 4 },
  heroWeather: { flex: 1, fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.92)', lineHeight: 20 },

  quickRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    marginTop: -spacing.lg, marginHorizontal: spacing.md,
    backgroundColor: colors.white, borderRadius: radii.clay, padding: spacing.md,
    ...(clay.surface as any),
  },
  quickItem: { alignItems: 'center', gap: 6, flex: 1 },
  quickIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.clayPink,
    alignItems: 'center', justifyContent: 'center',
    ...(clay.surfaceSoft as any),
  },
  quickLabel: { fontSize: 11, fontWeight: '700', color: colors.clayDark },

  actionWrap: { marginTop: spacing.md, marginHorizontal: spacing.md },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radii.clay,
    ...(clay.surface as any),
  },
  actionKicker: { fontSize: 11, fontWeight: '800', color: colors.gold, letterSpacing: 1.4 },
  actionTitle: { fontSize: 20, fontWeight: '800', color: colors.clayDark, marginTop: 4, lineHeight: 24 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 11,
    borderRadius: 999, alignSelf: 'flex-start', marginTop: spacing.sm, gap: 6,
    ...(clay.crimson as any),
  },
  actionBtnText: { color: colors.white, fontSize: 13, fontWeight: '800' },
  actionImg: {
    width: 88, height: 88, borderRadius: radii.clay,
    backgroundColor: colors.clayPeach,
    alignItems: 'center', justifyContent: 'center',
    ...(clay.surfaceSoft as any),
  },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: -2 },

  promoWrap: {
    marginTop: spacing.lg, marginHorizontal: spacing.md,
    borderRadius: radii.clay, overflow: 'hidden', height: 130,
    ...(clay.surface as any),
  },
  promoImg: { width: '100%', height: '100%', position: 'absolute' },
  promoOverlay: { flex: 1, padding: spacing.md, justifyContent: 'flex-end' },
  promoKicker: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.9)', letterSpacing: 1.5 },
  promoTitle: { fontSize: 18, fontWeight: '800', color: colors.white, marginTop: 2 },
  promoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.white, paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 999, alignSelf: 'flex-start', marginTop: 8,
  },
  promoBtnText: { fontSize: 12, fontWeight: '800', color: colors.primary },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: spacing.md, gap: spacing.sm,
  },
});
