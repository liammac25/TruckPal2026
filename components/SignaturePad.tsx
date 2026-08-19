import React, { useRef, useState } from 'react';
import { View, StyleSheet, PanResponder, Text, TouchableOpacity } from 'react-native';
import { C } from '../lib/theme';
import { Ionicons } from '@expo/vector-icons';

interface Point { x: number; y: number; }
interface Props { onSave: (d: string) => void; onCancel: () => void; existing?: string | null; }

export default function SignaturePad({ onSave, onCancel, existing }: Props) {
  const [paths, setPaths] = useState<Point[][]>([]);
  const [cur, setCur] = useState<Point[]>([]);

  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: e => setCur([{ x: e.nativeEvent.locationX, y: e.nativeEvent.locationY }]),
    onPanResponderMove: e => setCur(p => [...p, { x: e.nativeEvent.locationX, y: e.nativeEvent.locationY }]),
    onPanResponderRelease: () => { setPaths(p => [...p, cur]); setCur([]); },
  })).current;

  const hasSigned = paths.some(p => p.length > 0) || cur.length > 0;

  const handleSave = () => {
    const all = [...paths, ...(cur.length > 0 ? [cur] : [])];
    if (!all.some(p => p.length > 0)) { onSave(''); return; }
    const svg = all.filter(p => p.length > 0).map(p => p.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' ')).join(' ');
    onSave(`sig:${svg}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.head}>
        <Text style={styles.title}>Sign Below</Text>
        <TouchableOpacity onPress={onCancel}><Ionicons name="close" size={26} color={C.textSec} /></TouchableOpacity>
      </View>
      <View style={styles.canvas} {...pan.panHandlers}>
        {existing && !hasSigned ? (
          <View style={styles.signed}>
            <Ionicons name="checkmark-circle" size={44} color={C.success} />
            <Text style={[styles.signedTxt, { color: C.success }]}>Signed</Text>
          </View>
        ) : (
          <>
            {[...paths, cur].map((path, pi) => path.map((pt, pti) => (
              <View key={`${pi}-${pti}`} style={[styles.dot, { left: pt.x - 2, top: pt.y - 2 }]} />
            )))}
            {!hasSigned && !existing && (
              <View style={styles.ph}>
                <Ionicons name="finger-print-outline" size={44} color={C.textMut} />
                <Text style={styles.phTxt}>Draw your signature here</Text>
              </View>
            )}
          </>
        )}
      </View>
      <View style={styles.acts}>
        <TouchableOpacity style={[styles.btn, { backgroundColor: C.border }]} onPress={() => { setPaths([]); setCur([]); }}>
          <Ionicons name="trash-outline" size={18} color={C.text} />
          <Text style={[styles.btnTxt, { color: C.text }]}>Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, { backgroundColor: C.primary, flex: 1.5 }]} onPress={handleSave}>
          <Ionicons name="checkmark" size={18} color="#FFF" />
          <Text style={[styles.btnTxt, { color: '#FFF' }]}>Save Signature</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: C.surface, borderRadius: 20, padding: 20, margin: 16 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', color: C.text },
  canvas: { height: 200, borderRadius: 14, borderWidth: 2, borderStyle: 'dashed', borderColor: C.border, backgroundColor: C.inputBg, overflow: 'hidden', position: 'relative' },
  dot: { position: 'absolute', width: 4, height: 4, borderRadius: 2, backgroundColor: C.text },
  ph: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  phTxt: { fontSize: 15, color: C.textMut, marginTop: 8 },
  signed: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  signedTxt: { fontSize: 17, fontWeight: '600', marginTop: 8 },
  acts: { flexDirection: 'row', gap: 12, marginTop: 16 },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 },
  btnTxt: { fontSize: 15, fontWeight: '600' },
});
