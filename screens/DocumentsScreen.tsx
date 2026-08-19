import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, SafeAreaView } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../lib/theme';
import { getDocs } from '../lib/storage';
import { fmtDate, DOC_CATS } from '../lib/helpers';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import type { DocRecord } from '../lib/types';

const catIcon: Record<string, keyof typeof Ionicons.glyphMap> = { MOT: 'car', Insurance: 'shield-checkmark', Licence: 'id-card', CPC: 'school', 'Delivery Note': 'document', Invoice: 'receipt', Other: 'folder' };
const catColor: Record<string, string> = { MOT: C.primary, Insurance: C.success, Licence: C.info, CPC: C.purple, 'Delivery Note': C.orange, Invoice: C.warn, Other: C.textSec };

export default function DocumentsScreen() {
  const nav = useNavigation<any>();
  const [docs, setDocs] = useState<DocRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [folder, setFolder] = useState('All');

  const load = useCallback(async () => setDocs(await getDocs()), []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const folders = ['All', ...DOC_CATS];
  const filtered = folder === 'All' ? docs : docs.filter(d => d.category === folder);
  const count = (f: string) => f === 'All' ? docs.length : docs.filter(d => d.category === f).length;

  const isExpired = (d: string | null) => d ? new Date(d) < new Date() : false;
  const isExpiring = (d: string | null) => { if (!d) return false; const diff = new Date(d).getTime() - Date.now(); return diff > 0 && diff < 30 * 86400000; };

  return (
    <SafeAreaView style={$.safe}>
      <View style={$.headerBar}>
        <Text style={$.screenTitle}>Documents</Text>
        <TouchableOpacity style={$.addBtn} onPress={() => nav.navigate('AddDocument')}>
          <Ionicons name="add" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* ── Filter chips ── */}
      <View style={$.filterBar}>
        <FlatList
          horizontal
          data={folders}
          keyExtractor={i => i}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={$.filterScroll}
          renderItem={({ item }) => {
            const active = folder === item;
            const n = count(item);
            return (
              <TouchableOpacity
                style={[$.chip, active && $.chipActive]}
                onPress={() => setFolder(item)}
                activeOpacity={0.7}
              >
                <Text style={[$.chipTxt, active && $.chipTxtActive]}>{item}</Text>
                {n > 0 && (
                  <View style={[$.chipCount, active && $.chipCountActive]}>
                    <Text style={[$.chipCountTxt, active && $.chipCountTxtActive]}>{n}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* ── Document list ── */}
      <FlatList data={filtered} keyExtractor={i => i.id} contentContainerStyle={$.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
        renderItem={({ item }) => {
          const cc = catColor[item.category] || C.textMut;
          const exp = isExpired(item.expiryDate);
          const expSoon = isExpiring(item.expiryDate);
          return (
            <Card>
              <View style={$.docRow}>
                <View style={[$.docIcon, { backgroundColor: cc + '18' }]}><Ionicons name={catIcon[item.category] || 'document'} size={20} color={cc} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={$.docTitle}>{item.title}</Text>
                  <Text style={$.docCat}>{item.category}</Text>
                  {item.expiryDate && (
                    <View style={$.expiryRow}>
                      <Ionicons name={exp ? 'alert-circle' : expSoon ? 'warning' : 'calendar'} size={13} color={exp ? C.danger : expSoon ? C.warn : C.textMut} />
                      <Text style={[$.expiryTxt, { color: exp ? C.danger : expSoon ? C.warn : C.textMut }]}>{exp ? 'Expired: ' : expSoon ? 'Expiring: ' : 'Expires: '}{fmtDate(item.expiryDate)}</Text>
                    </View>
                  )}
                </View>
                <View style={$.docInds}>
                  {item.fileUri && <Ionicons name="document" size={15} color={C.textMut} />}
                  {item.photoUri && <Ionicons name="image" size={15} color={C.textMut} />}
                </View>
              </View>
            </Card>
          );
        }}
        ListEmptyComponent={<EmptyState icon="folder-open-outline" title="No Documents" msg="Store your MOT, insurance, licence, CPC and other work documents here." action="Add Document" onAction={() => nav.navigate('AddDocument')} />}
      />
    </SafeAreaView>
  );
}

const $ = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  headerBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  screenTitle: { fontSize: 22, fontWeight: '800', color: C.text },
  addBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center' },

  /* ── Filter bar ── */
  filterBar: {
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  filterScroll: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 36,
    paddingHorizontal: 16,
    paddingVertical: 0,
    borderRadius: 18,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: C.border,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  chipTxt: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textSec,
    lineHeight: 18,
  },
  chipTxtActive: {
    color: '#FFF',
  },
  chipCount: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: C.border,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  chipCountActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  chipCountTxt: {
    fontSize: 10,
    fontWeight: '700',
    color: C.textMut,
    lineHeight: 14,
  },
  chipCountTxtActive: {
    color: '#FFF',
  },

  /* ── List ── */
  list: { padding: 16, paddingTop: 8 },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  docIcon: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  docTitle: { fontSize: 15, fontWeight: '600', color: C.text, marginBottom: 2 },
  docCat: { fontSize: 13, color: C.textSec, marginBottom: 4 },
  expiryRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  expiryTxt: { fontSize: 12 },
  docInds: { flexDirection: 'row', gap: 8 },
});
