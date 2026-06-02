import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useData } from '../../context/DataContext';
import { EnvanterZimmet } from '../../types';
import { Colors } from '../../constants/colors';
import ScreenHeader from '../../components/common/ScreenHeader';
import EmptyState from '../../components/common/EmptyState';

export default function AdminInventoryScreen() {
  const { envanterZimmetler, envanterZimmetYukle, envanterZimmetIade } = useData();
  const [yukleniyor, setYukleniyor] = useState(false);

  useEffect(() => { void yukle(); }, []);

  const yukle = async () => {
    setYukleniyor(true);
    await envanterZimmetYukle();
    setYukleniyor(false);
  };

  const aktifler = envanterZimmetler.filter(z => z.durum === 'aktif');

  const iade = (z: EnvanterZimmet) => {
    Alert.alert('İade kaydet', `${z.kullaniciAdi} — ${z.envanterAd}`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'İade edildi',
        onPress: async () => {
          try {
            await envanterZimmetIade(z.id);
            await envanterZimmetYukle();
          } catch (e) {
            Alert.alert('Hata', e instanceof Error ? e.message : 'İşlem yapılamadı.');
          }
        },
      },
    ]);
  };

  const render = ({ item }: { item: EnvanterZimmet }) => (
    <View style={styles.kart}>
      <Text style={styles.ad}>{item.envanterAd}</Text>
      <Text style={styles.meta}>{item.kullaniciAdi} · {item.zimmetTarihi}</Text>
      {item.planlananIade && <Text style={styles.meta}>Planlanan iade: {item.planlananIade}</Text>}
      <TouchableOpacity style={styles.btn} onPress={() => iade(item)}>
        <Text style={styles.btnText}>İade al</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader baslik="Aktif zimmetler" altBaslik={`${aktifler.length} kayıt`} geriButon />
      <FlatList
        data={aktifler}
        keyExtractor={i => i.id}
        renderItem={render}
        contentContainerStyle={styles.liste}
        refreshControl={<RefreshControl refreshing={yukleniyor} onRefresh={yukle} tintColor={Colors.primary} />}
        ListEmptyComponent={<EmptyState ikon="cube-outline" baslik="Aktif zimmet yok" aciklama="Tüm demirbaşlar depoda." />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  liste: { padding: 16 },
  kart: { backgroundColor: Colors.surface, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  ad: { fontSize: 16, fontWeight: '600', color: Colors.text },
  meta: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  btn: { marginTop: 10, alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, backgroundColor: Colors.primary + '33', borderRadius: 8 },
  btnText: { color: Colors.primaryLight, fontWeight: '600' },
});
