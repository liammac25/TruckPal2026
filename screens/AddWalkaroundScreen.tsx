import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert, Modal, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { C } from '../lib/theme';
import { saveWalkaround, id, getUser, getVehicle } from '../lib/storage';
import { today, WALKAROUND_ITEMS, WALKAROUND_CATEGORIES, DEFECT_CATEGORIES } from '../lib/helpers';
import FormInput from '../components/FormInput';
import PickerSelect from '../components/PickerSelect';
import Card from '../components/Card';
import type { WalkaroundCheck, WalkaroundDefect } from '../lib/types';

const { width: SW } = Dimensions.get('window');

export default function AddWalkaroundScreen() {
  const nav = useNavigation<any>();
  const [vehicleReg, setVehicleReg] = useState('');
  const [checkType, setCheckType] = useState<'pre-trip' | 'post-trip' | 'mid-journey'>('pre-trip');
  const [items, setItems] = useState<Record<string, 'pass' | 'fail' | 'na'>>({});
  const [defects, setDefects] = useState<WalkaroundDefect[]>([]);
  const [notes, setNotes] = useState('');
  const [showDefectForm, setShowDefectForm] = useState(false);
  const [defCat, setDefCat] = useState('');
  const [defDesc, setDefDesc] = useState('');
  const [defSev, setDefSev] = useState<'minor' | 'major' | 'dangerous'>('minor');
  const [defPhoto, setDefPhoto] = useState<string | null>(null);
  const [viewPhoto, setViewPhoto] = useState<string | null>(null);
  const [expandedCat, setExpandedCat] = useState<string | null>(WALKAROUND_CATEGORIES[0]);

  useEffect(() => {
    (async () => {
      const veh = await getVehicle();
      if (veh?.registration) setVehicleReg(veh.registration);
      const init: Record<string, 'pass' | 'fail' | 'na'> = {};
      WALKAROUND_ITEMS.forEach(i => { init[i.key] = 'pass'; });
      setItems(init);
    })();
  }, []);

  const setItemStatus = (key: string, val: 'pass' | 'fail' | 'na') => {
    setItems(prev => ({ ...prev, [key]: val }));
  };

  const takeDefectPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Camera access is required to photograph defects.'); return; }
    const r = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true });
    if (!r.canceled && r.assets[0]) setDefPhoto(r.assets[0].uri);
  };

  const pickDefectPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Gallery access is required.'); return; }
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true });
    if (!r.canceled && r.assets[0]) setDefPhoto(r.assets[0].uri);
  };

  const addDefect = () => {
    if (!defCat) { Alert.alert('Required', 'Select a defect category.'); return; }
    if (!defDesc.trim()) { Alert.alert('Required', 'Describe the defect.'); return; }
    const d: WalkaroundDefect = { id: id(), category: defCat, description: defDesc, severity: defSev, photoUri: defPhoto, photoUploadStatus: defPhoto ? 'pending' : null };
    setDefects(prev => [...prev, d]);
    setDefCat(''); setDefDesc(''); setDefSev('minor'); setDefPhoto(null); setShowDefectForm(false);
  };

  const removeDefect = (did: string) => setDefects(prev => prev.filter(d => d.id !== did));

  const handleSave = async () => {
    if (!vehicleReg.trim()) { Alert.alert('Required', 'Enter the vehicle registration.'); return; }
    const failedItems = Object.values(items).filter(v => v === 'fail').length;
    const overallResult = (failedItems > 0 || defects.length > 0) ? 'fail' : 'pass';
    const user = await getUser();
    const check: WalkaroundCheck = {
      id: id(), userId: user?.id || '', vehicleReg: vehicleReg.toUpperCase(),
      date: today(), checkType, items, defects, overallResult,
      signatureData: null, notes,
      createdAt: new Date().toISOString(), syncStatus: 'pending',
    };
    await saveWalkaround(check);
    Alert.alert(
      overallResult === 'pass' ? 'Check Passed ✓' : 'Check Completed — Defects Found',
      overallResult === 'pass'
        ? 'Walkaround check saved. Vehicle is roadworthy.'
        : `Walkaround saved with ${defects.length} defect(s). Review before driving.\nSaved offline — will sync later.`,
      [{ text: 'OK', onPress: () => nav.goBack() }]
    );
  };

  const sevColors: Record<string, string> = { minor: C.warn, major: C.orange, dangerous: C.danger };
  const typeLabels: Record<string, string> = { 'pre-trip': 'Pre-Trip', 'post-trip': 'Post-Trip', 'mid-journey': 'Mid-Journey' };

  return (
    <SafeAreaView style={st.safe}>
      <View style={st.headerBar}>
        <TouchableOpacity onPress={() => nav.goBack()} style={st.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={st.screenTitle}>Walkaround Check</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        {/* Vehicle & Type */}
        <FormInput label="Vehicle Registration" value={vehicleReg} onChangeText={t => setVehicleReg(t.toUpperCase())} placeholder="AB12 CDE" icon="car-outline" autoCapitalize="characters" />
        <PickerSelect label="Check Type" value={typeLabels[checkType]} options={Object.values(typeLabels)} onSelect={v => { const k = Object.entries(typeLabels).find(([, l]) => l === v)?.[0] as any || 'pre-trip'; setCheckType(k); }} icon="clipboard-outline" />

        {/* Checklist */}
        <Text style={st.secTitle}>Checklist</Text>
        {WALKAROUND_CATEGORIES.map(cat => {
          const catItems = WALKAROUND_ITEMS.filter(i => i.cat === cat);
          const isExpanded = expandedCat === cat;
          const allPass = catItems.every(i => items[i.key] === 'pass');
          const hasFail = catItems.some(i => items[i.key] === 'fail');
          return (
            <View key={cat} style={st.catSection}>
              <TouchableOpacity style={st.catHeader} onPress={() => setExpandedCat(isExpanded ? null : cat)}>
                <View style={st.catLeft}>
                  <View style={[st.catDot, { backgroundColor: hasFail ? C.danger : allPass ? C.success : C.textMut }]} />
                  <Text style={st.catName}>{cat}</Text>
                  <Text style={st.catCount}>{catItems.length}</Text>
                </View>
                <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={C.textMut} />
              </TouchableOpacity>
              {isExpanded && catItems.map(item => (
                <View key={item.key} style={st.checkItem}>
                  <Text style={st.checkLabel}>{item.label}</Text>
                  <View style={st.checkBtns}>
                    {(['pass', 'fail', 'na'] as const).map(val => {
                      const active = items[item.key] === val;
                      const bg = val === 'pass' ? C.success : val === 'fail' ? C.danger : C.textMut;
                      return (
                        <TouchableOpacity key={val} style={[st.checkBtn, active && { backgroundColor: bg + '25', borderColor: bg }]} onPress={() => setItemStatus(item.key, val)}>
                          <Ionicons name={val === 'pass' ? 'checkmark' : val === 'fail' ? 'close' : 'remove'} size={16} color={active ? bg : C.textMut} />
                          <Text style={[st.checkBtnTxt, active && { color: bg }]}>{val === 'na' ? 'N/A' : val === 'pass' ? 'OK' : 'Fail'}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          );
        })}

        {/* Defects */}
        <View style={st.defHeader}>
          <Text style={st.secTitle}>Defects ({defects.length})</Text>
          <TouchableOpacity style={st.addDefBtn} onPress={() => setShowDefectForm(true)}>
            <Ionicons name="add" size={18} color="#FFF" />
            <Text style={st.addDefTxt}>Add Defect</Text>
          </TouchableOpacity>
        </View>

        {defects.map(d => (
          <Card key={d.id}>
            <View style={st.defRow}>
              {d.photoUri ? (
                <TouchableOpacity onPress={() => setViewPhoto(d.photoUri)}>
                  <Image source={{ uri: d.photoUri }} style={st.defThumb} contentFit="cover" />
                </TouchableOpacity>
              ) : (
                <View style={[st.defThumb, { justifyContent: 'center', alignItems: 'center', backgroundColor: C.elevated }]}>
                  <Ionicons name="image-outline" size={20} color={C.textMut} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <View style={st.defTopRow}>
                  <Text style={st.defCat}>{d.category}</Text>
                  <View style={[st.sevBadge, { backgroundColor: sevColors[d.severity] + '18' }]}>
                    <Text style={[st.sevTxt, { color: sevColors[d.severity] }]}>{d.severity}</Text>
                  </View>
                </View>
                <Text style={st.defDescTxt}>{d.description}</Text>
              </View>
              <TouchableOpacity onPress={() => removeDefect(d.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="trash-outline" size={18} color={C.danger} />
              </TouchableOpacity>
            </View>
          </Card>
        ))}

        {/* Notes */}
        <FormInput label="Notes (optional)" value={notes} onChangeText={setNotes} placeholder="Any additional observations…" multiline numberOfLines={3} icon="create-outline" />

        {/* Save */}
        <TouchableOpacity style={st.saveBtn} onPress={handleSave}>
          <Ionicons name="checkmark-circle" size={20} color="#FFF" />
          <Text style={st.saveBtnTxt}>Complete Check</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add Defect Modal */}
      <Modal visible={showDefectForm} animationType="slide" transparent>
        <View style={st.modalOverlay}>
          <SafeAreaView style={st.modalContent}>
            <View style={st.modalHead}>
              <Text style={st.modalTitle}>Add Defect</Text>
              <TouchableOpacity onPress={() => { setShowDefectForm(false); setDefPhoto(null); }}>
                <Ionicons name="close" size={26} color={C.textSec} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
              <PickerSelect label="Defect Category" value={defCat} options={DEFECT_CATEGORIES} onSelect={setDefCat} icon="alert-circle-outline" />
              <FormInput label="Description" value={defDesc} onChangeText={setDefDesc} placeholder="Describe the defect…" multiline numberOfLines={3} icon="create-outline" />
              <Text style={st.fieldLabel}>Severity</Text>
              <View style={st.sevRow}>
                {(['minor', 'major', 'dangerous'] as const).map(sv => (
                  <TouchableOpacity key={sv} style={[st.sevBtn, defSev === sv && { backgroundColor: sevColors[sv] + '20', borderColor: sevColors[sv] }]} onPress={() => setDefSev(sv)}>
                    <Text style={[st.sevBtnTxt, defSev === sv && { color: sevColors[sv] }]}>{sv.charAt(0).toUpperCase() + sv.slice(1)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={st.fieldLabel}>Photo Evidence</Text>
              {defPhoto ? (
                <View style={st.photoPreview}>
                  <Image source={{ uri: defPhoto }} style={st.photoImg} contentFit="cover" />
                  <View style={st.photoActions}>
                    <TouchableOpacity style={st.photoActBtn} onPress={takeDefectPhoto}>
                      <Ionicons name="camera-reverse" size={16} color={C.primary} /><Text style={[st.photoActTxt, { color: C.primary }]}>Retake</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={st.photoActBtn} onPress={() => setDefPhoto(null)}>
                      <Ionicons name="trash-outline" size={16} color={C.danger} /><Text style={[st.photoActTxt, { color: C.danger }]}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={st.photoBtns}>
                  <TouchableOpacity style={st.photoBtn} onPress={takeDefectPhoto}>
                    <Ionicons name="camera" size={24} color={C.primary} />
                    <Text style={st.photoBtnTxt}>Camera</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={st.photoBtn} onPress={pickDefectPhoto}>
                    <Ionicons name="images" size={24} color={C.purple} />
                    <Text style={st.photoBtnTxt}>Gallery</Text>
                  </TouchableOpacity>
                </View>
              )}
              <TouchableOpacity style={st.addDefSaveBtn} onPress={addDefect}>
                <Ionicons name="add-circle" size={20} color="#FFF" />
                <Text style={st.addDefSaveTxt}>Add Defect</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Full-screen photo viewer */}
      <Modal visible={!!viewPhoto} animationType="fade" transparent statusBarTranslucent>
        <View style={st.fullOverlay}>
          <SafeAreaView style={{ flex: 1 }}>
            <TouchableOpacity style={st.fullClose} onPress={() => setViewPhoto(null)}>
              <Ionicons name="close" size={26} color="#FFF" />
            </TouchableOpacity>
            {viewPhoto && <View style={st.fullWrap}><Image source={{ uri: viewPhoto }} style={st.fullImg} contentFit="contain" /></View>}
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  headerBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { width: 40 },
  screenTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: C.text, textAlign: 'center' },
  content: { padding: 16 },
  secTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 10 },
  catSection: { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, marginBottom: 10, overflow: 'hidden' },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  catLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  catDot: { width: 8, height: 8, borderRadius: 4 },
  catName: { fontSize: 15, fontWeight: '600', color: C.text },
  catCount: { fontSize: 12, color: C.textMut, backgroundColor: C.elevated, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  checkItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.border },
  checkLabel: { fontSize: 14, color: C.text, flex: 1 },
  checkBtns: { flexDirection: 'row', gap: 6 },
  checkBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: C.border, minHeight: 44 },
  checkBtnTxt: { fontSize: 12, fontWeight: '600', color: C.textMut },
  defHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 10 },
  addDefBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.warn, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addDefTxt: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  defRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  defThumb: { width: 48, height: 48, borderRadius: 10, backgroundColor: C.elevated },
  defTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  defCat: { fontSize: 14, fontWeight: '600', color: C.text },
  sevBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  sevTxt: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  defDescTxt: { fontSize: 13, color: C.textSec },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.primary, paddingVertical: 16, borderRadius: 14, marginTop: 16 },
  saveBtnTxt: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: C.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: '85%' },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: C.border },
  modalTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: C.textSec, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 },
  sevRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  sevBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: C.border },
  sevBtnTxt: { fontSize: 14, fontWeight: '600', color: C.textMut },
  photoBtns: { flexDirection: 'row', gap: 12, marginBottom: 18 },
  photoBtn: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 20, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.border, backgroundColor: C.card },
  photoBtnTxt: { fontSize: 13, fontWeight: '600', color: C.textSec },
  photoPreview: { marginBottom: 18, borderRadius: 14, overflow: 'hidden', backgroundColor: C.card },
  photoImg: { width: '100%', height: 180, borderRadius: 14 },
  photoActions: { flexDirection: 'row', justifyContent: 'center', gap: 20, paddingVertical: 10 },
  photoActBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  photoActTxt: { fontSize: 13, fontWeight: '600' },
  addDefSaveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.warn, paddingVertical: 14, borderRadius: 14 },
  addDefSaveTxt: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  // Full screen
  fullOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' },
  fullClose: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', margin: 16, alignSelf: 'flex-end' },
  fullWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  fullImg: { width: SW - 32, height: '80%', borderRadius: 8 },
});
