import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { api } from '../../src/api';
import { colors, radii, spacing, shadow } from '../../src/theme';
import { ScreenHeader } from '../../src/ui';
import { STATUS_COLOR, PRIORITY_COLOR, fmtDateTime } from './tickets';

export default function TicketDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try { setTicket(await api.ticketDetail(String(id))); } catch {}
    setLoading(false);
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const isClosed = ticket?.status === 'Closed';

  const send = async () => {
    if (!reply.trim()) return;
    setBusy(true);
    try { await api.addTicketComment(ticket.id, reply.trim()); setReply(''); await load(); }
    catch (e: any) { Alert.alert('Could not send', e.message || 'Try again.'); }
    finally { setBusy(false); }
  };

  const reopen = async () => {
    setBusy(true);
    try { await api.reopenTicket(ticket.id); await load(); Alert.alert('Reopened', 'This ticket has been reopened.'); }
    catch (e: any) { Alert.alert('Could not reopen', e.message || 'Try again.'); }
    finally { setBusy(false); }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader title="Ticket" onBack={() => router.back()} />
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      </SafeAreaView>
    );
  }
  if (!ticket) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader title="Ticket" onBack={() => router.back()} />
        <Text style={{ textAlign: 'center', marginTop: spacing.xl, color: colors.textSecondary }}>Ticket not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title={ticket.ticket_no}
        subtitle={ticket.subject}
        onBack={() => router.back()}
        right={
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {!!ticket.priority && (
              <View style={[styles.tag, { backgroundColor: `${PRIORITY_COLOR[ticket.priority] || colors.textMuted}1A` }]}>
                <Text style={[styles.tagText, { color: PRIORITY_COLOR[ticket.priority] || colors.textMuted }]}>{ticket.priority}</Text>
              </View>
            )}
            <View style={[styles.tag, { backgroundColor: `${STATUS_COLOR[ticket.status] || colors.textMuted}1A` }]}>
              <Text style={[styles.tagText, { color: STATUS_COLOR[ticket.status] || colors.textMuted }]}>{ticket.status}</Text>
            </View>
          </View>
        }
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}>
          {/* Conversation */}
          <Text style={styles.sectionTitle}>Conversation</Text>
          <View style={styles.card}>
            {(ticket.messages || []).map((m: any) => (
              m.author_type === 'transfer' ? (
                <View key={m.id} style={styles.transferRow}>
                  <View style={styles.transferLine} />
                  <View style={styles.transferPill}>
                    <MaterialCommunityIcons name="swap-horizontal" size={13} color={colors.steel600} />
                    <Text style={styles.transferText}>{m.from} → {m.to}</Text>
                  </View>
                  <View style={styles.transferLine} />
                </View>
              ) : (
                <View key={m.id} style={[styles.msgRow, m.author_type === 'requester' && styles.msgRowMine]}>
                  <View style={[styles.msgAvatar, m.author_type === 'requester' ? styles.avatarMine : styles.avatarDept]}>
                    <Text style={styles.msgAvatarText}>
                      {m.author_type === 'requester' ? 'ME' : String(m.author || '?').split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase()}
                    </Text>
                  </View>
                  <View style={[styles.msgBubble, m.author_type === 'requester' && styles.bubbleMine]}>
                    <Text style={[styles.msgAuthor, m.author_type === 'requester' && { color: 'rgba(255,255,255,0.85)' }]}>{m.author}</Text>
                    <Text style={[styles.msgText, m.author_type === 'requester' && { color: colors.white }]}>{m.text}</Text>
                    <Text style={[styles.msgTime, m.author_type === 'requester' && { color: 'rgba(255,255,255,0.7)' }]}>{fmtDateTime(m.at)}</Text>
                  </View>
                </View>
              )
            ))}
          </View>

          {/* Activity */}
          <Text style={styles.sectionTitle}>Activity</Text>
          <View style={styles.card}>
            <Text style={styles.journeyLabel}>Department Journey</Text>
            <View style={styles.journeyRow}>
              {(ticket.journey || []).map((j: string, i: number) => (
                <React.Fragment key={`${j}-${i}`}>
                  {i > 0 && <Ionicons name="arrow-forward" size={12} color={colors.textMuted} />}
                  <View style={styles.journeyChip}><Text style={styles.journeyChipText}>{j}</Text></View>
                </React.Fragment>
              ))}
            </View>

            <View style={{ marginTop: spacing.md }}>
              {(ticket.activity || []).map((a: any, i: number) => (
                <View key={a.id} style={styles.actRow}>
                  <View style={styles.actLineWrap}>
                    <View style={[styles.actDot, { backgroundColor: ACT_COLOR[a.type] || colors.steel400 }]} />
                    {i < ticket.activity.length - 1 && <View style={styles.actLine} />}
                  </View>
                  <View style={{ flex: 1, paddingBottom: spacing.md }}>
                    <Text style={styles.actLabel}>{a.label}</Text>
                    {!!a.note && <Text style={styles.actNote}>“{a.note}”</Text>}
                    <Text style={styles.actTime}>{fmtDateTime(a.at)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Properties */}
          <Text style={styles.sectionTitle}>Properties</Text>
          <View style={styles.card}>
            <PropRow label="Ticket #" value={ticket.ticket_no} />
            <PropRow label="Department" value={ticket.department} />
            <PropRow label="Channel" value={ticket.channel} />
            <PropRow label="Created" value={fmtDateTime(ticket.created_at)} />
            <PropRow label="Updated" value={fmtDateTime(ticket.updated_at)} last />
          </View>
        </ScrollView>

        {/* Footer: reopen (closed) or reply (open) */}
        {isClosed ? (
          <View style={styles.footer}>
            <View style={styles.lockedNote}>
              <Ionicons name="lock-closed" size={14} color={colors.textMuted} />
              <Text style={styles.lockedText}>This ticket is closed (read-only archive).</Text>
            </View>
            <TouchableOpacity style={[styles.reopenBtn, busy && { opacity: 0.7 }]} onPress={reopen} disabled={busy} activeOpacity={0.9} testID="ticket-reopen-btn">
              {busy ? <ActivityIndicator color={colors.white} /> : (
                <>
                  <Ionicons name="refresh" size={16} color={colors.white} />
                  <Text style={styles.reopenText}>Reopen Ticket</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.replyBar}>
            <TextInput
              style={styles.replyInput}
              value={reply}
              onChangeText={setReply}
              placeholder="Write a reply…"
              placeholderTextColor={colors.textMuted}
              testID="ticket-reply-input"
            />
            <TouchableOpacity style={styles.sendBtn} onPress={send} disabled={busy} activeOpacity={0.85} testID="ticket-send-btn">
              {busy ? <ActivityIndicator color={colors.white} size="small" /> : <Ionicons name="send" size={18} color={colors.white} />}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const ACT_COLOR: Record<string, string> = {
  created: '#3B82F6', status: '#F59E0B', comment: '#16A34A', transfer: '#7C3AED',
};

function PropRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.propRow, !last && styles.propRowBorder]}>
      <Text style={styles.propLabel}>{label}</Text>
      <Text style={styles.propValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', color: colors.textSecondary, marginTop: spacing.md, marginBottom: spacing.sm },
  card: { backgroundColor: colors.white, borderRadius: 22, padding: spacing.md, ...shadow.card },

  tag: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  tagText: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.3 },

  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: spacing.md },
  msgRowMine: { flexDirection: 'row-reverse' },
  msgAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarMine: { backgroundColor: colors.primary },
  avatarDept: { backgroundColor: colors.steel500 },
  msgAvatarText: { color: colors.white, fontWeight: '800', fontSize: 11 },
  msgBubble: { maxWidth: '78%', backgroundColor: colors.steel50, borderRadius: 14, padding: 10 },
  bubbleMine: { backgroundColor: colors.primary },
  msgAuthor: { fontSize: 11, fontWeight: '800', color: colors.steel600, marginBottom: 2 },
  msgText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  msgTime: { fontSize: 10, color: colors.textMuted, marginTop: 4 },

  transferRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md },
  transferLine: { flex: 1, height: 1, backgroundColor: colors.divider },
  transferPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.steel50, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  transferText: { fontSize: 10.5, fontWeight: '800', color: colors.steel600, letterSpacing: 0.3 },

  journeyLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 8 },
  journeyRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  journeyChip: { backgroundColor: colors.steel50, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  journeyChipText: { fontSize: 11.5, fontWeight: '700', color: colors.steel700 },

  actRow: { flexDirection: 'row', gap: 10 },
  actLineWrap: { alignItems: 'center', width: 16 },
  actDot: { width: 11, height: 11, borderRadius: 6, marginTop: 3 },
  actLine: { flex: 1, width: 2, backgroundColor: colors.divider, marginTop: 2 },
  actLabel: { fontSize: 13.5, fontWeight: '600', color: colors.text },
  actNote: { fontSize: 12.5, fontStyle: 'italic', color: colors.steel600, marginTop: 3 },
  actTime: { fontSize: 11, color: colors.textMuted, marginTop: 3 },

  propRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 11 },
  propRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  propLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  propValue: { fontSize: 13, color: colors.text, fontWeight: '700', flexShrink: 1, textAlign: 'right', marginLeft: spacing.md },

  footer: { padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.white, gap: spacing.sm },
  lockedNote: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' },
  lockedText: { fontSize: 12, color: colors.textMuted },
  reopenBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 16 },
  reopenText: { color: colors.white, fontSize: 15, fontWeight: '800' },

  replyBar: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: spacing.sm, paddingHorizontal: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.white },
  replyInput: { flex: 1, height: 50, backgroundColor: '#F2F3F5', borderRadius: 16, paddingHorizontal: 16, fontSize: 15, color: colors.text },
  sendBtn: { width: 50, height: 50, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
