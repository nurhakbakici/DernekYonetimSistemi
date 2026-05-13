import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, RefreshControl, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Kitap } from '../../types';
import { Colors } from '../../constants/colors';
import ScreenHeader from '../../components/common/ScreenHeader';
import EmptyState from '../../components/common/EmptyState';

export default function LibraryScreen() {
  const navigation = useNavigation<any>();
  const { kitaplar, kitapYukle, oduncAlmalar, oduncYukle } = useData();
  const { kullanici } = useAuth();
  const [arama, setArama] = useState('');
  const [seciliKategori, setSeciliKategori] = useState('Tümü');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [sekmeler, setSekmeler] = useState<'kitaplar' | 'odunclerim'>('kitaplar');

  useEffect(() => { yukle(); }, []);

  const yukle = async () => {
    setYukleniyor(true);
    await Promise.all([kitapYukle(), oduncYukle()]);
    setYukleniyor(false);
  };

  const kategoriListesi = useMemo(() => {
    const uniq = new Set(kitaplar.map(k => k.kategori?.trim()).filter(Boolean) as string[]);
    const sorted = [...uniq].sort((a, b) => a.localeCompare(b, 'tr'));
    return ['Tümü', ...sorted];
  }, [kitaplar]);

  const filtreliKitaplar = kitaplar.filter(k => {
    const aramaUygun = arama === '' ||
      k.baslik.toLowerCase().includes(arama.toLowerCase()) ||
      k.yazar.toLowerCase().includes(arama.toLowerCase());
    const kategoriUygun = seciliKategori === 'Tümü' || k.kategori === seciliKategori;
    return aramaUygun && kategoriUygun;
  });

  const benimOdunclerim = oduncAlmalar.filter(
    o => o.kullaniciId === kullanici?.id && o.durum !== 'iade_edildi'
  );

  const renderKitap = ({ item }: { item: Kitap }) => (
    <TouchableOpacity
      style={styles.kitapKart}
      onPress={() => navigation.navigate('BookDetail', { kitapId: item.id })}
    >
      <View style={styles.kitapIkon}>
        <Ionicons name="book" size={28} color={Colors.secondary} />
      </View>
      <View style={styles.kitapBilgi}>
        <Text style={styles.kitapBaslik} numberOfLines={2}>{item.baslik}</Text>
        <Text style={styles.kitapYazar}>{item.yazar}</Text>
        <View style={styles.kitapFooter}>
          <View style={styles.kategoriBadge}>
            <Text style={styles.kategoriText}>{item.kategori}</Text>
          </View>
          <View style={[styles.stokBadge, item.musaitAdet === 0 && styles.stokDolu]}>
            <Ionicons
              name={item.musaitAdet > 0 ? 'checkmark-circle-outline' : 'close-circle-outline'}
              size={12}
              color={item.musaitAdet > 0 ? Colors.success : Colors.error}
            />
            <Text style={[styles.stokText, item.musaitAdet === 0 && styles.stokDoluText]}>
              {item.musaitAdet > 0 ? `${item.musaitAdet}/${item.toplamAdet} Mevcut` : 'Stokta Yok'}
            </Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader
        baslik="Kütüphane"
        altBaslik={`${kitaplar.length} kitap`}
        sagButon={kullanici?.rol === 'admin' ? {
          ikon: 'add',
          onPress: () => navigation.navigate('AddBook'),
        } : undefined}
      />

      <View style={styles.sekmeler}>
        <TouchableOpacity
          style={[styles.sekme, sekmeler === 'kitaplar' && styles.aktifSekme]}
          onPress={() => setSekmeler('kitaplar')}
        >
          <Text style={[styles.sekmeText, sekmeler === 'kitaplar' && styles.aktifSekmeText]}>Tüm Kitaplar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sekme, sekmeler === 'odunclerim' && styles.aktifSekme]}
          onPress={() => setSekmeler('odunclerim')}
        >
          <Text style={[styles.sekmeText, sekmeler === 'odunclerim' && styles.aktifSekmeText]}>
            Ödünçlerim {benimOdunclerim.length > 0 && `(${benimOdunclerim.length})`}
          </Text>
        </TouchableOpacity>
      </View>

      {sekmeler === 'kitaplar' ? (
        <FlatList
          data={filtreliKitaplar}
          keyExtractor={item => item.id}
          renderItem={renderKitap}
          style={styles.kitapListesi}
          contentContainerStyle={styles.liste}
          refreshControl={<RefreshControl refreshing={yukleniyor} onRefresh={yukle} tintColor={Colors.primary} />}
          ListHeaderComponent={
            <View style={styles.listeUst}>
              <View style={styles.aramaContainer}>
                <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.aramaInput}
                  placeholder="Kitap veya yazar ara..."
                  placeholderTextColor={Colors.textMuted}
                  value={arama}
                  onChangeText={setArama}
                />
                {arama.length > 0 && (
                  <TouchableOpacity onPress={() => setArama('')}>
                    <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.kategoriSatir}
                contentContainerStyle={styles.kategoriler}
              >
                {kategoriListesi.map(item => (
                  <TouchableOpacity
                    key={item}
                    style={[styles.kategoriButon, seciliKategori === item && styles.kategoriButonSecili]}
                    onPress={() => setSeciliKategori(item)}
                  >
                    <Text style={[styles.kategoriButonText, seciliKategori === item && styles.kategoriButonSeciliText]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              ikon="book-outline"
              baslik="Kitap bulunamadı"
              aciklama="Arama kriterlerinize uygun kitap bulunamadı."
            />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={benimOdunclerim}
          keyExtractor={item => item.id}
          style={styles.kitapListesi}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.oduncKart}
              onPress={() => navigation.navigate('BookDetail', { kitapId: item.kitapId })}
            >
              <View style={styles.oduncIkon}>
                <Ionicons name="book-outline" size={24} color={item.durum === 'gecikti' ? Colors.error : Colors.success} />
              </View>
              <View style={styles.oduncBilgi}>
                <Text style={styles.oduncBaslik}>{item.kitapBaslik}</Text>
                <Text style={styles.oduncTarih}>Alınma: {item.oduncTarihi}</Text>
                <Text style={[styles.oduncIadeTarih, item.durum === 'gecikti' && styles.oduncGecikme]}>
                  {item.durum === 'gecikti' ? '⚠️ İade gecikiyor!' : `İade: ${item.iadeTarihi}`}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.liste}
          refreshControl={<RefreshControl refreshing={yukleniyor} onRefresh={yukle} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <EmptyState
              ikon="book-outline"
              baslik="Ödünç kitap yok"
              aciklama="Şu anda ödünç aldığınız kitap bulunmuyor."
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  sekmeler: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 12,
    gap: 10,
  },
  sekme: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  aktifSekme: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  sekmeText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  aktifSekmeText: { color: Colors.white },
  kitapListesi: { flex: 1 },
  listeUst: { flexGrow: 0, paddingTop: 4 },
  aramaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceVariant,
    marginHorizontal: 0,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  aramaInput: { flex: 1, height: 46, color: Colors.text, fontSize: 14 },
  kategoriSatir: { flexGrow: 0, marginBottom: 4 },
  kategoriler: { paddingLeft: 0, paddingRight: 0, paddingBottom: 10, gap: 8, alignItems: 'center' },
  kategoriButon: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  kategoriButonSecili: { backgroundColor: Colors.secondary + '30', borderColor: Colors.secondary },
  kategoriButonText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  kategoriButonSeciliText: { color: Colors.secondary },
  liste: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 0, flexGrow: 1 },
  kitapKart: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  kitapIkon: {
    width: 56,
    height: 56,
    backgroundColor: Colors.secondary + '20',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kitapBilgi: { flex: 1 },
  kitapBaslik: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 3 },
  kitapYazar: { fontSize: 12, color: Colors.textSecondary, marginBottom: 8 },
  kitapFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  kategoriBadge: {
    backgroundColor: Colors.secondary + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  kategoriText: { fontSize: 11, color: Colors.secondary, fontWeight: '600' },
  stokBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  stokDolu: { backgroundColor: Colors.error + '20' },
  stokText: { fontSize: 11, color: Colors.success, fontWeight: '600' },
  stokDoluText: { color: Colors.error },
  oduncKart: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  oduncIkon: {
    width: 48,
    height: 48,
    backgroundColor: Colors.success + '20',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  oduncBilgi: { flex: 1 },
  oduncBaslik: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 4 },
  oduncTarih: { fontSize: 12, color: Colors.textMuted },
  oduncIadeTarih: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  oduncGecikme: { color: Colors.error, fontWeight: '600' },
});
