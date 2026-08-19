import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert, Modal, FlatList } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../lib/theme';
import { getInfs, delInf, saveInf } from '../lib/storage';
import { fmtDate, fmtTime, fmtDateTime } from '../lib/helpers';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import type { InfringementRecord } from '../lib/types';

function DRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={ds.row}>
      <Ionicons name={icon} size={17} color={C.textMut} />
      <View style={{ flex: 1 }}><Text style={ds.lbl}>{label}</Text><Text style={ds.val}>{value || 'Not provided'}</Text></View>
    </View>
  );
}
const ds = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 }, lbl: { fontSize: 11, color: C.textSec }, val: { fontSize: 15, fontWeight: '500', color: C.text } });

export default function InfringementDetailScreen() {
  const nav = useNavigation<any>(); const route = useRoute<any>(); const { id: rid } = route.params;
  const [rec, setRec] = useState<InfringementRecord | null>(null);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => { (async () => { const r = await getInfs(); setRec(r.find(x => x.id === rid) || null); })(); }, [rid]);

  if (!rec) return <SafeAreaView style={$.safe}><View style={$.loading}><Text style={{ color: C.textSec }}>Loading\u2026</Text></View></SafeAreaView>;

  const handleDel = () => Alert.alert('Delete Record', 'Are you sure?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => { await delInf(rid); nav.goBack(); } }]);
  const handleExport = async () => { await saveInf({ ...rec, status: 'exported', updatedAt: new Date().toISOString() }); setRec({ ...rec, status: 'exported' }); Alert.alert('Exported', 'Record marked as exported. PDF export available in future update.'); };

  const moreActions = [
    { icon: 'copy-outline' as const, label: 'Duplicate as New', color: C.purple, onPress: () => { setShowMore(false); nav.navigate('AddInfringement', {}); } },
    { icon: 'trash-outline' as const, label: 'Delete Record', color: C.danger, onPress: () => { setShowMore(false); handleDel(); } },
  ];

  return (
    <SafeAreaView style={$.safe}>
      {/* Header — Back, Title, Edit (primary), More (secondary) */}
      <View style={$.headerBar}>
        <TouchableOpacity onPress={() => nav.goBack()} style={$.backBtn}><Ionicons name="arrow-back" size={24} color={C.text} /></TouchableOpacity>
        <Text style={$.screenTitle}>Infringement Detail</Text>
        <View style={$.headerActions}>
          <TouchableOpacity style={$.headerEditBtn} onPress={() => nav.navigate('AddInfringement', { editId: rec.id })}>
            <Ionicons name="create-outline" size={18} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={$.headerMoreBtn} onPress={() => setShowMore(true)}>
            <Ionicons name="ellipsis-vertical" size={20} color={C.textSec} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={$.content} showsVerticalScrollIndicator={false}>
        <View style={$.topRow}><StatusBadge status={rec.status} /><Text style={$.created}>Created {fmtDateTime(rec.createdAt)}</Text></View>
        <Text style={$.typeTitle}>{rec.infringementType}</Text>
        <View style={$.disclaimer}>
          <Ionicons name="information-circle" size={15} color={C.info} />
          <Text style={$.disclaimerTxt}>Backup copy only \u2013 not a replacement for any legal original</Text>
        </View>

        <Card>
          <DRow icon="calendar" label="Date & Time" value={fmtDateTime(rec.dateTime)} />
          <View style={$.div} />
          <DRow icon="car" label="Vehicle Registration" value={rec.vehicleReg} />
          <View style={$.div} />
          <DRow icon="location" label="Location / Depot" value={rec.location} />
          <View style={$.div} />
          <DRow icon="person" label="Driver Name" value={rec.driverName} />
        </Card>

        {rec.description ? <><Text style={$.secTitle}>Driver\u2019s Description</Text><Card><Text style={$.descTxt}>{rec.description}</Text></Card></> : null}
        {rec.notes ? <><Text style={$.secTitle}>Additional Notes</Text><Card><Text style={$.descTxt}>{rec.notes}</Text></Card></> : null}

        {/* Evidence section — Export action placed here, next to the evidence it relates to */}
        <View style={$.evidHeader}>
          <Text style={$.secTitle}>Evidence</Text>
          <TouchableOpacity style={$.exportBtn} onPress={handleExport}>
            <Ionicons name="download-outline" size={16} color={C.accent} />
            <Text style={$.exportBtnTxt}>Export PDF</Text>
          </TouchableOpacity>
        </View>
        <View style={$.evidRow}>
          {[{ has: !!rec.signatureImage, label: 'Signature', c: C.success }, { has: !!rec.printoutPhoto, label: 'Photo', c: C.info }].map(e => (
            <View key={e.label} style={[$.evidCard, { backgroundColor: e.has ? e.c + '12' : C.card, borderColor: e.has ? e.c + '30' : C.border }]}>
              <Ionicons name={e.has ? 'checkmark-circle' : 'close-circle'} size={26} color={e.has ? e.c : C.textMut} />
              <Text style={[$.evidLabel, { color: e.has ? e.c : C.textMut }]}>{e.label}</Text>
              <Text style={$.evidStatus}>{e.has ? 'Captured' : 'Missing'}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* More actions menu */}
      <Modal visible={showMore} transparent animationType="fade">
        <TouchableOpacity style={$.moreOverlay} activeOpacity={1} onPress={() => setShowMore(false)}>
          <View style={$.moreSheet}>
            <View style={$.moreHandle} />
            <Text style={$.moreTitle}>More Actions</Text>
            {moreActions.map((a, i) => (
              <TouchableOpacity key={i} style={$.moreItem} onPress={a.onPress}>
                <Ionicons name={a.icon} size={20} color={a.color} />
                <Text style={[$.moreItemTxt, { color: a.color }]}>{a.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={$.moreCancelBtn} onPress={() => setShowMore(false)}>
              <Text style={$.moreCancelTxt}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const $ = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  headerBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  screenTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: C.text, textAlign: 'center' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerEditBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center' },
  headerMoreBtn: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  created: { fontSize: 12, color: C.textMut },
  typeTitle: { fontSize: 22, fontWeight: '800', color: C.text, marginBottom: 12 },
  disclaimer: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, backgroundColor: C.info + '08', borderWidth: 1, borderColor: C.info + '20', marginBottom: 16 },
  disclaimerTxt: { flex: 1, fontSize: 12, color: C.info },
  div: { height: 1, backgroundColor: C.border },
  secTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginTop: 16, marginBottom: 10 },
  descTxt: { fontSize: 15, color: C.text, lineHeight: 22 },
  // Evidence header with inline export action
  evidHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 10 },
  exportBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: C.accent + '40', minHeight: 44 },
  exportBtnTxt: { fontSize: 13, fontWeight: '600', color: C.accent },
  evidRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  evidCard: { flex: 1, alignItems: 'center', paddingVertical: 20, borderRadius: 16, borderWidth: 1, gap: 6 },
  evidLabel: { fontSize: 14, fontWeight: '600' },
  evidStatus: { fontSize: 12, color: C.textMut },
  // More menu
  moreOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  moreSheet: { backgroundColor: C.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingBottom: 40, paddingTop: 12 },
  moreHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 16 },
  moreTitle: { fontSize: 16, fontWeight: '700', color: C.text, paddingHorizontal: 20, marginBottom: 8 },
  moreItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16, paddingHorizontal: 20, minHeight: 52 },
  moreItemTxt: { fontSize: 16, fontWeight: '500' },
  moreCancelBtn: { alignItems: 'center', paddingVertical: 16, marginTop: 8, marginHorizontal: 20, borderRadius: 14, backgroundColor: C.elevated, minHeight: 50 },
  moreCancelTxt: { fontSize: 16, fontWeight: '600', color: C.textSec },
});
