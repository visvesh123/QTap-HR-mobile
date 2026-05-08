import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Easing, Dimensions, Platform,
} from 'react-native';
import Svg, {
  Defs, LinearGradient as SvgLG, Stop, Rect, G, Polyline, Path,
  Circle, Text as SvgText,
} from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, radii, shadow, spacing } from '../../src/theme';
import { ScreenHeader, Pill, Badge } from '../../src/ui';
import {
  BUILDINGS, MAP_W, MAP_H, ROAD_LINES, YOU_ARE_HERE,
  CATEGORY_META, Category, Building,
} from '../../src/campus-map-data';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export default function CampusMapScreen() {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Category | 'all'>('all');
  const [guideOn, setGuideOn] = useState(false);

  const screenW = Dimensions.get('window').width;
  const scale = (screenW - 24) / MAP_W; // small margin
  const renderH = MAP_H * scale;

  const active = useMemo(() => BUILDINGS.find((b) => b.id === activeId) || null, [activeId]);

  const visibleBuildings = useMemo(() => {
    if (filter === 'all') return BUILDINGS;
    return BUILDINGS.filter((b) => b.category === filter || b.id === 'main-gate');
  }, [filter]);

  const handleSelect = (b: Building) => {
    setActiveId(b.id);
    setGuideOn(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="Campus Map"
        subtitle="Mahindra University — Bahadurpally"
        onBack={() => router.back()}
      />

      {/* Filter chips */}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          <Pill
            label="All"
            active={filter === 'all'}
            onPress={() => setFilter('all')}
            testID="filter-all"
          />
          {(Object.keys(CATEGORY_META) as Category[]).map((c) => {
            const meta = CATEGORY_META[c];
            return (
              <Pill
                key={c}
                label={meta.label}
                active={filter === c}
                onPress={() => setFilter(c)}
                testID={`filter-${c}`}
              />
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: active ? 280 : spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Map canvas */}
        <View style={styles.mapWrap}>
          <Svg
            width={screenW - 24}
            height={renderH}
            viewBox={`0 0 ${MAP_W} ${MAP_H}`}
          >
            <Defs>
              <SvgLG id="grass" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#E8F5E9" />
                <Stop offset="1" stopColor="#C8E6C9" />
              </SvgLG>
              <SvgLG id="boundary" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#86EFAC" />
                <Stop offset="1" stopColor="#22C55E" />
              </SvgLG>
            </Defs>

            {/* Background */}
            <Rect x={0} y={0} width={MAP_W} height={MAP_H} fill="url(#grass)" />

            {/* Decorative trees */}
            {DECOR_TREES.map((t, i) => (
              <G key={`t-${i}`}>
                <Circle cx={t[0]} cy={t[1]} r={10} fill="#16A34A" opacity={0.55} />
                <Circle cx={t[0] - 4} cy={t[1] - 4} r={8} fill="#22C55E" opacity={0.7} />
              </G>
            ))}

            {/* Boundary */}
            <Rect
              x={20} y={60} width={MAP_W - 40} height={MAP_H - 120}
              rx={28} ry={28}
              fill="none" stroke="url(#boundary)" strokeWidth={4} strokeDasharray="14 10"
            />

            {/* Roads */}
            {ROAD_LINES.map((line, i) => (
              <G key={`road-${i}`}>
                <Polyline
                  points={line.map((p) => p.join(',')).join(' ')}
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth={36}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Polyline
                  points={line.map((p) => p.join(',')).join(' ')}
                  fill="none"
                  stroke="#CBD5E1"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeDasharray="10 12"
                />
              </G>
            ))}

            {/* Buildings */}
            {BUILDINGS.map((b) => {
              const meta = CATEGORY_META[b.category];
              const dim = filter !== 'all' && b.category !== filter && b.id !== 'main-gate';
              const isActive = activeId === b.id;
              return (
                <G key={b.id} opacity={dim ? 0.25 : 1}>
                  {/* Shadow */}
                  <Rect
                    x={b.rect.x + 3} y={b.rect.y + 5}
                    width={b.rect.w} height={b.rect.h}
                    rx={b.rect.rx ?? 8} ry={b.rect.rx ?? 8}
                    fill="rgba(0,0,0,0.10)"
                  />
                  {/* Body */}
                  <Rect
                    x={b.rect.x} y={b.rect.y}
                    width={b.rect.w} height={b.rect.h}
                    rx={b.rect.rx ?? 8} ry={b.rect.rx ?? 8}
                    fill={isActive ? meta.color : `${meta.color}E6`}
                    stroke={isActive ? '#FFFFFF' : 'rgba(255,255,255,0.6)'}
                    strokeWidth={isActive ? 4 : 1.5}
                    onPress={() => handleSelect(b)}
                  />
                  {/* Pin marker */}
                  <Circle
                    cx={b.pin.x} cy={b.pin.y}
                    r={isActive ? 14 : 11}
                    fill={isActive ? colors.primary : '#FFFFFF'}
                    stroke={meta.color}
                    strokeWidth={3}
                    onPress={() => handleSelect(b)}
                  />
                  <Circle cx={b.pin.x} cy={b.pin.y} r={4} fill={meta.color} onPress={() => handleSelect(b)} />
                  {/* Label */}
                  {!dim && (
                    <SvgText
                      x={b.pin.x}
                      y={b.rect.y + b.rect.h / 2 + 5}
                      fill="#FFFFFF"
                      fontSize={b.rect.w < 90 ? 11 : 14}
                      fontWeight="700"
                      textAnchor="middle"
                    >
                      {b.short || b.name}
                    </SvgText>
                  )}
                </G>
              );
            })}

            {/* Guide route (animated dashed line) */}
            {guideOn && active && (
              <GuidePath route={active.route} color={colors.primary} />
            )}

            {/* "You are here" marker — Main Gate */}
            <G>
              <Circle cx={YOU_ARE_HERE[0]} cy={YOU_ARE_HERE[1]} r={20} fill="rgba(227,24,55,0.22)" />
              <Circle cx={YOU_ARE_HERE[0]} cy={YOU_ARE_HERE[1]} r={11} fill={colors.primary} stroke="#FFFFFF" strokeWidth={3} />
              <SvgText
                x={YOU_ARE_HERE[0]}
                y={YOU_ARE_HERE[1] + 38}
                fill={colors.primaryDark}
                fontSize={13}
                fontWeight="800"
                textAnchor="middle"
              >
                YOU ARE HERE
              </SvgText>
            </G>
          </Svg>
        </View>

        {/* Legend / quick instruction */}
        <View style={styles.legendCard}>
          <View style={styles.legendHead}>
            <MaterialCommunityIcons name="information-outline" size={16} color={colors.primary} />
            <Text style={styles.legendTitle}>Tap any place below or on the map to see details & directions.</Text>
          </View>
          <View style={styles.legendRow}>
            {(Object.keys(CATEGORY_META) as Category[]).slice(0, 6).map((c) => (
              <View key={c} style={styles.legendChip}>
                <View style={[styles.legendDot, { backgroundColor: CATEGORY_META[c].color }]} />
                <Text style={styles.legendChipText}>{CATEGORY_META[c].label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Tappable building list (works reliably on web too) */}
        <View style={styles.listWrap}>
          <Text style={styles.listHeader}>Places on Campus</Text>
          {visibleBuildings.map((b) => {
            const meta = CATEGORY_META[b.category];
            const Icon = meta.iconLib === 'mci' ? MaterialCommunityIcons : Ionicons;
            const isActive = activeId === b.id;
            return (
              <TouchableOpacity
                key={b.id}
                activeOpacity={0.7}
                onPress={() => handleSelect(b)}
                testID={`place-${b.id}`}
                style={[styles.placeRow, isActive && styles.placeRowActive]}
              >
                <View style={[styles.placeIcon, { backgroundColor: `${meta.color}1A` }]}>
                  <Icon name={meta.icon as any} size={18} color={meta.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.placeName}>{b.name}</Text>
                  <Text style={styles.placeMeta}>{meta.label}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom info sheet */}
      {active && (
        <InfoSheet
          building={active}
          guideOn={guideOn}
          onClose={() => { setActiveId(null); setGuideOn(false); }}
          onGuide={() => setGuideOn((v) => !v)}
        />
      )}
    </SafeAreaView>
  );
}

const GuidePath = ({ route, color }: { route: [number, number][]; color: string }) => {
  const dashOffset = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    dashOffset.setValue(0);
    Animated.loop(
      Animated.timing(dashOffset, {
        toValue: 36,
        duration: 700,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
    ).start();
  }, []);

  const d = useMemo(() => {
    const pts = [YOU_ARE_HERE, ...route];
    return pts.reduce((acc, p, i) => acc + (i === 0 ? `M${p[0]},${p[1]}` : ` L${p[0]},${p[1]}`), '');
  }, [route]);

  return (
    <G>
      <Path d={d} stroke="#FFFFFF" strokeWidth={14} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <AnimatedPath
        d={d}
        stroke={color}
        strokeWidth={6}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="14 16"
        // @ts-ignore — RN web supports strokeDashoffset on AnimatedPath
        strokeDashoffset={Platform.OS === 'web' ? undefined : dashOffset as any}
      />
      {/* Endpoint marker */}
      {route.length > 0 && (
        <Circle cx={route[route.length - 1][0]} cy={route[route.length - 1][1]} r={8} fill={color} stroke="#FFFFFF" strokeWidth={3} />
      )}
    </G>
  );
};

const InfoSheet = ({
  building, guideOn, onClose, onGuide,
}: { building: Building; guideOn: boolean; onClose: () => void; onGuide: () => void }) => {
  const meta = CATEGORY_META[building.category];
  const Icon = meta.iconLib === 'mci' ? MaterialCommunityIcons : Ionicons;

  // approx walking distance: route length × 0.6m per unit
  const dist = useMemo(() => {
    const pts: [number, number][] = [YOU_ARE_HERE, ...building.route];
    let total = 0;
    for (let i = 1; i < pts.length; i++) {
      const dx = pts[i][0] - pts[i - 1][0];
      const dy = pts[i][1] - pts[i - 1][1];
      total += Math.sqrt(dx * dx + dy * dy);
    }
    return Math.round(total * 0.6);
  }, [building.route]);
  const walkMin = Math.max(1, Math.round(dist / 80)); // ~80m/min walking

  return (
    <View style={styles.sheet}>
      <View style={styles.sheetHandle} />
      <View style={styles.sheetHead}>
        <View style={[styles.sheetIcon, { backgroundColor: `${meta.color}1A` }]}>
          <Icon name={meta.icon as any} size={22} color={meta.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sheetTitle}>{building.name}</Text>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, alignItems: 'center', flexWrap: 'wrap' }}>
            <Badge label={meta.label.toUpperCase()} color={meta.color} />
            <Text style={styles.sheetMeta}>~{dist}m · {walkMin} min walk</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onClose} testID="sheet-close" style={styles.closeBtn}>
          <Ionicons name="close" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      {!!building.description && (
        <Text style={styles.sheetDesc}>{building.description}</Text>
      )}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onGuide}
        testID="sheet-guide-btn"
        style={[styles.guideBtn, guideOn && { backgroundColor: '#16A34A' }]}
      >
        <MaterialCommunityIcons
          name={guideOn ? 'walk' : 'directions'}
          size={18}
          color="#FFFFFF"
        />
        <Text style={styles.guideBtnText}>
          {guideOn ? 'Following you to ' + (building.short || building.name) : 'Guide me here'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const DECOR_TREES: [number, number][] = [
  [50, 90], [690, 90], [40, 1180], [690, 1180],
  [40, 380], [690, 380], [40, 800], [690, 800],
  [350, 90], [350, 1170],
  [110, 50], [620, 50], [110, 1230], [620, 1230],
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  filterRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 6,
  },
  mapWrap: {
    marginHorizontal: 12,
    marginTop: 4,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: '#E8F5E9',
    ...shadow.card,
  },
  legendCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    ...shadow.card,
  },
  legendHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendTitle: { fontSize: 12, color: colors.textSecondary, flex: 1 },
  legendRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 8, marginTop: spacing.sm,
  },
  legendChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#F1F5F9', borderRadius: radii.pill,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendChipText: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
  listWrap: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.sm,
    ...shadow.card,
  },
  listHeader: {
    fontSize: 12, fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1.2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    textTransform: 'uppercase',
  },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
  },
  placeRowActive: {
    backgroundColor: colors.primaryBg,
  },
  placeIcon: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  placeName: { fontSize: 14, fontWeight: '700', color: colors.text },
  placeMeta: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  sheet: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: spacing.md,
    paddingBottom: spacing.lg,
    ...shadow.cardHeavy,
    elevation: 10,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center', marginBottom: spacing.sm,
  },
  sheetHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  sheetIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  sheetTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  sheetMeta: { fontSize: 12, color: colors.textSecondary },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: 'center', justifyContent: 'center',
  },
  sheetDesc: {
    fontSize: 13, color: colors.textSecondary,
    marginTop: spacing.sm, lineHeight: 18,
  },
  guideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 13,
    borderRadius: radii.md,
    marginTop: spacing.md,
  },
  guideBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
});
