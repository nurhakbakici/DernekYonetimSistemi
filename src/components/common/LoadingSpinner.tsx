import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Image } from 'react-native';
import { Colors } from '../../constants/colors';

interface Props {
  mesaj?: string;
}

export default function LoadingSpinner({ mesaj }: Props) {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../../assets/kule-logo.png')}
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="Kule Sakinleri"
      />
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
  logo: {
    width: 112,
    height: 112,
    marginBottom: 20,
    alignSelf: 'center',
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
