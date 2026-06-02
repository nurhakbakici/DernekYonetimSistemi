import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

interface Props {
  mesaj?: string;
}

export default function LoadingSpinner({ mesaj }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.ikonKutu}>
        <Ionicons name="business" size={56} color={Colors.primaryLight} />
      </View>
      <ActivityIndicator size="large" color={Colors.primary} style={styles.spinner} />
      {mesaj && <Text style={styles.text}>{mesaj}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  ikonKutu: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: Colors.surfaceVariant,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  spinner: {
    marginBottom: 4,
  },
  text: {
    marginTop: 12,
    color: Colors.textSecondary,
    fontSize: 14,
  },
});
