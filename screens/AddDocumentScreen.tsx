import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../lib/theme';
import { saveDoc, id, getUser } from '../lib/storage';
import { DOC_CATS } from '../lib/helpers';
import FormInput from '../components/FormInput';
import PickerSelect from '../components/PickerSelect';
import type { DocRecord } from '../lib/types';

export default function AddDocumentScreen() {
  const nav = useNavigation<any>();
  const [title, setTitle] = useState(''); const [category, setCategory] = useState(''); const [expiryDate, setExpiryDate] = useState(''); const [notes, setNotes] = useState('');
  const [hasFile, setHasFile] = useState(false); const [hasPhoto, setHasPhoto] = useState(false);

  const handleSave = async () => {
    if (!title) { Alert.alert('Required', 'Please enter a title.'); return; }
    if (!category) { Alert.alert('Required', 'Please select a category.'); return; }
    const user = await getUser();
    const d: DocRecord = { id: id(), userId: user?.id || '', title, category: category as any, folder: category, fileUri: hasFile ? 'file_' + Date.now() : null, photoUri: hasPhoto ? 'photo_' + Date.now() : null, expiryDate: expiryDate || null, notes, createdAt: new Date().toISOString() };
    await saveDoc(d);
    Alert.alert('Saved', 'Document saved.', [{ text: 'OK', onPress: () => nav.goBack() }]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color={C.text} /></TouchableOpacity>
        <Text style={styles.screenTitle}>Add Document</Text>
        <View style={{ width: 40 }} />
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <FormInput label="Document Title" value={title} onChangeText={setTitle} placeholder="e.g. MOT Certificate 2025" icon="document-text-outline" />
          <PickerSelect label="Category" value={category} options={[...DOC_CATS]} onSelect={setCategory} icon="folder-outline" />
          <FormInput label="Expiry Date (optional)" value={expiryDate} onChangeText={setExpiryDate} placeholder="YYYY-MM-DD" icon="calendar-outline" />
          <FormInput label="Notes (optional)" value={notes} onChangeText={setNotes} placeholder="Any details\u2026" multiline numberOfLines={3} icon="create-outline" />
          <Text style={styles.secLbl}>Attachments</Text>
          <View style={styles.attachRow}>
            <TouchableOpacity style={[styles.attachBtn, hasFile && { backgroundColor: C.success + '12', borderColor: C.success }]} onPress={() => { setHasFile(!hasFile); if (!hasFile) Alert.alert('File Upload', 'File picker available in production.'); }}>
              <Ionicons name={hasFile ? 'checkmark-circle' : 'document-attach-outline'} size={26} color={hasFile ? C.success : C.textMut} />
              <Text style={[styles.attachTxt, hasFile && { color: C.success }]}>{hasFile ? 'PDF Attached' : 'Upload PDF'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.attachBtn, hasPhoto && { backgroundColor: C.info + '12', borderColor: C.info }]} onPress={() => { setHasPhoto(!hasPhoto); if (!hasPhoto) Alert.alert('Photo', 'Camera available in production.'); }}>
              <Ionicons name={hasPhoto ? 'checkmark-circle' : 'camera-outline'} size={26} color={hasPhoto ? C.info : C.textMut} />
              <Text style={[styles.attachTxt, hasPhoto && { color: C.info }]}>{hasPhoto ? 'Photo Taken' : 'Take Photo'}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Ionicons name="checkmark-circle" size={20} color="#FFF" /><Text style={styles.saveBtnTxt}>Save Document</Text>
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
  secLbl: { fontSize: 12, fontWeight: '700', color: C.textSec, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 },
  attachRow: { flexDirection: 'row', gap: 12, marginBottom: 22 },
  attachBtn: { flex: 1, alignItems: 'center', gap: 8, paddingVertical: 20, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.border, backgroundColor: C.card },
  attachTxt: { fontSize: 13, fontWeight: '600', color: C.textSec },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.primary, paddingVertical: 16, borderRadius: 14, marginTop: 8 },
  saveBtnTxt: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
