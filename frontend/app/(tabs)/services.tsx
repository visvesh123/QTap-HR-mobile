import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/auth';
import { colors, spacing, typo } from '../../src/theme';
import { ServiceTile } from '../../src/ui';
import { TAB_SERVICES } from '../../src/services-catalog';

export default function Services() {
  const router = useRouter();
  const { user } = useAuth();
  if (!user) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Services</Text>
        <Text style={styles.subtitle}>Quick access to your campus tools</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <View style={styles.grid}>
          {TAB_SERVICES.map((s) => (
            <ServiceTile
              key={s.key}
              label={s.label}
              icon={s.icon}
              iconLib={s.iconLib}
              color={s.color}
              onPress={() => router.push(s.route as any)}
              testID={`service-tile-${s.key}`}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  title: { ...typo.h2, color: colors.text },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: spacing.md, gap: spacing.sm,
  },
});
