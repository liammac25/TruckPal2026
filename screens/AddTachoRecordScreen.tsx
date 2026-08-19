import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../lib/theme';
import { saveTacho, getTachos, id, getUser, getVehicle } from '../lib/storage';
import { today } from '../lib/helpers';
import FormInput from '../components/FormInput';
import PickerSelect from '../components/PickerSelect';
import type { TachoRecord } from '../lib/types';

const modeLabels: Record<string, string> = { driving: 'Driving', other_work: 'Other Work', availability: 'Availability', rest: 'Rest' };

export default function AddTachoRecordScreen() {
  const nav = useNavigation<any>(); const route = useRoute<any>(); const editId = route.params?.editId;
  const [form, setForm] = useState<TachoRecord>({ id: id(), userId: '', vehicleId: '', date: today(), vehicleReg: '', driverName: '', startOdometer: '', endOdometer: '', notes: '', mode: 'driving', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });

  useEffect(() => {
    (async () => {
      const user = await getUser(); const veh = await getVehicle();
      if (editId) { const recs = await getTachos(); const ex = recs.find(r => r.id === editId); if (ex) { setForm(ex); return; } }
      setForm(p => ({ ...p, userId: user?.id || '', vehicleId: veh?.id || '', driverName: user ? `${user.firstName} ${user.lastName}`.trim() : '', vehicleReg: veh?.registration || '' }));
    })();
  }, [editId]);

  const upd = (k: keyof TachoRecord, v: any) => setForm(p => ({ ...p, [k]: v, updatedAt: new Date().toISOString() }));

  const handleSave = async () => {
    if (!form.date) { Alert.alert('Required', 'Please enter a date.'); return; }
    await saveTacho(form);
    Alert.alert('Saved', 'Tacho record saved.', [{ text: 'OK', onPress: () => nav.goBack() }]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color={C.text} /></TouchableOpacity>
        <Text style={styles.screenTitle}>{editId ? 'Edit Tacho Record' : 'New Tacho Record'}</Text>
        <View style={{ width: 40 }} />
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <FormInput label="Date" value={form.date} onChangeText={t => upd('date', t)} placeholder="YYYY-MM-DD" icon="calendar-outline" />
          <PickerSelect label="Mode" value={modeLabels[form.mode] || form.mode} options={Object.values(modeLabels)} onSelect={v => { const k = Object.entries(modeLabels).find(([, l]) => l === v)?.[0] || 'driving'; upd('mode', k); }} icon="speedometer-outline" />
          <FormInput label="Vehicle Registration" value={form.vehicleReg} onChangeText={t => upd('vehicleReg', t.toUpperCase())} placeholder="AB12 CDE" icon="car-outline" autoCapitalize="characters" />
          <FormInput label="Driver Name" value={form.driverName} onChangeText={t => upd('driverName', t)} placeholder="Your name" icon="person-outline" />
          <View style={styles.row}>
            <View style={{ flex: 1 }}><FormInput label="Start Odometer" value={form.startOdometer} onChangeText={t => upd('startOdometer', t)} placeholder="km" keyboardType="numeric" icon="speedometer-outline" /></View>
            <View style={{ flex: 1 }}><FormInput label="End Odometer" value={form.endOdometer} onChangeText={t => upd('endOdometer', t)} placeholder="km" keyboardType="numeric" icon="speedometer-outline" /></View>
          </View>
          <FormInput label="Notes" value={form.notes} onChangeText={t => upd('notes', t)} placeholder="Any notes\u2026" multiline numberOfLines={4} icon="create-outline" />
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Ionicons name="checkmark-circle" size={20} color="#FFF" /><Text style={styles.saveBtnTxt}>Save Record</Text>
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  headerBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { width: 40 },
  screenTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: C.text, textAlign: 'center' },
  content: { padding: 16 },
  row: { flexDirection: 'row', gap: 12 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.primary, paddingVertical: 16, borderRadius: 14, marginTop: 16 },
  saveBtnTxt: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
