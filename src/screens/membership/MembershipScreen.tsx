import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';
import ScreenHeader from '../../components/common/ScreenHeader';
import EmptyState from '../../components/common/EmptyState';
import { uploadFileToStorage, timestampedFileName } from '../../utils/storageUpload';
import {
  birlestirAylikAidat,
  aidatDurumuEtiketi,
  ayEtiketi,
  aySonOdemeTarihi,
  type AylikAidatSlot,
} from '../../utils/aidatAylik';

function durumRengi(d: ReturnType<typeof aidatDurumuEtiketi>) {
  switch (d) {
    case 'tamam':
      return Colors.success;
    case 'onay_bekliyor':
      return Colors.warning;
    case 'red':
      return Colors.error;
    default:
      return Colors.textMuted;
  }
}

function durumMetni(d: ReturnType<typeof aidatDurumuEtiketi>) {
  switch (d) {
    case 'tamam':
      return 'Ödendi';
    case 'onay_bekliyor':
      return 'Dekont inceleniyor';
    case 'red':
      return 'Dekont reddedildi';
    default:
      return 'Ödeme bekleniyor';
  }
}

export default function MembershipScreen() {
  const { kullanici, aktifDernekId } = useAuth();
  const { aidatOdemeleri, aidatYukle, aidatEkle, aidatGuncelle, aidatAylikMiktari } = useData();
  const [listeYukleniyor, setListeYukleniyor] = useState(false);
  const [dekontYukleniyorAnahtar, setDekontYukleniyorAnahtar] = useState<string | null>(null);

  useEffect(() => {
    yukle();
  }, []);

  const yukle = async () => {
    setListeYukleniyor(true);
    await aidatYukle();
    setListeYukleniyor(false);
  };

  const aylikListe = useMemo(
    () => (kullanici?.id ? birlestirAylikAidat(kullanici.id, aidatOdemeleri) : []),
    [kullanici?.id, aidatOdemeleri],
  );

  const toplamBorc = useMemo(
    () =>
      aylikListe.reduce((acc, s) => {
        if (aidatDurumuEtiketi(s.kayit) === 'tamam') return acc;
        return acc + (s.kayit?.miktar ?? aidatAylikMiktari);
      }, 0),
    [aidatAylikMiktari, aylikListe],
  );

  const dekontYukle = useCallback(
    async (slot: AylikAidatSlot) => {
      if (!kullanici?.id) return;
      const anahtar = `${slot.yil}-${slot.ay}`;
      const izin = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!izin.granted) {
        Alert.alert('İzin gerekli', 'Dekont seçmek için galeri erişimine izin verin.');
        return;
      }
      const sonuc = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
      });
      if (sonuc.canceled || !sonuc.assets?.[0]?.uri) return;

      setDekontYukleniyorAnahtar(anahtar);
      try {
        const tid = aktifDernekId ?? 'genel';
        const dataUri = await uploadFileToStorage(
          sonuc.assets[0].uri,
          `aidatDekontlar/${tid}/${kullanici.id}/${timestampedFileName(`${slot.yil}_${slot.ay}`)}`,
        );
        const yuklenme = new Date().toISOString();

        let kayitId = slot.kayit?.id;
        if (!kayitId) {
          kayitId = await aidatEkle({
            kullaniciId: kullanici.id,
            kullaniciAdi: `${kullanici.ad} ${kullanici.soyad}`,
            yil: slot.yil,
            ay: slot.ay,
            miktar: aidatAylikMiktari,
            odendi: false,
            sonOdemeTarihi: aySonOdemeTarihi(slot.yil, slot.ay),
          });
        }
        await aidatGuncelle(kayitId, {
          dekontUri: dataUri,
          dekontYuklenmeTarihi: yuklenme,
        });
        Alert.alert('Gönderildi', 'Dekontunuz yönetici onayına iletildi.');
      } catch (e) {
        const mesaj = e instanceof Error ? e.message : 'Bilinmeyen hata';
        Alert.alert('Hata', mesaj);
      } finally {
        setDekontYukleniyorAnahtar(null);
      }
    },
    [aidatAylikMiktari, aidatEkle, aidatGuncelle, kullanici],
  );

  const renderSatir = useCallback(
    ({ item: slot }: { item: AylikAidatSlot }) => {
      const durum = aidatDurumuEtiketi(slot.kayit);
      const miktar = slot.kayit?.miktar ?? aidatAylikMiktari;
      const anahtar = `${slot.yil}-${slot.ay}`;
      const yukleniyor = dekontYukleniyorAnahtar === anahtar;

      return (
        <View
          style={[
            styles.aidatKart,
            durum === 'tamam' && styles.odenmiKart,
            durum === 'onay_bekliyor' && styles.onayBekliyorKart,
            durum === 'red' && styles.redKart,
          ]}
        >
          <View style={styles.aidatHeader}>
            <View style={styles.aidatIkon}>
              <Ionicons
                name={durum === 'tamam' ? 'checkmark-circle' : 'calendar-outline'}
                size={22}
                color={durumRengi(durum)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.aidatBaslik}>{ayEtiketi(slot.yil, slot.ay)}</Text>
              <Text style={styles.aidatTarih}>
                Son ödeme: {slot.kayit?.sonOdemeTarihi ?? aySonOdemeTarihi(slot.yil, slot.ay)}
              </Text>
              {slot.kayit?.odendi && slot.kayit.odemeTarihi && (
                <Text style={styles.odemeOnay}>
                  Ödeme: {slot.kayit.odemeTarihi}
                  {slot.kayit.onaylayanAdminAdi ? ` · Onay: ${slot.kayit.onaylayanAdminAdi}` : ''}
                </Text>
              )}
              {durum === 'red' && slot.kayit?.redAciklamasi ? (
                <Text style={styles.redMetin}>{slot.kayit.redAciklamasi}</Text>
              ) : null}
            </View>
            <View style={styles.aidatMiktar}>
              <Text style={[styles.aidatMiktarText, durum !== 'tamam' && styles.odenmemiMiktar]}>
                ₺{miktar.toLocaleString('tr-TR')}
              </Text>
              <View style={[styles.rozet, { backgroundColor: durumRengi(durum) + '22' }]}>
                <Text style={[styles.rozetText, { color: durumRengi(durum) }]}>{durumMetni(durum)}</Text>
              </View>
            </View>
          </View>

          {slot.kayit?.dekontUri && durum !== 'tamam' ? (
            <Image source={{ uri: slot.kayit.dekontUri }} style={styles.dekontOnizleme} resizeMode="cover" />
          ) : null}

          {durum !== 'tamam' && durum !== 'onay_bekliyor' ? (
            <TouchableOpacity
              style={[styles.dekontButon, yukleniyor && { opacity: 0.65 }]}
              onPress={() => dekontYukle(slot)}
              disabled={yukleniyor}
            >
              {yukleniyor ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={18} color={Colors.white} />
                  <Text style={styles.dekontButonText}>
                    {durum === 'red' ? 'Yeni dekont yükle' : 'Dekont yükle ve ödeme bildir'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          ) : null}
        </View>
      );
    },
    [aidatAylikMiktari, dekontYukleniyorAnahtar, dekontYukle],
  );

  if (!kullanici?.id) {
    return (
      <View style={styles.container}>
        <ScreenHeader baslik="Aidat Takibi" altBaslik="Üyelik ödemeleri" geriButon />
        <EmptyState ikon="person-outline" baslik="Giriş gerekli" aciklama="Aidatları görmek için oturum açın." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader baslik="Aidat Takibi" altBaslik="2025 Ocak’tan itibaren aylık" geriButon />

      <View style={styles.ozet}>
        <View style={[styles.ozetKart, styles.uyelikDurum]}>
          <Ionicons
            name={kullanici.uyelikDurumu === 'aktif' ? 'shield-checkmark' : 'shield-outline'}
            size={28}
            color={kullanici.uyelikDurumu === 'aktif' ? Colors.success : Colors.warning}
          />
          <View>
            <Text style={styles.ozetLabel}>Üyelik durumu</Text>
            <Text
              style={[styles.ozetDeger, kullanici.uyelikDurumu !== 'aktif' && { color: Colors.warning }]}
            >
              {kullanici.uyelikDurumu === 'aktif'
                ? 'Aktif'
                : kullanici.uyelikDurumu === 'beklemede'
                  ? 'Onay bekliyor'
                  : 'Pasif'}
            </Text>
          </View>
        </View>

        {toplamBorc > 0 ? (
          <View style={[styles.ozetKart, styles.borcDurum]}>
            <Ionicons name="alert-circle-outline" size={28} color={Colors.error} />
            <View>
              <Text style={styles.ozetLabel}>Tamamlanmamış aylar</Text>
              <Text style={[styles.ozetDeger, { color: Colors.error }]}>
                ₺{toplamBorc.toLocaleString('tr-TR')}
              </Text>
            </View>
          </View>
        ) : null}
      </View>

      <FlatList
        data={aylikListe}
        keyExtractor={s => `${s.yil}-${s.ay}`}
        renderItem={renderSatir}
        contentContainerStyle={styles.liste}
        refreshControl={
          <RefreshControl refreshing={listeYukleniyor} onRefresh={yukle} tintColor={Colors.primary} />
        }
        ListHeaderComponent={
          aylikListe.length > 0 ? <Text style={styles.listeBaslik}>Aylık aidat</Text> : null
        }
        ListEmptyComponent={
          <EmptyState ikon="calendar-outline" baslik="Kayıt yok" aciklama="Henüz görüntülenecek ay yok." />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  ozet: { flexDirection: 'row', padding: 16, gap: 12 },
  ozetKart: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
  },
  uyelikDurum: { borderColor: Colors.success + '40' },
  borcDurum: { borderColor: Colors.error + '40' },
  ozetLabel: { fontSize: 11, color: Colors.textMuted, marginBottom: 3 },
  ozetDeger: { fontSize: 16, fontWeight: '700', color: Colors.success },
  listeBaslik: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  liste: { padding: 16, paddingBottom: 32 },
  aidatKart: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  odenmiKart: { borderColor: Colors.success + '35', opacity: 0.92 },
  onayBekliyorKart: { borderColor: Colors.warning + '50' },
  redKart: { borderColor: Colors.error + '45' },
  aidatHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  aidatIkon: {
    width: 44,
    height: 44,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aidatBaslik: { fontSize: 15, fontWeight: '700', color: Colors.text },
  aidatTarih: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  odemeOnay: { fontSize: 11, color: Colors.textSecondary, marginTop: 4 },
  redMetin: { fontSize: 12, color: Colors.error, marginTop: 6 },
  aidatMiktar: { alignItems: 'flex-end', minWidth: 88 },
  aidatMiktarText: { fontSize: 16, fontWeight: '700', color: Colors.text },
  odenmemiMiktar: { color: Colors.error },
  rozet: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6,
  },
  rozetText: { fontSize: 10, fontWeight: '700' },
  dekontOnizleme: {
    width: '100%',
    height: 160,
    borderRadius: 10,
    marginTop: 12,
    backgroundColor: Colors.surfaceVariant,
  },
  dekontButon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  dekontButonText: { color: Colors.white, fontSize: 13, fontWeight: '600' },
});
