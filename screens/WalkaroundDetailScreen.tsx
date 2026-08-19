import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert, Modal, Dimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { C } from '../lib/theme';
import { getWalkarounds, delWalkaround } from '../lib/storage';
import { fmtDate, fmtDateTime, WALKAROUND_ITEMS } from '../lib/helpers';
import Card from '../components/Card';
import type { WalkaroundCheck } from '../lib/types';

const { width: SW } = Dimensions.get('window');
const sevColors: Record<string, string> = { minor: C.warn, major: C.orange, dangerous: C.danger };

export default function WalkaroundDetailScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { id: wid } = route.params;
  const [check, setCheck] = useState<WalkaroundCheck | null>(null);
  const [viewPhoto, setViewPhoto] = useState<string | null>(null);

  useEffect(() => { (async () => { const all = await getWalkarounds(); setCheck(all.find(c => c.id === wid) || null); })(); }, [wid]);

  if (!check) return <SafeAreaView style={s.safe}><View style={s.loading}><Text style={{ color: C.textSec }}>Loading…</Text></View></SafeAreaView>;

  const handleDelete = () => Alert.alert('Delete Check', 'Are you sure?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => { await delWalkaround(wid); nav.goBack(); } },
  ]);

  const failedItems = WALKAROUND_ITEMS.filter(i => check.items[i.key] === 'fail');
  const passedCount = Object.values(check.items).filter(v => v === 'pass').length;
  const totalChecked = Object.values(check.items).filter(v => v !== 'na').length;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.headerBar}>
        <TouchableOpacity onPress={() => nav.goBack()} style={s.backBtn}><Ionicons name="arrow-back" size={24} color={C.text} /></TouchableOpacity>
        <Text style={s.screenTitle}>Check Detail</Text>
        <TouchableOpacity onPress={handleDelete}><Ionicons name="trash-outline" size={20} color={C.danger} /></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Result banner */}
        <View style={[s.resultBanner, { backgroundColor: (check.overallResult === 'pass' ? C.success : C.danger) + '12' }]}>
          <Ionicons name={check.overallResult === 'pass' ? 'checkmark-circle' : 'close-circle'} size={32} color={check.overallResult === 'pass' ? C.success : C.danger} />
          <View>
            <Text style={[s.resultTitle, { color: check.overallResult === 'pass' ? C.success : C.danger }]}>
              {check.overallResult === 'pass' ? 'Vehicle Passed' : 'Defects Found'}
            </Text>
            <Text style={s.resultSub}>{passedCount}/{totalChecked} items passed</Text>
          </View>
          {check.syncStatus === 'pending' && (
            <View style={s.syncBadge}><Ionicons name="cloud-offline-outline" size={14} color={C.textMut} /><Text style={s.syncTxt}>Offline</Text></View>
          )}
        </View>

        <Card>
          <View style={s.detailRow}><Ionicons name="car" size={17} color={C.textMut} /><View style={{ flex: 1 }}><Text style={s.detLbl}>Vehicle</Text><Text style={s.detVal}>{check.vehicleReg}</Text></View></View>
          <View style={s.div} />
          <View style={s.detailRow}><Ionicons name="calendar" size={17} color={C.textMut} /><View style={{ flex: 1 }}><Text style={s.detLbl}>Date</Text><Text style={s.detVal}>{fmtDate(check.date)}</Text></View></View>
          <View style={s.div} />
          <View style={s.detailRow}><Ionicons name="clipboard" size={17} color={C.textMut} /><View style={{ flex: 1 }}><Text style={s.detLbl}>Check Type</Text><Text style={s.detVal}>{check.checkType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</Text></View></View>
        </Card>

        {/* Failed items */}
        {failedItems.length > 0 && (
          <><Text style={s.secTitle}>Failed Items ({failedItems.length})</Text>
          {failedItems.map(fi => (
            <Card key={fi.key}>
              <View style={s.failRow}>
                <Ionicons name="close-circle" size={18} color={C.danger} />
                <Text style={s.failLabel}>{fi.label}</Text>
                <Text style={s.failCat}>{fi.cat}</Text>
              </View>
            </Card>
          ))}</>
        )}

        {/* Defects with photos */}
        {check.defects.length > 0 && (
          <><Text style={s.secTitle}>Defects ({check.defects.length})</Text>
          {check.defects.map(d => (
            <Card key={d.id}>
              <View style={s.defRow}>
                {d.photoUri ? (
                  <TouchableOpacity onPress={() => setViewPhoto(d.photoUri)}>
                    <Image source={{ uri: d.photoUri }} style={s.defThumb} contentFit="cover" />
                    <View style={s.expandBadge}><Ionicons name="expand" size={10} color="#FFF" /></View>
                  </TouchableOpacity>
                ) : (
                  <View style={[s.defThumb, { justifyContent: 'center', alignItems: 'center', backgroundColor: C.elevated }]}>
                    <Ionicons name="image-outline" size={20} color={C.textMut} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <View style={s.defTopRow}>
                    <Text style={s.defCat}>{d.category}</Text>
                    <View style={[s.sevBadge, { backgroundColor: sevColors[d.severity] + '18' }]}>
                      <Text style={[s.sevTxt, { color: sevColors[d.severity] }]}>{d.severity}</Text>
                    </View>
                  </View>
                  <Text style={s.defDesc}>{d.description}</Text>
                </View>
              </View>
            </Card>
          ))}</>
        )}

        {check.notes ? <><Text style={s.secTitle}>Notes</Text><Card><Text style={s.notesTxt}>{check.notes}</Text></Card></> : null}

        <Text style={s.ts}>Created: {fmtDateTime(check.createdAt)}</Text>
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={!!viewPhoto} animationType="fade" transparent statusBarTranslucent>
        <View style={s.fullOverlay}>
          <SafeAreaView style={{ flex: 1 }}>
            <TouchableOpacity style={s.fullClose} onPress={() => setViewPhoto(null)}><Ionicons name="close" size={26} color="#FFF" /></TouchableOpacity>
            {viewPhoto && <View style={s.fullWrap}><Image source={{ uri: viewPhoto }} style={s.fullImg} contentFit="contain" /></View>}
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  headerBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { width: 40 },
  screenTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: C.text, textAlign: 'center' },
  content: { padding: 16 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  resultBanner: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: 16, marginBottom: 16 },
  resultTitle: { fontSize: 18, fontWeight: '700' },
  resultSub: { fontSize: 13, color: C.textSec, marginTop: 2 },
  syncBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.elevated, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginLeft: 'auto' },
  syncTxt: { fontSize: 11, color: C.textMut },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  detLbl: { fontSize: 11, color: C.textSec },
  detVal: { fontSize: 15, fontWeight: '500', color: C.text },
  div: { height: 1, backgroundColor: C.border },
  secTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginTop: 16, marginBottom: 10 },
  failRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  failLabel: { fontSize: 14, fontWeight: '600', color: C.text, flex: 1 },
  failCat: { fontSize: 12, color: C.textMut },
  defRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  defThumb: { width: 52, height: 52, borderRadius: 10, backgroundColor: C.elevated, position: 'relative' },
  expandBadge: { position: 'absolute', bottom: 2, right: 2, width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  defTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  defCat: { fontSize: 14, fontWeight: '600', color: C.text },
  sevBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  sevTxt: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  defDesc: { fontSize: 13, color: C.textSec },
  notesTxt: { fontSize: 15, color: C.text, lineHeight: 22 },
  ts: { fontSize: 12, color: C.textMut, marginTop: 12, textAlign: 'center' },
  fullOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' },
  fullClose: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', margin: 16, alignSelf: 'flex-end' },
  fullWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  fullImg: { width: SW - 32, height: '80%', borderRadius: 8 },
});
