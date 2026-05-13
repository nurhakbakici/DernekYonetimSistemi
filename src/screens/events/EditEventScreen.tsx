import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Image,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';
import ScreenHeader from '../../components/common/ScreenHeader';
import { galeridenGorselSec } from '../../utils/galeriSec';
import { FormDatePicker, FormTimePicker } from '../../components/common/FormDateTimePickers';
import EventKonumOdaSecimi from '../../components/events/EventKonumOdaSecimi';
import {
  konumMetnindenOdaIdleri,
  konumMetnindenEslesmeyenParcalar,
  odaIdlerindenKonumMetni,
} from '../../utils/etkinlikKonumOdalar';
import type { EtkinlikGorselSecenek } from '../../types';

type RouteParams = { etkinlikId: string };

export default function EditEventScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const { etkinlikId } = route.params;
  const { kullanici } = useAuth();
  const { etkinlikler, etkinlikYukle, etkinlikDetayGuncelle, odalar, odaYukle } = useData();

  const [baslik, setBaslik] = useState('');
  const [aciklama, setAciklama] = useState('');
  const [tarih, setTarih] = useState('');
  const [saat, setSaat] = useState('');
  const [bitisSaati, setBitisSaati] = useState('');
  const [seciliOdaIdleri, setSeciliOdaIdleri] = useState<string[]>([]);
  const [maxKatilimci, setMaxKatilimci] = useState('');
  const [yeniGorselUri, setYeniGorselUri] = useState<string | null>(null);
  const [gorselKaldir, setGorselKaldir] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [listeHazir, setListeHazir] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await etkinlikYukle();
      await odaYukle();
      if (!cancelled) setListeHazir(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [etkinlikYukle, odaYukle]);

  const etkinlik = useMemo(() => etkinlikler.find(e => e.id === etkinlikId), [etkinlikler, etkinlikId]);

  const aktifOdaKimligi = useMemo(
    () => odalar.filter(o => o.aktif).map(o => `${o.id}:${o.ad}`).sort().join('|'),
    [odalar],
  );

  useEffect(() => {
    if (!etkinlik) return;
    setBaslik(etkinlik.baslik);
    setAciklama(etkinlik.aciklama);
    setTarih(format(new Date(etkinlik.tarih), 'yyyy-MM-dd'));
    setSaat(format(new Date(etkinlik.tarih), 'HH:mm'));
    setBitisSaati(etkinlik.bitisTarihi ? format(new Date(etkinlik.bitisTarihi), 'HH:mm') : '');
    setSeciliOdaIdleri(konumMetnindenOdaIdleri(etkinlik.konum, odalar));
    setMaxKatilimci(etkinlik.maxKatilimci != null ? String(etkinlik.maxKatilimci) : '');
    setYeniGorselUri(null);
    setGorselKaldir(false);
  }, [
    etkinlik?.id,
    etkinlik?.baslik,
    etkinlik?.aciklama,
    etkinlik?.tarih,
    etkinlik?.bitisTarihi,
    etkinlik?.konum,
    etkinlik?.maxKatilimci,
    aktifOdaKimligi,
  ]);

  if (!listeHazir) {
    return (
      <View style={styles.container}>
        <ScreenHeader baslik="Etkinliği Düzenle" geriButon />
        <View style={styles.merkez}><Text style={styles.hataText}>Yükleniyor...</Text></View>
      </View>
    );
  }

  if (kullanici?.rol !== 'admin') {
    return (
      <View style={styles.container}>
        <ScreenHeader baslik="Etkinliği Düzenle" geriButon />
        <View style={styles.merkez}>
          <Text style={styles.hataText}>Bu sayfaya yalnızca yöneticiler erişebilir.</Text>
        </View>
      </View>
    );
  }

  if (!etkinlik) {
    return (
      <View style={styles.container}>
        <ScreenHeader baslik="Etkinliği Düzenle" geriButon />
        <View style={styles.merkez}><Text style={styles.hataText}>Etkinlik bulunamadı.</Text></View>
      </View>
    );
  }

  const onizlemeUri = gorselKaldir ? null : (yeniGorselUri ?? etkinlik.gorselUri);
  const eslesmeyenKonumParcalari = konumMetnindenEslesmeyenParcalar(etkinlik.konum, odalar);

  const handleKaydet = async () => {
    if (!baslik.trim() || !aciklama.trim() || !tarih.trim() || !saat.trim() || seciliOdaIdleri.length === 0) {
      Alert.alert('Hata', 'Başlık, açıklama, tarih, saat ve en az bir konum (oda) zorunludur.');
      return;
    }

    setYukleniyor(true);
    try {
      const tarihSaat = `${tarih}T${saat}:00`;
      const bitisTarihSaat = bitisSaati.trim() ? `${tarih}T${bitisSaati.trim()}:00` : null;

      let gorsel: EtkinlikGorselSecenek = 'degismedi';
      if (gorselKaldir) gorsel = 'kaldir';
      else if (yeniGorselUri) gorsel = { yerelUri: yeniGorselUri };

      await etkinlikDetayGuncelle(
        etkinlikId,
        {
          baslik: baslik.trim(),
          aciklama: aciklama.trim(),
          tarih: tarihSaat,
          bitisTarihi: bitisTarihSaat,
          konum: odaIdlerindenKonumMetni(seciliOdaIdleri, odalar),
          maxKatilimci: maxKatilimci.trim() ? parseInt(maxKatilimci.trim(), 10) : null,
        },
        gorsel,
      );

      Alert.alert('Kaydedildi', 'Etkinlik güncellendi.', [{ text: 'Tamam', onPress: () => navigation.goBack() }]);
    } catch {
      Alert.alert('Hata', 'Etkinlik güncellenemedi.');
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader baslik="Etkinliği Düzenle" geriButon />
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">

        <Text style={styles.label}>Etkinlik Adı *</Text>
        <TextInput style={styles.input} placeholder="Etkinlik başlığı" placeholderTextColor={Colors.textMuted} value={baslik} onChangeText={setBaslik} />

        <Text style={styles.label}>Açıklama *</Text>
        <TextInput style={[styles.input, styles.textArea]} placeholder="Etkinlik hakkında bilgi..." placeholderTextColor={Colors.textMuted} value={aciklama} onChangeText={setAciklama} multiline numberOfLines={4} textAlignVertical="top" />

        <View style={styles.satir}>
          <View style={{ flex: 1 }}>
            <FormDatePicker label="Etkinlik tarihi" value={tarih} onChange={setTarih} zorunlu />
          </View>
        </View>

        <View style={styles.satir}>
          <View style={{ flex: 1 }}>
            <FormTimePicker label="Başlangıç saati" value={saat} onChange={setSaat} zorunlu />
          </View>
          <View style={{ flex: 1 }}>
            <FormTimePicker label="Bitiş saati" value={bitisSaati} onChange={setBitisSaati} clearable />
          </View>
        </View>

        <Text style={styles.label}>Konum (odalar) *</Text>
        {eslesmeyenKonumParcalari.length > 0 ? (
          <View style={styles.uyariKutu}>
            <Ionicons name="warning-outline" size={16} color={Colors.warning} />
            <Text style={styles.uyariMetin}>
              Eski kayıtta listede olmayan kısımlar var: {eslesmeyenKonumParcalari.join(', ')}. Kaydettiğinizde yalnızca
              seçtiğiniz odalar konum olarak saklanır.
            </Text>
          </View>
        ) : null}
        <EventKonumOdaSecimi seciliOdaIdleri={seciliOdaIdleri} onSeciliOdaIdleriChange={setSeciliOdaIdleri} />

        <Text style={styles.label}>Maksimum Katılımcı Sayısı</Text>
        <TextInput style={styles.input} placeholder="Sınırsız için boş bırakın" placeholderTextColor={Colors.textMuted} value={maxKatilimci} onChangeText={setMaxKatilimci} keyboardType="number-pad" />

        <Text style={styles.label}>Etkinlik görseli</Text>
        <View style={styles.gorselSatir}>
          <TouchableOpacity
            style={styles.gorselBtn}
            onPress={async () => {
              const uri = await galeridenGorselSec();
              if (uri) {
                setYeniGorselUri(uri);
                setGorselKaldir(false);
              }
            }}
          >
            <Ionicons name="image-outline" size={18} color={Colors.primaryLight} />
            <Text style={styles.gorselBtnText}>{onizlemeUri ? 'Görseli değiştir' : 'Galeriden seç'}</Text>
          </TouchableOpacity>
          {(etkinlik.gorselUri || yeniGorselUri) && !gorselKaldir ? (
            <TouchableOpacity onPress={() => { setGorselKaldir(true); setYeniGorselUri(null); }}>
              <Text style={styles.gorselKaldir}>Kaldır</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        {onizlemeUri ? (
          <Image source={{ uri: onizlemeUri }} style={styles.onizleme} resizeMode="cover" />
        ) : null}

        <TouchableOpacity
          style={[styles.kaydetButton, yukleniyor && { opacity: 0.6 }]}
          onPress={handleKaydet}
          disabled={yukleniyor}
        >
          <Ionicons name="save-outline" size={20} color={Colors.white} />
          <Text style={styles.kaydetText}>{yukleniyor ? 'Kaydediliyor...' : 'Kaydet'}</Text>
        </TouchableOpacity>
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  merkez: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hataText: { color: Colors.textMuted },
  scroll: { padding: 16 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 12,
    padding: 14,
    color: Colors.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: { minHeight: 90, textAlignVertical: 'top' },
  satir: { flexDirection: 'row', gap: 12 },
  gorselSatir: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 10 },
  gorselBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  gorselBtnText: { fontSize: 14, fontWeight: '600', color: Colors.primaryLight },
  gorselKaldir: { fontSize: 14, fontWeight: '600', color: Colors.error },
  onizleme: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: Colors.border,
  },
  kaydetButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 24,
  },
  kaydetText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  uyariKutu: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.warning + '14',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.warning + '40',
  },
  uyariMetin: { flex: 1, fontSize: 12, color: Colors.warningLight, lineHeight: 17 },
});
