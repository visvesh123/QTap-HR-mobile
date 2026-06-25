import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  ImageBackground, RefreshControl, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/auth';
import { api } from '../../src/api';
import { spacing } from '../../src/theme';
import { daysUntil } from '../../src/timeago';

/* ───────────── Minimal monochrome palette (TripGlide-style) ───────────── */
const C = {
  bg: '#FFFFFF',
  ink: '#15171C',
  inkSoft: '#3A3F47',
  muted: '#8A9099',
  field: '#F2F3F5',
  card: '#FFFFFF',
  line: '#ECEDEF',
  white: '#FFFFFF',
  // Brand crimson accents
  red: '#DC143C',
  redDark: '#A8102F',
  redSoft: '#FCEEF1',
};

const CAMPUS_IMG = 'https://customer-assets.emergentagent.com/job_6e34b5bc-d1ea-497f-9b38-6e61f8c9d982/artifacts/08bgdgj4_image.png';

const CATEGORIES = ['For You', 'Academics', 'Campus Life', 'Services'] as const;
type Cat = (typeof CATEGORIES)[number];

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

interface Feature {
  key: string; cat: Exclude<Cat, 'For You'>; title: string; sub: string;
  meta: string; image: string; route: string;
}

const FEATURES: Feature[] = [
  { key: 'exams', cat: 'Academics', title: 'Examinations', sub: 'Hall ticket, schedule & results', meta: 'Academics', route: '/modules/examinations', image: 'https://images.pexels.com/photos/256431/pexels-photo-256431.jpeg?auto=compress&cs=tinysrgb&w=900' },
  { key: 'library', cat: 'Academics', title: 'Library', sub: 'Search, issue & RFID pass', meta: 'Academics', route: '/modules/library', image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=900' },
  { key: 'events', cat: 'Campus Life', title: 'Events & Clubs', sub: 'TechFest, cultural nights & more', meta: 'Campus Life', route: '/modules/events', image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900' },
  { key: 'hostel', cat: 'Campus Life', title: 'Hostel', sub: 'Allotment, roommates & complaints', meta: 'Campus Life', route: '/modules/hostel', image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=900' },
  { key: 'gate', cat: 'Services', title: 'Gate Pass', sub: 'Personal RFID / QR entry pass', meta: 'Services', route: '/modules/gate', image: 'https://images.unsplash.com/photo-1562774053-701939374585?w=900' },
  { key: 'parcel', cat: 'Services', title: 'Parcels', sub: 'Inbox, pickup & collect', meta: 'Services', route: '/modules/parcel', image: 'https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=900' },
];

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [weather, setWeather] = useState<any>(null);
  const [cat, setCat] = useState<Cat>('For You');

  const load = async () => {
    try { setEvents(await api.events()); } catch {}
    try { const h = await api.holidays(); setHolidays((h.upcoming || []).slice(0, 3)); } catch {}
    try { setWeather(await api.weather()); } catch {}
  };
  useEffect(() => { load(); }, [user]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  if (!user) return null;

  const HONORIFICS = ['dr', 'dr.', 'mr', 'mr.', 'mrs', 'mrs.', 'ms', 'ms.', 'prof', 'prof.', 'mx', 'mx.'];
  const nameParts = user.name.split(' ').filter(Boolean);
  const firstName = user.role === 'admin'
    ? 'Admin'
    : (HONORIFICS.includes((nameParts[0] || '').toLowerCase()) ? (nameParts[1] || nameParts[0]) : nameParts[0]);
  const initials = (firstName?.[0] || 'U').toUpperCase();

  // Role-aware "For You" hero.
  const roleHero = (() => {
    if (user.role === 'student') return { kicker: 'Mid-Sem Exams', title: 'Hall Ticket', sub: 'Released · tap to view your card', cta: 'View hall ticket', route: '/modules/examinations' };
    if (user.role === 'admin') return { kicker: 'University', title: 'HR Portal', sub: 'Live attendance, staff & analytics', cta: 'Open portal', route: '/admin' };
    return { kicker: user.department || 'Faculty', title: 'Mark Attendance', sub: 'Geo + face check-in / check-out', cta: 'Check in now', route: '/modules/attendance' };
  })();

  const list = cat === 'For You' ? FEATURES : FEATURES.filter((f) => f.cat === cat);
  // For category tabs, the first item becomes the hero; rest fill the row.
  const heroFeature = cat === 'For You' ? null : list[0];
  const rowFeatures = cat === 'For You' ? FEATURES : list.slice(1);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const temp: number | null = weather?.temp_c ?? null;
  const code: number | null = weather?.code ?? null;
  const advisory = weatherAdvisory(code, hour, temp);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xxl * 2 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.ink} />}
      >
        {/* Brand header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.brand}>MU<Text style={styles.brandOne}>One</Text></Text>
            <Text style={styles.welcome}>Mahindra University</Text>
          </View>
          <TouchableOpacity style={styles.avatar} onPress={() => router.push('/(tabs)/profile')} testID="home-avatar">
            {user.avatar
              ? <Image source={{ uri: user.avatar }} style={styles.avatarImg} />
              : <Text style={styles.avatarText}>{initials}</Text>}
          </TouchableOpacity>
        </View>

        {/* MU campus hero */}
        <View style={styles.muHeroWrap}>
          <Image source={{ uri: CAMPUS_IMG }} style={styles.muHeroImg} resizeMode="cover" />
          <LinearGradient
            colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.35)', 'rgba(20,23,28,0.86)']}
            style={styles.muOverlay}
          >
            <View style={styles.muTopRow}>
              <Text style={styles.muDate}>{dateStr}</Text>
              {temp != null && (
                <View style={styles.tempChip}>
                  <Text style={styles.tempEmoji}>{advisory.emoji}</Text>
                  <Text style={styles.tempText}>{Math.round(temp)}°C</Text>
                </View>
              )}
            </View>
            <View>
              <Text style={styles.muGreet}>{greeting}, {firstName}</Text>
              <View style={styles.muAdvisoryRow}>
                <Text style={styles.muAdvisoryEmoji}>{advisory.emoji}</Text>
                <Text style={styles.muAdvisory} numberOfLines={2}>{advisory.text}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Section heading */}
        <Text style={styles.sectionH}>Explore campus</Text>

        {/* Category pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillRow}
        >
          {CATEGORIES.map((c) => {
            const active = c === cat;
            return (
              <TouchableOpacity
                key={c}
                style={[styles.pill, active && styles.pillActive]}
                onPress={() => setCat(c)}
                testID={`cat-${c}`}
                activeOpacity={0.85}
              >
                <Text style={[styles.pillText, active && styles.pillTextActive]}>{c}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Hero card */}
        {cat === 'For You' ? (
          <HeroCard
            image="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=900"
            tag={roleHero.kicker}
            title={roleHero.title}
            cta={roleHero.cta}
            onPress={() => router.push(roleHero.route as any)}
          />
        ) : heroFeature ? (
          <HeroCard
            image={heroFeature.image}
            tag={heroFeature.meta}
            title={heroFeature.title}
            cta="See more"
            onPress={() => router.push(heroFeature.route as any)}
          />
        ) : null}

        {/* Feature row (clean cards) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featRow}
        >
          {rowFeatures.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={styles.featCard}
              activeOpacity={0.9}
              onPress={() => router.push(f.route as any)}
              testID={`feat-${f.key}`}
            >
              <Image source={{ uri: f.image }} style={styles.featImg} />
              <View style={styles.featBody}>
                <Text style={styles.featMeta}>{f.meta}</Text>
                <Text style={styles.featTitle} numberOfLines={1}>{f.title}</Text>
                <Text style={styles.featSub} numberOfLines={1}>{f.sub}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Upcoming events */}
        {events.length > 0 && (
          <>
            <View style={styles.rowHead}>
              <Text style={styles.sectionH2}>Upcoming events</Text>
              <TouchableOpacity onPress={() => router.push('/modules/events')} testID="events-see-all">
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.eventRow}>
              {events.map((e) => (
                <TouchableOpacity
                  key={e.id}
                  style={styles.eventCard}
                  activeOpacity={0.9}
                  onPress={() => router.push('/modules/events')}
                  testID={`event-${e.id}`}
                >
                  <Image source={{ uri: e.image }} style={styles.eventImg} />
                  <View style={styles.eventBody}>
                    <Text style={styles.eventTitle} numberOfLines={1}>{e.title}</Text>
                    <View style={styles.eventMetaRow}>
                      <Ionicons name="calendar-outline" size={13} color={C.muted} />
                      <Text style={styles.eventMeta} numberOfLines={1}>
                        {formatDate(e.date)} · {e.venue}
                      </Text>
                    </View>
                    <View style={styles.eventFoot}>
                      <View style={styles.ratingRow}>
                        <Ionicons name="people-outline" size={14} color={C.ink} />
                        <Text style={styles.ratingText}>{e.registered}</Text>
                        <Text style={styles.ratingSub}>going</Text>
                      </View>
                      <View style={styles.goBtn}>
                        <Ionicons name="arrow-forward" size={16} color={C.white} />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* Upcoming holidays */}
        {holidays.length > 0 && (
          <>
            <Text style={styles.sectionH2Plain}>Upcoming holidays</Text>
            <View style={styles.holidayWrap}>
              {holidays.map((h) => {
                const d = daysUntil(h.date);
                const countdown = d <= 0 ? 'Today' : d === 1 ? 'Tomorrow' : `in ${d} days`;
                const dt = new Date(`${h.date}T00:00:00`);
                return (
                  <View key={h.name} style={styles.holidayRow} testID={`holiday-${h.name}`}>
                    <View style={styles.holidayDate}>
                      <Text style={styles.holidayDay}>{dt.getDate()}</Text>
                      <Text style={styles.holidayMon}>{dt.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.holidayName} numberOfLines={1}>{h.name}</Text>
                      <Text style={styles.holidayType} numberOfLines={1}>{h.type}</Text>
                    </View>
                    <View style={styles.holidayPill}>
                      <Ionicons name="time-outline" size={13} color={C.red} />
                      <Text style={styles.holidayPillText}>{countdown}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function HeroCard({ image, tag, title, cta, onPress }: { image: string; tag: string; title: string; cta: string; onPress: () => void }) {
  const [liked, setLiked] = useState(false);
  return (
    <View style={styles.hero}>
      <ImageBackground source={{ uri: image }} style={styles.heroImg} imageStyle={styles.heroImgRadius}>
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.7)']}
          style={styles.heroOverlay}
        >
          <TouchableOpacity style={styles.heart} onPress={() => setLiked((v) => !v)} testID="hero-like">
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={20} color={liked ? '#DC143C' : C.ink} />
          </TouchableOpacity>

          <View style={styles.heroBottom}>
            <Text style={styles.heroTag}>{tag}</Text>
            <Text style={styles.heroTitle}>{title}</Text>
            <TouchableOpacity style={styles.seeMore} onPress={onPress} activeOpacity={0.9} testID="hero-cta">
              <Text style={styles.seeMoreText}>{cta}</Text>
              <View style={styles.seeMoreArrow}>
                <Ionicons name="arrow-forward" size={16} color={C.red} />
              </View>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

function formatDate(d: string) {
  try {
    return new Date(`${d}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch { return d; }
}

const SHADOW = Platform.select({
  web: { boxShadow: '0 8px 24px rgba(20,23,28,0.10)' } as any,
  default: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 5 },
});
const SOFT = Platform.select({
  web: { boxShadow: '0 4px 14px rgba(20,23,28,0.06)' } as any,
  default: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 2 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
  },
  hello: { fontSize: 26, fontWeight: '800', color: C.ink, letterSpacing: -0.6 },
  brand: { fontSize: 26, fontWeight: '900', color: C.ink, letterSpacing: -0.8 },
  brandOne: { color: C.red, fontWeight: '900' },
  welcome: { fontSize: 14, fontWeight: '500', color: C.muted, marginTop: 2 },
  avatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: C.red,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarText: { color: C.white, fontSize: 18, fontWeight: '800' },

  muHeroWrap: { width: '100%', aspectRatio: 1.7, overflow: 'hidden', marginTop: 4, marginBottom: 4 },
  muHeroImg: { position: 'absolute', top: 0, left: 0, right: 0, width: '100%', height: '160%' },
  muOverlay: { ...StyleSheet.absoluteFillObject, paddingHorizontal: 20, paddingVertical: 18, justifyContent: 'space-between' },
  muTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  muDate: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.92)' },
  tempChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.22)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
  },
  tempEmoji: { fontSize: 14 },
  tempText: { fontSize: 14, fontWeight: '800', color: C.white },
  muGreet: { fontSize: 25, fontWeight: '800', color: C.white, letterSpacing: -0.5 },
  muAdvisoryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, marginTop: 6 },
  muAdvisoryEmoji: { fontSize: 15, lineHeight: 19 },
  muAdvisory: { flex: 1, fontSize: 13.5, fontWeight: '500', color: 'rgba(255,255,255,0.92)', lineHeight: 19 },

  sectionH: { fontSize: 22, fontWeight: '800', color: C.ink, letterSpacing: -0.4, paddingHorizontal: 20, marginTop: 26, marginBottom: 14 },

  pillRow: { paddingHorizontal: 20, gap: 10, paddingRight: 30 },
  pill: {
    paddingHorizontal: 18, height: 42, borderRadius: 21, backgroundColor: C.field,
    alignItems: 'center', justifyContent: 'center',
  },
  pillActive: { backgroundColor: C.red },
  pillText: { fontSize: 14, fontWeight: '700', color: C.inkSoft },
  pillTextActive: { color: C.white },

  hero: { marginHorizontal: 20, marginTop: 18 },
  heroImg: { width: '100%', aspectRatio: 0.92, justifyContent: 'flex-end' },
  heroImgRadius: { borderRadius: 28 },
  heroOverlay: { flex: 1, borderRadius: 28, padding: 16, justifyContent: 'space-between' },
  heart: {
    alignSelf: 'flex-end', width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center',
  },
  heroBottom: {},
  heroTag: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  heroTitle: { fontSize: 28, fontWeight: '800', color: C.white, letterSpacing: -0.5, marginTop: 2, marginBottom: 14 },
  seeMore: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.red, borderRadius: 30, paddingLeft: 22, paddingRight: 6, height: 56,
  },
  seeMoreText: { fontSize: 16, fontWeight: '700', color: C.white },
  seeMoreArrow: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: C.white,
    alignItems: 'center', justifyContent: 'center',
  },

  featRow: { paddingHorizontal: 20, gap: 14, paddingTop: 18 },
  featCard: { width: 210, backgroundColor: C.card, borderRadius: 22, overflow: 'hidden', ...SOFT },
  featImg: { width: '100%', height: 120, backgroundColor: C.field },
  featBody: { padding: 14 },
  featMeta: { fontSize: 11, fontWeight: '700', color: C.red, letterSpacing: 0.4, textTransform: 'uppercase' },
  featTitle: { fontSize: 16, fontWeight: '800', color: C.ink, marginTop: 4 },
  featSub: { fontSize: 12.5, fontWeight: '500', color: C.muted, marginTop: 2 },

  rowHead: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, marginTop: 30, marginBottom: 14,
  },
  sectionH2: { fontSize: 22, fontWeight: '800', color: C.ink, letterSpacing: -0.4 },
  seeAll: { fontSize: 14, fontWeight: '700', color: C.ink, textDecorationLine: 'underline' },

  eventRow: { paddingHorizontal: 20, gap: 16 },
  eventCard: { width: 260, backgroundColor: C.card, borderRadius: 24, overflow: 'hidden', ...SHADOW },
  eventImg: { width: '100%', height: 150, backgroundColor: C.field },
  eventBody: { padding: 16 },
  eventTitle: { fontSize: 17, fontWeight: '800', color: C.ink, letterSpacing: -0.3 },
  eventMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  eventMeta: { flex: 1, fontSize: 12.5, fontWeight: '500', color: C.muted },
  eventFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  ratingText: { fontSize: 14, fontWeight: '800', color: C.ink },
  ratingSub: { fontSize: 13, fontWeight: '500', color: C.muted },
  goBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center' },

  sectionH2Plain: { fontSize: 22, fontWeight: '800', color: C.ink, letterSpacing: -0.4, paddingHorizontal: 20, marginTop: 30, marginBottom: 14 },
  holidayWrap: { paddingHorizontal: 20, gap: 12 },
  holidayRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: C.card, borderRadius: 18, padding: 14,
    borderWidth: 1, borderColor: '#EEEFF1', ...SOFT,
  },
  holidayDate: {
    width: 52, height: 52, borderRadius: 14, backgroundColor: '#FCE7EC',
    alignItems: 'center', justifyContent: 'center',
  },
  holidayDay: { fontSize: 20, fontWeight: '800', color: C.red, lineHeight: 22 },
  holidayMon: { fontSize: 10, fontWeight: '800', color: C.red, letterSpacing: 1 },
  holidayName: { fontSize: 16, fontWeight: '800', color: C.ink, letterSpacing: -0.2 },
  holidayType: { fontSize: 12.5, fontWeight: '500', color: C.muted, marginTop: 2 },
  holidayPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FCE7EC', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999,
  },
  holidayPillText: { fontSize: 12, fontWeight: '800', color: C.red },
});
