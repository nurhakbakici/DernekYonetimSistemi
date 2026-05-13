import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useData } from '../../context/DataContext';
import { Colors } from '../../constants/colors';
import ScreenHeader from '../../components/common/ScreenHeader';

const KATEGORILER = ['RPG', 'Strateji', 'Kooperatif', 'Bulmaca', 'Diğer'];

export default function AddBookScreen() {
  const navigation = useNavigation<any>();
  const { kitapEkle } = useData();
  const [baslik, setBaslik] = useState('');
  const [yazar, setYazar] = useState('');
  const [isbn, setIsbn] = useState('');
  const [kategori, setKategori] = useState('');
  const [toplamAdet, setToplamAdet] = useState('1');
  const [aciklama, setAciklama] = useState('');
  const [yayinYili, setYayinYili] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);

  const handleEkle = async () => {
    if (!baslik.trim() || !yazar.trim() || !kategori) {
      Alert.alert('Hata', 'Başlık, yazar ve kategori zorunludur.');
      return;
    }
    const adet = parseInt(toplamAdet);
    if (isNaN(adet) || adet <= 0) {
      Alert.alert('Hata', 'Geçerli bir adet girin.');
      return;
    }
    setYukleniyor(true);
    try {
      await kitapEkle({
        baslik: baslik.trim(),
        yazar: yazar.trim(),
        isbn: isbn.trim() || undefined,
        kategori,
        toplamAdet: adet,
        musaitAdet: adet,
        aciklama: aciklama.trim() || undefined,
        yayinYili: yayinYili ? parseInt(yayinYili) : undefined,
      });
      Alert.alert('Başarılı', 'Kitap kütüphaneye eklendi.', [{ text: 'Tamam', onPress: () => navigation.goBack() }]);
    } catch {
      Alert.alert('Hata', 'Kitap eklenemedi.');
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader baslik="Kitap Ekle" geriButon />
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Kitap Başlığı *</Text>
        <TextInput style={styles.input} placeholder="Kitap adı" placeholderTextColor={Colors.textMuted} value={baslik} onChangeText={setBaslik} />

        <Text style={styles.label}>Yazar *</Text>
        <TextInput style={styles.input} placeholder="Yazar adı" placeholderTextColor={Colors.textMuted} value={yazar} onChangeText={setYazar} />

        <Text style={styles.label}>Kategori *</Text>
        <View style={styles.kategoriGrid}>
          {KATEGORILER.map(k => (
            <TouchableOpacity
              key={k}
              style={[styles.kategoriButon, kategori === k && styles.kategoriButonSecili]}
              onPress={() => setKategori(k)}
            >
              <Text style={[styles.kategoriText, kategori === k && styles.kategoriTextSecili]}>{k}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.satir}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Adet *</Text>
            <TextInput style={styles.input} placeholder="1" placeholderTextColor={Colors.textMuted} value={toplamAdet} onChangeText={setToplamAdet} keyboardType="number-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Yayın Yılı</Text>
            <TextInput style={styles.input} placeholder="Örn: 2020" placeholderTextColor={Colors.textMuted} value={yayinYili} onChangeText={setYayinYili} keyboardType="number-pad" />
          </View>
        </View>

        <Text style={styles.label}>ISBN</Text>
        <TextInput style={styles.input} placeholder="Opsiyonel" placeholderTextColor={Colors.textMuted} value={isbn} onChangeText={setIsbn} />

        <Text style={styles.label}>Açıklama</Text>
        <TextInput style={[styles.input, styles.textArea]} placeholder="Kitap hakkında kısa bilgi..." placeholderTextColor={Colors.textMuted} value={aciklama} onChangeText={setAciklama} multiline numberOfLines={3} textAlignVertical="top" />

        <TouchableOpacity style={[styles.ekleButton, yukleniyor && { opacity: 0.6 }]} onPress={handleEkle} disabled={yukleniyor}>
          <Text style={styles.ekleText}>{yukleniyor ? 'Ekleniyor...' : 'Kitabı Ekle'}</Text>
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
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  kategoriGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kategoriButon: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  kategoriButonSecili: { backgroundColor: Colors.secondary + '30', borderColor: Colors.secondary },
  kategoriText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  kategoriTextSecili: { color: Colors.secondary },
  satir: { flexDirection: 'row', gap: 12 },
  ekleButton: {
    backgroundColor: Colors.secondary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  ekleText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
});
