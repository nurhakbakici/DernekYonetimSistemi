import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, Alert, StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { Colors } from '../../constants/colors';
import { firebaseAuthHataMetni } from '../../utils/firebaseAuthTr';
import { IS_FIREBASE_CONFIGURED } from '../../config/firebase';

type NavProp = NativeStackNavigationProp<AuthStackParamList, 'SifremiUnuttum'>;

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<NavProp>();
  const { sifreSifirlamaEmailGonder } = useAuth();
  const [email, setEmail] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);

  const gonder = async () => {
    const e = email.trim().toLowerCase();
    if (!e) {
      Alert.alert('Hata', 'Kayıtlı e-posta adresinizi girin.');
      return;
    }
    setYukleniyor(true);
    try {
      await sifreSifirlamaEmailGonder(e);
      Alert.alert(
        'E-posta gönderildi',
        'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Gelen kutunuzu ve spam klasörünü kontrol edin.',
        [{ text: 'Tamam', onPress: () => navigation.navigate('Giris') }],
      );
    } catch (err: unknown) {
      Alert.alert('İşlem yapılamadı', firebaseAuthHataMetni(err));
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.geri} onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
          <Text style={styles.geriText}>Girişe dön</Text>
        </TouchableOpacity>

        <View style={styles.form}>
          <Text style={styles.baslik}>Şifremi unuttum</Text>
          <Text style={styles.aciklama}>
            Hesabınızın e-posta adresini yazın; şifrenizi yenilemeniz için size bir bağlantı gönderilir.
          </Text>

          {!IS_FIREBASE_CONFIGURED && (
            <View style={styles.demoBilgi}>
              <Ionicons name="information-circle-outline" size={18} color={Colors.warning} />
              <Text style={styles.demoBilgiText}>
                Demo modunda şifre sıfırlama desteklenmez. Yönetici şifresi:{' '}
                <Text style={{ fontWeight: '700' }}>admin123</Text>, üye şifresi:{' '}
                <Text style={{ fontWeight: '700' }}>123456</Text>
              </Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="E-posta adresiniz"
              placeholderTextColor={Colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, (yukleniyor || !IS_FIREBASE_CONFIGURED) && styles.buttonDisabled]}
            onPress={gonder}
            disabled={yukleniyor || !IS_FIREBASE_CONFIGURED}
          >
            <Text style={styles.buttonText}>{yukleniyor ? 'Gönderiliyor...' : 'Sıfırlama bağlantısı gönder'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, padding: 24, paddingTop: 48 },
  geri: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
  geriText: { fontSize: 15, color: Colors.text, fontWeight: '600' },
  form: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  baslik: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  aciklama: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 12,
    marginBottom: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: 52, color: Colors.text, fontSize: 15 },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  demoBilgi: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.warning + '15',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.warning + '40',
  },
  demoBilgiText: { flex: 1, fontSize: 12, color: Colors.warning, lineHeight: 18 },
});
