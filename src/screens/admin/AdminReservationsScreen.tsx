import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../../context/DataContext';
import { Rezervasyon } from '../../types';
import { Colors } from '../../constants/colors';
import ScreenHeader from '../../components/common/ScreenHeader';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function AdminReservationsScreen() {
  const { rezervasyonlar, rezervasyonYukle, rezervasyonGuncelle } = useData();
  const [yukleniyor, setYukleniyor] = useState(false);
  const [filtre, setFiltre] = useState<'beklemede' | 'onaylandi' | 'iptal' | 'tum'>('beklemede');

  useEffect(() => { yukle(); }, []);

  const yukle = async () => {
    setYukleniyor(true);
    await rezervasyonYukle();
    setYukleniyor(false);
  };

  const filtreliRezervasyonlar = rezervasyonlar
    .filter(r => filtre === 'tum' || r.durum === filtre)
    .sort((a, b) => new Date(b.olusturulmaTarihi).getTime() - new Date(a.olusturulmaTarihi).getTime());

  const handleOnay = (rez: Rezervasyon) => {
    Alert.alert('Rezervasyonu Onayla', `${rez.kullaniciAdi} için "${rez.odaAdi}" rezervasyonunu onaylamak istiyor musunuz?`, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Onayla', onPress: () => rezervasyonGuncelle(rez.id, 'onaylandi') },
    ]);
  };

  const handleIptal = (rez: Rezervasyon) => {
    Alert.alert('Rezervasyonu İptal Et', `"${rez.odaAdi}" rezervasyonunu iptal etmek istiyor musunuz?`, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'İptal Et', style: 'destructive', onPress: () => rezervasyonGuncelle(rez.id, 'iptal') },
    ]);
  };

  const renderRez = ({ item }: { item: Rezervasyon }) => (
    <View style={styles.rezKart}>
      <View style={styles.rezHeader}>
        <View>
          <Text style={styles.odaAdi}>{item.odaAdi}</Text>
          <Text style={styles.kullaniciAdi}>{item.kullaniciAdi}</Text>
        </View>
        <StatusBadge durum={item.durum} kucuk />
      </View>
      <View style={styles.rezDetay}>
        <View style={styles.detayRow}>
          <Ionicons name="calendar-outline" size={13} color={Colors.textMuted} />
          <Text style={styles.detayText}>
            {format(new Date(item.tarih), 'd MMMM yyyy', { locale: tr })}
          </Text>
        </View>
        <View style={styles.detayRow}>
          <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
          <Text style={styles.detayText}>{item.baslangicSaati} - {item.bitisSaati}</Text>
        </View>
        <View style={styles.detayRow}>
          <Ionicons name="document-text-outline" size={13} color={Colors.textMuted} />
          <Text style={styles.detayText}>{item.amac}</Text>
        </View>
      </View>
      {item.durum === 'beklemede' && (
        <View style={styles.aksiyonlar}>
          <TouchableOpacity style={styles.onayButton} onPress={() => handleOnay(item)}>
            <Ionicons name="checkmark-outline" size={16} color={Colors.white} />
            <Text style={styles.aksiyonText}>Onayla</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iptalButton} onPress={() => handleIptal(item)}>
            <Ionicons name="close-outline" size={16} color={Colors.white} />
            <Text style={styles.aksiyonText}>İptal</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader baslik="Rezervasyon Yönetimi" geriButon />
      <View style={styles.filtreler}>
        {(['beklemede', 'onaylandi', 'iptal', 'tum'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filtreButon, filtre === f && styles.filtreButonAktif]}
            onPress={() => setFiltre(f)}
          >
            <Text style={[styles.filtreText, filtre === f && styles.filtreTextAktif]}>
              {f === 'beklemede' ? 'Bekleyen' : f === 'onaylandi' ? 'Onaylı' : f === 'iptal' ? 'İptal' : 'Tümü'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={filtreliRezervasyonlar}
        keyExtractor={item => item.id}
        renderItem={renderRez}
        contentContainerStyle={styles.liste}
        refreshControl={<RefreshControl refreshing={yukleniyor} onRefresh={yukle} tintColor={Colors.primary} />}
        ListEmptyComponent={<EmptyState ikon="calendar-outline" baslik="Rezervasyon bulunamadı" />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  filtreler: { flexDirection: 'row', padding: 16, paddingBottom: 8, gap: 8 },
  filtreButon: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filtreButonAktif: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filtreText: { fontSize: 11, fontWeight: '600', color: Colors.textMuted },
  filtreTextAktif: { color: Colors.white },
  liste: { padding: 16 },
  rezKart: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rezHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  odaAdi: { fontSize: 15, fontWeight: '700', color: Colors.text },
  kullaniciAdi: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  rezDetay: { gap: 5, marginBottom: 10 },
  detayRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detayText: { fontSize: 13, color: Colors.textSecondary },
  aksiyonlar: { flexDirection: 'row', gap: 10 },
  onayButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.success,
    borderRadius: 10,
    padding: 10,
  },
  iptalButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.error,
    borderRadius: 10,
    padding: 10,
  },
  aksiyonText: { color: Colors.white, fontSize: 13, fontWeight: '600' },
});
