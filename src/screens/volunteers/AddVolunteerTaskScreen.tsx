import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';
import ScreenHeader from '../../components/common/ScreenHeader';

export default function AddVolunteerTaskScreen() {
  const navigation = useNavigation<any>();
  const { kullanici } = useAuth();
  const { gonulluGorevEkle } = useData();
  const [baslik, setBaslik] = useState('');
  const [aciklama, setAciklama] = useState('');
  const [tarih, setTarih] = useState('');
  const [konum, setKonum] = useState('');
  const [kontenjan, setKontenjan] = useState('5');
  const [yukleniyor, setYukleniyor] = useState(false);

  const handleKaydet = async () => {
    if (!baslik.trim() || !aciklama.trim() || !tarih.trim() || !kullanici) {
      Alert.alert('Hata', 'Başlık, açıklama ve tarih zorunludur.');
      return;
    }
    const k = parseInt(kontenjan, 10);
    if (Number.isNaN(k) || k < 1) {
      Alert.alert('Hata', 'Geçerli kontenjan girin.');
      return;
    }
    setYukleniyor(true);
    try {
      await gonulluGorevEkle({
        baslik: baslik.trim(),
        aciklama: aciklama.trim(),
        tarih: tarih.trim(),
        konum: konum.trim() || undefined,
        kontenjan: k,
        durum: 'acik',
        olusturanId: kullanici.id,
        olusturanAdi: `${kullanici.ad} ${kullanici.soyad}`,
      });
      Alert.alert('Başarılı', 'Gönüllü görevi oluşturuldu.', [{ text: 'Tamam', onPress: () => navigation.goBack() }]);
    } catch (e) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'Kaydedilemedi.');
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader baslik="Gönüllü görev ekle" geriButon />
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Başlık *</Text>
        <TextInput style={styles.input} value={baslik} onChangeText={setBaslik} placeholder="Görev adı" placeholderTextColor={Colors.textMuted} />
        <Text style={styles.label}>Açıklama *</Text>
        <TextInput style={[styles.input, styles.cokSatir]} value={aciklama} onChangeText={setAciklama} multiline placeholder="Ne yapılacak?" placeholderTextColor={Colors.textMuted} />
        <Text style={styles.label}>Tarih (YYYY-MM-DD) *</Text>
        <TextInput style={styles.input} value={tarih} onChangeText={setTarih} placeholder="2026-06-01" placeholderTextColor={Colors.textMuted} />
        <Text style={styles.label}>Konum</Text>
        <TextInput style={styles.input} value={konum} onChangeText={setKonum} placeholder="Salon / adres" placeholderTextColor={Colors.textMuted} />
        <Text style={styles.label}>Kontenjan *</Text>
        <TextInput style={styles.input} value={kontenjan} onChangeText={setKontenjan} keyboardType="number-pad" />
        <TouchableOpacity style={styles.buton} onPress={handleKaydet} disabled={yukleniyor}>
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
  input: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 12, color: Colors.text, fontSize: 15 },
  cokSatir: { minHeight: 90, textAlignVertical: 'top' },
  buton: { marginTop: 24, backgroundColor: Colors.primary, padding: 14, borderRadius: 10, alignItems: 'center' },
  butonText: { color: '#fff', fontWeight: '600' },
});
