import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, RefreshControl, LayoutAnimation, Platform, UIManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '../../src/api';
import { colors, radii, spacing, shadow } from '../../src/theme';
import { ScreenHeader } from '../../src/ui';
import { timeAgo } from '../../src/timeago';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CAT_COLOR: Record<string, string> = {
  Achievements: '#16A34A',
  Research: '#7D3ECF',
  Sports: '#EA580C',
  Academics: '#2563EB',
  'Campus Life': '#0EA5E9',
};

export default function News() {
  const router = useRouter();
  const [news, setNews] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { setNews(await api.news()); } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const toggle = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.create(200, 'easeInEaseOut', 'opacity'));
    setOpenId((cur) => (cur === id ? null : id));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Campus News" subtitle="Happenings around campus" onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {news.map((n) => {
          const expanded = openId === n.id;
          const cat = CAT_COLOR[n.category] || colors.primary;
          return (
            <TouchableOpacity
              key={n.id}
              activeOpacity={0.9}
              style={styles.card}
              onPress={() => toggle(n.id)}
              testID={`news-item-${n.id}`}
            >
              <Image source={{ uri: n.image }} style={styles.image} />
              <View style={styles.body}>
                <View style={styles.row}>
                  <View style={[styles.catBadge, { backgroundColor: `${cat}1A` }]}>
                    <Text style={[styles.catText, { color: cat }]}>{n.category}</Text>
                  </View>
                  <Text style={styles.time}>{timeAgo(n.date)}</Text>
                </View>
                <Text style={styles.title}>{n.title}</Text>
                <Text style={styles.summary} numberOfLines={expanded ? undefined : 2}>{n.summary}</Text>
                <View style={styles.moreRow}>
                  <Text style={styles.moreText}>{expanded ? 'Show less' : 'Read more'}</Text>
                  <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={15} color={colors.primary} />
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  card: { backgroundColor: colors.white, borderRadius: radii.lg, overflow: 'hidden', ...shadow.card },
  image: { width: '100%', height: 180, backgroundColor: '#EEE' },
  body: { padding: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  catBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  catText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  time: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  title: { fontSize: 17, fontWeight: '800', color: colors.text, marginTop: 8, lineHeight: 22 },
  summary: { fontSize: 13, color: colors.textSecondary, marginTop: 6, lineHeight: 20 },
  moreRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  moreText: { fontSize: 13, fontWeight: '700', color: colors.primary },
});
