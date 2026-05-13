import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';
import ScreenHeader from '../../components/common/ScreenHeader';
import StatusBadge from '../../components/common/StatusBadge';

type RouteParams = { kitapId: string };

export default function BookDetailScreen() {
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const { kitapId } = route.params;
  const { kullanici } = useAuth();
  const { kitaplar, kitapYukle, oduncAlmalar, oduncYukle, oduncAl, oduncIadeEt } = useData();
  const [yukleniyor, setYukleniyor] = useState(false);

  useEffect(() => {
    void Promise.all([kitapYukle(), oduncYukle()]);
  }, []);

  const kitap = kitaplar.find(k => k.id === kitapId);

  const aktifOdunc = oduncAlmalar.find(
    o => o.kitapId === kitapId && o.kullaniciId === kullanici?.id && o.durum !== 'iade_edildi'
  );

  const handleOduncAl = async () => {
    if (!kullanici) return;
    Alert.alert(
      'Kitap Ödünç Al',
      `"${kitap?.baslik}" kitabını 14 günlüğüne ödünç almak istiyor musunuz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Ödünç Al',
          onPress: async () => {
            setYukleniyor(true);
            try {
              await oduncAl(kitapId, kullanici.id, `${kullanici.ad} ${kullanici.soyad}`);
              await kitapYukle();
              Alert.alert('Başarılı', 'Kitap ödünç alındı. İyi okumalar!');
            } catch (error: unknown) {
              const mesaj = error instanceof Error ? error.message : 'İşlem başarısız.';
              Alert.alert('Hata', mesaj);
            } finally {
              setYukleniyor(false);
            }
          },
        },
      ]
    );
  };

  const handleIadeEt = async () => {
    if (!aktifOdunc) return;
    Alert.alert(
      'Kitap İade Et',
      `"${kitap?.baslik}" kitabını iade etmek istiyor musunuz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'İade Et',
          onPress: async () => {
            setYukleniyor(true);
            try {
              await oduncIadeEt(aktifOdunc.id, kitapId);
              await kitapYukle();
              Alert.alert('Başarılı', 'Kitap iade edildi.');
            } catch {
              Alert.alert('Hata', 'İade işlemi başarısız.');
            } finally {
              setYukleniyor(false);
            }
          },
        },
      ]
    );
  };

  if (!kitap) {
    return (
      <View style={styles.container}>
        <ScreenHeader baslik="Kitap Detayı" geriButon />
        <View style={styles.merkez}><Text style={styles.hataText}>Kitap bulunamadı.</Text></View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader baslik="Kitap Detayı" geriButon />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.kitapHeader}>
          <View style={styles.kitapIkon}>
            <Ionicons name="book" size={56} color={Colors.secondary} />
          </View>
          <Text style={styles.kitapBaslik}>{kitap.baslik}</Text>
          <Text style={styles.kitapYazar}>{kitap.yazar}</Text>
          {kitap.yayinYili && (
            <Text style={styles.kitapYil}>{kitap.yayinYili}</Text>
          )}
        </View>

        <View style={styles.bilgiGrid}>
          <View style={styles.bilgiKart}>
            <Ionicons name="grid-outline" size={20} color={Colors.primaryLight} />
            <Text style={styles.bilgiLabel}>Kategori</Text>
            <Text style={styles.bilgiDeger}>{kitap.kategori}</Text>
          </View>
          <View style={styles.bilgiKart}>
            <Ionicons name="copy-outline" size={20} color={Colors.primaryLight} />
            <Text style={styles.bilgiLabel}>Toplam Adet</Text>
            <Text style={styles.bilgiDeger}>{kitap.toplamAdet}</Text>
          </View>
          <View style={[styles.bilgiKart, kitap.musaitAdet === 0 && styles.stokYok]}>
            <Ionicons
              name={kitap.musaitAdet > 0 ? 'checkmark-circle-outline' : 'close-circle-outline'}
              size={20}
              color={kitap.musaitAdet > 0 ? Colors.success : Colors.error}
            />
            <Text style={styles.bilgiLabel}>Müsait</Text>
            <Text style={[styles.bilgiDeger, kitap.musaitAdet === 0 && { color: Colors.error }]}>
              {kitap.musaitAdet}
            </Text>
          </View>
        </View>

        {kitap.aciklama && (
          <View style={styles.aciklamaCard}>
            <Text style={styles.aciklamaBaslik}>Açıklama</Text>
            <Text style={styles.aciklamaText}>{kitap.aciklama}</Text>
          </View>
        )}

        {aktifOdunc && (
          <View style={[styles.oduncCard, aktifOdunc.durum === 'gecikti' && styles.oduncGecikCard]}>
            <View style={styles.oduncCardHeader}>
              <Ionicons
                name={aktifOdunc.durum === 'gecikti' ? 'warning' : 'information-circle'}
                size={20}
                color={aktifOdunc.durum === 'gecikti' ? Colors.error : Colors.info}
              />
              <Text style={[styles.oduncCardTitle, aktifOdunc.durum === 'gecikti' && { color: Colors.error }]}>
                {aktifOdunc.durum === 'gecikti' ? 'İade Gecikiyor!' : 'Aktif Ödünç'}
              </Text>
              <StatusBadge durum={aktifOdunc.durum} kucuk />
            </View>
            <Text style={styles.oduncTarihText}>
              Alınma: {aktifOdunc.oduncTarihi} | Son İade: {aktifOdunc.iadeTarihi}
            </Text>
          </View>
        )}

        <View style={styles.butonlar}>
          {aktifOdunc ? (
            <TouchableOpacity
              style={[styles.iadeButton, yukleniyor && { opacity: 0.6 }]}
              onPress={handleIadeEt}
              disabled={yukleniyor}
            >
              <Ionicons name="return-down-back-outline" size={20} color={Colors.white} />
              <Text style={styles.butonText}>İade Et</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.oduncButton,
                kitap.musaitAdet === 0 && styles.disabledButton,
                yukleniyor && { opacity: 0.6 },
              ]}
              onPress={handleOduncAl}
              disabled={kitap.musaitAdet === 0 || yukleniyor}
            >
              <Ionicons name="book-outline" size={20} color={Colors.white} />
              <Text style={styles.butonText}>
                {kitap.musaitAdet === 0 ? 'Stokta Yok' : 'Ödünç Al'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  merkez: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hataText: { color: Colors.textMuted },
  kitapHeader: {
    alignItems: 'center',
    padding: 24,
    paddingBottom: 20,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  kitapIkon: {
    width: 100,
    height: 100,
    backgroundColor: Colors.secondary + '20',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.secondary + '40',
  },
  kitapBaslik: { fontSize: 20, fontWeight: '700', color: Colors.text, textAlign: 'center', marginBottom: 6 },
  kitapYazar: { fontSize: 14, color: Colors.textSecondary, marginBottom: 4 },
  kitapYil: { fontSize: 12, color: Colors.textMuted },
  bilgiGrid: { flexDirection: 'row', padding: 16, gap: 12 },
  bilgiKart: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stokYok: { borderColor: Colors.error + '40', backgroundColor: Colors.error + '10' },
  bilgiLabel: { fontSize: 11, color: Colors.textMuted, textAlign: 'center' },
  bilgiDeger: { fontSize: 18, fontWeight: '700', color: Colors.text },
  aciklamaCard: {
    margin: 16,
    marginTop: 0,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  aciklamaBaslik: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  aciklamaText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  oduncCard: {
    margin: 16,
    marginTop: 0,
    backgroundColor: Colors.info + '15',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.info + '40',
  },
  oduncGecikCard: {
    backgroundColor: Colors.error + '15',
    borderColor: Colors.error + '40',
  },
  oduncCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  oduncCardTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.info },
  oduncTarihText: { fontSize: 12, color: Colors.textSecondary },
  butonlar: { paddingHorizontal: 16 },
  oduncButton: {
    backgroundColor: Colors.secondary,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  iadeButton: {
    backgroundColor: Colors.success,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  disabledButton: { backgroundColor: Colors.surfaceVariant },
  butonText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
});
