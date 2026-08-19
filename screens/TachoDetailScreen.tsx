import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../lib/theme';
import { getTachos, delTacho } from '../lib/storage';
import { fmtDate, fmtDateTime } from '../lib/helpers';
import Card from '../components/Card';
import type { TachoRecord } from '../lib/types';

const modeColor: Record<string, string> = { driving: C.primary, other_work: C.orange, availability: C.info, rest: C.accent };
const modeLabel: Record<string, string> = { driving: 'Driving', other_work: 'Other Work', availability: 'Availability', rest: 'Rest' };

function DRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return <View style={dr.row}><Ionicons name={icon} size={17} color={C.textMut} /><View style={{ flex: 1 }}><Text style={dr.lbl}>{label}</Text><Text style={dr.val}>{value || 'Not set'}</Text></View></View>;
}
const dr = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 }, lbl: { fontSize: 11, color: C.textSec }, val: { fontSize: 15, fontWeight: '500', color: C.text } });

export default function TachoDetailScreen() {
  const nav = useNavigation<any>(); const route = useRoute<any>(); const { id: rid } = route.params;
  const [rec, setRec] = useState<TachoRecord | null>(null);
  useEffect(() => { (async () => { const r = await getTachos(); setRec(r.find(x => x.id === rid) || null); })(); }, [rid]);
  if (!rec) return <SafeAreaView style={styles.safe}><View style={styles.loading}><Text style={{ color: C.textSec }}>Loading\u2026</Text></View></SafeAreaView>;

  const mc = modeColor[rec.mode] || C.textMut;
  const handleDel = () => Alert.alert('Delete Record', 'Are you sure?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => { await delTacho(rid); nav.goBack(); } }]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color={C.text} /></TouchableOpacity>
        <Text style={styles.screenTitle}>Tacho Detail</Text>
        <TouchableOpacity onPress={handleDel}><Ionicons name="trash-outline" size={20} color={C.danger} /></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.modeBanner, { backgroundColor: mc + '12' }]}>
          <Ionicons name="speedometer" size={26} color={mc} />
          <Text style={[styles.modeLbl, { color: mc }]}>{modeLabel[rec.mode]}</Text>
        </View>
        <Card>
          <DRow icon="calendar" label="Date" value={fmtDate(rec.date)} />
          <View style={styles.div} />
          <DRow icon="car" label="Vehicle" value={rec.vehicleReg} />
          <View style={styles.div} />
          <DRow icon="person" label="Driver" value={rec.driverName} />
          <View style={styles.div} />
          <DRow icon="speedometer" label="Odometer" value={`${rec.startOdometer || '-'} \u2192 ${rec.endOdometer || '-'} km`} />
        </Card>
        {rec.notes ? <><Text style={styles.secTitle}>Notes</Text><Card><Text style={styles.notesTxt}>{rec.notes}</Text></Card></> : null}
        <View style={styles.actRow}>
          <TouchableOpacity style={[styles.actBtn, { backgroundColor: C.primary }]} onPress={() => nav.navigate('AddTachoRecord', { editId: rec.id })}>
            <Ionicons name="create" size={18} color="#FFF" /><Text style={styles.actBtnTxt}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actBtn, { backgroundColor: C.accent }]} onPress={() => Alert.alert('Export', 'PDF export available in future update.')}>
            <Ionicons name="download" size={18} color="#FFF" /><Text style={styles.actBtnTxt}>Export PDF</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.ts}>Created: {fmtDateTime(rec.createdAt)}</Text>
        <Text style={styles.ts}>Updated: {fmtDateTime(rec.updatedAt)}</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  headerBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { width: 40 },
  screenTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: C.text, textAlign: 'center' },
  content: { padding: 16 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modeBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, marginBottom: 16 },
  modeLbl: { fontSize: 20, fontWeight: '700' },
  div: { height: 1, backgroundColor: C.border },
  secTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginTop: 16, marginBottom: 10 },
  notesTxt: { fontSize: 15, color: C.text, lineHeight: 22 },
  actRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  actBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 14 },
  actBtnTxt: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  ts: { fontSize: 12, color: C.textMut, marginTop: 8, textAlign: 'center' },
});
