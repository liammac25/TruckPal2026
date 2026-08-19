import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView,
  Alert, KeyboardAvoidingView, Platform, Modal, Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { C } from '../lib/theme';
import { saveExp, getExps, id, getUser } from '../lib/storage';
import { today, EXPENSE_CATS } from '../lib/helpers';
import FormInput from '../components/FormInput';
import PickerSelect from '../components/PickerSelect';
import type { Expense } from '../lib/types';

const { width: SCREEN_W } = Dimensions.get('window');

export default function AddExpenseScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const editId = route.params?.editId;

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(today());
  const [note, setNote] = useState('');
  const [receiptPhoto, setReceiptPhoto] = useState<string | null>(null);
  const [receiptCreatedAt, setReceiptCreatedAt] = useState<string | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [showFullScreen, setShowFullScreen] = useState(false);

  useEffect(() => {
    if (editId) {
      (async () => {
        const exps = await getExps();
        const ex = exps.find(e => e.id === editId);
        if (ex) {
          setAmount(ex.amount.toString());
          setCategory(ex.category);
          setDate(ex.date);
          setNote(ex.note);
          if (ex.receiptPhoto) {
            setReceiptPhoto(ex.receiptPhoto);
            setReceiptCreatedAt(ex.receiptCreatedAt || null);
          }
        }
      })();
    }
  }, [editId]);

  const requestCameraPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission',
        'TruckPal needs camera access to photograph receipts. Please enable it in your device settings.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const requestGalleryPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Gallery Permission',
        'TruckPal needs gallery access to select receipt photos. Please enable it in your device settings.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const handleTakePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setPreviewUri(uri);
    }
  };

  const handlePickFromGallery = async () => {
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setPreviewUri(uri);
    }
  };

  const confirmPreview = () => {
    if (previewUri) {
      setReceiptPhoto(previewUri);
      setReceiptCreatedAt(new Date().toISOString());
      setPreviewUri(null);
    }
  };

  const retakePreview = () => {
    setPreviewUri(null);
    handleTakePhoto();
  };

  const replaceFromGallery = () => {
    setPreviewUri(null);
    handlePickFromGallery();
  };

  const cancelPreview = () => {
    setPreviewUri(null);
  };

  const removeReceipt = () => {
    Alert.alert(
      'Remove Receipt',
      'Are you sure you want to remove this receipt photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setReceiptPhoto(null);
            setReceiptCreatedAt(null);
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    const n = parseFloat(amount);
    if (isNaN(n) || n <= 0) {
      Alert.alert('Invalid', 'Please enter a valid amount.');
      return;
    }
    if (!category) {
      Alert.alert('Required', 'Please select a category.');
      return;
    }
    const user = await getUser();
    const e: Expense = {
      id: editId || id(),
      userId: user?.id || '',
      amount: n,
      currency: 'GBP',
      category: category as any,
      date,
      note,
      receiptUri: null,
      createdAt: new Date().toISOString(),
      receiptPhoto: receiptPhoto,
      receiptPhotoUrl: null,
      receiptUploadStatus: receiptPhoto ? 'pending' : null,
      receiptCreatedAt: receiptCreatedAt,
    };
    await saveExp(e);
    Alert.alert(
      'Saved',
      `£${n.toFixed(2)} expense recorded.${receiptPhoto ? '\nReceipt saved offline — will sync when online.' : ''}`,
      [{ text: 'OK', onPress: () => nav.goBack() }]
    );
  };

  const quickAmts = ['5', '10', '20', '30', '50', '75', '100'];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>{editId ? 'Edit Expense' : 'Add Expense'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Amount Preview */}
          <View style={styles.amtCard}>
            <Text style={styles.curr}>£</Text>
            <Text style={styles.amtText}>{amount ? parseFloat(amount).toFixed(2) : '0.00'}</Text>
          </View>

          <FormInput label="Amount (£)" value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="decimal-pad" icon="cash-outline" />

          <View style={styles.quickRow}>
            {quickAmts.map(q => (
              <TouchableOpacity key={q} style={styles.quickBtn} onPress={() => setAmount(q)}>
                <Text style={styles.quickBtnTxt}>£{q}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <PickerSelect label="Category" value={category} options={[...EXPENSE_CATS]} onSelect={setCategory} icon="pricetag-outline" />
          <FormInput label="Date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" icon="calendar-outline" />
          <FormInput label="Note (optional)" value={note} onChangeText={setNote} placeholder="What was this expense for?" multiline numberOfLines={3} icon="create-outline" />

          {/* ── Receipt Photo Section ── */}
          <Text style={styles.receiptSectionLabel}>Receipt Photo (Optional)</Text>

          {!receiptPhoto && !previewUri && (
            <View style={styles.receiptActions}>
              <TouchableOpacity style={styles.receiptBtn} onPress={handleTakePhoto}>
                <View style={[styles.receiptBtnIcon, { backgroundColor: C.primary + '18' }]}>
                  <Ionicons name="camera" size={24} color={C.primary} />
                </View>
                <Text style={styles.receiptBtnTitle}>Take Photo</Text>
                <Text style={styles.receiptBtnSub}>Use your camera</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.receiptBtn} onPress={handlePickFromGallery}>
                <View style={[styles.receiptBtnIcon, { backgroundColor: C.purple + '18' }]}>
                  <Ionicons name="images" size={24} color={C.purple} />
                </View>
                <Text style={styles.receiptBtnTitle}>Upload</Text>
                <Text style={styles.receiptBtnSub}>From gallery</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Preview (before confirming) */}
          {previewUri && (
            <View style={styles.previewContainer}>
              <View style={styles.previewHeader}>
                <View style={styles.previewBadge}>
                  <Ionicons name="eye" size={14} color={C.warn} />
                  <Text style={styles.previewBadgeTxt}>Preview</Text>
                </View>
                <Text style={styles.previewHint}>Review before saving</Text>
              </View>
              <View style={styles.previewImageWrap}>
                <Image
                  source={{ uri: previewUri }}
                  style={styles.previewImage}
                  contentFit="cover"
                  transition={200}
                />
              </View>
              <View style={styles.previewActions}>
                <TouchableOpacity style={[styles.previewAction, { backgroundColor: C.border }]} onPress={cancelPreview}>
                  <Ionicons name="close" size={18} color={C.text} />
                  <Text style={[styles.previewActionTxt, { color: C.text }]}>Discard</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.previewAction, { backgroundColor: C.primary + '25' }]} onPress={retakePreview}>
                  <Ionicons name="camera-reverse" size={18} color={C.primary} />
                  <Text style={[styles.previewActionTxt, { color: C.primary }]}>Retake</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.previewAction, { backgroundColor: C.success }]} onPress={confirmPreview}>
                  <Ionicons name="checkmark" size={18} color="#FFF" />
                  <Text style={[styles.previewActionTxt, { color: '#FFF' }]}>Use This</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Saved receipt (after confirming) */}
          {receiptPhoto && !previewUri && (
            <View style={styles.savedReceiptContainer}>
              <View style={styles.savedReceiptHeader}>
                <View style={[styles.previewBadge, { backgroundColor: C.success + '18' }]}>
                  <Ionicons name="checkmark-circle" size={14} color={C.success} />
                  <Text style={[styles.previewBadgeTxt, { color: C.success }]}>Receipt Attached</Text>
                </View>
                <View style={styles.syncBadge}>
                  <Ionicons name="cloud-offline-outline" size={12} color={C.textMut} />
                  <Text style={styles.syncBadgeTxt}>Saved offline</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.savedImageWrap}
                onPress={() => setShowFullScreen(true)}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: receiptPhoto }}
                  style={styles.savedImage}
                  contentFit="cover"
                  transition={200}
                />
                <View style={styles.tapToExpandOverlay}>
                  <Ionicons name="expand" size={20} color="#FFF" />
                  <Text style={styles.tapToExpandTxt}>Tap to view full size</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.savedActions}>
                <TouchableOpacity style={styles.savedAction} onPress={handleTakePhoto}>
                  <Ionicons name="camera-reverse-outline" size={18} color={C.primary} />
                  <Text style={[styles.savedActionTxt, { color: C.primary }]}>Retake</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.savedAction} onPress={handlePickFromGallery}>
                  <Ionicons name="images-outline" size={18} color={C.purple} />
                  <Text style={[styles.savedActionTxt, { color: C.purple }]}>Replace</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.savedAction} onPress={removeReceipt}>
                  <Ionicons name="trash-outline" size={18} color={C.danger} />
                  <Text style={[styles.savedActionTxt, { color: C.danger }]}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Save Button */}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Ionicons name="checkmark-circle" size={20} color="#FFF" />
            <Text style={styles.saveBtnTxt}>Save Expense</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Full-screen receipt viewer */}
      <Modal visible={showFullScreen} animationType="fade" transparent statusBarTranslucent>
        <View style={styles.fullScreenOverlay}>
          <SafeAreaView style={styles.fullScreenSafe}>
            <View style={styles.fullScreenHeader}>
              <TouchableOpacity
                style={styles.fullScreenClose}
                onPress={() => setShowFullScreen(false)}
              >
                <Ionicons name="close" size={26} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.fullScreenTitle}>Receipt Photo</Text>
              <View style={{ width: 44 }} />
            </View>
            {receiptPhoto && (
              <View style={styles.fullScreenImageWrap}>
                <Image
                  source={{ uri: receiptPhoto }}
                  style={styles.fullScreenImage}
                  contentFit="contain"
                  transition={300}
                />
              </View>
            )}
          </SafeAreaView>
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
  amtCard: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', paddingVertical: 24, borderRadius: 18, backgroundColor: C.primary + '12', marginBottom: 20, gap: 4 },
  curr: { fontSize: 28, fontWeight: '700', color: C.primary },
  amtText: { fontSize: 48, fontWeight: '800', color: C.primary },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  quickBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  quickBtnTxt: { fontSize: 14, fontWeight: '600', color: C.text },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.primary, paddingVertical: 16, borderRadius: 14, marginTop: 20 },
  saveBtnTxt: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  // Receipt section
  receiptSectionLabel: {
    fontSize: 12, fontWeight: '700', color: C.textSec, marginBottom: 10,
    textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 4,
  },
  receiptActions: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  receiptBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 22, borderRadius: 16,
    backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border,
    borderStyle: 'dashed', gap: 6,
  },
  receiptBtnIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  receiptBtnTitle: { fontSize: 14, fontWeight: '700', color: C.text },
  receiptBtnSub: { fontSize: 12, color: C.textMut },

  // Preview
  previewContainer: {
    backgroundColor: C.card, borderRadius: 16, borderWidth: 1,
    borderColor: C.warn + '40', overflow: 'hidden', marginBottom: 8,
  },
  previewHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10,
  },
  previewBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.warn + '18', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  previewBadgeTxt: { fontSize: 12, fontWeight: '600', color: C.warn },
  previewHint: { fontSize: 12, color: C.textMut },
  previewImageWrap: { marginHorizontal: 14, borderRadius: 12, overflow: 'hidden' },
  previewImage: { width: '100%', height: 240, borderRadius: 12 },
  previewActions: { flexDirection: 'row', gap: 8, padding: 14 },
  previewAction: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderRadius: 12,
  },
  previewActionTxt: { fontSize: 13, fontWeight: '600' },

  // Saved receipt
  savedReceiptContainer: {
    backgroundColor: C.card, borderRadius: 16, borderWidth: 1,
    borderColor: C.success + '30', overflow: 'hidden', marginBottom: 8,
  },
  savedReceiptHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10,
  },
  syncBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.elevated, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  syncBadgeTxt: { fontSize: 11, color: C.textMut },
  savedImageWrap: {
    marginHorizontal: 14, borderRadius: 12, overflow: 'hidden', position: 'relative',
  },
  savedImage: { width: '100%', height: 180, borderRadius: 12 },
  tapToExpandOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)', flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 8, borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
  },
  tapToExpandTxt: { fontSize: 12, color: '#FFF', fontWeight: '500' },
  savedActions: { flexDirection: 'row', gap: 0, paddingVertical: 6, paddingHorizontal: 8 },
  savedAction: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10,
  },
  savedActionTxt: { fontSize: 13, fontWeight: '600' },

  // Full-screen viewer
  fullScreenOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' },
  fullScreenSafe: { flex: 1 },
  fullScreenHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  fullScreenClose: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  fullScreenTitle: { fontSize: 17, fontWeight: '600', color: '#FFF' },
  fullScreenImageWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  fullScreenImage: { width: SCREEN_W - 32, height: '85%', borderRadius: 8 },
});
