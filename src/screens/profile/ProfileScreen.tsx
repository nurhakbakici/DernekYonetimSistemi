import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useAuth } from '../../context/AuthContext';
import { IS_FIREBASE_CONFIGURED } from '../../config/firebase';
import { Colors } from '../../constants/colors';
import { rolGosterimMetni, tamUyeOzelliklerineErisir } from '../../utils/userAccess';
import ScreenHeader from '../../components/common/ScreenHeader';

interface MenuOgesi {
  ikon: keyof typeof Ionicons.glyphMap;
  baslik: string;
  aciklama: string;
  renk: string;
  onPress: () => void;
  sadece?: 'admin' | 'tamUyelik';
}

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const {
    kullanici, cikisYap, uyelikOzetleri, aktifDernegiSec, aktifDernekId, paketAktif, platformYonetici,
  } = useAuth();

  const handleCikis = () => {
    Alert.alert('Çıkış Yap', 'Hesabınızdan çıkmak istediğinize emin misiniz?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Çıkış Yap', style: 'destructive', onPress: cikisYap },
    ]);
  };

  const menuOgeleri: MenuOgesi[] = [
    {
      ikon: 'card-outline',
      baslik: 'Aidat Takibi',
      aciklama: 'Üyelik ödemelerinizi görün',
      renk: Colors.purple,
      onPress: () => navigation.navigate('Membership'),
      sadece: 'tamUyelik',
    },
    {
      ikon: 'calendar-outline',
      baslik: 'Rezervasyonlarım',
      aciklama: 'Oda rezervasyonlarınızı yönetin',
      renk: Colors.info,
      onPress: () => navigation.navigate('Odalar', { screen: 'MyReservations' }),
      sadece: 'tamUyelik',
    },
    {
      ikon: 'book-outline',
      baslik: 'Ödünçlerim',
      aciklama: 'Ödünç aldığınız kitaplar',
      renk: Colors.secondary,
      onPress: () => navigation.navigate('Kutuphane'),
      sadece: 'tamUyelik',
    },
    {
      ikon: 'hand-left-outline',
      baslik: 'Gönüllülük',
      aciklama: 'Gönüllü görevler ve başvurularınız',
      renk: Colors.info,
      onPress: () => navigation.navigate('VolunteerTasks'),
      sadece: 'tamUyelik',
    },
    {
      ikon: 'cube-outline',
      baslik: 'Envanter',
      aciklama: 'Demirbaş listesi ve zimmet',
      renk: Colors.warning,
      onPress: () => navigation.navigate('Inventory'),
      sadece: 'tamUyelik',
    },
    {
      ikon: 'shield-checkmark-outline',
      baslik: 'Yönetici Paneli',
      aciklama: 'Dernek yönetim araçları',
      renk: Colors.gold,
      onPress: () => navigation.navigate('Admin'),
      sadece: 'admin',
    },
  ];

  const platformMenuOgeleri: MenuOgesi[] =
    IS_FIREBASE_CONFIGURED && platformYonetici
      ? [
          {
            ikon: 'globe-outline',
            baslik: 'Platform: dernek başvuruları',
            aciklama: 'Yeni dernek açılışlarını inceleyin ve onaylayın',
            renk: Colors.warning,
            onPress: () => navigation.navigate('PlatformDernekOnay'),
          },
        ]
      : [];

  const gorunurMenuOgeleri = menuOgeleri.filter((item) => {
    if (item.sadece === 'admin') return kullanici?.rol === 'admin';
    if (item.sadece === 'tamUyelik') {
      if (!tamUyeOzelliklerineErisir(kullanici)) return false;
      if (item.baslik === 'Aidat Takibi') return paketAktif('aidat');
      if (item.baslik === 'Rezervasyonlarım') return paketAktif('odalar');
      if (item.baslik === 'Ödünçlerim') return paketAktif('kutuphane');
      if (item.baslik === 'Gönüllülük') return paketAktif('gonulluluk');
      if (item.baslik === 'Envanter') return paketAktif('envanter');
      return true;
    }
    return true;
  });

  const sifreMenuOgesi: MenuOgesi = {
    ikon: 'key-outline',
    baslik: 'Şifre değiştir',
    aciklama: 'Mevcut şifrenizi doğrulayarak yeni şifre belirleyin',
    renk: Colors.primaryLight,
    onPress: () => navigation.navigate('SifreDegistir'),
  };

  return (
    <View style={styles.container}>
      <ScreenHeader baslik="Profil" altBaslik="Hesap bilgileri" />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Profil Kartı */}
        <View style={styles.profilKart}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {kullanici?.ad?.charAt(0)}{kullanici?.soyad?.charAt(0)}
              </Text>
            </View>
            {kullanici?.rol === 'admin' && (
              <View style={styles.adminRozet}>
                <Ionicons name="shield-checkmark" size={12} color={Colors.gold} />
              </View>
            )}
            {kullanici?.rol === 'aday' && (
              <View style={styles.adayRozet}>
                <Ionicons name="hourglass-outline" size={12} color={Colors.warning} />
              </View>
            )}
          </View>

          <Text style={styles.kullaniciAdi}>{kullanici?.ad} {kullanici?.soyad}</Text>
          <Text style={styles.email}>{kullanici?.email}</Text>

          <View style={styles.rozetRow}>
            {kullanici?.rol === 'aday' ? (
              <View style={[styles.rozet, styles.adayRozetStil, styles.adayTekRozet]}>
                <Ionicons name="hourglass-outline" size={12} color={Colors.warning} />
                <Text style={[styles.rozetText, styles.adayRozetText]}>
                  {kullanici.uyelikDurumu === 'pasif'
                    ? 'Aday üye · Pasif'
                    : 'Aday üye · Onay bekliyor'}
                </Text>
              </View>
            ) : (
              <>
                <View style={[
                  styles.rozet,
                  kullanici?.rol === 'admin' && styles.adminRozetStil,
                ]}>
                  <Ionicons
                    name={kullanici?.rol === 'admin' ? 'shield-checkmark' : 'person'}
                    size={12}
                    color={kullanici?.rol === 'admin' ? Colors.gold : Colors.primaryLight}
                  />
                  <Text style={[
                    styles.rozetText,
                    kullanici?.rol === 'admin' && styles.adminRozetText,
                  ]}>
                    {kullanici ? rolGosterimMetni(kullanici.rol) : ''}
                  </Text>
                </View>
                <View style={[
                  styles.rozet,
                  kullanici?.uyelikDurumu === 'aktif' ? styles.aktifRozet :
                  kullanici?.uyelikDurumu === 'beklemede' ? styles.bekleRozet : styles.pasifRozet
                ]}>
                  <Text style={[
                    styles.rozetText,
                    kullanici?.uyelikDurumu === 'aktif' ? { color: Colors.success } :
                    kullanici?.uyelikDurumu === 'beklemede' ? { color: Colors.warning } : { color: Colors.error }
                  ]}>
                    {kullanici?.uyelikDurumu === 'aktif' ? '✓ Aktif Üye' :
                      kullanici?.uyelikDurumu === 'beklemede' ? '⏳ Onay Bekliyor' : '✗ Pasif'}
                  </Text>
                </View>
              </>
            )}
          </View>

          {kullanici?.telefon && (
            <View style={styles.detayRow}>
              <Ionicons name="call-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.detayText}>{kullanici.telefon}</Text>
            </View>
          )}

          <View style={styles.detayRow}>
            <Ionicons name="calendar-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.detayText}>Üyelik: {kullanici?.uyelikBaslangic}</Text>
          </View>
        </View>

        {IS_FIREBASE_CONFIGURED && uyelikOzetleri.length > 1 && (
          <View style={styles.dernekKutu}>
            <Text style={styles.dernekBaslik}>Aktif dernek</Text>
            {uyelikOzetleri.map((o) => (
              <TouchableOpacity
                key={o.dernekId}
                style={[
                  styles.dernekSatir,
                  o.dernekId === aktifDernekId && styles.dernekSatirSecili,
                ]}
                onPress={async () => {
                  if (o.dernekId === aktifDernekId) return;
                  try {
                    await aktifDernegiSec(o.dernekId);
                  } catch (e) {
                    Alert.alert('Hata', e instanceof Error ? e.message : 'Dernek değiştirilemedi.');
                  }
                }}
              >
                <Ionicons
                  name={o.dernekId === aktifDernekId ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={o.dernekId === aktifDernekId ? Colors.primaryLight : Colors.textMuted}
                />
                <Text style={styles.dernekAd}>{o.dernekAd}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Menü */}
        <View style={styles.menu}>
          {[...platformMenuOgeleri, sifreMenuOgesi, ...gorunurMenuOgeleri].map((item, idx) => (
            <TouchableOpacity key={idx} style={styles.menuOge} onPress={item.onPress}>
              <View style={[styles.menuIkon, { backgroundColor: item.renk + '20' }]}>
                <Ionicons name={item.ikon} size={22} color={item.renk} />
              </View>
              <View style={styles.menuBilgi}>
                <Text style={styles.menuBaslik}>{item.baslik}</Text>
                <Text style={styles.menuAciklama}>{item.aciklama}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.cikisButton} onPress={handleCikis}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.cikisText}>Çıkış Yap</Text>
        </TouchableOpacity>

        {Platform.OS === 'android' && Constants.appOwnership === 'expo' && (
          <View style={styles.expogoBilgi}>
            <Ionicons name="notifications-off-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.expogoBilgiText}>
              Expo Go'da anlık bildirimler desteklenmez. Bildirimler almak için development build veya production sürümü kullanın.
            </Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Dernek yönetim uygulaması</Text>
          <Text style={styles.footerAlt}>v1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  profilKart: {
    margin: 16,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarContainer: { position: 'relative', marginBottom: 14 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.primaryLight + '60',
  },
  avatarText: { fontSize: 26, fontWeight: '700', color: Colors.white },
  adminRozet: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primaryDark,
    borderRadius: 10,
    padding: 3,
    borderWidth: 2,
    borderColor: Colors.gold,
  },
  kullaniciAdi: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  email: { fontSize: 13, color: Colors.textSecondary, marginBottom: 12 },
  rozetRow: { flexDirection: 'row', gap: 10, marginBottom: 14, flexWrap: 'wrap', justifyContent: 'center' },
  rozet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: Colors.primary + '20',
  },
  adminRozetStil: { backgroundColor: Colors.gold + '20' },
  aktifRozet: { backgroundColor: Colors.success + '20' },
  bekleRozet: { backgroundColor: Colors.warning + '20' },
  pasifRozet: { backgroundColor: Colors.error + '20' },
  rozetText: { fontSize: 12, fontWeight: '600', color: Colors.primaryLight },
  adminRozetText: { color: Colors.gold },
  adayRozet: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primaryDark,
    borderRadius: 10,
    padding: 3,
    borderWidth: 2,
    borderColor: Colors.warning,
  },
  adayRozetStil: { backgroundColor: Colors.warning + '20' },
  adayTekRozet: { paddingVertical: 6, paddingHorizontal: 14 },
  adayRozetText: { color: Colors.warning },
  detayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  detayText: { fontSize: 13, color: Colors.textMuted },
  dernekKutu: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dernekBaslik: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 10 },
  dernekSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  dernekSatirSecili: { backgroundColor: Colors.primary + '15' },
  dernekAd: { fontSize: 15, color: Colors.text, flex: 1 },
  menu: {
    marginHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  menuOge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuIkon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuBilgi: { flex: 1 },
  menuBaslik: { fontSize: 15, fontWeight: '600', color: Colors.text },
  menuAciklama: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  cikisButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    margin: 16,
    backgroundColor: Colors.error + '15',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.error + '40',
  },
  cikisText: { color: Colors.error, fontSize: 15, fontWeight: '700' },
  footer: { alignItems: 'center', paddingBottom: 24 },
  footerText: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  footerAlt: { fontSize: 11, color: Colors.textMuted + '80', marginTop: 4 },
  expogoBilgi: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  expogoBilgiText: { flex: 1, fontSize: 11, color: Colors.textMuted, lineHeight: 16 },
});
