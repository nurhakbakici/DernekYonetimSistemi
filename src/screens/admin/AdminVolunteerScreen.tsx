import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useData } from '../../context/DataContext';
import { GonulluBasvuru } from '../../types';
import { Colors } from '../../constants/colors';
import ScreenHeader from '../../components/common/ScreenHeader';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';

export default function AdminVolunteerScreen() {
  const { gonulluBasvurular, gonulluBasvuruYukle, gonulluBasvuruGuncelle } = useData();
  const [yukleniyor, setYukleniyor] = useState(false);

  useEffect(() => { void yukle(); }, []);

  const yukle = async () => {
    setYukleniyor(true);
    await gonulluBasvuruYukle();
    setYukleniyor(false);
  };

  const bekleyenler = gonulluBasvurular.filter(b => b.durum === 'beklemede');
  const sirali = [...bekleyenler, ...gonulluBasvurular.filter(b => b.durum !== 'beklemede')];

  const karar = (b: GonulluBasvuru, durum: 'onaylandi' | 'reddedildi') => {
    Alert.alert(durum === 'onaylandi' ? 'Onayla' : 'Reddet', `${b.kullaniciAdi} — ${b.gorevBaslik}`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: durum === 'onaylandi' ? 'Onayla' : 'Reddet',
        style: durum === 'reddedildi' ? 'destructive' : 'default',
        onPress: async () => {
          try {
            await gonulluBasvuruGuncelle(b.id, durum);
          } catch (e) {
            Alert.alert('Hata', e instanceof Error ? e.message : 'İşlem yapılamadı.');
          }
        },
      },
    ]);
  };

  const render = ({ item }: { item: GonulluBasvuru }) => (
    <View style={styles.kart}>
      <View style={styles.ust}>
        <Text style={styles.ad}>{item.kullaniciAdi}</Text>
        <StatusBadge durum={item.durum} kucuk />
      </View>
      <Text style={styles.gorev}>{item.gorevBaslik}</Text>
      <Text style={styles.tarih}>{item.basvuruTarihi}</Text>
      {item.durum === 'beklemede' && (
        <View style={styles.aksiyon}>
          <TouchableOpacity style={[styles.btn, styles.onay]} onPress={() => karar(item, 'onaylandi')}>
            <Text style={styles.btnText}>Onayla</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.red]} onPress={() => karar(item, 'reddedildi')}>
            <Text style={styles.btnText}>Reddet</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader baslik="Gönüllü başvuruları" altBaslik={`${bekleyenler.length} bekleyen`} geriButon />
      <FlatList
        data={sirali}
        keyExtractor={i => i.id}
        renderItem={render}
        contentContainerStyle={styles.liste}
        refreshControl={<RefreshControl refreshing={yukleniyor} onRefresh={yukle} tintColor={Colors.primary} />}
        ListEmptyComponent={<EmptyState ikon="hand-left-outline" baslik="Başvuru yok" aciklama="Henüz gönüllü başvurusu yok." />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  liste: { padding: 16 },
  kart: { backgroundColor: Colors.surface, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  ust: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ad: { fontSize: 16, fontWeight: '600', color: Colors.text },
  gorev: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  tarih: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  aksiyon: { flexDirection: 'row', gap: 8, marginTop: 12 },
  btn: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center' },
  onay: { backgroundColor: Colors.success + '33' },
  red: { backgroundColor: Colors.error + '33' },
  btnText: { fontWeight: '600', color: Colors.text },
});
