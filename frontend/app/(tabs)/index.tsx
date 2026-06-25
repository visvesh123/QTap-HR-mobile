import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  ImageBackground, RefreshControl, TextInput, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/auth';
import { api } from '../../src/api';
import { spacing } from '../../src/theme';

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
};

const CAMPUS_IMG = 'https://customer-assets.emergentagent.com/job_6e34b5bc-d1ea-497f-9b38-6e61f8c9d982/artifacts/08bgdgj4_image.png';

const CATEGORIES = ['For You', 'Academics', 'Campus Life', 'Services'] as const;
type Cat = (typeof CATEGORIES)[number];

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
  const [cat, setCat] = useState<Cat>('For You');

  const load = async () => {
    try { setEvents(await api.events()); } catch {}
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
  const roleHero = useMemo(() => {
    if (user.role === 'student') return { kicker: 'Mid-Sem Exams', title: 'Hall Ticket', sub: 'Released · tap to view your card', cta: 'View hall ticket', route: '/modules/examinations' };
    if (user.role === 'admin') return { kicker: 'University', title: 'HR Portal', sub: 'Live attendance, staff & analytics', cta: 'Open portal', route: '/admin' };
    return { kicker: user.department || 'Faculty', title: 'Mark Attendance', sub: 'Geo + face check-in / check-out', cta: 'Check in now', route: '/modules/attendance' };
  }, [user.role, user.department]);

  const list = cat === 'For You' ? FEATURES : FEATURES.filter((f) => f.cat === cat);
  // For category tabs, the first item becomes the hero; rest fill the row.
  const heroFeature = cat === 'For You' ? null : list[0];
  const rowFeatures = cat === 'For You' ? FEATURES : list.slice(1);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xxl * 2 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.ink} />}
      >
        {/* Greeting header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hello}>Hello, {firstName}</Text>
            <Text style={styles.welcome}>Welcome to MUOne</Text>
          </View>
          <TouchableOpacity style={styles.avatar} onPress={() => router.push('/(tabs)/profile')} testID="home-avatar">
            {user.avatar
              ? <Image source={{ uri: user.avatar }} style={styles.avatarImg} />
              : <Text style={styles.avatarText}>{initials}</Text>}
          </TouchableOpacity>
        </View>

        {/* Search + filter */}
        <View style={styles.searchRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.searchField}
            onPress={() => router.push('/(tabs)/services')}
            testID="home-search"
          >
            <Ionicons name="search" size={20} color={C.muted} />
            <Text style={styles.searchPlaceholder}>Search services, events…</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterBtn} onPress={() => router.push('/(tabs)/services')} testID="home-filter">
            <Ionicons name="options-outline" size={22} color={C.white} />
          </TouchableOpacity>
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
            image={CAMPUS_IMG}
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
                <Ionicons name="arrow-forward" size={16} color={C.ink} />
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
  welcome: { fontSize: 14, fontWeight: '500', color: C.muted, marginTop: 2 },
  avatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: C.ink,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarText: { color: C.white, fontSize: 18, fontWeight: '800' },

  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20 },
  searchField: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.field, borderRadius: 16, paddingHorizontal: 16, height: 54,
  },
  searchPlaceholder: { fontSize: 15, color: C.muted, fontWeight: '500' },
  filterBtn: {
    width: 54, height: 54, borderRadius: 16, backgroundColor: C.ink,
    alignItems: 'center', justifyContent: 'center',
  },

  sectionH: { fontSize: 22, fontWeight: '800', color: C.ink, letterSpacing: -0.4, paddingHorizontal: 20, marginTop: 26, marginBottom: 14 },

  pillRow: { paddingHorizontal: 20, gap: 10, paddingRight: 30 },
  pill: {
    paddingHorizontal: 18, height: 42, borderRadius: 21, backgroundColor: C.field,
    alignItems: 'center', justifyContent: 'center',
  },
  pillActive: { backgroundColor: C.ink },
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
    backgroundColor: 'rgba(20,23,28,0.78)', borderRadius: 30, paddingLeft: 22, paddingRight: 6, height: 56,
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
  featMeta: { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 0.4, textTransform: 'uppercase' },
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
  goBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center' },
});
