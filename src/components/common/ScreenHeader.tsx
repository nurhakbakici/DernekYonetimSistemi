import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useNavigation } from '@react-navigation/native';

interface Props {
  baslik: string;
  altBaslik?: string;
  geriButon?: boolean;
  sagButon?: {
    ikon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
  };
}

export default function ScreenHeader({ baslik, altBaslik, geriButon = false, sagButon }: Props) {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />
      <View style={styles.icerik}>
        <View style={styles.sol}>
          {geriButon && (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.geriButon}>
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>
          )}
          <View>
            <Text style={styles.baslik}>{baslik}</Text>
            {altBaslik && <Text style={styles.altBaslik}>{altBaslik}</Text>}
          </View>
        </View>
        {sagButon && (
          <TouchableOpacity onPress={sagButon.onPress} style={styles.sagButon}>
            <Ionicons name={sagButon.ikon} size={24} color={Colors.text} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.primaryDark,
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primaryLight + '40',
  },
  icerik: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  geriButon: {
    marginRight: 12,
    padding: 4,
  },
  baslik: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
  },
  altBaslik: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sagButon: {
    padding: 8,
    backgroundColor: Colors.primary + '40',
    borderRadius: 20,
  },
});
