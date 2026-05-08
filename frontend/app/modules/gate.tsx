import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { api } from '../../src/api';
import { useAuth } from '../../src/auth';
import { colors, radii, shadow, spacing } from '../../src/theme';
import { Card, Pill, Badge, ScreenHeader } from '../../src/ui';

export default function Gate() {
  const router = useRouter();
  const { user } = useAuth();
  const [tab, setTab] = useState<'pass' | 'logs'>('pass');
  const [pass, setPass] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    api.myPass().then(setPass).catch(() => {});
    api.gateLogs().then(setLogs).catch(() => {});
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Gate Access" subtitle="RFID • QR pass" onBack={() => router.back()} />
      <View style={styles.tabs}>
        <Pill label="My Pass" active={tab === 'pass'} onPress={() => setTab('pass')} testID="tab-mypass" />
        <Pill label="Entry/Exit Logs" active={tab === 'logs'} onPress={() => setTab('logs')} testID="tab-logs" />
      </View>

      {tab === 'pass' && (
        <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}>
          {!pass ? <ActivityIndicator color={colors.primary} /> : (
            <LinearGradient colors={[colors.primaryDark, colors.primaryLight]} style={styles.passCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View>
                  <Text style={styles.passKicker}>UNIVERSITY ID</Text>
                  <Text style={styles.passName}>{pass.name}</Text>
                  <Text style={styles.passMeta}>{pass.role.toUpperCase()} • {pass.department}</Text>
                </View>
                <View style={styles.qrBox}>
                  <QRCode value={pass.qr_data} size={88} color={colors.primaryDark} />
                </View>
              </View>
              <View style={styles.passDivider} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View>
                  <Text style={styles.passLabel}>ID NO</Text>
                  <Text style={styles.passVal}>{pass.id_no}</Text>
                </View>
                <View>
                  <Text style={styles.passLabel}>RFID TAG</Text>
                  <Text style={styles.passVal}>{pass.rfid_tag}</Text>
                </View>
                <View>
                  <Text style={styles.passLabel}>VALID UNTIL</Text>
                  <Text style={styles.passVal}>{pass.valid_until}</Text>
                </View>
              </View>
            </LinearGradient>
          )}

          <Card style={{ marginTop: spacing.md, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <MaterialCommunityIcons name="contactless-payment" size={24} color={colors.primary} />
            <Text style={{ flex: 1, fontSize: 12, color: colors.textSecondary, lineHeight: 17 }}>
              Tap your RFID tag at any campus gate. QR is for visitor manual scan.
            </Text>
          </Card>
        </ScrollView>
      )}

      {tab === 'logs' && (
        <ScrollView contentContainerStyle={{ padding: spacing.md }}>
          {logs.map((l, i) => (
            <Card key={i} style={{ marginBottom: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <View style={[styles.logIcon, { backgroundColor: l.type === 'entry' ? '#10B98120' : '#EF444420' }]}>
                  <Ionicons
                    name={l.type === 'entry' ? 'log-in-outline' : 'log-out-outline'}
                    size={18}
                    color={l.type === 'entry' ? colors.success : colors.sos}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '700', color: colors.text }}>{l.name ?? `${l.type} at ${l.gate}`}</Text>
                  <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                    {l.gate} • {new Date(l.time).toLocaleString()}
                  </Text>
                </View>
                <Badge label={l.method} color={colors.primary} />
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
  passCard: { padding: spacing.lg, borderRadius: radii.xl, ...shadow.cardHeavy },
  passKicker: { fontSize: 11, fontWeight: '800', color: colors.gold, letterSpacing: 2 },
  passName: { fontSize: 22, fontWeight: '800', color: colors.white, marginTop: 4 },
  passMeta: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  qrBox: { padding: 6, backgroundColor: colors.white, borderRadius: 12 },
  passDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: spacing.md },
  passLabel: { fontSize: 9, color: 'rgba(255,255,255,0.7)', letterSpacing: 1.5, fontWeight: '700' },
  passVal: { fontSize: 12, color: colors.white, fontWeight: '700', marginTop: 2 },
  logIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
