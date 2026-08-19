import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, TouchableOpacity } from 'react-native';
import { C } from '../lib/theme';
import { Ionicons } from '@expo/vector-icons';

interface Props extends TextInputProps {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
  onPressIcon?: () => void;
}

export default function FormInput({ label, icon, error, onPressIcon, style, ...rest }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.box, error && { borderColor: C.danger }]}>
        {icon && (
          <TouchableOpacity onPress={onPressIcon} disabled={!onPressIcon}>
            <Ionicons name={icon} size={18} color={C.textMut} style={{ marginRight: 10 }} />
          </TouchableOpacity>
        )}
        <TextInput
          style={[styles.input, rest.multiline && styles.multi, style]}
          placeholderTextColor={C.textMut}
          {...rest}
        />
      </View>
      {error && <Text style={styles.err}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 18 },
  label: { fontSize: 12, fontWeight: '700', color: C.textSec, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 },
  box: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, backgroundColor: C.inputBg },
  input: { flex: 1, fontSize: 16, color: C.text, paddingVertical: 14 },
  multi: { minHeight: 100, textAlignVertical: 'top' },
  err: { fontSize: 12, color: C.danger, marginTop: 4 },
});
