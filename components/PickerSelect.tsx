import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, SafeAreaView } from 'react-native';
import { C } from '../lib/theme';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  label: string;
  value: string;
  options: string[];
  onSelect: (v: string) => void;
  icon?: keyof typeof Ionicons.glyphMap;
}

export default function PickerSelect({ label, value, options, onSelect, icon }: Props) {
  const [vis, setVis] = useState(false);
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.sel} onPress={() => setVis(true)}>
        {icon && <Ionicons name={icon} size={18} color={C.textMut} style={{ marginRight: 10 }} />}
        <Text style={[styles.val, !value && { color: C.textMut }]}>{value || `Select ${label.toLowerCase()}`}</Text>
        <Ionicons name="chevron-down" size={18} color={C.textMut} />
      </TouchableOpacity>
      <Modal visible={vis} transparent animationType="slide">
        <View style={styles.overlay}>
          <SafeAreaView style={styles.modal}>
            <View style={styles.mHead}>
              <Text style={styles.mTitle}>Select {label}</Text>
              <TouchableOpacity onPress={() => setVis(false)}><Ionicons name="close" size={26} color={C.textSec} /></TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={i => i}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.opt, item === value && { backgroundColor: C.primary + '12' }]}
                  onPress={() => { onSelect(item); setVis(false); }}
                >
                  <Text style={[styles.optTxt, item === value && { color: C.primary, fontWeight: '700' }]}>{item}</Text>
                  {item === value && <Ionicons name="checkmark" size={20} color={C.primary} />}
                </TouchableOpacity>
              )}
            />
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 18 },
  label: { fontSize: 12, fontWeight: '700', color: C.textSec, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 },
  sel: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, backgroundColor: C.inputBg },
  val: { flex: 1, fontSize: 16, color: C.text },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  modal: { backgroundColor: C.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: '60%' },
  mHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: C.border },
  mTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  opt: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 0.5, borderBottomColor: C.border },
  optTxt: { fontSize: 16, color: C.text },
});
