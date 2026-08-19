import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../lib/theme';
import { saveInf, getInfs, id, getUser, getVehicle } from '../lib/storage';
import { INFRINGEMENT_TYPES, today } from '../lib/helpers';
import FormInput from '../components/FormInput';
import PickerSelect from '../components/PickerSelect';
import SignaturePad from '../components/SignaturePad';
import type { InfringementRecord } from '../lib/types';

export default function AddInfringementScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const editId = route.params?.editId;

  const [form, setForm] = useState<InfringementRecord>({
    id: id(), userId: '', vehicleId: '', infringementType: '', description: '',
    dateTime: new Date().toISOString(), location: '', driverName: '', vehicleReg: '',
    notes: '', signatureImage: null, printoutPhoto: null, status: 'draft',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });
  const [showSig, setShowSig] = useState(false);
  const [dateStr, setDateStr] = useState(today());
  const [timeStr, setTimeStr] = useState(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));

  useEffect(() => {
    (async () => {
      const user = await getUser(); const veh = await getVehicle();
      if (editId) {
        const infs = await getInfs(); const ex = infs.find(i => i.id === editId);
        if (ex) { setForm(ex); const dt = new Date(ex.dateTime); setDateStr(dt.toISOString().split('T')[0]); setTimeStr(dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })); return; }
      }
      setForm(p => ({ ...p, userId: user?.id || '', vehicleId: veh?.id || '', driverName: user ? `${user.firstName} ${user.lastName}`.trim() : '', vehicleReg: veh?.registration || '' }));
    })();
  }, [editId]);

  const upd = (k: keyof InfringementRecord, v: any) => setForm(p => ({ ...p, [k]: v, updatedAt: new Date().toISOString() }));

  const handleSave = async (status: 'draft' | 'completed') => {
    if (!form.infringementType) { Alert.alert('Required', 'Please select an infringement type.'); return; }
    const dateTime = new Date(`${dateStr}T${timeStr}:00`).toISOString();
    await saveInf({ ...form, dateTime, status, updatedAt: new Date().toISOString() });
    Alert.alert('Saved', status === 'completed' ? 'Infringement record saved. This is a backup copy, not a replacement for any legal original.' : 'Draft saved. You can complete it later.', [{ text: 'OK', onPress: () => nav.goBack() }]);
  };

  const handlePhoto = () => { upd('printoutPhoto', 'photo_' + Date.now()); Alert.alert('Photo Saved', 'Photo of printout saved as backup evidence.'); };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color={C.text} /></TouchableOpacity>
        <Text style={styles.screenTitle}>{editId ? 'Edit Infringement' : 'New Infringement'}</Text>
        <View style={{ width: 40 }} />
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.disclaimer}>
            <Ionicons name="information-circle" size={18} color={C.info} />
            <Text style={styles.disclaimerTxt}>This is a backup record only. It does not replace any legal original document.</Text>
          </View>

          <PickerSelect label="Infringement Type" value={form.infringementType} options={INFRINGEMENT_TYPES} onSelect={v => upd('infringementType', v)} icon="alert-circle-outline" />
          <FormInput label="Description (in your own words)" value={form.description} onChangeText={t => upd('description', t)} placeholder="Describe what happened\u2026" multiline numberOfLines={4} icon="create-outline" />
          <View style={styles.row}>
            <View style={{ flex: 1 }}><FormInput label="Date" value={dateStr} onChangeText={setDateStr} placeholder="YYYY-MM-DD" icon="calendar-outline" /></View>
            <View style={{ flex: 1 }}><FormInput label="Time" value={timeStr} onChangeText={setTimeStr} placeholder="HH:MM" icon="time-outline" /></View>
          </View>
          <FormInput label="Vehicle Registration" value={form.vehicleReg} onChangeText={t => upd('vehicleReg', t.toUpperCase())} placeholder="AB12 CDE" icon="car-outline" autoCapitalize="characters" />
          <FormInput label="Depot / Location" value={form.location} onChangeText={t => upd('location', t)} placeholder="Where did this happen?" icon="location-outline" />
          <FormInput label="Driver Name" value={form.driverName} onChangeText={t => upd('driverName', t)} placeholder="Your full name" icon="person-outline" />
          <FormInput label="Additional Notes" value={form.notes} onChangeText={t => upd('notes', t)} placeholder="Any other details\u2026" multiline numberOfLines={3} icon="chatbox-outline" />

          <Text style={styles.secLabel}>Digital Signature</Text>
          <TouchableOpacity style={[styles.sigBtn, form.signatureImage && { backgroundColor: C.success + '12', borderColor: C.success }]} onPress={() => setShowSig(true)}>
            <Ionicons name={form.signatureImage ? 'checkmark-circle' : 'finger-print-outline'} size={26} color={form.signatureImage ? C.success : C.textMut} />
            <Text style={[styles.sigBtnTxt, form.signatureImage && { color: C.success }]}>{form.signatureImage ? 'Signature Captured \u2713' : 'Tap to Sign'}</Text>
          </TouchableOpacity>

          <Text style={styles.secLabel}>Printout Photo</Text>
          <Text style={styles.secHint}>Take a photo of the actual paper infringement sheet</Text>
          <TouchableOpacity style={[styles.photoBtn, form.printoutPhoto && { backgroundColor: C.info + '12', borderColor: C.info }]} onPress={handlePhoto}>
            <Ionicons name={form.printoutPhoto ? 'checkmark-circle' : 'camera-outline'} size={30} color={form.printoutPhoto ? C.info : C.textMut} />
            <Text style={[styles.photoBtnTxt, form.printoutPhoto && { color: C.info }]}>{form.printoutPhoto ? 'Photo Saved as Backup \u2713' : 'Capture Photo of Printout'}</Text>
            {form.printoutPhoto && <Text style={styles.photoHint}>Stored as backup evidence</Text>}
          </TouchableOpacity>

          <View style={styles.saveRow}>
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: C.warn }]} onPress={() => handleSave('draft')}>
              <Ionicons name="bookmark-outline" size={18} color="#FFF" /><Text style={styles.saveBtnTxt}>Save Draft</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: C.success }]} onPress={() => handleSave('completed')}>
              <Ionicons name="checkmark-circle" size={18} color="#FFF" /><Text style={styles.saveBtnTxt}>Complete</Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
      <Modal visible={showSig} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <SignaturePad existing={form.signatureImage} onSave={s => { upd('signatureImage', s || null); setShowSig(false); }} onCancel={() => setShowSig(false)} />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  headerBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { width: 40 },
  screenTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: C.text, textAlign: 'center' },
  content: { padding: 16 },
  disclaimer: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14, backgroundColor: C.info + '10', borderWidth: 1, borderColor: C.info + '25', marginBottom: 20 },
  disclaimerTxt: { flex: 1, fontSize: 13, color: C.info, lineHeight: 18 },
  row: { flexDirection: 'row', gap: 12 },
  secLabel: { fontSize: 15, fontWeight: '700', color: C.text, marginTop: 8, marginBottom: 6 },
  secHint: { fontSize: 13, color: C.textMut, marginBottom: 10 },
  sigBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.border, backgroundColor: C.card, marginBottom: 18 },
  sigBtnTxt: { fontSize: 15, fontWeight: '600', color: C.textSec },
  photoBtn: { alignItems: 'center', gap: 8, padding: 24, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.border, backgroundColor: C.card, marginBottom: 22 },
  photoBtnTxt: { fontSize: 15, fontWeight: '600', color: C.textSec },
  photoHint: { fontSize: 12, color: C.textMut, marginTop: 4 },
  saveRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  saveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 14 },
  saveBtnTxt: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
});
