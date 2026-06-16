import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from '../../src/api';
import { colors, radii, spacing, typo } from '../../src/theme';
import { Card, Badge, Empty } from '../../src/ui';

const TYPE_META: Record<string, { color: string; icon: any; lib: 'ion' | 'mci' }> = {
  info: { color: colors.info, icon: 'information-outline', lib: 'mci' },
  academic: { color: colors.primary, icon: 'school-outline', lib: 'ion' },
  event: { color: '#EC4899', icon: 'ticket-confirmation-outline', lib: 'mci' },
  urgent: { color: colors.sos, icon: 'alert-circle', lib: 'ion' },
};

const FEATURED = {
  banner: 'https://customer-assets.emergentagent.com/job_6e34b5bc-d1ea-497f-9b38-6e61f8c9d982/artifacts/fkyl434x_DINNER%20INVITATION.jpeg',
  title: 'VC Dinner — 10th June 2026',
  location: 'Huts & Hive, Kompally',
  body: `Dear all,

Get ready for some fun, food, laughter, and unforgettable memories because we're all set to chill together on 10th June 2026 at Huts & Hive, Kompally 🎉🥳.

Kindly fill out the RSVP form shared below to help us with the event arrangements.
VC Dinner on 10th June 2026 – Fill out form

The form also includes a section for transportation requirements. Please note that transport facility will be available only for 40 employees and will be allotted on a first-come, first-served basis.
We request you to submit your responses at the earliest to enable smooth coordination.

P.S.: This one's strictly an in-house production; guest appearances and extended universes are temporarily suspended for the evening 😄.`,
};

function FeaturedAnnouncement() {
  return (
    <Card style={styles.featuredCard} testID="featured-announcement">
      <Image source={{ uri: FEATURED.banner }} style={styles.banner} resizeMode="cover" />
      <View style={styles.featuredBody}>
        <View style={styles.featuredTopRow}>
          <Badge label="EVENT" color="#EC4899" />
          <View style={styles.locRow}>
            <Ionicons name="location-outline" size={13} color={colors.textMuted} />
            <Text style={styles.featuredLoc}>{FEATURED.location}</Text>
          </View>
        </View>
        <Text style={styles.featuredTitle}>{FEATURED.title}</Text>
        <Text style={styles.featuredText}>{FEATURED.body}</Text>
      </View>
    </Card>
  );
}

export default function Alerts() {
  const [data, setData] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.alerts();
      setData(res);
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Alerts & Announcements</Text>
          <Text style={styles.subtitle}>Stay updated with campus news</Text>
        </View>
      </View>

      <FlatList
        data={data}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
        ListHeaderComponent={<FeaturedAnnouncement />}
        ListEmptyComponent={null}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        renderItem={({ item }) => {
          const meta = TYPE_META[item.type] ?? TYPE_META.info;
          const Icon = meta.lib === 'mci' ? MaterialCommunityIcons : Ionicons;
          const ts = new Date(item.created_at);
          return (
            <Card testID={`alert-${item.id}`}>
              <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' }}>
                <View style={[styles.alertIcon, { backgroundColor: `${meta.color}1A` }]}>
                  <Icon name={meta.icon} size={20} color={meta.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Badge label={item.type.toUpperCase()} color={meta.color} />
                    <Text style={styles.time}>{ts.toLocaleDateString()}</Text>
                  </View>
                  <Text style={styles.alertTitle}>{item.title}</Text>
                  <Text style={styles.alertMsg}>{item.message}</Text>
                </View>
              </View>
            </Card>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
  },
  title: { ...typo.h2, color: colors.text },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },

  featuredCard: { padding: 0, overflow: 'hidden' },
  banner: { width: '100%', aspectRatio: 3458 / 4292 },
  featuredBody: { padding: spacing.md },
  featuredTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  featuredLoc: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  featuredTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 8 },
  featuredText: { fontSize: 13, color: colors.textSecondary, marginTop: 8, lineHeight: 20 },

  alertIcon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  alertTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 6 },
  alertMsg: { fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 18 },
  time: { fontSize: 11, color: colors.textMuted },
});
