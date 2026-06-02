import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useData } from '../../context/DataContext';
import { Colors } from '../../constants/colors';
import ScreenHeader from '../../components/common/ScreenHeader';

const KATEGORILER = ['Teknik', 'Oyun', 'Mobilya', 'Kırtasiye', 'Diğer'];

export default function AddInventoryScreen() {
  const navigation = useNavigation<any>();
  const { envanterEkle } = useData();
  const [ad, setAd] = useState('');
  const [kategori, setKategori] = useState('');
  const [toplamAdet, setToplamAdet] = useState('1');
  const [lokasyon, setLokasyon] = useState('');
  const [aciklama, setAciklama] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);

  const kaydet = async () => {
    if (!ad.trim() || !kategori) {
      Alert.alert('Hata', 'Ad ve kategori zorunludur.');
      return;
    }
    const adet = parseInt(toplamAdet, 10);
    if (Number.isNaN(adet) || adet < 1) {
      Alert.alert('Hata', 'Geçerli adet girin.');
      return;
    }
    setYukleniyor(true);
    try {
      await envanterEkle({
        ad: ad.trim(),
        kategori,
        toplamAdet: adet,
        musaitAdet: adet,
        lokasyon: lokasyon.trim() || undefined,
        aciklama: aciklama.trim() || undefined,
        durum: 'kullanilabilir',
      });
      Alert.alert('Başarılı', 'Demirbaş eklendi.', [{ text: 'Tamam', onPress: () => navigation.goBack() }]);
    } catch (e) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'Eklenemedi.');
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader baslik="Demirbaş ekle" geriButon />
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Ad *</Text>
        <TextInput style={styles.input} value={ad} onChangeText={setAd} placeholder="Cihaz / malzeme adı" placeholderTextColor={Colors.textMuted} />
        <Text style={styles.label}>Kategori *</Text>
        <View style={styles.grid}>
          {KATEGORILER.map(k => (
            <TouchableOpacity key={k} style={[styles.chip, kategori === k && styles.chipSecili]} onPress={() => setKategori(k)}>
              <Text style={[styles.chipText, kategori === k && styles.chipTextSecili]}>{k}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.label}>Toplam adet *</Text>
        <TextInput style={styles.input} value={toplamAdet} onChangeText={setToplamAdet} keyboardType="number-pad" />
        <Text style={styles.label}>Lokasyon</Text>
        <TextInput style={styles.input} value={lokasyon} onChangeText={setLokasyon} placeholderTextColor={Colors.textMuted} />
        <Text style={styles.label}>Açıklama</Text>
        <TextInput style={[styles.input, styles.cok]} value={aciklama} onChangeText={setAciklama} multiline placeholderTextColor={Colors.textMuted} />
        <TouchableOpacity style={styles.buton} onPress={kaydet} disabled={yukleniyor}>
          <Text style={styles.butonText}>{yukleniyor ? 'Kaydediliyor…' : 'Kaydet'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16 },
  label: { fontSize: 13, color: Colors.textMuted, marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 12, color: Colors.text },
  cok: { minHeight: 80, textAlignVertical: 'top' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: Colors.border },
  chipSecili: { backgroundColor: Colors.primary + '44', borderColor: Colors.primary },
  chipText: { color: Colors.textMuted, fontSize: 13 },
  chipTextSecili: { color: Colors.primaryLight, fontWeight: '600' },
  buton: { marginTop: 24, backgroundColor: Colors.primary, padding: 14, borderRadius: 10, alignItems: 'center' },
  butonText: { color: '#fff', fontWeight: '600' },
});
