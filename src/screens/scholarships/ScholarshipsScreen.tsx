import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Burs } from '../../types';
import { Colors } from '../../constants/colors';
import ScreenHeader from '../../components/common/ScreenHeader';
import EmptyState from '../../components/common/EmptyState';
import StatusBadge from '../../components/common/StatusBadge';
import { bursProgramSuresiAy } from '../../utils/bursSuresi';

export default function ScholarshipsScreen() {
  const navigation = useNavigation<any>();
  const { burslar, bursYukle, bursBasvurulari, bursBasvuruYukle, bursSil } = useData();
  const { kullanici } = useAuth();
  const [yukleniyor, setYukleniyor] = useState(false);
  const [sekme, setSekme] = useState<'burslar' | 'basvurularim'>('burslar');

  useEffect(() => { yukle(); }, []);

  const yukle = async () => {
    setYukleniyor(true);
    await Promise.all([bursYukle(), bursBasvuruYukle()]);
    setYukleniyor(false);
  };

  const benimBasvurularim = bursBasvurulari.filter(b => b.kullaniciId === kullanici?.id);

  const bursKaldirOnay = (b: Burs) => {
    const basvuruSayisi = bursBasvurulari.filter(x => x.bursId === b.id).length;
    Alert.alert(
      'Bursu kaldır',
      `"${b.ad}" programını ve bağlı ${basvuruSayisi} başvuruyu kalıcı olarak silmek istediğinize emin misiniz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Kaldır',
          style: 'destructive',
          onPress: async () => {
            try {
              await bursSil(b.id);
            } catch {
              Alert.alert('Hata', 'Burs kaldırılamadı.');
            }
          },
        },
      ],
    );
  };

  const renderBurs = ({ item }: { item: Burs }) => {
    const basvurumVar = bursBasvurulari.some(
      b => b.bursId === item.id && b.kullaniciId === kullanici?.id
    );
    const aktif = item.durum === 'aktif';
    const sonBasvuruGecti = new Date(item.sonBasvuruTarihi) < new Date();

    return (
      <View style={[styles.bursKart, !aktif && styles.kapaliKart]}>
        <View style={styles.bursKartUst}>
          <TouchableOpacity
            style={styles.bursKartMain}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('ScholarshipDetail', { bursId: item.id })}
          >
            <View style={styles.bursHeader}>
              <View style={styles.bursIkon}>
                <Ionicons name="school" size={24} color={aktif ? Colors.gold : Colors.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.bursAdi, !aktif && styles.kapaliText]}>{item.ad}</Text>
                <Text style={styles.bursSaglayan}>{item.saglayanKurum}</Text>
              </View>
              <StatusBadge durum={aktif ? 'aktif' : 'kapali'} kucuk />
            </View>

            <Text style={styles.bursAciklama} numberOfLines={2}>{item.aciklama}</Text>

            <View style={styles.bursMiktar}>
              <Ionicons name="cash-outline" size={16} color={Colors.gold} />
              <Text style={styles.bursMiktarText}>₺{item.miktar.toLocaleString('tr-TR')}</Text>
            </View>

            <View style={styles.bursSure}>
              <Ionicons name="hourglass-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.bursSureText}>
                Program: {bursProgramSuresiAy(item)} ay
              </Text>
            </View>

            <View style={styles.bursTarih}>
              <Ionicons
                name={sonBasvuruGecti ? 'close-circle-outline' : 'calendar-outline'}
                size={14}
                color={sonBasvuruGecti ? Colors.error : Colors.textMuted}
              />
              <Text style={[styles.bursTarihText, sonBasvuruGecti && { color: Colors.error }]}>
                Son Başvuru: {item.sonBasvuruTarihi}
                {sonBasvuruGecti ? ' (Süre doldu)' : ''}
              </Text>
            </View>

            {basvurumVar && (
              <View style={styles.basvuruYapildi}>
                <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                <Text style={styles.basvuruYapildiText}>Başvurunuz alındı</Text>
              </View>
            )}
          </TouchableOpacity>

          {kullanici?.rol === 'admin' && (
            <TouchableOpacity
              style={styles.bursSilBtn}
              onPress={() => bursKaldirOnay(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={22} color={Colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        baslik="Burslar"
        altBaslik="Öğrenci burs programları"
        sagButon={kullanici?.rol === 'admin' ? {
          ikon: 'add',
          onPress: () => navigation.navigate('AddScholarship'),
        } : undefined}
      />

      <View style={styles.sekmeler}>
        <TouchableOpacity
          style={[styles.sekme, sekme === 'burslar' && styles.aktifSekme]}
          onPress={() => setSekme('burslar')}
        >
          <Text style={[styles.sekmeText, sekme === 'burslar' && styles.aktifSekmeText]}>Burslar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sekme, sekme === 'basvurularim' && styles.aktifSekme]}
          onPress={() => setSekme('basvurularim')}
        >
          <Text style={[styles.sekmeText, sekme === 'basvurularim' && styles.aktifSekmeText]}>
            Başvurularım {benimBasvurularim.length > 0 && `(${benimBasvurularim.length})`}
          </Text>
        </TouchableOpacity>
      </View>

      {sekme === 'burslar' ? (
        <FlatList
          data={burslar}
          keyExtractor={item => item.id}
          renderItem={renderBurs}
          contentContainerStyle={styles.liste}
          refreshControl={<RefreshControl refreshing={yukleniyor} onRefresh={yukle} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <EmptyState ikon="school-outline" baslik="Burs bulunamadı" aciklama="Henüz aktif burs programı yok." />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={benimBasvurularim}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.basvuruKart}
              onPress={() => navigation.navigate('ScholarshipDetail', { bursId: item.bursId })}
              activeOpacity={0.85}
            >
              <View style={styles.basvuruHeader}>
                <Text style={styles.basvuruBursAdi}>{item.bursAdi}</Text>
                <StatusBadge durum={item.durum} kucuk />
              </View>
              <Text style={styles.basvuruTarih}>
                Başvuru: {item.basvuruTarihi}
              </Text>
              {item.durum === 'onaylandi' && !item.iban && (
                <View style={styles.ibanUyari}>
                  <Ionicons name="warning-outline" size={16} color={Colors.warning} />
                  <Text style={styles.ibanUyariText}>Ödeme için IBAN girmeniz gerekiyor — detaya dokunun.</Text>
                </View>
              )}
              {item.durum === 'onaylandi' && (
                <View style={styles.odemeOzeti}>
                  <Ionicons
                    name={item.bursOdemeDurumu === 'yatirildi' ? 'checkmark-done-circle' : 'wallet-outline'}
                    size={16}
                    color={item.bursOdemeDurumu === 'yatirildi' ? Colors.success : Colors.warning}
                  />
                  <Text style={styles.odemeOzetiText}>
                    {item.bursOdemeDurumu === 'yatirildi'
                      ? `Burs yatırıldı${item.bursOdemeTarihi ? ` · ${item.bursOdemeTarihi}` : ''}`
                      : 'Burs ödemesi henüz yatırılmadı'}
                  </Text>
                </View>
              )}
              {item.notlar && (
                <Text style={styles.basvuruNot}>{item.notlar}</Text>
              )}
              <Text style={styles.basvuruDetayHint}>Detay için dokunun</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.liste}
          refreshControl={<RefreshControl refreshing={yukleniyor} onRefresh={yukle} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <EmptyState ikon="document-outline" baslik="Başvuru bulunamadı" aciklama="Henüz bir bursa başvurmadınız." />
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
    paddingBottom: 0,
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
  liste: { padding: 16 },
  bursKart: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  bursKartUst: { flexDirection: 'row', alignItems: 'stretch' },
  bursKartMain: { flex: 1, padding: 16, paddingRight: 8 },
  bursSilBtn: {
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
    backgroundColor: Colors.error + '08',
  },
  kapaliKart: { opacity: 0.7 },
  bursHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  bursIkon: {
    width: 44,
    height: 44,
    backgroundColor: Colors.gold + '20',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bursAdi: { fontSize: 15, fontWeight: '700', color: Colors.text, flex: 1 },
  kapaliText: { color: Colors.textMuted },
  bursSaglayan: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  bursAciklama: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18, marginBottom: 10 },
  bursMiktar: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  bursMiktarText: { fontSize: 16, fontWeight: '700', color: Colors.gold },
  bursSure: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  bursSureText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  bursTarih: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bursTarihText: { fontSize: 12, color: Colors.textMuted },
  basvuruYapildi: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  basvuruYapildiText: { fontSize: 12, color: Colors.success, fontWeight: '600' },
  basvuruKart: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  basvuruHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  basvuruBursAdi: { fontSize: 14, fontWeight: '600', color: Colors.text, flex: 1, marginRight: 8 },
  basvuruTarih: { fontSize: 12, color: Colors.textMuted },
  ibanUyari: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    padding: 10,
    backgroundColor: Colors.warning + '15',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.warning + '40',
  },
  ibanUyariText: { flex: 1, fontSize: 12, color: Colors.warning, fontWeight: '600', lineHeight: 17 },
  odemeOzeti: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  odemeOzetiText: { flex: 1, fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  basvuruNot: { fontSize: 12, color: Colors.textSecondary, marginTop: 6, fontStyle: 'italic' },
  basvuruDetayHint: { fontSize: 11, color: Colors.textMuted, marginTop: 8 },
});
