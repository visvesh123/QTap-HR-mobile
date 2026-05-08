import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, Alert,
  KeyboardAvoidingView, Platform, Modal, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { api } from '../../src/api';
import { colors, radii, spacing } from '../../src/theme';
import { Card, Pill, Badge, ScreenHeader, PrimaryButton, Empty } from '../../src/ui';

export default function Visitor() {
  const router = useRouter();
  const [tab, setTab] = useState<'new' | 'list'>('new');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [purpose, setPurpose] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [list, setList] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showQr, setShowQr] = useState<any>(null);

  const load = async () => { try { setList(await api.visitorList()); } catch {} };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!name || !phone || !purpose) { Alert.alert('Missing', 'Fill all fields'); return; }
    setSubmitting(true);
    try {
      const res = await api.visitorRequest({
        visitor_name: name, visitor_phone: phone, purpose, visit_date: date,
      });
      setShowQr(res);
      setName(''); setPhone(''); setPurpose('');
      load();
    } catch (e: any) { Alert.alert('Error', e.message); }
    setSubmitting(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Visitor Management" subtitle="Pre-approval & QR pass" onBack={() => router.back()} />
      <View style={styles.tabs}>
        <Pill label="Pre-Approve" active={tab === 'new'} onPress={() => setTab('new')} testID="tab-vis-new" />
        <Pill label="My Approvals" active={tab === 'list'} onPress={() => setTab('list')} testID="tab-vis-list" />
      </View>

      {tab === 'new' && (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: spacing.md }}>
            <Card>
              <Text style={styles.label}>Visitor Name</Text>
              <TextInput value={name} onChangeText={setName} placeholder="Full name" placeholderTextColor={colors.textMuted} style={styles.input} testID="visitor-name" />
              <Text style={[styles.label, { marginTop: spacing.md }]}>Phone</Text>
              <TextInput value={phone} onChangeText={setPhone} placeholder="+91 9..." keyboardType="phone-pad" placeholderTextColor={colors.textMuted} style={styles.input} testID="visitor-phone" />
              <Text style={[styles.label, { marginTop: spacing.md }]}>Purpose</Text>
              <TextInput value={purpose} onChangeText={setPurpose} placeholder="Reason for visit" placeholderTextColor={colors.textMuted} style={styles.input} testID="visitor-purpose" />
              <Text style={[styles.label, { marginTop: spacing.md }]}>Date of Visit</Text>
              <TextInput value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textMuted} style={styles.input} testID="visitor-date" />
              <View style={styles.faceNote}>
                <MaterialCommunityIcons name="face-recognition" size={18} color={colors.gold} />
                <Text style={styles.faceText}>Face validation will be performed at gate during entry</Text>
              </View>
              <PrimaryButton label="Generate QR Pass" onPress={submit} loading={submitting} style={{ marginTop: spacing.md }} testID="visitor-submit" />
            </Card>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {tab === 'list' && (
        <ScrollView contentContainerStyle={{ padding: spacing.md }}>
          {list.length === 0 ? <Empty icon="people-outline" message="No visitor approvals yet" /> : list.map((v) => (
            <Card key={v.id} style={{ marginBottom: spacing.sm }} testID={`visitor-${v.id}`}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '700', color: colors.text }}>{v.visitor_name}</Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{v.purpose}</Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>{v.visit_date} • Host: {v.host_name}</Text>
                </View>
                <Badge label={v.status.toUpperCase()} color={v.status === 'approved' ? colors.success : colors.warning} />
              </View>
              <TouchableOpacity onPress={() => setShowQr(v)} style={styles.viewQr} testID={`view-qr-${v.id}`}>
                <Ionicons name="qr-code-outline" size={14} color={colors.primary} />
                <Text style={styles.viewQrText}>View QR</Text>
              </TouchableOpacity>
            </Card>
          ))}
        </ScrollView>
      )}

      <Modal visible={!!showQr} transparent animationType="slide" onRequestClose={() => setShowQr(null)}>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <TouchableOpacity onPress={() => setShowQr(null)} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalKicker}>VISITOR PASS</Text>
            <Text style={styles.modalTitle}>{showQr?.visitor_name}</Text>
            <Text style={styles.modalSub}>{showQr?.visit_date}</Text>
            <View style={styles.qrWrap}>
              {!!showQr && <QRCode value={showQr.qr_code ?? 'VISITOR'} size={200} color={colors.primaryDark} />}
            </View>
            <Text style={styles.modalNote}>Show this at security gate. Valid only for the date above.</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  tabs: { flexDirection: 'row', padding: spacing.md, gap: 8 },
  label: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, paddingHorizontal: 12, paddingVertical: 10, color: colors.text, fontSize: 14, backgroundColor: colors.white },
  faceNote: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.goldLight, padding: 10, borderRadius: radii.md, marginTop: spacing.md },
  faceText: { fontSize: 11, color: colors.gold, flex: 1, fontWeight: '600' },
  viewQr: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  viewQrText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, alignItems: 'center' },
  closeBtn: { position: 'absolute', top: 12, right: 12, width: 36, height: 36, borderRadius: 18, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  modalKicker: { fontSize: 11, fontWeight: '800', color: colors.gold, letterSpacing: 2 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 4 },
  modalSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  qrWrap: { padding: 12, backgroundColor: colors.white, borderRadius: 16, marginTop: spacing.md, borderWidth: 1, borderColor: colors.border },
  modalNote: { fontSize: 11, color: colors.textMuted, textAlign: 'center', marginTop: spacing.md, paddingHorizontal: spacing.md },
});
