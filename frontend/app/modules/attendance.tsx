import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { api } from '../../src/api';
import { colors, radii, shadow, spacing } from '../../src/theme';
import { Card, Pill, Badge, ScreenHeader, PrimaryButton, Empty } from '../../src/ui';

export default function StaffAttendance() {
  const router = useRouter();
  const [tab, setTab] = useState<'check' | 'history'>('check');
  const [history, setHistory] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<any>(null);

  const load = async () => { try { setHistory(await api.attendanceHistory()); } catch {} };
  useEffect(() => { load(); }, []);

  const check = async (type: 'in' | 'out') => {
    setBusy(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission', 'Location permission is required'); setBusy(false); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const res = await api.attendanceCheck({ latitude: loc.coords.latitude, longitude: loc.coords.longitude, type });
      setLast(res);
      if (res.on_campus) Alert.alert('Success', `Check-${type} recorded on campus.`);
      else Alert.alert('Outside Campus', `You are ${(res.distance_m/1000).toFixed(1)} km from campus. Anti-proxy flag added.`);
      load();
    } catch (e: any) { Alert.alert('Error', e.message); }
    setBusy(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Staff Attendance" subtitle="Geolocation-verified" onBack={() => router.back()} />
      <View style={styles.tabs}>
        <Pill label="Check In/Out" active={tab === 'check'} onPress={() => setTab('check')} testID="tab-att-check" />
        <Pill label="History" active={tab === 'history'} onPress={() => setTab('history')} testID="tab-att-history" />
      </View>

      {tab === 'check' && (
        <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}>
          <LinearGradient colors={[colors.primaryDark, colors.primaryLight]} style={styles.heroCard}>
            <MaterialCommunityIcons name="map-marker-radius-outline" size={48} color={colors.white} />
            <Text style={styles.heroTitle}>Geofence Active</Text>
            <Text style={styles.heroSub}>Tap below to mark your attendance</Text>
          </LinearGradient>

          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
            <View style={{ flex: 1 }}>
              <PrimaryButton label="Check In" onPress={() => check('in')} loading={busy} testID="checkin-btn" />
            </View>
            <View style={{ flex: 1 }}>
              <PrimaryButton label="Check Out" onPress={() => check('out')} loading={busy} testID="checkout-btn" />
            </View>
          </View>

          {last && (
            <Card style={{ marginTop: spacing.md }} testID="last-check">
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontWeight: '700', color: colors.text }}>Last check-{last.type}</Text>
                <Badge label={last.on_campus ? 'ON-CAMPUS' : 'OFF-CAMPUS'} color={last.on_campus ? colors.success : colors.sos} />
              </View>
              <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 6 }}>
                Distance from campus: {(last.distance_m / 1000).toFixed(2)} km
              </Text>
              <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                {new Date(last.timestamp).toLocaleString()}
              </Text>
            </Card>
          )}

          <View style={styles.tipCard}>
            <Ionicons name="information-circle" size={16} color={colors.info} />
            <Text style={styles.tipText}>
              Anti-proxy: Your location is logged for verification. Mock locations and outside-campus check-ins are flagged automatically.
            </Text>
          </View>
        </ScrollView>
      )}

      {tab === 'history' && (
        <ScrollView contentContainerStyle={{ padding: spacing.md }}>
          {history.length === 0 ? <Empty icon="time-outline" message="No attendance records yet" /> : history.map((h, i) => (
            <Card key={i} style={{ marginBottom: spacing.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={{ fontWeight: '700', color: colors.text }}>Check-{h.type}</Text>
                  <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>{new Date(h.timestamp).toLocaleString()}</Text>
                </View>
                <Badge label={h.on_campus ? 'ON-CAMPUS' : 'OFF-CAMPUS'} color={h.on_campus ? colors.success : colors.sos} />
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
  tabs: { flexDirection: 'row', padding: spacing.md, gap: 8 },
  heroCard: { padding: spacing.lg, borderRadius: radii.xl, alignItems: 'center', ...shadow.cardHeavy },
  heroTitle: { fontSize: 22, fontWeight: '800', color: colors.white, marginTop: 8 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  tipCard: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: '#DBEAFE', padding: spacing.sm, borderRadius: radii.md, marginTop: spacing.md },
  tipText: { flex: 1, fontSize: 11, color: colors.info, fontWeight: '500', lineHeight: 16 },
});
