import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert, StatusBar, Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { Colors } from '../../constants/colors';
import { firebaseAuthHataMetni } from '../../utils/firebaseAuthTr';

type NavProp = NativeStackNavigationProp<AuthStackParamList, 'Kayit'>;

export default function RegisterScreen() {
  const navigation = useNavigation<NavProp>();
  const { kayitOl } = useAuth();
  const [ad, setAd] = useState('');
  const [soyad, setSoyad] = useState('');
  const [email, setEmail] = useState('');
  const [telefon, setTelefon] = useState('');
  const [sifre, setSifre] = useState('');
  const [sifreTekrar, setSifreTekrar] = useState('');
  const [sifreGoster, setSifreGoster] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);
  const islemdeRef = useRef(false);

  const handleKayit = async () => {
    if (islemdeRef.current) return;
    if (!ad.trim() || !soyad.trim() || !email.trim() || !sifre.trim()) {
      Alert.alert('Hata', 'Ad, soyad, e-posta ve şifre zorunludur.');
      return;
    }
    if (sifre.length < 6) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır.');
      return;
    }
    if (sifre !== sifreTekrar) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor.');
      return;
    }

    islemdeRef.current = true;
    setYukleniyor(true);
    try {
      await kayitOl(ad.trim(), soyad.trim(), email.trim(), sifre, telefon.trim() || undefined);
      Alert.alert(
        'Kayıt Tamamlandı',
        'Hesabınız aday üye olarak oluşturuldu. Aynı e-posta ve şifre ile giriş yaparak dernek durumunu ve etkinlikleri görebilirsiniz. Tam üyelik ve diğer haklar için yönetici onayı gereklidir.',
        [{ text: 'Giriş ekranına git', onPress: () => navigation.navigate('Giris') }]
      );
    } catch (error: unknown) {
      Alert.alert('Kayıt Hatası', firebaseAuthHataMetni(error));
    } finally {
      islemdeRef.current = false;
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
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.geriButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../assets/kule-logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
              accessibilityLabel="Kule Sakinleri logosu"
            />
          </View>
          <Text style={styles.baslik}>Yeni Üye Kaydı</Text>
          <Text style={styles.altBaslik}>Kule Sakinleri ailesine katılın</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfInput]}>
              <TextInput
                style={styles.input}
                placeholder="Adınız"
                placeholderTextColor={Colors.textMuted}
                value={ad}
                onChangeText={setAd}
              />
            </View>
            <View style={[styles.inputContainer, styles.halfInput]}>
              <TextInput
                style={styles.input}
                placeholder="Soyadınız"
                placeholderTextColor={Colors.textMuted}
                value={soyad}
                onChangeText={setSoyad}
              />
            </View>
          </View>

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

          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Telefon (isteğe bağlı)"
              placeholderTextColor={Colors.textMuted}
              value={telefon}
              onChangeText={setTelefon}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Şifre (en az 6 karakter)"
              placeholderTextColor={Colors.textMuted}
              value={sifre}
              onChangeText={setSifre}
              secureTextEntry={!sifreGoster}
            />
            <TouchableOpacity onPress={() => setSifreGoster(!sifreGoster)}>
              <Ionicons
                name={sifreGoster ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={Colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Şifre tekrar"
              placeholderTextColor={Colors.textMuted}
              value={sifreTekrar}
              onChangeText={setSifreTekrar}
              secureTextEntry={!sifreGoster}
            />
          </View>

          <View style={styles.bilgi}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.info} />
            <Text style={styles.bilgiText}>
              Üyeliğiniz yönetim kurulu onayından sonra aktifleşecektir.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.kayitButton, yukleniyor && styles.disabledButton]}
            onPress={handleKayit}
            disabled={yukleniyor}
          >
            <Text style={styles.kayitButtonText}>
              {yukleniyor ? 'Kaydediliyor...' : 'Kayıt Ol'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.girisLink}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.girisLinkText}>
              Hesabınız var mı? <Text style={styles.girisLinkVurgu}>Giriş Yapın</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, padding: 24, paddingTop: 60 },
  header: { alignItems: 'center', marginBottom: 32 },
  geriButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 8,
  },
  logoContainer: {
    width: 112,
    height: 112,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  baslik: { fontSize: 22, fontWeight: '700', color: Colors.text },
  altBaslik: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  form: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  row: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 12,
    marginBottom: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: 50, color: Colors.text, fontSize: 14 },
  bilgi: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.infoLight + '20',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  bilgiText: { flex: 1, fontSize: 12, color: Colors.info, lineHeight: 18 },
  kayitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: { opacity: 0.6 },
  kayitButtonText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  girisLink: { marginTop: 16, alignItems: 'center' },
  girisLinkText: { color: Colors.textSecondary, fontSize: 14 },
  girisLinkVurgu: { color: Colors.primaryLight, fontWeight: '600' },
});
