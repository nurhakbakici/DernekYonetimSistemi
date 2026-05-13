import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

interface Props {
  ikon?: keyof typeof Ionicons.glyphMap;
  baslik: string;
  aciklama?: string;
}

export default function EmptyState({ ikon = 'file-tray-outline', baslik, aciklama }: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name={ikon} size={64} color={Colors.textMuted} />
      <Text style={styles.baslik}>{baslik}</Text>
      {aciklama && <Text style={styles.aciklama}>{aciklama}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  baslik: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
  aciklama: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});
