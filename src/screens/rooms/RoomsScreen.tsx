import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Oda } from '../../types';
import { Colors } from '../../constants/colors';
import ScreenHeader from '../../components/common/ScreenHeader';
import EmptyState from '../../components/common/EmptyState';

export default function RoomsScreen() {
  const navigation = useNavigation<any>();
  const { odalar, odaYukle } = useData();
  const { kullanici } = useAuth();
  const [yukleniyor, setYukleniyor] = useState(false);

  useEffect(() => {
    yukle();
  }, []);

  const yukle = async () => {
    setYukleniyor(true);
    await odaYukle();
    setYukleniyor(false);
  };

  const renderOda = ({ item }: { item: Oda }) => (
    <TouchableOpacity
      style={styles.odaKart}
      onPress={() => navigation.navigate('ReservationForm', { odaId: item.id })}
    >
      <View style={styles.odaIkonContainer}>
        <Ionicons name="business" size={32} color={Colors.primaryLight} />
      </View>
      <View style={styles.odaBilgi}>
        <View style={styles.odaHeader}>
          <Text style={styles.odaAd}>{item.ad}</Text>
          <View style={[styles.kapasiteBadge]}>
            <Ionicons name="people-outline" size={12} color={Colors.primaryLight} />
            <Text style={styles.kapasiteText}>{item.kapasite} kişi</Text>
          </View>
        </View>
        <Text style={styles.odaAciklama} numberOfLines={2}>{item.aciklama}</Text>
        <View style={styles.ozellikler}>
          {item.ozellikler.slice(0, 3).map((oz, idx) => (
            <View key={idx} style={styles.ozellikBadge}>
              <Text style={styles.ozellikText}>{oz}</Text>
            </View>
          ))}
          {item.ozellikler.length > 3 && (
            <Text style={styles.dahaFazla}>+{item.ozellikler.length - 3}</Text>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader
        baslik="Odalar"
        altBaslik="Toplantı ve etkinlik alanları"
        sagButon={kullanici?.rol === 'admin' ? {
          ikon: 'add',
          onPress: () => navigation.navigate('AddRoom'),
        } : undefined}
      />

      <View style={styles.aksiyonBar}>
        <TouchableOpacity
          style={styles.rezervasyonlarimButton}
          onPress={() => navigation.navigate('MyReservations')}
        >
          <Ionicons name="calendar-outline" size={18} color={Colors.primaryLight} />
          <Text style={styles.rezervasyonlarimText}>Rezervasyonlarım</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.primaryLight} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.takvimButton}
          onPress={() => navigation.navigate('ReservationCalendar')}
        >
          <Ionicons name="calendar" size={20} color={Colors.secondary} />
          <View style={styles.takvimButtonMetin}>
            <Text style={styles.takvimButtonText}>Doluluk takvimi</Text>
            <Text style={styles.takvimButtonAlt}>Tüm odalar · tarih seçerek görüntüle</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.secondary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={odalar.filter(o => o.aktif)}
        keyExtractor={(item) => item.id}
        renderItem={renderOda}
        contentContainerStyle={styles.liste}
        refreshControl={<RefreshControl refreshing={yukleniyor} onRefresh={yukle} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <EmptyState
            ikon="business-outline"
            baslik="Oda bulunamadı"
            aciklama="Henüz aktif oda eklenmemiş."
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  aksiyonBar: {
    padding: 16,
    paddingBottom: 8,
    gap: 10,
  },
  rezervasyonlarimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  rezervasyonlarimText: {
    flex: 1,
    color: Colors.primaryLight,
    fontWeight: '600',
    fontSize: 14,
  },
  takvimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.secondary + '55',
  },
  takvimButtonMetin: { flex: 1 },
  takvimButtonText: {
    color: Colors.secondaryLight,
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 2,
  },
  takvimButtonAlt: {
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 15,
  },
  liste: { padding: 16, paddingTop: 8 },
  odaKart: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 14,
  },
  odaIkonContainer: {
    width: 60,
    height: 60,
    backgroundColor: Colors.primary + '20',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  odaBilgi: { flex: 1 },
  odaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  odaAd: { fontSize: 16, fontWeight: '700', color: Colors.text, flex: 1 },
  kapasiteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  kapasiteText: { fontSize: 11, color: Colors.primaryLight, fontWeight: '600' },
  odaAciklama: { fontSize: 13, color: Colors.textSecondary, marginBottom: 10, lineHeight: 18 },
  ozellikler: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  ozellikBadge: {
    backgroundColor: Colors.surfaceVariant,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ozellikText: { fontSize: 11, color: Colors.textSecondary },
  dahaFazla: { fontSize: 11, color: Colors.textMuted, alignSelf: 'center' },
});
