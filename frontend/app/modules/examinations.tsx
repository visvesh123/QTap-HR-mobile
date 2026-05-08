import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { api } from '../../src/api';
import { colors, radii, shadow, spacing, typo } from '../../src/theme';
import { Card, Pill, Badge, ScreenHeader } from '../../src/ui';

export default function Examinations() {
  const router = useRouter();
  const [tab, setTab] = useState<'ticket' | 'attendance'>('ticket');
  const [data, setData] = useState<any>(null);
  const [att, setAtt] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [t, a] = await Promise.all([api.hallTicket(), api.examAttendance()]);
        setData(t); setAtt(a);
      } catch {}
      setLoading(false);
    })();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Examinations" subtitle="Hall ticket • Attendance" onBack={() => router.back()} />
      <View style={styles.tabs}>
        <Pill label="Hall Ticket" active={tab === 'ticket'} onPress={() => setTab('ticket')} testID="tab-ticket" />
        <Pill label="RFID Attendance" active={tab === 'attendance'} onPress={() => setTab('attendance')} testID="tab-attendance" />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : tab === 'ticket' ? (
        <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}>
          <LinearGradient
            colors={[colors.primaryDark, colors.primaryLight]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.ticket}
          >
            <View style={styles.ticketHead}>
              <View>
                <Text style={styles.ticketKicker}>HALL TICKET</Text>
                <Text style={styles.ticketTitle}>{data?.exam_name}</Text>
                <Text style={styles.ticketDates}>{data?.exam_dates}</Text>
              </View>
              <View style={styles.qrWrap}>
                <QRCode value={data?.qr_data ?? 'HALLTICKET'} size={88} backgroundColor="#fff" color={colors.primaryDark} />
              </View>
            </View>
            <View style={styles.ticketDivider} />
            <Row label="Candidate" value={data?.student_name} dark />
            <Row label="Roll No" value={data?.student_id} dark />
            <Row label="Department" value={data?.department} dark />
            <Row label="Ticket #" value={data?.ticket_no} dark />
          </LinearGradient>

          <View style={{ marginTop: spacing.md }}>
            <Text style={styles.sectionTitle}>Subject Schedule</Text>
            {data?.subjects?.map((s: any) => (
              <Card key={s.code} style={{ marginTop: spacing.sm }} testID={`subject-${s.code}`}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.subjectName}>{s.name}</Text>
                    <Text style={styles.subjectCode}>{s.code}</Text>
                  </View>
                  <Badge label={s.date} color={colors.primary} />
                </View>
                <View style={styles.metaRow}>
                  <Meta icon="time-outline" label={s.time} />
                  <Meta icon="location-outline" label={s.room} />
                  <Meta icon="grid-outline" label={`Seat ${s.seat}`} />
                </View>
              </Card>
            ))}
          </View>

          <View style={{ marginTop: spacing.md }}>
            <Text style={styles.sectionTitle}>Important Instructions</Text>
            {data?.instructions?.map((i: string, idx: number) => (
              <View key={idx} style={styles.instruction}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={styles.instructionText}>{i}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.md }}>
          <Card>
            <Text style={styles.sectionTitle}>Live RFID Attendance</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
              Tap your ID at the exam hall reader to mark presence
            </Text>
          </Card>
          {att.length === 0 ? (
            <Text style={{ color: colors.textSecondary, marginTop: spacing.md, textAlign: 'center' }}>
              No attendance records yet
            </Text>
          ) : (
            att.map((a, i) => (
              <Card key={i} style={{ marginTop: spacing.sm }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={styles.subjectName}>{a.subject}</Text>
                    <Text style={styles.subjectCode}>{a.date} • {a.time}</Text>
                  </View>
                  <Badge label="PRESENT" color={colors.success} />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                  <MaterialCommunityIcons name="contactless-payment" size={14} color={colors.textMuted} />
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>via {a.method}</Text>
                </View>
              </Card>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const Row = ({ label, value, dark }: any) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
    <Text style={{ fontSize: 12, color: dark ? 'rgba(255,255,255,0.7)' : colors.textSecondary }}>{label}</Text>
    <Text style={{ fontSize: 13, fontWeight: '600', color: dark ? colors.white : colors.text }}>{value}</Text>
  </View>
);

const Meta = ({ icon, label }: any) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
    <Ionicons name={icon} size={13} color={colors.textSecondary} />
    <Text style={{ fontSize: 12, color: colors.textSecondary }}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  tabs: { flexDirection: 'row', padding: spacing.md, gap: 8 },
  ticket: {
    borderRadius: radii.xl,
    padding: spacing.md,
    ...shadow.cardHeavy,
  },
  ticketHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  ticketKicker: { fontSize: 11, fontWeight: '700', color: colors.gold, letterSpacing: 1.5 },
  ticketTitle: { fontSize: 18, fontWeight: '800', color: colors.white, marginTop: 4, lineHeight: 22 },
  ticketDates: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  qrWrap: { backgroundColor: colors.white, padding: 6, borderRadius: 12 },
  ticketDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: spacing.md },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  subjectName: { fontSize: 15, fontWeight: '700', color: colors.text },
  subjectCode: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  metaRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  instruction: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 6, paddingHorizontal: 4 },
  instructionText: { flex: 1, fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
});
