import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { C } from '../lib/theme';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  msg: string;
  action?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon, title, msg, action, onAction }: Props) {
  return (
    <View style={styles.box}>
      <View style={styles.circle}><Ionicons name={icon} size={44} color={C.primary} /></View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.msg}>{msg}</Text>
      {action && onAction && (
        <TouchableOpacity style={styles.btn} onPress={onAction}>
          <Text style={styles.btnTxt}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, paddingVertical: 60 },
  circle: { width: 88, height: 88, borderRadius: 44, backgroundColor: C.primary + '14', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '700', color: C.text, marginBottom: 8, textAlign: 'center' },
  msg: { fontSize: 14, color: C.textSec, textAlign: 'center', lineHeight: 21 },
  btn: { marginTop: 24, backgroundColor: C.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  btnTxt: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
