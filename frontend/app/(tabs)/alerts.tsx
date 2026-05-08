import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '../../src/api';
import { colors, radii, shadow, spacing, typo } from '../../src/theme';
import { Card, Badge, Empty } from '../../src/ui';

const TYPE_META: Record<string, { color: string; icon: any; lib: 'ion' | 'mci' }> = {
  info: { color: colors.info, icon: 'information-outline', lib: 'mci' },
  academic: { color: colors.primary, icon: 'school-outline', lib: 'ion' },
  event: { color: '#EC4899', icon: 'ticket-confirmation-outline', lib: 'mci' },
  urgent: { color: colors.sos, icon: 'alert-circle', lib: 'ion' },
};

export default function Alerts() {
  const router = useRouter();
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
        <TouchableOpacity
          style={styles.sosBtn}
          onPress={() => router.push('/modules/sos')}
          testID="alerts-sos-btn"
        >
          <MaterialCommunityIcons name="shield-alert-outline" size={18} color={colors.white} />
          <Text style={styles.sosBtnText}>SOS</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={data}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
        ListEmptyComponent={<Empty icon="notifications-off-outline" message="No alerts at the moment" />}
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
  sosBtn: {
    backgroundColor: colors.sos, flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
  },
  sosBtnText: { color: colors.white, fontWeight: '700', fontSize: 12 },
  alertIcon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  alertTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 6 },
  alertMsg: { fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 18 },
  time: { fontSize: 11, color: colors.textMuted },
});
