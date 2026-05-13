import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../../context/DataContext';
import { Etkinlik } from '../../types';
import { Colors } from '../../constants/colors';
import ScreenHeader from '../../components/common/ScreenHeader';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function AdminEventsScreen() {
  const navigation = useNavigation<any>();
  const { etkinlikler, etkinlikYukle, etkinlikGuncelle } = useData();
  const [yukleniyor, setYukleniyor] = useState(false);

  useEffect(() => { yukle(); }, []);

  const yukle = async () => {
    setYukleniyor(true);
    await etkinlikYukle();
    setYukleniyor(false);
  };

  const siralananEtkinlikler = [...etkinlikler].sort(
    (a, b) => (a.durum === 'beklemede' ? -1 : 1) - (b.durum === 'beklemede' ? -1 : 1)
  );

  const handleOnayla = (etkinlik: Etkinlik) => {
    Alert.alert('Etkinliği Onayla', `"${etkinlik.baslik}" etkinliğini onaylamak istiyor musunuz?`, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Onayla', onPress: () => etkinlikGuncelle(etkinlik.id, 'onaylandi') },
    ]);
  };

  const handleIptal = (etkinlik: Etkinlik) => {
    Alert.alert('Etkinliği İptal Et', `"${etkinlik.baslik}" etkinliğini iptal etmek istiyor musunuz?`, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'İptal Et', style: 'destructive', onPress: () => etkinlikGuncelle(etkinlik.id, 'iptal') },
    ]);
  };

  const renderEtkinlik = ({ item }: { item: Etkinlik }) => (
    <View style={styles.etkinlikKart}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.baslik}>{item.baslik}</Text>
          <Text style={styles.organizator}>{item.organizator}</Text>
        </View>
        <StatusBadge durum={item.durum} kucuk />
      </View>
      <View style={styles.detaylar}>
        <View style={styles.detayRow}>
          <Ionicons name="calendar-outline" size={13} color={Colors.textMuted} />
          <Text style={styles.detayText}>
            {format(new Date(item.tarih), 'd MMMM yyyy HH:mm', { locale: tr })}
          </Text>
        </View>
        <View style={styles.detayRow}>
          <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
          <Text style={styles.detayText}>{item.konum}</Text>
        </View>
      </View>
      {item.durum === 'beklemede' && (
        <View style={styles.aksiyonlar}>
          <TouchableOpacity style={styles.onayButton} onPress={() => handleOnayla(item)}>
            <Ionicons name="checkmark-outline" size={16} color={Colors.white} />
            <Text style={styles.aksiyonText}>Onayla</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iptalButton} onPress={() => handleIptal(item)}>
            <Ionicons name="close-outline" size={16} color={Colors.white} />
            <Text style={styles.aksiyonText}>İptal</Text>
          </TouchableOpacity>
        </View>
      )}
      {(item.durum === 'beklemede' || item.durum === 'onaylandi') && (
        <View style={[styles.aksiyonlar, item.durum === 'beklemede' && { marginTop: 10 }]}>
          <TouchableOpacity
            style={styles.duzenleButton}
            onPress={() => navigation.navigate('Etkinlikler', { screen: 'EditEvent', params: { etkinlikId: item.id } })}
          >
            <Ionicons name="create-outline" size={16} color={Colors.white} />
            <Text style={styles.aksiyonText}>Düzenle</Text>
          </TouchableOpacity>
          {item.durum === 'onaylandi' && (
            <TouchableOpacity style={styles.iptalButton} onPress={() => handleIptal(item)}>
              <Ionicons name="close-outline" size={16} color={Colors.white} />
              <Text style={styles.aksiyonText}>İptal</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader baslik="Etkinlik Yönetimi" geriButon />
      <FlatList
        data={siralananEtkinlikler}
        keyExtractor={item => item.id}
        renderItem={renderEtkinlik}
        contentContainerStyle={styles.liste}
        refreshControl={<RefreshControl refreshing={yukleniyor} onRefresh={yukle} tintColor={Colors.primary} />}
        ListEmptyComponent={<EmptyState ikon="calendar-outline" baslik="Etkinlik bulunamadı" />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  liste: { padding: 16 },
  etkinlikKart: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 8 },
  baslik: { fontSize: 15, fontWeight: '700', color: Colors.text },
  organizator: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  detaylar: { gap: 5, marginBottom: 10 },
  detayRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detayText: { fontSize: 13, color: Colors.textSecondary },
  aksiyonlar: { flexDirection: 'row', gap: 10 },
  onayButton: {
    flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 6, backgroundColor: Colors.success, borderRadius: 10, padding: 10,
  },
  iptalButton: {
    flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 6, backgroundColor: Colors.error, borderRadius: 10, padding: 10,
  },
  duzenleButton: {
    flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 6, backgroundColor: Colors.info, borderRadius: 10, padding: 10,
  },
  aksiyonText: { color: Colors.white, fontSize: 13, fontWeight: '600' },
});
