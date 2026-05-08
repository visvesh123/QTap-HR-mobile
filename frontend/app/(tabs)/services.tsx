import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/auth';
import { colors, spacing, typo } from '../../src/theme';
import { ServiceTile, SectionHeader } from '../../src/ui';
import { SECTIONED_SERVICES } from '../../src/services-catalog';

export default function Services() {
  const router = useRouter();
  const { user } = useAuth();
  if (!user) return null;
  const sections = SECTIONED_SERVICES(user.role, user.department);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Services</Text>
        <Text style={styles.subtitle}>All campus modules in one place</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        {sections.map((section) => (
          <View key={section.title}>
            <SectionHeader title={section.title} />
            <View style={styles.grid}>
              {section.items.map((s) => (
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
          </View>
        ))}
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
