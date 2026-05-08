import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { api } from '../../src/api';
import { colors, radii, shadow, spacing } from '../../src/theme';
import { ScreenHeader, Empty, Badge } from '../../src/ui';

const ribbonColor = (t: string) => t === 'Winner' ? '#F59E0B' : t === 'Top 10' ? '#3B82F6' : '#10B981';

export default function Certificates() {
  const router = useRouter();
  const [certs, setCerts] = useState<any[]>([]);

  useEffect(() => { api.certificates().then(setCerts).catch(() => {}); }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="My Certificates" subtitle="Achievements & participation" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}>
        {certs.length === 0 ? <Empty icon="ribbon-outline" message="No certificates yet" /> : certs.map((c) => (
          <LinearGradient
            key={c.id}
            colors={['#FFFFFF', '#F9FAFB']}
            style={styles.cert}
          >
            <View style={[styles.ribbon, { backgroundColor: ribbonColor(c.type) }]}>
              <MaterialCommunityIcons name="medal-outline" size={24} color={colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.kicker}>{c.type.toUpperCase()}</Text>
              <Text style={styles.title}>{c.event}</Text>
              <Text style={styles.meta}>Issued by {c.issuer}</Text>
              <Text style={styles.date}>{new Date(c.date).toLocaleDateString()}</Text>
            </View>
            <Badge label="VERIFIED" color={colors.success} />
          </LinearGradient>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  cert: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.md, borderRadius: radii.lg, marginBottom: spacing.sm,
    ...shadow.card,
  },
  ribbon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  kicker: { fontSize: 10, fontWeight: '800', color: colors.gold, letterSpacing: 1.4 },
  title: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 2 },
  meta: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  date: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
});
