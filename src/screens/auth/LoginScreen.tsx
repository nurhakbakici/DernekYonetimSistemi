import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert, StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { Colors } from '../../constants/colors';
import { firebaseAuthHataMetni } from '../../utils/firebaseAuthTr';
import AuthBrandingHeader from '../../components/auth/AuthBrandingHeader';

type NavProp = NativeStackNavigationProp<AuthStackParamList, 'Giris'>;

export default function LoginScreen() {
  const navigation = useNavigation<NavProp>();
  const { girisYap, girisMarkasi } = useAuth();
  const [email, setEmail] = useState('');
  const [sifre, setSifre] = useState('');
  const [sifreGoster, setSifreGoster] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);

  const handleGiris = async () => {
    if (!email.trim() || !sifre.trim()) {
      Alert.alert('Hata', 'E-posta ve şifre alanları zorunludur.');
      return;
    }
    setYukleniyor(true);
    try {
      await girisYap(email.trim().toLowerCase(), sifre);
    } catch (error: unknown) {
      Alert.alert('Giriş Hatası', firebaseAuthHataMetni(error));
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
        <AuthBrandingHeader marka={girisMarkasi} />

        <View style={styles.form}>
          <Text style={styles.formBaslik}>Giriş</Text>

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
            <Ionicons name="lock-closed-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Şifreniz"
              placeholderTextColor={Colors.textMuted}
              value={sifre}
              onChangeText={setSifre}
              secureTextEntry={!sifreGoster}
            />
            <TouchableOpacity onPress={() => setSifreGoster(!sifreGoster)} style={styles.gosteGizle}>
              <Ionicons
                name={sifreGoster ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={Colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.sifremiUnuttum}
            onPress={() => navigation.navigate('SifremiUnuttum')}
          >
            <Text style={styles.sifremiUnuttumText}>Şifremi unuttum</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.girisButton, yukleniyor && styles.disabledButton]}
            onPress={handleGiris}
            disabled={yukleniyor}
          >
            {yukleniyor ? (
              <Text style={styles.girisButtonText}>Giriş yapılıyor...</Text>
            ) : (
              <Text style={styles.girisButtonText}>Giriş Yap</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.kayitCta}
          onPress={() => navigation.navigate('Kayit', {})}
        >
          <Text style={styles.kayitCtaText}>Kayıt ol</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.basvuruFooter}
          onPress={() => navigation.navigate('MisafirDernekBasvuru')}
        >
          <Text style={styles.basvuruFooterText}>Yeni dernek için başvuru</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingBottom: 40,
  },
  form: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  formBaslik: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 52,
    color: Colors.text,
    fontSize: 15,
  },
  gosteGizle: {
    padding: 4,
  },
  sifremiUnuttum: {
    alignSelf: 'flex-end',
    marginBottom: 4,
    paddingVertical: 6,
  },
  sifremiUnuttumText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primaryLight,
  },
  girisButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  girisButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  kayitCta: {
    marginTop: 20,
    height: 52,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  kayitCtaText: {
    color: Colors.primaryLight,
    fontSize: 16,
    fontWeight: '700',
  },
  basvuruFooter: {
    marginTop: 28,
    alignItems: 'center',
    paddingVertical: 12,
  },
  basvuruFooterText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },
});
