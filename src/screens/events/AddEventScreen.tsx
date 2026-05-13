import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';
import ScreenHeader from '../../components/common/ScreenHeader';
import { galeridenGorselSec } from '../../utils/galeriSec';
import { FormDatePicker, FormTimePicker } from '../../components/common/FormDateTimePickers';
import { startOfDay } from 'date-fns';
import EventKonumOdaSecimi from '../../components/events/EventKonumOdaSecimi';
import { odaIdlerindenKonumMetni } from '../../utils/etkinlikKonumOdalar';

export default function AddEventScreen() {
  const navigation = useNavigation<any>();
  const { etkinlikEkle, odalar } = useData();
  const { kullanici } = useAuth();
  const [baslik, setBaslik] = useState('');
  const [aciklama, setAciklama] = useState('');
  const [tarih, setTarih] = useState('');
  const [saat, setSaat] = useState('');
  const [bitisSaati, setBitisSaati] = useState('');
  const [seciliOdaIdleri, setSeciliOdaIdleri] = useState<string[]>([]);
  const [maxKatilimci, setMaxKatilimci] = useState('');
  const [gorselYerelUri, setGorselYerelUri] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);

  const bugunBaslangic = useMemo(() => startOfDay(new Date()), []);

  const handleEkle = async () => {
    if (!baslik.trim() || !aciklama.trim() || !tarih.trim() || !saat.trim() || seciliOdaIdleri.length === 0) {
      Alert.alert('Hata', 'Başlık, açıklama, tarih, saat ve en az bir konum (oda) zorunludur.');
      return;
    }
    if (!kullanici) return;

    setYukleniyor(true);
    try {
      const tarihSaat = `${tarih}T${saat}:00`;
      const bitisTarihSaat = bitisSaati.trim() ? `${tarih}T${bitisSaati.trim()}:00` : undefined;

      await etkinlikEkle(
        {
          baslik: baslik.trim(),
          aciklama: aciklama.trim(),
          tarih: tarihSaat,
          bitisTarihi: bitisTarihSaat,
          konum: odaIdlerindenKonumMetni(seciliOdaIdleri, odalar),
          organizator: `${kullanici.ad} ${kullanici.soyad}`,
          organizatorId: kullanici.id,
          maxKatilimci: maxKatilimci ? parseInt(maxKatilimci, 10) : undefined,
        },
        {
          gorselYerelUri: gorselYerelUri ?? undefined,
          baslangicDurumu: kullanici.rol === 'admin' ? 'onaylandi' : 'beklemede',
        },
      );

      Alert.alert(
        'Etkinlik Gönderildi',
        kullanici.rol === 'admin'
          ? 'Etkinlik oluşturuldu ve onaylandı.'
          : 'Etkinlik talebiniz yönetim kuruluna iletildi. Onay sonrası yayınlanacak.',
        [{ text: 'Tamam', onPress: () => navigation.goBack() }]
      );
    } catch {
      Alert.alert('Hata', 'Etkinlik eklenemedi.');
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader baslik="Etkinlik Ekle" geriButon />
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">

        <View style={styles.bilgiBox}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.info} />
          <Text style={styles.bilgiText}>
            {kullanici?.rol === 'admin'
              ? 'Yönetici olarak eklediğiniz etkinlikler otomatik onaylanır.'
              : 'Etkinliğiniz yönetim kurulu onayından sonra yayınlanacaktır.'}
          </Text>
        </View>

        <Text style={styles.label}>Etkinlik Adı *</Text>
        <TextInput style={styles.input} placeholder="Etkinlik başlığı" placeholderTextColor={Colors.textMuted} value={baslik} onChangeText={setBaslik} />

        <Text style={styles.label}>Açıklama *</Text>
        <TextInput style={[styles.input, styles.textArea]} placeholder="Etkinlik hakkında bilgi..." placeholderTextColor={Colors.textMuted} value={aciklama} onChangeText={setAciklama} multiline numberOfLines={4} textAlignVertical="top" />

        <View style={styles.satir}>
          <View style={{ flex: 1 }}>
            <FormDatePicker
              label="Etkinlik tarihi"
              value={tarih}
              onChange={setTarih}
              minimumDate={bugunBaslangic}
              zorunlu
            />
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
        <EventKonumOdaSecimi seciliOdaIdleri={seciliOdaIdleri} onSeciliOdaIdleriChange={setSeciliOdaIdleri} />

        <Text style={styles.label}>Maksimum Katılımcı Sayısı</Text>
        <TextInput style={styles.input} placeholder="Sınırsız için boş bırakın" placeholderTextColor={Colors.textMuted} value={maxKatilimci} onChangeText={setMaxKatilimci} keyboardType="number-pad" />

        <Text style={styles.label}>Etkinlik görseli (isteğe bağlı)</Text>
        <View style={styles.gorselSatir}>
          <TouchableOpacity
            style={styles.gorselBtn}
            onPress={async () => {
              const uri = await galeridenGorselSec();
              if (uri) setGorselYerelUri(uri);
            }}
          >
            <Ionicons name="image-outline" size={18} color={Colors.primaryLight} />
            <Text style={styles.gorselBtnText}>{gorselYerelUri ? 'Görseli değiştir' : 'Galeriden seç'}</Text>
          </TouchableOpacity>
          {gorselYerelUri ? (
            <TouchableOpacity onPress={() => setGorselYerelUri(null)}>
              <Text style={styles.gorselKaldir}>Kaldır</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        {gorselYerelUri ? (
          <Image source={{ uri: gorselYerelUri }} style={styles.onizleme} resizeMode="cover" />
        ) : null}

        <TouchableOpacity
          style={[styles.ekleButton, yukleniyor && { opacity: 0.6 }]}
          onPress={handleEkle}
          disabled={yukleniyor}
        >
          <Ionicons name="calendar-outline" size={20} color={Colors.white} />
          <Text style={styles.ekleText}>
            {yukleniyor ? 'Gönderiliyor...' : 'Etkinlik Ekle'}
          </Text>
        </TouchableOpacity>
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16 },
  bilgiBox: {
    flexDirection: 'row',
    backgroundColor: Colors.info + '15',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.info + '40',
  },
  bilgiText: { flex: 1, fontSize: 12, color: Colors.info, lineHeight: 18 },
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
  gorselSatir: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 4 },
  gorselBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 2,
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
  ekleButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 24,
  },
  ekleText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
});
