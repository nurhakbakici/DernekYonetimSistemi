import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../../context/DataContext';
import { Colors } from '../../constants/colors';
import ScreenHeader from '../../components/common/ScreenHeader';

export default function AddRoomScreen() {
  const navigation = useNavigation<any>();
  const { odaEkle } = useData();
  const [ad, setAd] = useState('');
  const [aciklama, setAciklama] = useState('');
  const [kapasite, setKapasite] = useState('');
  const [ozellik, setOzellik] = useState('');
  const [ozellikler, setOzellikler] = useState<string[]>([]);
  const [yukleniyor, setYukleniyor] = useState(false);

  const ozellikEkle = () => {
    if (ozellik.trim()) {
      setOzellikler([...ozellikler, ozellik.trim()]);
      setOzellik('');
    }
  };

  const ozellikSil = (idx: number) => {
    setOzellikler(ozellikler.filter((_, i) => i !== idx));
  };

  const handleEkle = async () => {
    if (!ad.trim() || !aciklama.trim() || !kapasite.trim()) {
      Alert.alert('Hata', 'Ad, açıklama ve kapasite zorunludur.');
      return;
    }
    const kapasiteSayi = parseInt(kapasite);
    if (isNaN(kapasiteSayi) || kapasiteSayi <= 0) {
      Alert.alert('Hata', 'Kapasite geçerli bir sayı olmalıdır.');
      return;
    }
    setYukleniyor(true);
    try {
      await odaEkle({ ad: ad.trim(), aciklama: aciklama.trim(), kapasite: kapasiteSayi, ozellikler, aktif: true });
      Alert.alert('Başarılı', 'Oda eklendi.', [{ text: 'Tamam', onPress: () => navigation.goBack() }]);
    } catch {
      Alert.alert('Hata', 'Oda eklenemedi.');
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader baslik="Yeni Oda Ekle" geriButon />
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Oda Adı *</Text>
        <TextInput style={styles.input} placeholder="Örn: Büyük Salon" placeholderTextColor={Colors.textMuted} value={ad} onChangeText={setAd} />

        <Text style={styles.label}>Açıklama *</Text>
        <TextInput style={[styles.input, styles.textArea]} placeholder="Odanın kullanım amacı..." placeholderTextColor={Colors.textMuted} value={aciklama} onChangeText={setAciklama} multiline numberOfLines={3} textAlignVertical="top" />

        <Text style={styles.label}>Kapasite (kişi) *</Text>
        <TextInput style={styles.input} placeholder="Örn: 10" placeholderTextColor={Colors.textMuted} value={kapasite} onChangeText={setKapasite} keyboardType="number-pad" />

        <Text style={styles.label}>Özellikler</Text>
        <View style={styles.ozellikRow}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder="Örn: WiFi, Projeksiyon..."
            placeholderTextColor={Colors.textMuted}
            value={ozellik}
            onChangeText={setOzellik}
            onSubmitEditing={ozellikEkle}
          />
          <TouchableOpacity style={styles.ekleButon} onPress={ozellikEkle}>
            <Ionicons name="add" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
        <View style={styles.ozellikListesi}>
          {ozellikler.map((oz, idx) => (
            <View key={idx} style={styles.ozellikChip}>
              <Text style={styles.ozellikChipText}>{oz}</Text>
              <TouchableOpacity onPress={() => ozellikSil(idx)}>
                <Ionicons name="close" size={14} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <TouchableOpacity style={[styles.kaydetButton, yukleniyor && { opacity: 0.6 }]} onPress={handleEkle} disabled={yukleniyor}>
          <Text style={styles.kaydetText}>{yukleniyor ? 'Kaydediliyor...' : 'Odayı Ekle'}</Text>
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
  ozellikRow: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 10 },
  ekleButon: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    padding: 14,
    justifyContent: 'center',
  },
  ozellikListesi: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  ozellikChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '30',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  ozellikChipText: { fontSize: 12, color: Colors.primaryLight },
  kaydetButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  kaydetText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
});
