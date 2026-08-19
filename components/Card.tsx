import React from 'react';
import { View, TouchableOpacity, ViewStyle, StyleSheet } from 'react-native';
import { C } from '../lib/theme';

interface Props { children: React.ReactNode; onPress?: () => void; style?: ViewStyle; }

export default function Card({ children, onPress, style }: Props) {
  const s = [styles.card, style];
  if (onPress) return <TouchableOpacity style={s} onPress={onPress} activeOpacity={0.65}>{children}</TouchableOpacity>;
  return <View style={s}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
});
