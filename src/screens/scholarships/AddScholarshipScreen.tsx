import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../../context/DataContext';
import { Colors } from '../../constants/colors';
import ScreenHeader from '../../components/common/ScreenHeader';
import { FormDatePicker } from '../../components/common/FormDateTimePickers';
import { startOfDay } from 'date-fns';
import type { BursGerekliBelge } from '../../types';
import { BURS_BELGE_SABLONLARI, yeniOzelBelgeId } from '../../utils/bursBelgeler';

export default function AddScholarshipScreen() {
  const navigation = useNavigation<any>();
  const { bursEkle } = useData();
  const [ad, setAd] = useState('');
  const [aciklama, setAciklama] = useState('');
  const [miktar, setMiktar] = useState('');
  const [programSuresiAy, setProgramSuresiAy] = useState('12');
  const [saglayanKurum, setSaglayanKurum] = useState('Kule Sakinleri Derneği');
  const [sonBasvuruTarihi, setSonBasvuruTarihi] = useState('');
  const [gereksinim, setGereksinim] = useState('');
  const [gereksinimler, setGereksinimler] = useState<string[]>([]);
  const [gerekliBelgeler, setGerekliBelgeler] = useState<BursGerekliBelge[]>([]);
  const [ozelBelgeBaslik, setOzelBelgeBaslik] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);

  const sonBasvuruMin = useMemo(() => startOfDay(new Date()), []);

  const gereksinimEkle = () => {
    if (gereksinim.trim()) {
      setGereksinimler([...gereksinimler, gereksinim.trim()]);
      setGereksinim('');
    }
  };

  const sablonSecili = (id: string) => gerekliBelgeler.some(g => g.id === id);

  const sablonToggle = (s: BursGerekliBelge) => {
    if (sablonSecili(s.id)) {
      setGerekliBelgeler(prev => prev.filter(g => g.id !== s.id));
    } else {
      setGerekliBelgeler(prev => [...prev, { id: s.id, baslik: s.baslik }]);
    }
  };

  const ozelBelgeEkle = () => {
    const t = ozelBelgeBaslik.trim();
    if (!t) return;
    setGerekliBelgeler(prev => [...prev, { id: yeniOzelBelgeId(), baslik: t }]);
    setOzelBelgeBaslik('');
  };

  const seciliBelgeKaldir = (id: string) => {
    setGerekliBelgeler(prev => prev.filter(g => g.id !== id));
  };

  const handleEkle = async () => {
    if (!ad.trim() || !aciklama.trim() || !miktar.trim() || !sonBasvuruTarihi.trim()) {
      Alert.alert('Hata', 'Tüm zorunlu alanları doldurun.');
      return;
    }
    const miktarSayi = parseFloat(miktar);
    if (isNaN(miktarSayi) || miktarSayi <= 0) {
      Alert.alert('Hata', 'Geçerli bir miktar girin.');
      return;
    }
    const ay = parseInt(programSuresiAy, 10);
    if (isNaN(ay) || ay < 1 || ay > 120) {
      Alert.alert('Hata', 'Program süresi 1 ile 120 ay arasında olmalıdır.');
      return;
    }
    setYukleniyor(true);
    try {
      const temel = {
        ad: ad.trim(),
        aciklama: aciklama.trim(),
        miktar: miktarSayi,
        programSuresiAy: ay,
        saglayanKurum: saglayanKurum.trim(),
        sonBasvuruTarihi: sonBasvuruTarihi.trim(),
        gereksinimler,
        durum: 'aktif' as const,
      };
      await bursEkle(
        gerekliBelgeler.length > 0 ? { ...temel, gerekliBelgeler } : temel,
      );
      Alert.alert('Başarılı', 'Burs programı eklendi.', [{ text: 'Tamam', onPress: () => navigation.goBack() }]);
    } catch {
      Alert.alert('Hata', 'Burs eklenemedi.');
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader baslik="Burs Programı Ekle" geriButon />
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Program Adı *</Text>
        <TextInput style={styles.input} placeholder="Burs adı" placeholderTextColor={Colors.textMuted} value={ad} onChangeText={setAd} />

        <Text style={styles.label}>Açıklama *</Text>
        <TextInput style={[styles.input, styles.textArea]} placeholder="Burs hakkında bilgi..." placeholderTextColor={Colors.textMuted} value={aciklama} onChangeText={setAciklama} multiline numberOfLines={3} textAlignVertical="top" />

        <Text style={styles.label}>Miktar (₺) *</Text>
        <TextInput style={styles.input} placeholder="Örn: 3000" placeholderTextColor={Colors.textMuted} value={miktar} onChangeText={setMiktar} keyboardType="numeric" />

        <Text style={styles.label}>Program süresi (ay) *</Text>
        <Text style={styles.altAciklama}>
          Onay sonrası burs desteğinin kaç ay süreceği (ör. taksit / ödeme planı bilgilendirmesi için).
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Örn: 12"
          placeholderTextColor={Colors.textMuted}
          value={programSuresiAy}
          onChangeText={setProgramSuresiAy}
          keyboardType="number-pad"
        />

        <Text style={styles.label}>Sağlayan Kurum *</Text>
        <TextInput style={styles.input} placeholder="Kurum adı" placeholderTextColor={Colors.textMuted} value={saglayanKurum} onChangeText={setSaglayanKurum} />

        <FormDatePicker
          label="Son başvuru tarihi"
          value={sonBasvuruTarihi}
          onChange={setSonBasvuruTarihi}
          minimumDate={sonBasvuruMin}
          zorunlu
        />

        <Text style={styles.label}>Başvuruda yüklenecek belgeler</Text>
        <Text style={styles.altAciklama}>
          Aday üyeler başvururken seçtikleriniz için ayrı ayrı dosya yükleyecektir. Hiç seçmezseniz belge istenmez.
        </Text>
        <View style={styles.sablonGrid}>
          {BURS_BELGE_SABLONLARI.map(s => {
            const sec = sablonSecili(s.id);
            return (
              <TouchableOpacity
                key={s.id}
                style={[styles.sablonChip, sec && styles.sablonChipSecili]}
                onPress={() => sablonToggle(s)}
              >
                <Ionicons
                  name={sec ? 'checkbox' : 'square-outline'}
                  size={16}
                  color={sec ? Colors.primaryLight : Colors.textMuted}
                />
                <Text style={[styles.sablonChipText, sec && styles.sablonChipTextSecili]}>{s.baslik}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.ozelSatir}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder="Özel belge adı (ör. Referans mektubu)"
            placeholderTextColor={Colors.textMuted}
            value={ozelBelgeBaslik}
            onChangeText={setOzelBelgeBaslik}
          />
          <TouchableOpacity style={styles.ekleButon} onPress={ozelBelgeEkle}>
            <Ionicons name="add" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
        {gerekliBelgeler.length > 0 ? (
          <View style={styles.seciliListe}>
            {gerekliBelgeler.map(g => (
              <View key={g.id} style={styles.seciliSatir}>
                <Ionicons name="document-attach-outline" size={16} color={Colors.success} />
                <Text style={styles.seciliText}>{g.baslik}</Text>
                <TouchableOpacity onPress={() => seciliBelgeKaldir(g.id)} hitSlop={8}>
                  <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : null}

        <Text style={styles.label}>Gereksinimler (metin)</Text>
        <View style={styles.gereksinimRow}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder="Gereksinim ekle..."
            placeholderTextColor={Colors.textMuted}
            value={gereksinim}
            onChangeText={setGereksinim}
            onSubmitEditing={gereksinimEkle}
          />
          <TouchableOpacity style={styles.ekleButon} onPress={gereksinimEkle}>
            <Ionicons name="add" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
        <View style={styles.gereksinimListesi}>
          {gereksinimler.map((ger, idx) => (
            <View key={idx} style={styles.gereksinimItem}>
              <Ionicons name="checkmark-circle-outline" size={14} color={Colors.success} />
              <Text style={styles.gereksinimText}>{ger}</Text>
              <TouchableOpacity onPress={() => setGereksinimler(gereksinimler.filter((_, i) => i !== idx))}>
                <Ionicons name="close" size={14} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <TouchableOpacity style={[styles.ekleButton, yukleniyor && { opacity: 0.6 }]} onPress={handleEkle} disabled={yukleniyor}>
          <Text style={styles.ekleText}>{yukleniyor ? 'Kaydediliyor...' : 'Burs Programını Ekle'}</Text>
        </TouchableOpacity>
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8, marginTop: 16 },
  altAciklama: { fontSize: 12, color: Colors.textMuted, lineHeight: 18, marginBottom: 12 },
  sablonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sablonChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: Colors.surfaceVariant,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sablonChipSecili: {
    borderColor: Colors.primaryLight + '80',
    backgroundColor: Colors.primaryDark + '40',
  },
  sablonChipText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  sablonChipTextSecili: { color: Colors.text },
  ozelSatir: { flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 12 },
  seciliListe: { marginTop: 12, gap: 8 },
  seciliSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.success + '12',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.success + '35',
  },
  seciliText: { flex: 1, fontSize: 13, color: Colors.text, fontWeight: '600' },
  input: {
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 12,
    padding: 14,
    color: Colors.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 4,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  gereksinimRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  ekleButon: { backgroundColor: Colors.primary, borderRadius: 10, padding: 14 },
  gereksinimListesi: { marginTop: 10, gap: 8 },
  gereksinimItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.success + '15',
    padding: 10,
    borderRadius: 10,
  },
  gereksinimText: { flex: 1, fontSize: 13, color: Colors.textSecondary },
  ekleButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  ekleText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
});
