import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/auth';
import { colors, radii, spacing, shadow, BRAND } from '../../src/theme';
import { TAB_SERVICES } from '../../src/services-catalog';

const CAPTION: Record<string, string> = {
  attendance: 'Check in & out',
  leave: 'Apply & track',
  visitor: 'Invite guests',
  mess: "Today's menu",
};

// Services that are not yet live — shown disabled with an "Upcoming" badge.
const UPCOMING = new Set(['leave', 'visitor', 'mess']);

// Subtly pulsing "Upcoming" badge to gently draw the eye.
function UpcomingBadge({ testID }: { testID?: string }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.09] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.72] });
  return (
    <Animated.View style={[styles.upcomingBadge, { transform: [{ scale }], opacity }]} testID={testID}>
      <MaterialCommunityIcons name="clock-outline" size={10} color={colors.white} />
      <Text style={styles.upcomingBadgeText}>UPCOMING</Text>
    </Animated.View>
  );
}

const GAP = 12;
const H_PAD = spacing.md;
const COLS = 3;
const SCREEN_W = Dimensions.get('window').width;
const TILE_W = (SCREEN_W - H_PAD * 2 - GAP * (COLS - 1)) / COLS;

export default function Services() {
  const router = useRouter();
  const { user } = useAuth();
  if (!user) return null;

  const firstName = user.role === 'admin' ? 'Admin' : user.name.replace(/^(Dr\.?|Mr\.?|Mrs\.?|Ms\.?|Prof\.?)\s+/i, '').split(' ')[0];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }} showsVerticalScrollIndicator={false}>
        {/* Branded header */}
        <LinearGradient
          colors={[colors.primaryLight, colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroTextWrap}>
            <Text style={styles.heroKicker}>MUOne · SERVICES</Text>
            <Text style={styles.heroTitle}>Hi {firstName}, what would you{'\n'}like to do today?</Text>
          </View>
          <MaterialCommunityIcons name="apps" size={64} color="rgba(255,255,255,0.18)" style={styles.heroGlyph} />
        </LinearGradient>

        {/* 3-column bento grid */}
        <View style={styles.grid}>
          {TAB_SERVICES.map((s) => {
            const Icon = s.iconLib === 'mci' ? MaterialCommunityIcons : Ionicons;
            const upcoming = UPCOMING.has(s.key);
            return (
              <TouchableOpacity
                key={s.key}
                style={[styles.tile, { width: TILE_W }, upcoming && styles.tileUpcoming]}
                onPress={() => { if (!upcoming) router.push(s.route as any); }}
                activeOpacity={upcoming ? 1 : 0.85}
                disabled={upcoming}
                testID={`service-tile-${s.key}`}
              >
                {upcoming && (
                  <UpcomingBadge testID={`upcoming-badge-${s.key}`} />
                )}
                <View style={[styles.tileBody, upcoming && styles.contentDim]}>
                  <View style={[styles.iconChip, { backgroundColor: `${s.color}1A` }, upcoming && styles.iconChipDim]}>
                    <Icon name={s.icon as any} size={26} color={upcoming ? colors.textMuted : s.color} />
                  </View>
                  <Text style={styles.tileLabel} numberOfLines={1}>{s.label}</Text>
                  <Text style={styles.tileCaption} numberOfLines={1}>{upcoming ? 'Coming soon' : CAPTION[s.key]}</Text>
                </View>
                <View style={[styles.accent, { backgroundColor: upcoming ? '#F59E0B' : s.color }]} />
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.footnote}>More services rolling out across {BRAND.name} soon.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.clayBg },
  hero: {
    margin: spacing.md,
    borderRadius: radii.xl,
    padding: spacing.lg,
    overflow: 'hidden',
    minHeight: 120,
    justifyContent: 'center',
    ...shadow.cardHeavy,
  },
  heroTextWrap: { paddingRight: 56 },
  heroKicker: { fontSize: 11, fontWeight: '800', color: colors.gold, letterSpacing: 1.5 },
  heroTitle: { fontSize: 21, fontWeight: '800', color: colors.white, marginTop: 6, lineHeight: 27, letterSpacing: -0.3 },
  heroGlyph: { position: 'absolute', right: 12, bottom: 6 },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: H_PAD,
    gap: GAP,
  },
  tile: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: 8,
    alignItems: 'center',
    minHeight: 132,
    justifyContent: 'center',
    overflow: 'hidden',
    ...shadow.card,
  },
  iconChip: {
    width: 54, height: 54, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  iconChipDim: { backgroundColor: '#EEF1F4' },
  tileBody: { alignItems: 'center', width: '100%' },
  contentDim: { opacity: 0.5 },
  tileUpcoming: {
    borderWidth: 1.5,
    borderColor: '#FCD9A0',
    backgroundColor: '#FFFBF2',
  },
  upcomingBadge: {
    position: 'absolute', top: 8, right: 8, zIndex: 3,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#F59E0B',
    borderRadius: 999,
    paddingHorizontal: 9, paddingVertical: 4,
    shadowColor: '#F59E0B', shadowOpacity: 0.45, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  upcomingBadgeText: { fontSize: 9.5, fontWeight: '900', color: colors.white, letterSpacing: 0.6 },
  tileLabel: { fontSize: 13, fontWeight: '800', color: colors.text, textAlign: 'center' },
  tileCaption: { fontSize: 10.5, color: colors.textMuted, marginTop: 2, textAlign: 'center' },
  accent: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3 },

  footnote: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg, paddingHorizontal: spacing.lg },
});
