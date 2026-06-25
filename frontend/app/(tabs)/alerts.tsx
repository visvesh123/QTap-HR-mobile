import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, Image, TouchableOpacity,
  LayoutAnimation, Platform, UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from '../../src/api';
import { colors, spacing } from '../../src/theme';
import { Badge } from '../../src/ui';

/* ───────────── Palette (matches Home / Services / Profile) ───────────── */
const C = {
  bg: '#FFFFFF', ink: '#15171C', inkSoft: '#3A3F47', muted: '#8A9099',
  field: '#F2F3F5', white: '#FFFFFF', red: '#DC143C', redTint: '#FCE7EC',
};
const SOFT = Platform.select({
  web: { boxShadow: '0 2px 4px rgba(20,23,28,0.04), 0 8px 22px rgba(20,23,28,0.10)' } as any,
  default: { shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 14, elevation: 4 },
});

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const TYPE_META: Record<string, { color: string; icon: any; lib: 'ion' | 'mci' }> = {
  info: { color: colors.info, icon: 'information-outline', lib: 'mci' },
  academic: { color: colors.primary, icon: 'school-outline', lib: 'ion' },
  event: { color: '#EC4899', icon: 'ticket-confirmation-outline', lib: 'mci' },
  urgent: { color: colors.sos, icon: 'alert-circle', lib: 'ion' },
};

function timeAgo(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso).getTime();
  if (isNaN(d)) return '';
  const sec = Math.floor((Date.now() - d) / 1000);
  if (sec < 45) return 'Just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day === 1) return 'Yesterday';
  if (day < 7) return `${day} days ago`;
  if (day < 14) return 'Last week';
  if (day < 30) return `${Math.floor(day / 7)} weeks ago`;
  if (day < 60) return 'Last month';
  if (day < 365) return `${Math.floor(day / 30)} months ago`;
  return day < 730 ? 'Last year' : `${Math.floor(day / 365)} years ago`;
}

const FEATURED = {
  id: 'featured-vc-dinner',
  type: 'event',
  title: 'VC Dinner — 10th June 2026',
  date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  image: 'https://customer-assets.emergentagent.com/job_6e34b5bc-d1ea-497f-9b38-6e61f8c9d982/artifacts/fkyl434x_DINNER%20INVITATION.jpeg',
  imageRatio: 3458 / 4292,
  location: 'Huts & Hive, Kompally',
  body: `Dear all,

Get ready for some fun, food, laughter, and unforgettable memories because we're all set to chill together on 10th June 2026 at Huts & Hive, Kompally 🎉🥳.

Kindly fill out the RSVP form shared below to help us with the event arrangements.
VC Dinner on 10th June 2026 – Fill out form

The form also includes a section for transportation requirements. Please note that transport facility will be available only for 40 employees and will be allotted on a first-come, first-served basis.
We request you to submit your responses at the earliest to enable smooth coordination.

P.S.: This one's strictly an in-house production; guest appearances and extended universes are temporarily suspended for the evening 😄.`,
};

type Item = {
  id: string; type: string; title: string;
  image?: string | null; imageRatio?: number; body: string;
  location?: string; date?: string;
};

function AccordionItem({ item, expanded, onToggle }: { item: Item; expanded: boolean; onToggle: () => void }) {
  const meta = TYPE_META[item.type] ?? TYPE_META.info;
  const Icon = meta.lib === 'mci' ? MaterialCommunityIcons : Ionicons;
  return (
    <View style={[styles.card, expanded && styles.cardExpanded]}>
      <TouchableOpacity
        style={styles.headRow}
        activeOpacity={0.7}
        onPress={onToggle}
        testID={`accordion-${item.id}`}
      >
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.thumb} resizeMode="cover" />
        ) : (
          <View style={styles.iconChip}>
            <Icon name={meta.icon} size={20} color={C.red} />
          </View>
        )}
        <View style={styles.headTextWrap}>
          <Text style={styles.headTitle} numberOfLines={expanded ? undefined : 1}>{item.title}</Text>
          {!expanded && (
            <Text style={styles.headSnippet} numberOfLines={1}>
              {[timeAgo(item.date), item.location || item.body.replace(/\s+/g, ' ').trim()]
                .filter(Boolean).join('  ·  ')}
            </Text>
          )}
        </View>
        <View style={styles.chevBox}>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={C.inkSoft} />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.body} testID={`accordion-body-${item.id}`}>
          {!!item.image && (
            <Image
              source={{ uri: item.image }}
              style={styles.bodyImage}
              resizeMode="contain"
            />
          )}
          <View style={styles.metaRow}>
            <Badge label={item.type.toUpperCase()} color={C.red} />
            {!!item.date && (
              <View style={styles.locRow}>
                <Ionicons name="time-outline" size={13} color={colors.textMuted} />
                <Text style={styles.metaText}>Posted {timeAgo(item.date)}</Text>
              </View>
            )}
            {!!item.location && (
              <View style={styles.locRow}>
                <Ionicons name="location-outline" size={13} color={colors.textMuted} />
                <Text style={styles.metaText}>{item.location}</Text>
              </View>
            )}
          </View>
          <Text style={styles.bodyText}>{item.body}</Text>
        </View>
      )}
    </View>
  );
}

export default function Alerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.alerts();
      setAlerts(res);
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const toggle = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.create(220, 'easeInEaseOut', 'opacity'));
    setOpenId((cur) => (cur === id ? null : id));
  };

  const items: Item[] = [
    FEATURED,
    ...alerts.map((a) => ({ id: a.id, type: a.type, title: a.title, image: null, body: a.message, date: a.created_at })),
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Alerts & Announcements</Text>
        <Text style={styles.subtitle}>Tap a headline to read more</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {items.map((item) => (
          <AccordionItem
            key={item.id}
            item={item}
            expanded={openId === item.id}
            onToggle={() => toggle(item.id)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '800', color: C.ink, letterSpacing: -0.6 },
  subtitle: { fontSize: 14, color: C.muted, marginTop: 4, fontWeight: '500' },

  card: {
    backgroundColor: C.white,
    borderRadius: 22,
    borderWidth: 1, borderColor: '#EEEFF1',
    ...SOFT,
  },
  cardExpanded: {},
  headRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  iconChip: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: C.redTint },
  thumb: { width: 52, height: 52, borderRadius: 16, backgroundColor: C.field },
  chevBox: { width: 44, height: 36, borderRadius: 12, backgroundColor: C.field, alignItems: 'center', justifyContent: 'center' },
  headTextWrap: { flex: 1, gap: 3 },
  headTitle: { fontSize: 15.5, fontWeight: '700', color: C.ink, letterSpacing: -0.2 },
  headSnippet: { fontSize: 12.5, color: C.muted },

  body: { paddingHorizontal: 16, paddingBottom: 16 },
  bodyImage: { width: '100%', height: 440, borderRadius: 16, marginBottom: 10, backgroundColor: C.field },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 11.5, color: C.muted, fontWeight: '600' },
  bodyText: { fontSize: 13.5, color: C.inkSoft, lineHeight: 21 },
});
