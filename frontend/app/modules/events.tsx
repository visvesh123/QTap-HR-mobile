import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { api } from '../../src/api';
import { colors, radii, shadow, spacing } from '../../src/theme';
import { Card, Pill, Badge, ScreenHeader, Empty } from '../../src/ui';

export default function Events() {
  const router = useRouter();
  const [tab, setTab] = useState<'browse' | 'mine'>('browse');
  const [events, setEvents] = useState<any[]>([]);
  const [regs, setRegs] = useState<any[]>([]);

  const load = async () => {
    try {
      const [e, r] = await Promise.all([api.events(), api.myRegistrations()]);
      setEvents(e); setRegs(r);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const register = async (id: string) => {
    try {
      await api.registerEvent(id);
      Alert.alert('Registered', 'You are now registered. Check email for confirmation.');
      load();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const isReg = (id: string) => regs.some((r) => r.event_id === id);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Events & Clubs" subtitle="Browse & register" onBack={() => router.back()} />
      <View style={styles.tabs}>
        <Pill label="All Events" active={tab === 'browse'} onPress={() => setTab('browse')} testID="tab-events-browse" />
        <Pill label="My Registrations" active={tab === 'mine'} onPress={() => setTab('mine')} testID="tab-events-mine" />
      </View>

      {tab === 'browse' && (
        <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}>
          {events.map((e) => (
            <Card key={e.id} style={{ padding: 0, marginBottom: spacing.md, overflow: 'hidden' }} testID={`event-${e.id}`}>
              <Image source={{ uri: e.image }} style={{ width: '100%', height: 140 }} />
              <View style={{ padding: spacing.md }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Badge label={e.category} color={colors.primary} />
                  <Text style={styles.date}>{e.date}</Text>
                </View>
                <Text style={styles.eventTitle}>{e.title}</Text>
                <Text style={styles.eventDesc} numberOfLines={2}>{e.description}</Text>
                <View style={styles.metaRow}>
                  <Meta icon="location-outline" text={e.venue} />
                  <Meta icon="people-outline" text={`${e.registered} going`} />
                </View>
                <View style={{ marginTop: spacing.sm, flexDirection: 'row', justifyContent: 'flex-end' }}>
                  <TouchableOpacity
                    onPress={() => register(e.id)}
                    disabled={isReg(e.id)}
                    style={[styles.regBtn, { opacity: isReg(e.id) ? 0.5 : 1, backgroundColor: isReg(e.id) ? colors.success : colors.primary }]}
                    testID={`register-${e.id}`}
                  >
                    <Ionicons name={isReg(e.id) ? 'checkmark' : 'add'} size={14} color={colors.white} />
                    <Text style={styles.regText}>{isReg(e.id) ? 'Registered' : 'Register'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          ))}
        </ScrollView>
      )}

      {tab === 'mine' && (
        <ScrollView contentContainerStyle={{ padding: spacing.md }}>
          {regs.length === 0 ? <Empty icon="calendar-outline" message="No registrations yet" /> : regs.map((r) => (
            <Card key={r.id} style={{ marginBottom: spacing.sm }}>
              <Text style={{ fontWeight: '700', color: colors.text }}>{r.event_title}</Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>Registered: {new Date(r.registered_at).toLocaleDateString()}</Text>
              <Badge label="CONFIRMED" color={colors.success} />
            </Card>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const Meta = ({ icon, text }: any) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
    <Ionicons name={icon} size={13} color={colors.textSecondary} />
    <Text style={{ fontSize: 12, color: colors.textSecondary }}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  tabs: { flexDirection: 'row', padding: spacing.md, gap: 8 },
  date: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  eventTitle: { fontSize: 17, fontWeight: '800', color: colors.text, marginTop: 8 },
  eventDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 4, lineHeight: 18 },
  metaRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  regBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  regText: { color: colors.white, fontWeight: '700', fontSize: 12 },
});
