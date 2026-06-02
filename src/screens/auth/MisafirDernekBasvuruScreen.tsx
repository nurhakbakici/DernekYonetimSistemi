import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { setItem, KEYS } from '../../config/storage';
import { Colors } from '../../constants/colors';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'MisafirDernekBasvuru'>;

export default function MisafirDernekBasvuruScreen() {
  const navigation = useNavigation<Nav>();

  const isaretleVeGit = async (hedef: 'Giris' | 'Kayit') => {
    await setItem(KEYS.DERNEK_BASVURU_NIYETI, true);
    if (hedef === 'Kayit') {
      navigation.navigate('Kayit', { yeniDernekBasvuru: true });
    } else {
      navigation.navigate('Giris');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.geri}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>

        <View style={styles.ikonKutu}>
          <Ionicons name="document-text-outline" size={48} color={Colors.primaryLight} />
        </View>
        <Text style={styles.baslik}>Yeni dernek başvurusu</Text>
        <Text style={styles.aciklama}>
          Platform yöneticisi onayından sonra derneğiniz açılır ve size yönetici üyeliği atanır.
          Devam etmek için giriş yapın veya yeni hesap oluşturun; oturum açıldıktan sonra başvuru
          formuna yönlendirileceksiniz.
        </Text>

        <TouchableOpacity
          style={styles.birincil}
          onPress={() => void isaretleVeGit('Giris')}
        >
          <Text style={styles.birincilText}>Giriş yap</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.ikincil}
          onPress={() => void isaretleVeGit('Kayit')}
        >
          <Text style={styles.ikincilText}>Kayıt ol</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 24, paddingTop: 56, paddingBottom: 40 },
  geri: { alignSelf: 'flex-start', padding: 8, marginBottom: 16 },
  ikonKutu: {
    width: 88,
    height: 88,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  baslik: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  aciklama: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 28,
  },
  birincil: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  birincilText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  ikincil: {
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ikincilText: { color: Colors.primaryLight, fontSize: 16, fontWeight: '600' },
});
