import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { api } from '../../src/api';
import { colors, radii, spacing } from '../../src/theme';
import { Card, ScreenHeader, Badge, Empty, PrimaryButton } from '../../src/ui';

export default function Parcels() {
  const router = useRouter();
  const [list, setList] = useState<any[]>([]);
  const [pickup, setPickup] = useState<any>(null);

  const load = async () => { try { setList(await api.parcels()); } catch {} };
  useEffect(() => { load(); }, []);

  const collect = async (id: string) => {
    try {
      await api.collectParcel(id);
      Alert.alert('Collected', 'Parcel marked as collected');
      setPickup(null); load();
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Parcels" subtitle="Notifications & secure pickup" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}>
        {list.length === 0 ? <Empty icon="cube-outline" message="No parcels found" /> : list.map((p) => (
          <Card key={p.id} style={{ marginBottom: spacing.sm }} testID={`parcel-${p.id}`}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <View style={styles.parcelIcon}>
                <MaterialCommunityIcons name="package-variant-closed" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.courier}>{p.courier}</Text>
                  <Badge
                    label={p.status === 'ready' ? 'READY FOR PICKUP' : 'COLLECTED'}
                    color={p.status === 'ready' ? colors.warning : colors.success}
                  />
                </View>
                <Text style={styles.tracking}>#{p.tracking}</Text>
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
                  <Meta icon="cube-outline" text={p.weight} />
                  <Meta icon="time-outline" text={new Date(p.received_at).toLocaleDateString()} />
                </View>
                {p.status === 'ready' && (
                  <TouchableOpacity style={styles.pickupBtn} onPress={() => setPickup(p)} testID={`pickup-${p.id}`}>
                    <Ionicons name="qr-code-outline" size={14} color={colors.white} />
                    <Text style={styles.pickupText}>Get Pickup QR</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </Card>
        ))}
      </ScrollView>

      <Modal visible={!!pickup} transparent animationType="slide" onRequestClose={() => setPickup(null)}>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <TouchableOpacity onPress={() => setPickup(null)} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalKicker}>PICKUP VERIFICATION</Text>
            <Text style={styles.modalTitle}>{pickup?.courier}</Text>
            <Text style={styles.modalSub}>#{pickup?.tracking}</Text>
            <View style={styles.qrWrap}>
              {!!pickup && <QRCode value={`PARCEL|${pickup.id}|${pickup.tracking}`} size={200} color={colors.primaryDark} />}
            </View>
            <Text style={styles.modalNote}>Show at parcel desk. Verification staff will mark as collected.</Text>
            <PrimaryButton label="Mark as Collected" onPress={() => collect(pickup.id)} testID="collect-btn" style={{ marginTop: spacing.md, alignSelf: 'stretch' }} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const Meta = ({ icon, text }: any) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
    <Ionicons name={icon} size={12} color={colors.textSecondary} />
    <Text style={{ fontSize: 11, color: colors.textSecondary }}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  parcelIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center' },
  courier: { fontSize: 14, fontWeight: '700', color: colors.text },
  tracking: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  pickupBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, alignSelf: 'flex-start', marginTop: 8 },
  pickupText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, alignItems: 'center' },
  closeBtn: { position: 'absolute', top: 12, right: 12, width: 36, height: 36, borderRadius: 18, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  modalKicker: { fontSize: 11, fontWeight: '800', color: colors.gold, letterSpacing: 2 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 4 },
  modalSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  qrWrap: { padding: 12, backgroundColor: colors.white, borderRadius: 16, marginTop: spacing.md, borderWidth: 1, borderColor: colors.border },
  modalNote: { fontSize: 11, color: colors.textMuted, textAlign: 'center', marginTop: spacing.md },
});
