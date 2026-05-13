import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, TextInput,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { tamUyeOzelliklerineErisir } from '../../utils/userAccess';
import { Colors } from '../../constants/colors';
import ScreenHeader from '../../components/common/ScreenHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { galeridenGorselSec } from '../../utils/galeriSec';
import { bursProgramSuresiAy } from '../../utils/bursSuresi';
import { ibanFormatlaGosterim } from '../../utils/iban';

type RouteParams = { bursId: string };

export default function ScholarshipDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const { bursId } = route.params;
  const { kullanici } = useAuth();
  const { burslar, bursYukle, bursBasvurulari, bursBasvuruYukle, bursBasvur, bursSil, bursBasvuruIbanKaydet } = useData();
  const [yukleniyor, setYukleniyor] = useState(false);
  const [ibanTaslak, setIbanTaslak] = useState('');
  const [ibanKaydediliyor, setIbanKaydediliyor] = useState(false);
  /** Belge alanı id → yerel önizleme URI */
  const [yerelBelgeler, setYerelBelgeler] = useState<Record<string, string>>({});

  const burs = burslar.find(b => b.id === bursId);
  const basvurumVar = bursBasvurulari.find(
    b => b.bursId === bursId && b.kullaniciId === kullanici?.id
  );
  const buBursaBasvuruSayisi = bursBasvurulari.filter(b => b.bursId === bursId).length;
  const sonBasvuruGecti = burs && new Date(burs.sonBasvuruTarihi) < new Date();

  useEffect(() => {
    bursYukle();
    bursBasvuruYukle();
  }, []);

  useEffect(() => {
    if (basvurumVar?.iban) setIbanTaslak(ibanFormatlaGosterim(basvurumVar.iban));
    else setIbanTaslak('');
  }, [basvurumVar?.id, basvurumVar?.iban]);

  const odemeMetni = () => {
    if (!basvurumVar || basvurumVar.durum !== 'onaylandi') return null;
    if (!basvurumVar.iban) {
      return 'Burs ödemesi için aşağıdan geçerli IBAN bilginizi kaydedin.';
    }
    if (basvurumVar.bursOdemeDurumu === 'yatirildi') {
      return `Burs ödemesi yatırıldı${basvurumVar.bursOdemeTarihi ? ` (${basvurumVar.bursOdemeTarihi})` : ''}.`;
    }
    return 'IBAN kaydınız alındı. Ödeme dernek tarafından hesabınıza yatırıldığında burada güncellenecektir.';
  };

  const gerekliBelgeler = burs?.gerekliBelgeler ?? [];
  const belgeZorunlu = gerekliBelgeler.length > 0;

  const tumBelgelerYuklendi = () => {
    if (!belgeZorunlu) return true;
    return gerekliBelgeler.every(g => Boolean(yerelBelgeler[g.id]?.trim()));
  };

  const handleBasvur = async () => {
    if (!kullanici || !burs) return;
    if (belgeZorunlu && !tumBelgelerYuklendi()) {
      Alert.alert('Eksik belge', 'Lütfen istenen tüm belgeleri ayrı ayrı yükleyin.');
      return;
    }
    Alert.alert(
      'Bursa Başvur',
      `"${burs.ad}" bursuna başvurmak istediğinize emin misiniz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Başvur',
          onPress: async () => {
            setYukleniyor(true);
            try {
              await bursBasvur(bursId, burs.ad, kullanici.id, `${kullanici.ad} ${kullanici.soyad}`, {
                belgelerYerel: belgeZorunlu ? yerelBelgeler : {},
              });
              setYerelBelgeler({});
              Alert.alert(
                'Başarılı',
                belgeZorunlu ? 'Başvurunuz ve belgeleriniz alındı. İnceleme sonucu bildirilecektir.' : 'Başvurunuz alındı.',
              );
            } catch (error: unknown) {
              const mesaj = error instanceof Error ? error.message : 'Başvuru yapılamadı.';
              Alert.alert('Hata', mesaj);
            } finally {
              setYukleniyor(false);
            }
          },
        },
      ]
    );
  };

  const bursuKaldir = () => {
    if (!burs) return;
    Alert.alert(
      'Bursu kaldır',
      `"${burs.ad}" programını ve bağlı ${buBursaBasvuruSayisi} başvuruyu kalıcı olarak silmek istediğinize emin misiniz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Kaldır',
          style: 'destructive',
          onPress: async () => {
            try {
              await bursSil(burs.id);
              Alert.alert('Kaldırıldı', 'Burs programı silindi.', [{ text: 'Tamam', onPress: () => navigation.goBack() }]);
            } catch {
              Alert.alert('Hata', 'Burs kaldırılamadı.');
            }
          },
        },
      ],
    );
  };

  if (!burs) {
    return (
      <View style={styles.container}>
        <ScreenHeader baslik="Burs Detayı" geriButon />
        <View style={styles.merkez}><Text style={styles.hataText}>Burs bulunamadı.</Text></View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader baslik="Burs Detayı" geriButon />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.bursHeader}>
          <View style={styles.bursIkon}>
            <Ionicons name="school" size={48} color={Colors.gold} />
          </View>
          <Text style={styles.bursAdi}>{burs.ad}</Text>
          <Text style={styles.bursSaglayan}>{burs.saglayanKurum}</Text>
          <StatusBadge durum={burs.durum === 'aktif' ? 'aktif' : 'kapali'} />
        </View>

        <View style={styles.miktarCard}>
          <Ionicons name="cash-outline" size={28} color={Colors.gold} />
          <View>
            <Text style={styles.miktarLabel}>Burs Miktarı</Text>
            <Text style={styles.miktarDeger}>₺{burs.miktar.toLocaleString('tr-TR')}</Text>
          </View>
        </View>

        <View style={styles.sureCard}>
          <Ionicons name="hourglass-outline" size={22} color={Colors.primaryLight} />
          <View style={{ flex: 1 }}>
            <Text style={styles.sureLabel}>Program süresi</Text>
            <Text style={styles.sureDeger}>{bursProgramSuresiAy(burs)} ay</Text>
            <Text style={styles.sureAciklama}>
              Onaylı başvurularda burs desteğinin bu süre boyunca geçerli olduğu kabul edilir.
            </Text>
          </View>
        </View>

        <View style={styles.bilgiCard}>
          <Text style={styles.bilgiBaslik}>Açıklama</Text>
          <Text style={styles.bilgiText}>{burs.aciklama}</Text>
        </View>

        <View style={styles.bilgiCard}>
          <Text style={styles.bilgiBaslik}>Başvuru Gereksinimleri</Text>
          {burs.gereksinimler.map((ger, idx) => (
            <View key={idx} style={styles.gereksinimRow}>
              <Ionicons name="checkmark-circle-outline" size={16} color={Colors.success} />
              <Text style={styles.gereksinimText}>{ger}</Text>
            </View>
          ))}
        </View>

        {belgeZorunlu && (
          <View style={styles.bilgiCard}>
            <Text style={styles.bilgiBaslik}>Başvuruda yüklenecek belgeler</Text>
            {gerekliBelgeler.map(ger => (
              <View key={ger.id} style={styles.gereksinimRow}>
                <Ionicons name="document-text-outline" size={16} color={Colors.primaryLight} />
                <Text style={styles.gereksinimText}>{ger.baslik}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.tarihCard}>
          <Ionicons
            name={sonBasvuruGecti ? 'close-circle' : 'calendar-outline'}
            size={20}
            color={sonBasvuruGecti ? Colors.error : Colors.warning}
          />
          <View>
            <Text style={styles.tarihLabel}>Son Başvuru Tarihi</Text>
            <Text style={[styles.tarihDeger, sonBasvuruGecti && { color: Colors.error }]}>
              {burs.sonBasvuruTarihi}
              {sonBasvuruGecti ? ' - Süre Doldu' : ''}
            </Text>
          </View>
        </View>

        {basvurumVar ? (
          <>
            <View style={styles.basvuruDurumCard}>
              <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
              <View style={{ flex: 1 }}>
                <Text style={styles.basvuruDurumText}>Başvurunuz Alındı</Text>
                <Text style={styles.basvuruTarih}>Başvuru tarihi: {basvurumVar.basvuruTarihi}</Text>
              </View>
              <StatusBadge durum={basvurumVar.durum} kucuk />
            </View>
            {basvurumVar.belgelerUri && Object.keys(basvurumVar.belgelerUri).length > 0 ? (
              Object.entries(basvurumVar.belgelerUri).map(([kid, uri]) => {
                if (!uri) return null;
                const baslik = gerekliBelgeler.find(g => g.id === kid)?.baslik ?? kid;
                return (
                  <View key={kid} style={styles.belgeOnizlemeCard}>
                    <Text style={styles.belgeOnizlemeBaslik}>{baslik}</Text>
                    <Image source={{ uri }} style={styles.belgeOnizlemeImg} resizeMode="contain" />
                  </View>
                );
              })
            ) : basvurumVar.belgeUri ? (
              <View style={styles.belgeOnizlemeCard}>
                <Text style={styles.belgeOnizlemeBaslik}>Gönderdiğiniz belge (eski kayıt)</Text>
                <Image source={{ uri: basvurumVar.belgeUri }} style={styles.belgeOnizlemeImg} resizeMode="contain" />
              </View>
            ) : null}
            {basvurumVar.durum === 'onaylandi' && (
              <View style={styles.ibanCard}>
                <Text style={styles.ibanBaslik}>Ödeme için IBAN</Text>
                <Text style={styles.ibanAciklama}>
                  Onaylanan başvurunuz için bursun yatırılacağı hesabın IBAN’ını girin. Bu bilgi yalnızca yönetim kurulunca görüntülenir.
                </Text>
                <TextInput
                  style={styles.ibanInput}
                  placeholder="TR00 0000 0000 0000 0000 0000 00"
                  placeholderTextColor={Colors.textMuted}
                  value={ibanTaslak}
                  onChangeText={setIbanTaslak}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
                {basvurumVar.iban ? (
                  <Text style={styles.ibanKayitBilgi}>
                    Son kayıt{basvurumVar.ibanGuncellenmeTarihi ? `: ${basvurumVar.ibanGuncellenmeTarihi}` : ''}
                  </Text>
                ) : null}
                <TouchableOpacity
                  style={[styles.ibanKaydetBtn, (ibanKaydediliyor || !kullanici) && { opacity: 0.55 }]}
                  disabled={ibanKaydediliyor || !kullanici}
                  onPress={async () => {
                    if (!kullanici) return;
                    setIbanKaydediliyor(true);
                    try {
                      await bursBasvuruIbanKaydet(basvurumVar.id, kullanici.id, ibanTaslak);
                      Alert.alert('Kaydedildi', 'IBAN bilginiz güncellendi.');
                    } catch (e) {
                      Alert.alert('Hata', e instanceof Error ? e.message : 'Kayıt başarısız.');
                    } finally {
                      setIbanKaydediliyor(false);
                    }
                  }}
                >
                  <Ionicons name="save-outline" size={18} color={Colors.white} />
                  <Text style={styles.ibanKaydetText}>
                    {ibanKaydediliyor ? 'Kaydediliyor...' : basvurumVar.iban ? 'IBAN’ı güncelle' : 'IBAN’ı kaydet'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            {odemeMetni() ? (
              <View style={styles.odemeCard}>
                <Ionicons
                  name={basvurumVar.bursOdemeDurumu === 'yatirildi' ? 'checkmark-done-circle' : 'wallet-outline'}
                  size={22}
                  color={basvurumVar.bursOdemeDurumu === 'yatirildi' ? Colors.success : Colors.warning}
                />
                <Text style={styles.odemeCardText}>{odemeMetni()}</Text>
              </View>
            ) : null}
          </>
        ) : (
          tamUyeOzelliklerineErisir(kullanici) && !sonBasvuruGecti && burs.durum === 'aktif' && (
            <>
              {belgeZorunlu ? (
                <View style={styles.belgeCard}>
                  <Text style={styles.belgeBaslik}>Belgeler *</Text>
                  <Text style={styles.belgeAciklama}>
                    Her belge türü için ayrı ayrı galeriden net fotoğraf seçin.
                  </Text>
                  {gerekliBelgeler.map(ger => (
                    <View key={ger.id} style={styles.belgeSlot}>
                      <Text style={styles.belgeSlotBaslik}>{ger.baslik}</Text>
                      <View style={styles.belgeSatir}>
                        <TouchableOpacity
                          style={styles.belgeBtn}
                          onPress={async () => {
                            const uri = await galeridenGorselSec();
                            if (uri) setYerelBelgeler(prev => ({ ...prev, [ger.id]: uri }));
                          }}
                        >
                          <Ionicons name="image-outline" size={18} color={Colors.primaryLight} />
                          <Text style={styles.belgeBtnText}>
                            {yerelBelgeler[ger.id] ? 'Değiştir' : 'Galeriden seç'}
                          </Text>
                        </TouchableOpacity>
                        {yerelBelgeler[ger.id] ? (
                          <TouchableOpacity onPress={() => setYerelBelgeler(prev => {
                            const n = { ...prev };
                            delete n[ger.id];
                            return n;
                          })}>
                            <Text style={styles.belgeKaldir}>Kaldır</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                      {yerelBelgeler[ger.id] ? (
                        <Image source={{ uri: yerelBelgeler[ger.id] }} style={styles.belgeSlotOnizleme} resizeMode="contain" />
                      ) : null}
                    </View>
                  ))}
                </View>
              ) : (
                <View style={[styles.belgeCard, { marginBottom: 12 }]}>
                  <Text style={styles.belgeAciklama}>
                    Bu program için belge yüklemesi istenmiyor; doğrudan başvurabilirsiniz.
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={[styles.basvurButton, ((!belgeZorunlu || tumBelgelerYuklendi()) ? {} : { opacity: 0.55 }), yukleniyor && { opacity: 0.55 }]}
                onPress={handleBasvur}
                disabled={yukleniyor || (belgeZorunlu && !tumBelgelerYuklendi())}
              >
                <Ionicons name="send-outline" size={20} color={Colors.white} />
                <Text style={styles.basvurButtonText}>
                  {yukleniyor ? 'Gönderiliyor...' : 'Başvur'}
                </Text>
              </TouchableOpacity>
            </>
          )
        )}

        {kullanici?.rol === 'admin' && (
          <View style={styles.adminSilWrap}>
            <Text style={styles.adminSilBaslik}>Yönetici</Text>
            <Text style={styles.adminSilAciklama}>
              Bu programı listeden kaldırır; tüm başvuru kayıtları da silinir.
            </Text>
            <TouchableOpacity style={styles.adminSilBtn} onPress={bursuKaldir}>
              <Ionicons name="trash-outline" size={20} color={Colors.white} />
              <Text style={styles.adminSilBtnText}>Burs programını kaldır</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  merkez: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hataText: { color: Colors.textMuted },
  bursHeader: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  bursIkon: {
    width: 88,
    height: 88,
    backgroundColor: Colors.gold + '20',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: Colors.gold + '40',
  },
  bursAdi: { fontSize: 20, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  bursSaglayan: { fontSize: 13, color: Colors.textSecondary },
  miktarCard: {
    margin: 16,
    backgroundColor: Colors.gold + '15',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.gold + '40',
  },
  miktarLabel: { fontSize: 12, color: Colors.textMuted },
  miktarDeger: { fontSize: 24, fontWeight: '700', color: Colors.gold },
  sureCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: Colors.primary + '12',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  sureLabel: { fontSize: 12, color: Colors.textMuted },
  sureDeger: { fontSize: 18, fontWeight: '700', color: Colors.primaryLight, marginTop: 2 },
  sureAciklama: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18, marginTop: 6 },
  bilgiCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bilgiBaslik: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 10 },
  bilgiText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  gereksinimRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  gereksinimText: { flex: 1, fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  tarihCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: Colors.warning + '15',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.warning + '40',
  },
  tarihLabel: { fontSize: 12, color: Colors.textMuted },
  tarihDeger: { fontSize: 15, fontWeight: '700', color: Colors.warning },
  basvuruDurumCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: Colors.success + '15',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.success + '40',
  },
  basvuruDurumText: { fontSize: 14, fontWeight: '700', color: Colors.success },
  basvuruTarih: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  belgeOnizlemeCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  belgeOnizlemeBaslik: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 },
  belgeOnizlemeImg: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    backgroundColor: Colors.surfaceVariant,
  },
  odemeCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  odemeCardText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  ibanCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: Colors.info + '12',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.info + '40',
  },
  ibanBaslik: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  ibanAciklama: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18, marginBottom: 12 },
  ibanInput: {
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 12,
    padding: 14,
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  ibanKayitBilgi: { fontSize: 11, color: Colors.textMuted, marginBottom: 12 },
  ibanKaydetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.info,
    borderRadius: 12,
    padding: 14,
  },
  ibanKaydetText: { color: Colors.white, fontSize: 14, fontWeight: '700' },
  belgeCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  belgeBaslik: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  belgeAciklama: { fontSize: 12, color: Colors.textMuted, lineHeight: 18, marginBottom: 12 },
  belgeSatir: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 8 },
  belgeBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  belgeBtnText: { fontSize: 14, fontWeight: '600', color: Colors.primaryLight },
  belgeKaldir: { fontSize: 14, fontWeight: '600', color: Colors.error },
  belgeSlot: {
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  belgeSlotBaslik: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  belgeSlotOnizleme: {
    width: '100%',
    height: 160,
    borderRadius: 10,
    marginTop: 10,
    backgroundColor: Colors.surfaceVariant,
  },
  basvurButton: {
    marginHorizontal: 16,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  basvurButtonText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  adminSilWrap: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 14,
    backgroundColor: Colors.error + '12',
    borderWidth: 1,
    borderColor: Colors.error + '45',
  },
  adminSilBaslik: { fontSize: 13, fontWeight: '700', color: Colors.error, marginBottom: 6 },
  adminSilAciklama: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18, marginBottom: 14 },
  adminSilBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.error,
    borderRadius: 12,
    padding: 14,
  },
  adminSilBtnText: { color: Colors.white, fontSize: 14, fontWeight: '700' },
});
