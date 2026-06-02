import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert, StatusBar,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { Colors } from '../../constants/colors';
import { firebaseAuthHataMetni } from '../../utils/firebaseAuthTr';
import AuthBrandingHeader from '../../components/auth/AuthBrandingHeader';
import DernekSecimDropdown from '../../components/auth/DernekSecimDropdown';
import type { KayitDernekOzeti } from '../../types';

type NavProp = NativeStackNavigationProp<AuthStackParamList, 'Kayit'>;
type KayitRoute = RouteProp<AuthStackParamList, 'Kayit'>;

export default function RegisterScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<KayitRoute>();
  const { kayitOl, girisMarkasi, kayitIcinAktifDernekListesi } = useAuth();
  const yeniDernekBasvuru = route.params?.yeniDernekBasvuru === true;

  const [ad, setAd] = useState('');
  const [soyad, setSoyad] = useState('');
  const [email, setEmail] = useState('');
  const [telefon, setTelefon] = useState('');
  const [sifre, setSifre] = useState('');
  const [sifreTekrar, setSifreTekrar] = useState('');
  const [sifreGoster, setSifreGoster] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [dernekler, setDernekler] = useState<KayitDernekOzeti[]>([]);
  const [derneklerYukleniyor, setDerneklerYukleniyor] = useState(false);
  const [secilenDernekId, setSecilenDernekId] = useState<string | null>(null);
  const islemdeRef = useRef(false);

  const dernekleriYukle = useCallback(async () => {
    if (yeniDernekBasvuru) return;
    setDerneklerYukleniyor(true);
    try {
      const liste = await kayitIcinAktifDernekListesi();
      setDernekler(liste);
      if (liste.length === 0) {
        Alert.alert(
          'Dernek listesi boş',
          'Şu an kayıt için açık dernek bulunmuyor. Daha sonra tekrar deneyin veya yönetici ile iletişime geçin.',
        );
      }
    } catch {
      Alert.alert('Hata', 'Dernek listesi yüklenemedi. İnternet bağlantınızı veya Firestore kurallarını kontrol edin.');
      setDernekler([]);
    } finally {
      setDerneklerYukleniyor(false);
    }
  }, [kayitIcinAktifDernekListesi, yeniDernekBasvuru]);

  useEffect(() => {
    void dernekleriYukle();
  }, [dernekleriYukle]);

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
    if (!yeniDernekBasvuru && !secilenDernekId) {
      Alert.alert('Dernek seçin', 'Açılır listeden üye olmak istediğiniz derneği seçin.');
      return;
    }
    islemdeRef.current = true;
    setYukleniyor(true);
    try {
      if (yeniDernekBasvuru) {
        await kayitOl(ad.trim(), soyad.trim(), email.trim(), sifre, {
          telefon: telefon.trim() || undefined,
          yalnizcaProfil: true,
        });
        Alert.alert(
          'Kayıt tamamlandı',
          'Giriş yaptıktan sonra yeni dernek başvuru formuna yönlendirileceksiniz.',
          [{ text: 'Giriş ekranına git', onPress: () => navigation.navigate('Giris') }],
        );
      } else {
        await kayitOl(ad.trim(), soyad.trim(), email.trim(), sifre, {
          telefon: telefon.trim() || undefined,
          dernekId: secilenDernekId ?? undefined,
        });
        const adDer = dernekler.find((d) => d.id === secilenDernekId)?.ad ?? 'Seçtiğiniz dernek';
        Alert.alert(
          'Kayıt tamamlandı',
          `${adDer} için aday üyeliğiniz oluşturuldu. Aynı e-posta ve şifre ile giriş yaparak derneği kullanmaya başlayabilirsiniz; tam haklar yönetici onayına bağlıdır.`,
          [{ text: 'Giriş ekranına git', onPress: () => navigation.navigate('Giris') }],
        );
      }
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
          <AuthBrandingHeader marka={girisMarkasi} kayitModu />
        </View>

        {yeniDernekBasvuru && (
          <View style={styles.bilgiKutu}>
            <Text style={styles.bilgiKutuText}>
              Bu kayıt yalnızca platformda yeni bir dernek açmak içindir. Dernek seçmeniz gerekmez; girişten sonra
              başvuru formunu doldurursunuz.
            </Text>
          </View>
        )}

        {!yeniDernekBasvuru && (
          <DernekSecimDropdown
            dernekler={dernekler}
            secilenId={secilenDernekId}
            onSecim={setSecilenDernekId}
            yukleniyor={derneklerYukleniyor}
            aciklama="Dernek yöneticileri başvurunuzu inceleyecek; onay sonrası tam üyelik ve tüm özellikler açılır."
          />
        )}

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
              {yeniDernekBasvuru
                ? 'Hesap oluşturulduktan sonra giriş yapıp dernek başvuru formunu tamamlayın.'
                : 'Aday üyeliğiniz seçtiğiniz dernek yönetimi tarafından onaylandığında tam üyeliğe geçer.'}
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
  header: { alignItems: 'center', marginBottom: 20, position: 'relative', width: '100%', paddingTop: 44 },
  geriButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 8,
    zIndex: 2,
  },
  bilgiKutu: {
    marginBottom: 16,
    padding: 14,
    backgroundColor: Colors.warning + '18',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.warning + '40',
  },
  bilgiKutuText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
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
