import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Rezervasyon } from '../../types';
import { Colors } from '../../constants/colors';
import ScreenHeader from '../../components/common/ScreenHeader';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function MyReservationsScreen() {
  const { kullanici } = useAuth();
  const { rezervasyonlar, rezervasyonYukle, rezervasyonSil } = useData();
  const [yukleniyor, setYukleniyor] = useState(false);

  useEffect(() => { yukle(); }, []);

  const yukle = async () => {
    setYukleniyor(true);
    await rezervasyonYukle();
    setYukleniyor(false);
  };

  const benimRezervasyonlarim = rezervasyonlar
    .filter(r => r.kullaniciId === kullanici?.id)
    .sort((a, b) => new Date(b.olusturulmaTarihi).getTime() - new Date(a.olusturulmaTarihi).getTime());

  const handleIptal = (rez: Rezervasyon) => {
    Alert.alert(
      'Rezervasyonu İptal Et',
      `"${rez.odaAdi}" - ${rez.tarih} tarihli rezervasyonu iptal etmek istediğinize emin misiniz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'İptal Et',
          style: 'destructive',
          onPress: () => rezervasyonSil(rez.id),
        },
      ]
    );
  };

  const renderRezervasyon = ({ item }: { item: Rezervasyon }) => (
    <View style={styles.rezKart}>
      <View style={styles.rezHeader}>
        <View style={styles.odaInfo}>
          <Ionicons name="business-outline" size={18} color={Colors.primaryLight} />
          <Text style={styles.odaAdi}>{item.odaAdi}</Text>
        </View>
        <StatusBadge durum={item.durum} kucuk />
      </View>

      <View style={styles.rezDetay}>
        <View style={styles.detayRow}>
          <Ionicons name="calendar-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.detayText}>
            {format(new Date(item.tarih), 'd MMMM yyyy, EEEE', { locale: tr })}
          </Text>
        </View>
        <View style={styles.detayRow}>
          <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.detayText}>{item.baslangicSaati} - {item.bitisSaati}</Text>
        </View>
        <View style={styles.detayRow}>
          <Ionicons name="document-text-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.detayText}>{item.amac}</Text>
        </View>
      </View>

      {item.durum === 'beklemede' && (
        <TouchableOpacity style={styles.iptalButton} onPress={() => handleIptal(item)}>
          <Ionicons name="close-circle-outline" size={16} color={Colors.error} />
          <Text style={styles.iptalText}>İptal Et</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader baslik="Rezervasyonlarım" geriButon />
      <FlatList
        data={benimRezervasyonlarim}
        keyExtractor={item => item.id}
        renderItem={renderRezervasyon}
        contentContainerStyle={styles.liste}
        refreshControl={<RefreshControl refreshing={yukleniyor} onRefresh={yukle} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <EmptyState
            ikon="calendar-outline"
            baslik="Rezervasyon bulunamadı"
            aciklama="Henüz rezervasyon yapmadınız."
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  liste: { padding: 16 },
  rezKart: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rezHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  odaInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  odaAdi: { fontSize: 15, fontWeight: '700', color: Colors.text },
  rezDetay: { gap: 6 },
  detayRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detayText: { fontSize: 13, color: Colors.textSecondary },
  iptalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  iptalText: { fontSize: 13, color: Colors.error, fontWeight: '600' },
});
