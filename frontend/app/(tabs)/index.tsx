import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ImageBackground, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/auth';
import { api } from '../../src/api';
import { colors, radii, spacing, BRAND, clay } from '../../src/theme';
import { Card } from '../../src/ui';
import { timeAgo, daysUntil } from '../../src/timeago';
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

function weatherAdvisory(code: number | null, hour: number, temp: number | null): { emoji: string; text: string } {
  const night = hour >= 19 || hour < 6;
  if (code == null) return { emoji: '🎓', text: 'Welcome to campus — have a great day!' };
  if ([95, 96, 99].includes(code)) return { emoji: '⛈️', text: 'Thunderstorms likely — stay indoors between classes.' };
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code))
    return { emoji: '☔', text: 'Rain on campus — carry an umbrella to class.' };
  if ([45, 48].includes(code)) return { emoji: '🌫️', text: 'Foggy out — allow extra time to reach campus.' };
  if (temp != null && temp >= 38) return { emoji: '🥵', text: 'Scorching today — stay hydrated and keep to the shade.' };
  if ([0, 1].includes(code))
    return night
      ? { emoji: '🌙', text: 'Clear skies tonight — perfect for a campus stroll.' }
      : { emoji: '☀️', text: 'Clear skies — a great day out on the lawn.' };
  if ([2, 3].includes(code)) return { emoji: '⛅', text: 'Cloud cover over campus — a comfortable day ahead.' };
  return { emoji: '🌤️', text: 'Pleasant on campus today.' };
}

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [weather, setWeather] = useState<any>(null);
  const [holiday, setHoliday] = useState<any>(null);
  const [news, setNews] = useState<any[]>([]);

  const load = async () => {
    try { setWeather(await api.weather()); } catch {}
    try { const h = await api.holidays(); setHoliday(h.upcoming?.[0] || null); } catch {}
    try { setNews(await api.news()); } catch {}
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

  const now = new Date();
  const hour = now.getHours();
  const timeGreet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const HONORIFICS = ['dr', 'dr.', 'mr', 'mr.', 'mrs', 'mrs.', 'ms', 'ms.', 'prof', 'prof.', 'mx', 'mx.'];
  const nameParts = user.name.split(' ').filter(Boolean);
  const firstName = user.role === 'admin'
    ? 'Administrator'
    : (HONORIFICS.includes((nameParts[0] || '').toLowerCase()) ? (nameParts[1] || nameParts[0]) : nameParts[0]);
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const advisory = weatherAdvisory(weather?.code ?? null, hour, weather?.temp_c ?? null);

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
            <View style={styles.heroTopRow}>
              <View style={styles.heroBrandPill}>
                <Image source={{ uri: BRAND.logoUrl }} style={styles.heroLogo} resizeMode="contain" />
                <Text style={styles.wmMU}>MU<Text style={styles.wmOne}>One</Text></Text>
              </View>

              {weather && weather.temp_c != null && (
                <View style={styles.glassChipWrap}>
                  <BlurView intensity={32} tint="light" style={styles.glassChip}>
                    <View style={styles.glassTopRow}>
                      <MaterialCommunityIcons
                        name={weatherIconForCode(weather.code)}
                        size={22}
                        color={colors.white}
                      />
                      <Text style={styles.glassTemp}>{weather.temp_c}°</Text>
                    </View>
                    <Text style={styles.glassHL}>
                      H:{weather.high_c ?? '—'}°  L:{weather.low_c ?? '—'}°
                    </Text>
                  </BlurView>
                </View>
              )}
            </View>

            <View style={styles.heroBottom}>
              <Text style={styles.heroDate}>{dateStr}</Text>
              <Text style={styles.heroGreet}>{timeGreet}, {firstName}!</Text>
              <View style={styles.heroWeatherRow}>
                <Text style={styles.advisoryEmoji}>{advisory.emoji}</Text>
                <Text style={styles.heroWeather}>{advisory.text}</Text>
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>

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
                  <Stat label="Visitors" value={stats.total_visitors} />
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

        {/* Upcoming holiday countdown */}
        {holiday && (() => {
          const d = daysUntil(holiday.date);
          const countdown = d <= 0 ? 'Today' : d === 1 ? 'Tomorrow' : `in ${d} days`;
          const dt = new Date(`${holiday.date}T00:00:00`);
          return (
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.holidayCard}
              onPress={() => router.push('/modules/leave')}
              testID="holiday-card"
            >
              <View style={styles.holidayDate}>
                <Text style={styles.holidayDay}>{dt.getDate()}</Text>
                <Text style={styles.holidayMon}>{dt.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.holidayKicker}>NEXT HOLIDAY</Text>
                <Text style={styles.holidayName} numberOfLines={1}>{holiday.name}</Text>
                <Text style={styles.holidayType}>{holiday.type}</Text>
              </View>
              <View style={styles.holidayPill}>
                <MaterialCommunityIcons name="calendar-clock" size={14} color={colors.primary} />
                <Text style={styles.holidayPillText}>{countdown}</Text>
              </View>
            </TouchableOpacity>
          );
        })()}

        {/* Latest campus news */}
        {news.length > 0 && (
          <View style={styles.newsSection}>
            <View style={styles.sectionRow}>
              <View>
                <Text style={styles.sectionTitle}>Latest News</Text>
                <Text style={styles.sectionSub}>Happenings around campus</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/modules/news')} testID="news-see-all">
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.newsScroll}
            >
              {news.map((n) => (
                <TouchableOpacity
                  key={n.id}
                  style={styles.newsCard}
                  activeOpacity={0.9}
                  onPress={() => router.push('/modules/news')}
                  testID={`news-${n.id}`}
                >
                  <Image source={{ uri: n.image }} style={styles.newsImg} />
                  <View style={styles.newsBody}>
                    <View style={styles.newsCatBadge}>
                      <Text style={styles.newsCatText}>{n.category}</Text>
                    </View>
                    <Text style={styles.newsTitle} numberOfLines={2}>{n.title}</Text>
                    <Text style={styles.newsTime}>{timeAgo(n.date)}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Mess live capacity */}
        <MessLiveCard />
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.clayBg },

  hero: {
    width: '100%',
    aspectRatio: 1120 / 1062,
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
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  glassChipWrap: {
    borderRadius: 18, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
  },
  glassChip: {
    paddingHorizontal: 12, paddingVertical: 8, alignItems: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  glassTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  glassTemp: { fontSize: 24, fontWeight: '800', color: colors.white },
  glassHL: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.9)', marginTop: 1 },
  advisoryEmoji: { fontSize: 15, marginTop: 1 },
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

  holidayCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    marginTop: spacing.md, marginHorizontal: spacing.md,
    backgroundColor: colors.white, borderRadius: radii.clay, padding: spacing.md,
    ...(clay.surface as any),
  },
  holidayDate: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: colors.clayPeach, alignItems: 'center', justifyContent: 'center',
  },
  holidayDay: { fontSize: 22, fontWeight: '900', color: colors.primary, lineHeight: 24 },
  holidayMon: { fontSize: 10, fontWeight: '800', color: colors.primary, letterSpacing: 1 },
  holidayKicker: { fontSize: 10, fontWeight: '800', color: colors.gold, letterSpacing: 1.4 },
  holidayName: { fontSize: 17, fontWeight: '800', color: colors.clayDark, marginTop: 2 },
  holidayType: { fontSize: 12, color: colors.clayMuted, marginTop: 1 },
  holidayPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.clayPink, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999,
  },
  holidayPillText: { fontSize: 12, fontWeight: '800', color: colors.primary },

  newsSection: { marginTop: spacing.lg },
  sectionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, marginBottom: spacing.sm,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.clayDark },
  sectionSub: { fontSize: 12, color: colors.clayMuted, marginTop: 1 },
  seeAll: { fontSize: 13, fontWeight: '700', color: colors.primary },
  newsScroll: { paddingHorizontal: spacing.md, gap: spacing.sm },
  newsCard: {
    width: 250, backgroundColor: colors.white, borderRadius: radii.clay,
    overflow: 'hidden', ...(clay.surface as any),
  },
  newsImg: { width: '100%', height: 130, backgroundColor: colors.clayPeach },
  newsBody: { padding: spacing.md },
  newsCatBadge: {
    alignSelf: 'flex-start', backgroundColor: colors.clayPink,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 6,
  },
  newsCatText: { fontSize: 10, fontWeight: '800', color: colors.primary, letterSpacing: 0.5 },
  newsTitle: { fontSize: 14, fontWeight: '700', color: colors.clayDark, lineHeight: 19 },
  newsTime: { fontSize: 11, color: colors.clayMuted, marginTop: 6 },

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
