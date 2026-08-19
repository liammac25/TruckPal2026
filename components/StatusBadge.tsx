import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { C } from '../lib/theme';

const map: Record<string, string> = { draft: C.warn, completed: C.success, exported: C.info };

export default function StatusBadge({ status, small }: { status: string; small?: boolean }) {
  const c = map[status] || C.textMut;
  return (
    <View style={[styles.badge, { backgroundColor: c + '18' }, small && styles.sm]}>
      <View style={[styles.dot, { backgroundColor: c }]} />
      <Text style={[styles.txt, { color: c }, small && styles.smTxt]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, alignSelf: 'flex-start' },
  sm: { paddingHorizontal: 8, paddingVertical: 3 },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  txt: { fontSize: 13, fontWeight: '600' },
  smTxt: { fontSize: 11 },
});
