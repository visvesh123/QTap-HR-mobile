import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { api } from '../../src/api';
import { colors, radii, shadow, spacing } from '../../src/theme';
import { Card, ScreenHeader, Badge } from '../../src/ui';

const gradeColor = (g: string) => {
  if (g.startsWith('A')) return colors.success;
  if (g.startsWith('B')) return colors.info;
  if (g.startsWith('C')) return colors.warning;
  return colors.sos;
};

export default function Results() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.results().then(setData).catch(() => {});
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Exam Results" subtitle="Latest semester performance" onBack={() => router.back()} />
      {!data ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}>
          <LinearGradient colors={[colors.primaryDark, colors.primaryLight]} style={styles.gpaCard}>
            <Text style={styles.gpaLabel}>{data.semester} GPA</Text>
            <Text style={styles.gpaValue} testID="gpa-value">{data.gpa}</Text>
            <View style={styles.metaRow}>
              <View><Text style={styles.metaLabel}>Credits</Text><Text style={styles.metaValue}>{data.total_credits}</Text></View>
              <View><Text style={styles.metaLabel}>Subjects</Text><Text style={styles.metaValue}>{data.subjects.length}</Text></View>
              <View><Text style={styles.metaLabel}>Status</Text><Text style={[styles.metaValue, { color: '#10F0A0' }]}>PASSED</Text></View>
            </View>
          </LinearGradient>

          <Text style={styles.sectionTitle}>Subject-wise Grades</Text>
          {data.subjects.map((s: any) => (
            <Card key={s.code} style={{ marginTop: spacing.sm }} testID={`result-${s.code}`}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.subjectName}>{s.name}</Text>
                  <Text style={styles.subjectMeta}>{s.code} • {s.credits} credits</Text>
                </View>
                <View style={[styles.gradePill, { backgroundColor: `${gradeColor(s.grade)}1A` }]}>
                  <Text style={[styles.grade, { color: gradeColor(s.grade) }]}>{s.grade}</Text>
                </View>
              </View>
            </Card>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  gpaCard: { padding: spacing.lg, borderRadius: radii.xl, ...shadow.cardHeavy, alignItems: 'center' },
  gpaLabel: { fontSize: 12, color: 'rgba(255,255,255,0.85)', letterSpacing: 1.5, fontWeight: '700' },
  gpaValue: { fontSize: 56, fontWeight: '800', color: colors.white, letterSpacing: -2, marginTop: 6 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-around', alignSelf: 'stretch', marginTop: spacing.md },
  metaLabel: { fontSize: 11, color: 'rgba(255,255,255,0.85)' },
  metaValue: { fontSize: 18, fontWeight: '700', color: colors.white },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: spacing.lg, marginBottom: 4 },
  subjectName: { fontSize: 15, fontWeight: '700', color: colors.text },
  subjectMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  gradePill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  grade: { fontSize: 18, fontWeight: '800' },
});
