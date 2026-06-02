import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Envanter } from '../../types';
import { Colors } from '../../constants/colors';
import ScreenHeader from '../../components/common/ScreenHeader';
import EmptyState from '../../components/common/EmptyState';

export default function InventoryScreen() {
  const navigation = useNavigation<any>();
  const { kullanici } = useAuth();
  const { envanterKayitlari, envanterZimmetler, envanterYukle, envanterZimmetYukle } = useData();
  const [yukleniyor, setYukleniyor] = useState(false);
  const [arama, setArama] = useState('');
  const [sekme, setSekme] = useState<'liste' | 'zimmetlerim'>('liste');

  useEffect(() => { void yukle(); }, []);

  const yukle = async () => {
    setYukleniyor(true);
    await Promise.all([envanterYukle(), envanterZimmetYukle()]);
    setYukleniyor(false);
  };

  const filtreli = envanterKayitlari.filter(e => {
    if (!arama.trim()) return true;
    const q = arama.toLowerCase();
    return e.ad.toLowerCase().includes(q) || e.kategori.toLowerCase().includes(q);
  });

  const benimZimmetler = envanterZimmetler.filter(
    z => z.kullaniciId === kullanici?.id && z.durum === 'aktif',
  );

  const renderEnvanter = ({ item }: { item: Envanter }) => (
    <TouchableOpacity
      style={styles.kart}
      onPress={() => navigation.navigate('InventoryDetail', { envanterId: item.id })}
    >
      <View style={styles.ikon}>
        <Ionicons name="cube-outline" size={26} color={Colors.warning} />
      </View>
      <View style={styles.bilgi}>
        <Text style={styles.ad} numberOfLines={1}>{item.ad}</Text>
        <Text style={styles.kat}>{item.kategori}{item.lokasyon ? ` · ${item.lokasyon}` : ''}</Text>
        <Text style={[styles.stok, item.musaitAdet < 1 && styles.stokYok]}>
          {item.musaitAdet}/{item.toplamAdet} müsait
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader
        baslik="Envanter"
        altBaslik={`${envanterKayitlari.length} demirbaş`}
        geriButon
        sagButon={kullanici?.rol === 'admin' ? { ikon: 'add', onPress: () => navigation.navigate('AddInventory') } : undefined}
      />
      <View style={styles.sekmeler}>
        <TouchableOpacity style={[styles.sekme, sekme === 'liste' && styles.aktifSekme]} onPress={() => setSekme('liste')}>
          <Text style={[styles.sekmeText, sekme === 'liste' && styles.aktifSekmeText]}>Demirbaşlar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.sekme, sekme === 'zimmetlerim' && styles.aktifSekme]} onPress={() => setSekme('zimmetlerim')}>
          <Text style={[styles.sekmeText, sekme === 'zimmetlerim' && styles.aktifSekmeText]}>
            Zimmetlerim {benimZimmetler.length > 0 ? `(${benimZimmetler.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>
      {sekme === 'liste' ? (
        <FlatList
          data={filtreli}
          keyExtractor={i => i.id}
          renderItem={renderEnvanter}
          contentContainerStyle={styles.liste}
          refreshControl={<RefreshControl refreshing={yukleniyor} onRefresh={yukle} tintColor={Colors.primary} />}
          ListHeaderComponent={
            <View style={styles.arama}>
              <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
              <TextInput
                style={styles.aramaInput}
                placeholder="Ara…"
                placeholderTextColor={Colors.textMuted}
                value={arama}
                onChangeText={setArama}
              />
            </View>
          }
          ListEmptyComponent={<EmptyState ikon="cube-outline" baslik="Kayıt yok" aciklama="Demirbaş eklenmemiş." />}
        />
      ) : (
        <FlatList
          data={benimZimmetler}
          keyExtractor={i => i.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.kart}
              onPress={() => navigation.navigate('InventoryDetail', { envanterId: item.envanterId })}
            >
              <Text style={styles.ad}>{item.envanterAd}</Text>
              <Text style={styles.kat}>Zimmet: {item.zimmetTarihi}{item.planlananIade ? ` · İade: ${item.planlananIade}` : ''}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.liste}
          refreshControl={<RefreshControl refreshing={yukleniyor} onRefresh={yukle} tintColor={Colors.primary} />}
          ListEmptyComponent={<EmptyState ikon="hand-right-outline" baslik="Zimmet yok" aciklama="Üzerinizde aktif zimmet bulunmuyor." />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  sekmeler: { flexDirection: 'row', marginHorizontal: 16, marginTop: 8, backgroundColor: Colors.surface, borderRadius: 10, padding: 4 },
  sekme: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  aktifSekme: { backgroundColor: Colors.primary + '44' },
  sekmeText: { fontSize: 13, color: Colors.textMuted },
  aktifSekmeText: { color: Colors.primaryLight, fontWeight: '600' },
  arama: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.surface, borderRadius: 10, paddingHorizontal: 12, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  aramaInput: { flex: 1, paddingVertical: 10, color: Colors.text },
  liste: { padding: 16 },
  kart: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  ikon: { width: 44, height: 44, borderRadius: 10, backgroundColor: Colors.warning + '22', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  bilgi: { flex: 1 },
  ad: { fontSize: 15, fontWeight: '600', color: Colors.text },
  kat: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  stok: { fontSize: 12, color: Colors.success, marginTop: 4 },
  stokYok: { color: Colors.error },
});
