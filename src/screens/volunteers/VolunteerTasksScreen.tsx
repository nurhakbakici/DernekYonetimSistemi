import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { GonulluGorev } from '../../types';
import { Colors } from '../../constants/colors';
import ScreenHeader from '../../components/common/ScreenHeader';
import EmptyState from '../../components/common/EmptyState';

export default function VolunteerTasksScreen() {
  const navigation = useNavigation<any>();
  const { kullanici } = useAuth();
  const {
    gonulluGorevler, gonulluBasvurular, gonulluGorevYukle, gonulluBasvuruYukle, onayliGonulluSayisi,
  } = useData();
  const [yukleniyor, setYukleniyor] = useState(false);

  useEffect(() => { void yukle(); }, []);

  const yukle = async () => {
    setYukleniyor(true);
    await Promise.all([gonulluGorevYukle(), gonulluBasvuruYukle()]);
    setYukleniyor(false);
  };

  const benimBasvurularim = gonulluBasvurular.filter(b => b.kullaniciId === kullanici?.id);
  const acikGorevler = gonulluGorevler.filter(g => g.durum === 'acik');

  const renderGorev = ({ item }: { item: GonulluGorev }) => {
    const onayli = onayliGonulluSayisi(item.id);
    const basvurum = benimBasvurularim.find(b => b.gorevId === item.id);
    return (
      <TouchableOpacity
        style={styles.kart}
        onPress={() => navigation.navigate('VolunteerTaskDetail', { gorevId: item.id })}
      >
        <View style={styles.kartUst}>
          <Text style={styles.baslik} numberOfLines={2}>{item.baslik}</Text>
          {basvurum && (
            <View style={styles.basvuruRozet}>
              <Text style={styles.basvuruRozetText}>
                {basvurum.durum === 'onaylandi' ? 'Onaylı' : basvurum.durum === 'reddedildi' ? 'Red' : 'Beklemede'}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.meta}>{item.tarih}{item.konum ? ` · ${item.konum}` : ''}</Text>
        <View style={styles.alt}>
          <Ionicons name="people-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.kontenjan}>{onayli}/{item.kontenjan} gönüllü</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} style={styles.ok} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        baslik="Gönüllülük"
        altBaslik={`${acikGorevler.length} açık görev`}
        geriButon
        sagButon={kullanici?.rol === 'admin' ? { ikon: 'add', onPress: () => navigation.navigate('AddVolunteerTask') } : undefined}
      />
      <FlatList
        data={gonulluGorevler}
        keyExtractor={item => item.id}
        renderItem={renderGorev}
        contentContainerStyle={styles.liste}
        refreshControl={<RefreshControl refreshing={yukleniyor} onRefresh={yukle} tintColor={Colors.primary} />}
        ListEmptyComponent={<EmptyState ikon="hand-left-outline" baslik="Görev yok" aciklama="Henüz gönüllü ilanı eklenmemiş." />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  liste: { padding: 16, paddingBottom: 32 },
  kart: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  kartUst: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  baslik: { flex: 1, fontSize: 16, fontWeight: '600', color: Colors.text },
  basvuruRozet: { backgroundColor: Colors.primary + '22', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  basvuruRozetText: { fontSize: 11, color: Colors.primaryLight, fontWeight: '600' },
  meta: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  alt: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  kontenjan: { fontSize: 12, color: Colors.textMuted },
  ok: { position: 'absolute', right: 12, top: '50%' },
});
