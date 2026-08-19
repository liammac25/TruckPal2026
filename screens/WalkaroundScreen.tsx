import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, SafeAreaView } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../lib/theme';
import { getWalkarounds } from '../lib/storage';
import { fmtDate, fmtTime } from '../lib/helpers';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import type { WalkaroundCheck } from '../lib/types';

export default function WalkaroundScreen() {
  const nav = useNavigation<any>();
  const [checks, setChecks] = useState<WalkaroundCheck[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => setChecks(await getWalkarounds()), []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const typeLabel: Record<string, string> = { 'pre-trip': 'Pre-Trip', 'post-trip': 'Post-Trip', 'mid-journey': 'Mid-Journey' };
  const typeColor: Record<string, string> = { 'pre-trip': C.primary, 'post-trip': C.purple, 'mid-journey': C.orange };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.headerBar}>
        <TouchableOpacity onPress={() => nav.goBack()} style={s.backBtn}><Ionicons name="arrow-back" size={24} color={C.text} /></TouchableOpacity>
        <Text style={s.screenTitle}>Walkaround</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => nav.navigate('AddWalkaround')}>
          <Ionicons name="add" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Summary cards */}
      <View style={s.sumRow}>
        <View style={s.sumCard}>
          <Text style={[s.sumVal, { color: C.primary }]}>{checks.length}</Text>
          <Text style={s.sumLbl}>Total Checks</Text>
        </View>
        <View style={s.sumCard}>
          <Text style={[s.sumVal, { color: C.success }]}>{checks.filter(c => c.overallResult === 'pass').length}</Text>
          <Text style={s.sumLbl}>Passed</Text>
        </View>
        <View style={s.sumCard}>
          <Text style={[s.sumVal, { color: C.danger }]}>{checks.filter(c => c.overallResult === 'fail').length}</Text>
          <Text style={s.sumLbl}>Failed</Text>
        </View>
      </View>

      <FlatList
        data={checks}
        keyExtractor={i => i.id}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
        renderItem={({ item }) => {
          const tc = typeColor[item.checkType] || C.primary;
          const defectCount = item.defects.length;
          const hasPhotos = item.defects.some(d => d.photoUri);
          return (
            <Card onPress={() => nav.navigate('WalkaroundDetail', { id: item.id })}>
              <View style={s.checkRow}>
                <View style={[s.resultDot, { backgroundColor: item.overallResult === 'pass' ? C.success : C.danger }]} />
                <View style={{ flex: 1 }}>
                  <View style={s.checkHead}>
                    <Text style={s.checkDate}>{fmtDate(item.createdAt)}</Text>
                    <View style={[s.typeBadge, { backgroundColor: tc + '18' }]}>
                      <Text style={[s.typeTxt, { color: tc }]}>{typeLabel[item.checkType]}</Text>
                    </View>
                  </View>
                  <Text style={s.checkVeh}>{item.vehicleReg}</Text>
                  <View style={s.checkMeta}>
                    <View style={[s.resultBadge, { backgroundColor: (item.overallResult === 'pass' ? C.success : C.danger) + '18' }]}>
                      <Ionicons name={item.overallResult === 'pass' ? 'checkmark-circle' : 'close-circle'} size={14} color={item.overallResult === 'pass' ? C.success : C.danger} />
                      <Text style={[s.resultTxt, { color: item.overallResult === 'pass' ? C.success : C.danger }]}>
                        {item.overallResult === 'pass' ? 'Pass' : 'Fail'}
                      </Text>
                    </View>
                    {defectCount > 0 && (
                      <View style={[s.defectBadge, { backgroundColor: C.warn + '18' }]}>
                        <Ionicons name="alert-circle" size={13} color={C.warn} />
                        <Text style={[s.defectTxt, { color: C.warn }]}>{defectCount} defect{defectCount > 1 ? 's' : ''}</Text>
                      </View>
                    )}
                    {hasPhotos && (
                      <View style={[s.defectBadge, { backgroundColor: C.info + '18' }]}>
                        <Ionicons name="camera" size={13} color={C.info} />
                      </View>
                    )}
                    {item.syncStatus === 'pending' && (
                      <Ionicons name="cloud-offline-outline" size={14} color={C.textMut} style={{ marginLeft: 4 }} />
                    )}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color={C.textMut} />
              </View>
            </Card>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon="clipboard-outline"
            title="No Walkaround Checks"
            msg="Complete a daily walkaround check before starting your journey. Required by UK law for HGV drivers."
            action="Start Check"
            onAction={() => nav.navigate('AddWalkaround')}
          />
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  headerBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border, gap: 12 },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  screenTitle: { flex: 1, fontSize: 22, fontWeight: '800', color: C.text },
  addBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center' },
  sumRow: { flexDirection: 'row', gap: 10, padding: 16, paddingBottom: 4 },
  sumCard: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 14, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  sumVal: { fontSize: 22, fontWeight: '800' },
  sumLbl: { fontSize: 11, color: C.textSec, marginTop: 2 },
  list: { padding: 16, paddingTop: 8 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  resultDot: { width: 6, height: 44, borderRadius: 3 },
  checkHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  checkDate: { fontSize: 15, fontWeight: '600', color: C.text },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  typeTxt: { fontSize: 11, fontWeight: '600' },
  checkVeh: { fontSize: 13, color: C.textSec, marginBottom: 6 },
  checkMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resultBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  resultTxt: { fontSize: 11, fontWeight: '600' },
  defectBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  defectTxt: { fontSize: 11, fontWeight: '600' },
});
