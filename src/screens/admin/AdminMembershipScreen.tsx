import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { AidatOdemesi, User } from '../../types';
import { Colors } from '../../constants/colors';
import ScreenHeader from '../../components/common/ScreenHeader';
import EmptyState from '../../components/common/EmptyState';
import {
  ayEtiketi,
  birlestirAylikAidat,
  aidatDurumuEtiketi,
  type AylikAidatSlot,
} from '../../utils/aidatAylik';

type Filtre = 'dekont' | 'odenmemis' | 'odenmis' | 'tum';

interface OdenmemisUyeGrubu {
  kullaniciId: string;
  kullaniciAdi: string;
  /** Ocak 2025’ten bugüne tamamlanmamış aylar (üye ekranı ile aynı mantık) */
  borcluSlotlar: AylikAidatSlot[];
  aySayisi: number;
  toplamTutar: number;
}

type ListeElemani =
  | { tur: 'grup'; grup: OdenmemisUyeGrubu }
  | { tur: 'tek'; aidat: AidatOdemesi };

/** Aidat kaydı olmasa bile Ocak 2025’ten bugüne borçlu ayları sayar (üye aidat ekranı ile uyumlu). */
function teorikOdenmemisGrupla(
  aidatlar: AidatOdemesi[],
  uyeler: User[],
  varsayilanMiktar: number,
): OdenmemisUyeGrubu[] {
  const aidatUyeleri = uyeler.filter(
    (u) => u.rol === 'uye' && (u.uyelikDurumu === 'aktif' || u.uyelikDurumu === 'beklemede'),
  );
  const gruplar: OdenmemisUyeGrubu[] = [];
  for (const u of aidatUyeleri) {
    const slotlar = birlestirAylikAidat(u.id, aidatlar);
    const borcluSlotlar = slotlar.filter((s) => aidatDurumuEtiketi(s.kayit) !== 'tamam');
    if (borcluSlotlar.length === 0) continue;
    const toplamTutar = borcluSlotlar.reduce(
      (s, slot) => s + (slot.kayit?.miktar ?? varsayilanMiktar),
      0,
    );
    gruplar.push({
      kullaniciId: u.id,
      kullaniciAdi: `${u.ad} ${u.soyad}`,
      borcluSlotlar,
      aySayisi: borcluSlotlar.length,
      toplamTutar,
    });
  }
  return gruplar.sort(
    (a, b) => b.toplamTutar - a.toplamTutar || a.kullaniciAdi.localeCompare(b.kullaniciAdi, 'tr'),
  );
}

export default function AdminMembershipScreen() {
  const { kullanici } = useAuth();
  const {
    aidatOdemeleri,
    aidatYukle,
    aidatOnayla,
    aidatReddet,
    aidatOde,
    kullanicilar,
    kullaniciYukle,
    aidatAylikMiktari,
    aidatAylikMiktariGuncelle,
  } = useData();
  const [yukleniyor, setYukleniyor] = useState(false);
  const [aylikMiktarTaslak, setAylikMiktarTaslak] = useState('');
  const [miktarKaydediliyor, setMiktarKaydediliyor] = useState(false);
  const [filtre, setFiltre] = useState<Filtre>('dekont');
  const [redModal, setRedModal] = useState<{ id: string; ad: string } | null>(null);
  const [redAciklama, setRedAciklama] = useState('');
  const [genisletilmisUyeId, setGenisletilmisUyeId] = useState<string | null>(null);
  const [dekontModal, setDekontModal] = useState<{ uri: string; baslik: string } | null>(null);
  const [aylikTutarAyarAcik, setAylikTutarAyarAcik] = useState(false);

  useEffect(() => {
    yukle();
  }, []);

  useEffect(() => {
    setAylikMiktarTaslak(String(aidatAylikMiktari));
  }, [aidatAylikMiktari]);

  const yukle = async () => {
    setYukleniyor(true);
    await Promise.all([aidatYukle(), kullaniciYukle()]);
    setYukleniyor(false);
  };

  const odenmemisGruplar = useMemo(
    () => teorikOdenmemisGrupla(aidatOdemeleri, kullanicilar, aidatAylikMiktari),
    [aidatOdemeleri, kullanicilar, aidatAylikMiktari],
  );

  const borcluUyeSayisi = odenmemisGruplar.length;

  const toplamBorcluAy = useMemo(
    () => odenmemisGruplar.reduce((n, g) => n + g.aySayisi, 0),
    [odenmemisGruplar],
  );

  const toplamOdenmemis = useMemo(
    () => odenmemisGruplar.reduce((acc, g) => acc + g.toplamTutar, 0),
    [odenmemisGruplar],
  );

  const listeVerisi: ListeElemani[] = useMemo(() => {
    if (filtre === 'odenmemis') {
      return odenmemisGruplar.map((grup) => ({ tur: 'grup', grup }));
    }
    const liste = aidatOdemeleri
      .filter((a) => {
        if (filtre === 'odenmis') return a.odendi;
        if (filtre === 'dekont') return !a.odendi && !!a.dekontUri;
        return true;
      })
      .sort((a, b) => b.yil - a.yil || (b.ay ?? 0) - (a.ay ?? 0));
    return liste.map((aidat) => ({ tur: 'tek', aidat }));
  }, [aidatOdemeleri, filtre, odenmemisGruplar]);

  const dekontBekleyenSayi = aidatOdemeleri.filter((a) => !a.odendi && !!a.dekontUri).length;

  const onayla = useCallback(
    async (id: string) => {
      if (!kullanici?.id) return;
      try {
        await aidatOnayla(id, kullanici.id, `${kullanici.ad} ${kullanici.soyad}`);
        Alert.alert('Tamam', 'Aidat onaylandı.');
      } catch {
        Alert.alert('Hata', 'Onay kaydedilemedi.');
      }
    },
    [aidatOnayla, kullanici],
  );

  const reddetGonder = useCallback(async () => {
    if (!redModal) return;
    try {
      await aidatReddet(redModal.id, redAciklama.trim());
      setRedModal(null);
      setRedAciklama('');
      Alert.alert('Tamam', 'Dekont reddedildi; üye yeni dekont yükleyebilir.');
    } catch {
      Alert.alert('Hata', 'Red kaydedilemedi.');
    }
  }, [aidatReddet, redAciklama, redModal]);

  const manuelOde = useCallback(
    (item: AidatOdemesi) => {
      Alert.alert(
        'Manuel ödeme',
        `${item.kullaniciAdi} — ${ayEtiketi(item.yil, item.ay)} kaydını ödendi yapmak istiyor musunuz?`,
        [
          { text: 'Vazgeç', style: 'cancel' },
          {
            text: 'Ödendi işaretle',
            onPress: async () => {
              try {
                await aidatOde(item.id);
              } catch {
                Alert.alert('Hata', 'Güncellenemedi.');
              }
            },
          },
        ],
      );
    },
    [aidatOde],
  );

  const dekontButonu = useCallback(
    (a: AidatOdemesi) => {
      if (!a.dekontUri) return null;
      return (
        <TouchableOpacity
          style={styles.dekontGosterBtn}
          onPress={() =>
            setDekontModal({
              uri: a.dekontUri!,
              baslik: `${a.kullaniciAdi} · ${ayEtiketi(a.yil, a.ay)}`,
            })
          }
        >
          <Ionicons name="image-outline" size={18} color={Colors.primaryLight} />
          <Text style={styles.dekontGosterBtnText}>Dekontu göster</Text>
        </TouchableOpacity>
      );
    },
    [],
  );

  const renderTekAidat = useCallback(
    (item: AidatOdemesi) => {
      const dekontVar = !!item.dekontUri && !item.odendi;

      return (
        <View style={[styles.aidatKart, !item.odendi && styles.odenmemisKart]}>
          <View style={styles.aidatHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.kullaniciAdi}>{item.kullaniciAdi}</Text>
              <Text style={styles.aidatYil}>{ayEtiketi(item.yil, item.ay)}</Text>
              <Text style={styles.tutarSatir}>₺{item.miktar.toLocaleString('tr-TR')}</Text>
            </View>
            {item.odendi ? (
              <View style={styles.onayRozet}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                <Text style={styles.onayRozetText}>Ödendi</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.tarihRow}>
            <Ionicons
              name={item.odendi ? 'calendar-outline' : 'time-outline'}
              size={13}
              color={item.odendi ? Colors.success : Colors.warning}
            />
            <Text style={styles.tarihText}>
              {item.odendi
                ? `Ödeme: ${item.odemeTarihi ?? '-'}`
                : `Son ödeme: ${item.sonOdemeTarihi}`}
            </Text>
          </View>

          {item.redAciklamasi ? <Text style={styles.redNot}>Son red: {item.redAciklamasi}</Text> : null}

          {dekontButonu(item)}

          {!item.odendi ? (
            <View style={styles.aksiyonlar}>
              {dekontVar ? (
                <>
                  <TouchableOpacity style={styles.onayBtn} onPress={() => onayla(item.id)}>
                    <Ionicons name="checkmark-done" size={18} color={Colors.white} />
                    <Text style={styles.onayBtnText}>Dekontu onayla</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.redBtn}
                    onPress={() => setRedModal({ id: item.id, ad: item.kullaniciAdi })}
                  >
                    <Text style={styles.redBtnText}>Reddet</Text>
                  </TouchableOpacity>
                </>
              ) : null}
              <TouchableOpacity style={styles.manuelBtn} onPress={() => manuelOde(item)}>
                <Text style={styles.manuelBtnText}>Manuel ödendi</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      );
    },
    [dekontButonu, manuelOde, onayla],
  );

  const renderGrup = useCallback(
    ({ grup }: { grup: OdenmemisUyeGrubu }) => {
      const acik = genisletilmisUyeId === grup.kullaniciId;
      return (
        <View style={[styles.aidatKart, styles.odenmemisKart]}>
          <View style={styles.grupBaslikSatir}>
            <View style={{ flex: 1 }}>
              <Text style={styles.kullaniciAdi}>{grup.kullaniciAdi}</Text>
              <Text style={styles.grupAlt}>
                {grup.aySayisi} ay (Ocak 2025–günümüz, tamamlanmamış) · ₺
                {grup.toplamTutar.toLocaleString('tr-TR')}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.genisletBtn}
              onPress={() => setGenisletilmisUyeId(acik ? null : grup.kullaniciId)}
            >
              <Text style={styles.genisletBtnText}>{acik ? 'Gizle' : 'Ayları göster'}</Text>
              <Ionicons name={acik ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.primaryLight} />
            </TouchableOpacity>
          </View>
          {acik ? (
            <View style={styles.ayListesi}>
              {grup.borcluSlotlar.map((slot) => {
                const tutar = slot.kayit?.miktar ?? aidatAylikMiktari;
                const durum = aidatDurumuEtiketi(slot.kayit);
                const durumEtiket =
                  durum === 'onay_bekliyor'
                    ? 'Dekont onayda'
                    : durum === 'red'
                      ? 'Red — yeniden dekont'
                      : slot.kayit
                        ? 'Bekliyor'
                        : 'Kayıt yok';
                return (
                  <View key={`${slot.yil}-${slot.ay}`} style={styles.aySatiri}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.ayEtiket}>{ayEtiketi(slot.yil, slot.ay)}</Text>
                      <Text style={styles.ayTutar}>₺{tutar.toLocaleString('tr-TR')} · {durumEtiket}</Text>
                    </View>
                    {slot.kayit ? (
                      <TouchableOpacity style={styles.ayManuelBtn} onPress={() => manuelOde(slot.kayit!)}>
                        <Text style={styles.ayManuelBtnText}>Manuel ödendi</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.aySanalNot}>Kayıt yok</Text>
                    )}
                  </View>
                );
              })}
            </View>
          ) : null}
        </View>
      );
    },
    [aidatAylikMiktari, genisletilmisUyeId, manuelOde],
  );

  const renderItem = useCallback(
    ({ item }: { item: ListeElemani }) => {
      if (item.tur === 'grup') return renderGrup({ grup: item.grup });
      return renderTekAidat(item.aidat);
    },
    [renderGrup, renderTekAidat],
  );

  const keyExtractor = useCallback((item: ListeElemani) => {
    if (item.tur === 'grup') return `grup-${item.grup.kullaniciId}`;
    return `tek-${item.aidat.id}`;
  }, []);

  return (
    <View style={styles.container}>
      <ScreenHeader baslik="Aidat yönetimi" geriButon />

      {toplamOdenmemis > 0 ? (
        <View style={styles.borcCard}>
          <Ionicons name="alert-circle-outline" size={20} color={Colors.error} />
          <Text style={styles.borcText}>
            {borcluUyeSayisi} üye · {toplamBorcluAy} ay · toplam ₺
            {toplamOdenmemis.toLocaleString('tr-TR')}
          </Text>
        </View>
      ) : null}

      <View style={styles.filtreler}>
        {(
          [
            ['dekont', `Dekont (${dekontBekleyenSayi})`],
            ['odenmemis', `Borçlu (${odenmemisGruplar.length})`],
            ['odenmis', 'Ödenmiş'],
            ['tum', 'Tümü'],
          ] as const
        ).map(([f, etiket]) => (
          <TouchableOpacity
            key={f}
            style={[styles.filtreButon, filtre === f && styles.filtreButonAktif]}
            onPress={() => {
              setFiltre(f);
              setGenisletilmisUyeId(null);
            }}
          >
            <Text style={[styles.filtreText, filtre === f && styles.filtreTextAktif]}>{etiket}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={listeVerisi}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.liste}
        refreshControl={<RefreshControl refreshing={yukleniyor} onRefresh={yukle} tintColor={Colors.primary} />}
        ListEmptyComponent={<EmptyState ikon="card-outline" baslik="Kayıt yok" />}
        ListFooterComponent={
          <View style={styles.aylikTutarFooter}>
            <TouchableOpacity
              style={styles.aylikTutarBaslikSatir}
              onPress={() => setAylikTutarAyarAcik((v) => !v)}
              activeOpacity={0.7}
            >
              <Text style={styles.aylikTutarBaslikKucuk}>Aylık tutar (₺{aidatAylikMiktari.toLocaleString('tr-TR')})</Text>
              <Ionicons
                name={aylikTutarAyarAcik ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={Colors.textMuted}
              />
            </TouchableOpacity>
            {aylikTutarAyarAcik ? (
              <View style={styles.aylikTutarAcilir}>
                <Text style={styles.aylikTutarAciklamaKucuk}>
                  Yeni oluşturulan aylık kayıtlar bu tutarı kullanır. Kayıtlar girişte otomatik oluşturulur.
                </Text>
                <View style={styles.aylikMiktarSatir}>
                  <TextInput
                    style={styles.aylikMiktarInput}
                    value={aylikMiktarTaslak}
                    onChangeText={setAylikMiktarTaslak}
                    keyboardType="decimal-pad"
                    placeholderTextColor={Colors.textMuted}
                  />
                  <Text style={styles.aylikMiktarBirim}>₺</Text>
                  <TouchableOpacity
                    style={[styles.aylikMiktarKaydet, miktarKaydediliyor && { opacity: 0.65 }]}
                    disabled={miktarKaydediliyor}
                    onPress={async () => {
                      const v = parseFloat(aylikMiktarTaslak.replace(/\s/g, '').replace(',', '.'));
                      if (Number.isNaN(v) || v <= 0) {
                        Alert.alert('Hata', 'Geçerli pozitif bir tutar girin.');
                        return;
                      }
                      setMiktarKaydediliyor(true);
                      try {
                        await aidatAylikMiktariGuncelle(v);
                        await yukle();
                        Alert.alert('Tamam', 'Aylık aidat miktarı güncellendi.');
                      } catch (e) {
                        const m = e instanceof Error ? e.message : 'Kaydedilemedi.';
                        Alert.alert('Hata', m);
                      } finally {
                        setMiktarKaydediliyor(false);
                      }
                    }}
                  >
                    <Text style={styles.aylikMiktarKaydetText}>{miktarKaydediliyor ? '…' : 'Kaydet'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      <Modal visible={!!dekontModal} transparent animationType="fade" onRequestClose={() => setDekontModal(null)}>
        <View style={styles.dekontModalDis}>
          <View style={styles.dekontModalIc}>
            <View style={styles.dekontModalUst}>
              <Text style={styles.dekontModalBaslik} numberOfLines={2}>
                {dekontModal?.baslik}
              </Text>
              <TouchableOpacity onPress={() => setDekontModal(null)} hitSlop={12}>
                <Ionicons name="close" size={26} color={Colors.text} />
              </TouchableOpacity>
            </View>
            {dekontModal?.uri ? (
              <ScrollView contentContainerStyle={styles.dekontModalScroll} bounces>
                <Image
                  source={{ uri: dekontModal.uri }}
                  style={{
                    width: Dimensions.get('window').width - 64,
                    minHeight: Dimensions.get('window').height * 0.5,
                    maxHeight: Dimensions.get('window').height * 0.78,
                  }}
                  resizeMode="contain"
                />
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!redModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setRedModal(null);
          setRedAciklama('');
        }}
      >
        <KeyboardAvoidingView
          style={styles.modalDis}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalIc}>
            <Text style={styles.modalBaslik}>Red gerekçesi</Text>
            <Text style={styles.modalAlt}>{redModal?.ad}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Kısa açıklama (üyeye gösterilir)"
              placeholderTextColor={Colors.textMuted}
              value={redAciklama}
              onChangeText={setRedAciklama}
              multiline
            />
            <View style={styles.modalSatir}>
              <TouchableOpacity
                style={styles.modalIptal}
                onPress={() => {
                  setRedModal(null);
                  setRedAciklama('');
                }}
              >
                <Text style={styles.modalIptalText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalTamam} onPress={reddetGonder}>
                <Text style={styles.modalTamamText}>Reddet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  aylikTutarFooter: {
    marginTop: 8,
    paddingTop: 16,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  aylikTutarBaslikSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  aylikTutarBaslikKucuk: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  aylikTutarAcilir: { marginTop: 10 },
  aylikTutarAciklamaKucuk: { fontSize: 12, color: Colors.textMuted, lineHeight: 17 },
  aylikMiktarSatir: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 10 },
  aylikMiktarInput: {
    flex: 1,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  aylikMiktarBirim: { fontSize: 16, fontWeight: '700', color: Colors.textSecondary },
  aylikMiktarKaydet: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  aylikMiktarKaydetText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  borcCard: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: Colors.error + '15',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.error + '40',
  },
  borcText: { color: Colors.error, fontWeight: '700', fontSize: 13, flex: 1 },
  filtreler: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, paddingBottom: 8, gap: 8 },
  filtreButon: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filtreButonAktif: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filtreText: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  filtreTextAktif: { color: Colors.white },
  liste: { padding: 16, paddingBottom: 40 },
  aidatKart: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  odenmemisKart: { borderColor: Colors.warning + '45' },
  aidatHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  kullaniciAdi: { fontSize: 15, fontWeight: '700', color: Colors.text },
  aidatYil: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  tutarSatir: { fontSize: 14, fontWeight: '600', color: Colors.text, marginTop: 6 },
  onayRozet: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  onayRozetText: { fontSize: 12, fontWeight: '700', color: Colors.success },
  tarihRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tarihText: { fontSize: 12, color: Colors.textMuted },
  redNot: { fontSize: 12, color: Colors.error, marginTop: 6 },
  dekontGosterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primary + '55',
    backgroundColor: Colors.primary + '12',
  },
  dekontGosterBtnText: { fontSize: 13, fontWeight: '600', color: Colors.primaryLight },
  aksiyonlar: { marginTop: 12, gap: 8 },
  onayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.success,
    borderRadius: 10,
    padding: 12,
  },
  onayBtnText: { color: Colors.white, fontSize: 14, fontWeight: '700' },
  redBtn: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  redBtnText: { color: Colors.error, fontWeight: '700' },
  manuelBtn: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    backgroundColor: Colors.surfaceVariant,
  },
  manuelBtnText: { color: Colors.textSecondary, fontWeight: '600', fontSize: 13 },
  grupBaslikSatir: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  grupAlt: { fontSize: 13, color: Colors.textMuted, marginTop: 6 },
  genisletBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  genisletBtnText: { fontSize: 12, fontWeight: '600', color: Colors.primaryLight },
  ayListesi: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border, gap: 10 },
  aySatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 10,
  },
  ayEtiket: { fontSize: 13, fontWeight: '600', color: Colors.text },
  ayTutar: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  ayManuelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ayManuelBtnText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  aySanalNot: { fontSize: 11, color: Colors.textMuted, fontStyle: 'italic', maxWidth: 120, textAlign: 'right' },
  dekontModalDis: {
    flex: 1,
    backgroundColor: '#000d',
    justifyContent: 'center',
    padding: 16,
  },
  dekontModalIc: {
    flex: 1,
    maxHeight: '92%',
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  dekontModalUst: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dekontModalBaslik: { flex: 1, fontSize: 15, fontWeight: '700', color: Colors.text, paddingRight: 8 },
  dekontModalScroll: { flexGrow: 1, justifyContent: 'center', padding: 8, paddingBottom: 20 },
  modalDis: {
    flex: 1,
    backgroundColor: '#000a',
    justifyContent: 'center',
    padding: 24,
  },
  modalIc: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalBaslik: { fontSize: 17, fontWeight: '700', color: Colors.text },
  modalAlt: { fontSize: 13, color: Colors.textMuted, marginTop: 6 },
  modalInput: {
    marginTop: 14,
    minHeight: 88,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    color: Colors.text,
    textAlignVertical: 'top',
    backgroundColor: Colors.surfaceVariant,
  },
  modalSatir: { flexDirection: 'row', gap: 12, marginTop: 16 },
  modalIptal: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalIptalText: { color: Colors.textSecondary, fontWeight: '600' },
  modalTamam: { flex: 1, padding: 14, alignItems: 'center', borderRadius: 12, backgroundColor: Colors.error },
  modalTamamText: { color: Colors.white, fontWeight: '700' },
});
