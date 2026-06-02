import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, Switch, Alert, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AdminShell } from '../../src/components/AdminShell';
import { Surface, SectionTitle, Pill, PrimaryButton, OutlineButton } from '../../src/components/admin-ui';
import { colors, radii, shadow } from '../../src/theme';
import { api } from '../../src/api';
import { useAuth } from '../../src/auth';

export default function AdminGeofences() {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const load = async () => {
    const r = await api.attendanceGeofences().catch(() => []);
    setItems(r);
  };

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'admin') { router.replace('/(tabs)'); return; }
    load();
  }, [user]);

  const startCreate = () => {
    setEditing({ name: '', address: '', lat: '17.5234', lon: '78.3941', radius_m: '300', type: 'office', active: true });
    setOpen(true);
  };
  const startEdit = (g: any) => {
    setEditing({ ...g, lat: String(g.lat), lon: String(g.lon), radius_m: String(g.radius_m) });
    setOpen(true);
  };
  const remove = async (g: any) => {
    const ok = Platform.OS === 'web'
      ? (typeof window !== 'undefined' && window.confirm ? window.confirm(`Delete "${g.name}"?`) : true)
      : true;
    if (!ok) return;
    await api.adminDeleteGeofence(g.id).catch(() => null);
    load();
  };
  const save = async () => {
    if (!editing?.name) return;
    const payload = {
      name: editing.name, address: editing.address,
      lat: parseFloat(editing.lat) || 0,
      lon: parseFloat(editing.lon) || 0,
      radius_m: parseInt(editing.radius_m, 10) || 0,
      type: editing.type, active: !!editing.active,
    };
    if (editing.id && !editing.id.startsWith('new-')) {
      await api.adminUpdateGeofence(editing.id, payload).catch(() => null);
    } else {
      await api.adminCreateGeofence(payload).catch(() => null);
    }
    setOpen(false);
    setEditing(null);
    load();
  };

  return (
    <AdminShell title="Geofence Configuration" subtitle={`${items.length} zone${items.length === 1 ? '' : 's'} configured`}>
      <Surface>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <MaterialCommunityIcons name="information-outline" size={18} color={colors.primary} />
            <Text style={styles.info}>
              Employees can only check-in when their device GPS is inside one of these radii.
            </Text>
          </View>
          <PrimaryButton label="New Geofence" icon="plus" onPress={startCreate} testID="new-fence" />
        </View>
      </Surface>

      <View style={styles.grid}>
        {items.map((g) => (
          <Surface key={g.id} style={{ width: '32%', minWidth: 280 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.fenceIcon, { backgroundColor: g.type === 'wfh' ? '#DBEAFE' : `${colors.primary}15` }]}>
                <MaterialCommunityIcons
                  name={g.type === 'wfh' ? 'home-outline' : g.type === 'branch' ? 'office-building-outline' : 'school-outline'}
                  size={20} color={g.type === 'wfh' ? colors.info : colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{g.name}</Text>
                <Text style={styles.addr} numberOfLines={1}>{g.address}</Text>
              </View>
              <Pill label={g.active ? 'Active' : 'Inactive'} color={g.active ? '#16A34A' : '#94A3B8'} />
            </View>
            <View style={styles.detRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.statLabel}>Type</Text>
                <Text style={styles.statValue}>{(g.type || 'office').toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.statLabel}>Radius</Text>
                <Text style={styles.statValue}>{g.type === 'wfh' ? '—' : `${g.radius_m} m`}</Text>
              </View>
              <View style={{ flex: 1.4 }}>
                <Text style={styles.statLabel}>Coordinates</Text>
                <Text style={styles.statValue} numberOfLines={1}>{g.lat?.toFixed(4)}, {g.lon?.toFixed(4)}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <OutlineButton label="Edit" icon="pencil-outline" onPress={() => startEdit(g)} testID={`edit-${g.id}`} />
              <TouchableOpacity onPress={() => remove(g)} style={styles.delBtn} testID={`del-${g.id}`}>
                <Ionicons name="trash-outline" size={16} color={colors.sos} />
                <Text style={styles.delBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </Surface>
        ))}
      </View>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalRoot}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>{editing?.id ? 'Edit Geofence' : 'New Geofence'}</Text>
              <TouchableOpacity onPress={() => setOpen(false)} testID="modal-close">
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Field label="Name" value={editing?.name} onChange={(v: string) => setEditing({ ...editing, name: v })} testID="fence-name" />
            <Field label="Address" value={editing?.address} onChange={(v: string) => setEditing({ ...editing, address: v })} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}><Field label="Latitude" value={editing?.lat} onChange={(v: string) => setEditing({ ...editing, lat: v })} /></View>
              <View style={{ flex: 1 }}><Field label="Longitude" value={editing?.lon} onChange={(v: string) => setEditing({ ...editing, lon: v })} /></View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Type</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {['office', 'branch', 'client', 'wfh'].map((t) => (
                    <TouchableOpacity
                      key={t}
                      onPress={() => setEditing({ ...editing, type: t })}
                      style={[styles.tchip, editing?.type === t && styles.tchipActive]}
                    >
                      <Text style={[styles.tchipText, editing?.type === t && { color: colors.white }]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={{ flex: 1 }}><Field label="Radius (m)" value={editing?.radius_m} onChange={(v: string) => setEditing({ ...editing, radius_m: v })} /></View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 }}>
              <Switch value={!!editing?.active} onValueChange={(v) => setEditing({ ...editing, active: v })} />
              <Text style={{ color: colors.text, fontSize: 13 }}>Active</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <OutlineButton label="Cancel" onPress={() => setOpen(false)} />
              <PrimaryButton label="Save" icon="content-save" onPress={save} testID="fence-save" />
            </View>
          </View>
        </View>
      </Modal>
    </AdminShell>
  );
}

const Field = ({ label, value, onChange, testID }: any) => (
  <View style={{ marginTop: 10 }}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChange}
      style={styles.fieldInput}
      placeholderTextColor={colors.textMuted}
      testID={testID}
    />
  </View>
);

const styles = StyleSheet.create({
  info: { color: colors.textSecondary, fontSize: 12, fontWeight: '500' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 16 },
  fenceIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 15, fontWeight: '800', color: colors.text },
  addr: { fontSize: 11, color: colors.textMuted },
  detRow: { flexDirection: 'row', gap: 10, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  statLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '700', letterSpacing: 1 },
  statValue: { fontSize: 12, color: colors.text, fontWeight: '700', marginTop: 2 },
  delBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: colors.sos,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: radii.md,
  },
  delBtnText: { color: colors.sos, fontWeight: '700', fontSize: 13 },
  modalRoot: { flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 520, backgroundColor: colors.surface, borderRadius: radii.xl, padding: 24, ...shadow.cardHeavy },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  fieldLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  fieldInput: {
    backgroundColor: colors.background, borderRadius: radii.md,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: colors.text,
    outlineStyle: 'none' as any,
  },
  tchip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  tchipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tchipText: { fontSize: 11, color: colors.textSecondary, fontWeight: '700', textTransform: 'uppercase' },
});
