import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';
import ScreenHeader from '../../components/common/ScreenHeader';
import { firebaseAuthHataMetni } from '../../utils/firebaseAuthTr';

export default function ChangePasswordScreen() {
  const navigation = useNavigation<any>();
  const { sifreDegistir } = useAuth();
  const [mevcut, setMevcut] = useState('');
  const [yeni, setYeni] = useState('');
  const [yeniTekrar, setYeniTekrar] = useState('');
  const [goster1, setGoster1] = useState(false);
  const [goster2, setGoster2] = useState(false);
  const [goster3, setGoster3] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);

  const kaydet = async () => {
    if (!mevcut.trim() || !yeni.trim() || !yeniTekrar.trim()) {
      Alert.alert('Hata', 'Tüm alanları doldurun.');
      return;
    }
    if (yeni !== yeniTekrar) {
      Alert.alert('Hata', 'Yeni şifre ile tekrarı eşleşmiyor.');
      return;
    }
    setYukleniyor(true);
    try {
      await sifreDegistir(mevcut, yeni);
      Alert.alert('Başarılı', 'Şifreniz güncellendi.', [{ text: 'Tamam', onPress: () => navigation.goBack() }]);
    } catch (e: unknown) {
      Alert.alert('Şifre değiştirilemedi', firebaseAuthHataMetni(e));
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader baslik="Şifre değiştir" altBaslik="Mevcut şifrenizi doğrulayın" geriButon />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Mevcut şifre</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={Colors.textMuted}
              value={mevcut}
              onChangeText={setMevcut}
              secureTextEntry={!goster1}
            />
            <TouchableOpacity onPress={() => setGoster1(!goster1)} style={styles.goz}>
              <Ionicons name={goster1 ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Yeni şifre (en az 6 karakter)</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={Colors.textMuted}
              value={yeni}
              onChangeText={setYeni}
              secureTextEntry={!goster2}
            />
            <TouchableOpacity onPress={() => setGoster2(!goster2)} style={styles.goz}>
              <Ionicons name={goster2 ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Yeni şifre (tekrar)</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={Colors.textMuted}
              value={yeniTekrar}
              onChangeText={setYeniTekrar}
              secureTextEntry={!goster3}
            />
            <TouchableOpacity onPress={() => setGoster3(!goster3)} style={styles.goz}>
              <Ionicons name={goster3 ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.kaydet, yukleniyor && { opacity: 0.6 }]}
            onPress={kaydet}
            disabled={yukleniyor}
          >
            <Ionicons name="save-outline" size={20} color={Colors.white} />
            <Text style={styles.kaydetText}>{yukleniyor ? 'Kaydediliyor...' : 'Şifreyi güncelle'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8, marginTop: 12 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
  },
  input: { flex: 1, height: 50, color: Colors.text, fontSize: 15 },
  goz: { padding: 8 },
  kaydet: {
    marginTop: 28,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  kaydetText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
});
