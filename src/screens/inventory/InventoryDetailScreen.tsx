import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';
import ScreenHeader from '../../components/common/ScreenHeader';

type RouteParams = { envanterId: string };

export default function InventoryDetailScreen() {
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const { envanterId } = route.params;
  const { kullanici } = useAuth();
  const {
    envanterKayitlari, envanterZimmetler, envanterYukle, envanterZimmetYukle,
    envanterZimmetVer, envanterZimmetIade,
  } = useData();
  const [yukleniyor, setYukleniyor] = useState(false);

  useEffect(() => {
    void Promise.all([envanterYukle(), envanterZimmetYukle()]);
  }, []);

  const env = envanterKayitlari.find(e => e.id === envanterId);
  const aktifZimmet = envanterZimmetler.find(
    z => z.envanterId === envanterId && z.kullaniciId === kullanici?.id && z.durum === 'aktif',
  );

  const zimmetAl = () => {
    if (!kullanici || !env) return;
    Alert.alert('Zimmet al', `"${env.ad}" demirbaşını zimmetinize almak istiyor musunuz?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Zimmet al',
        onPress: async () => {
          setYukleniyor(true);
          try {
            await envanterZimmetVer(envanterId, env.ad, kullanici.id, `${kullanici.ad} ${kullanici.soyad}`);
            await Promise.all([envanterYukle(), envanterZimmetYukle()]);
            Alert.alert('Başarılı', 'Zimmet kaydı oluşturuldu.');
          } catch (e) {
            Alert.alert('Hata', e instanceof Error ? e.message : 'İşlem başarısız.');
          } finally {
            setYukleniyor(false);
          }
        },
      },
    ]);
  };

  const iadeEt = () => {
    if (!aktifZimmet) return;
    Alert.alert('İade et', 'Demirbaşı iade etmek istiyor musunuz?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'İade et',
        onPress: async () => {
          setYukleniyor(true);
          try {
            await envanterZimmetIade(aktifZimmet.id);
            await Promise.all([envanterYukle(), envanterZimmetYukle()]);
            Alert.alert('Başarılı', 'İade kaydedildi.');
          } catch (e) {
            Alert.alert('Hata', e instanceof Error ? e.message : 'İşlem başarısız.');
          } finally {
            setYukleniyor(false);
          }
        },
      },
    ]);
  };

  if (!env) {
    return (
      <View style={styles.container}>
        <ScreenHeader baslik="Demirbaş" geriButon />
        <Text style={styles.hata}>Kayıt bulunamadı.</Text>
      </View>
    );
  }

  const zimmetAlinabilir = env.musaitAdet > 0 && env.durum !== 'arizali' && !aktifZimmet && kullanici?.rol !== 'admin';

  return (
    <View style={styles.container}>
      <ScreenHeader baslik="Demirbaş" geriButon />
      <ScrollView style={styles.scroll}>
        <View style={styles.ikon}>
          <Ionicons name="cube" size={48} color={Colors.warning} />
        </View>
        <Text style={styles.ad}>{env.ad}</Text>
        <Text style={styles.kat}>{env.kategori} · {env.durum}</Text>
        {env.aciklama ? <Text style={styles.aciklama}>{env.aciklama}</Text> : null}
        <Text style={styles.stok}>{env.musaitAdet} / {env.toplamAdet} müsait</Text>
        {env.lokasyon && <Text style={styles.meta}>Konum: {env.lokasyon}</Text>}
        {env.seriNo && <Text style={styles.meta}>Seri no: {env.seriNo}</Text>}
        {aktifZimmet && (
          <View style={styles.kutu}>
            <Text style={styles.kutuBaslik}>Aktif zimmetiniz</Text>
            <Text style={styles.meta}>Başlangıç: {aktifZimmet.zimmetTarihi}</Text>
            <TouchableOpacity style={styles.butonIkincil} onPress={iadeEt} disabled={yukleniyor}>
              <Text style={styles.butonIkincilText}>İade et</Text>
            </TouchableOpacity>
          </View>
        )}
        {zimmetAlinabilir && (
          <TouchableOpacity style={styles.buton} onPress={zimmetAl} disabled={yukleniyor}>
            <Text style={styles.butonText}>Zimmet al</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16 },
  ikon: { alignSelf: 'center', marginBottom: 12 },
  ad: { fontSize: 22, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  kat: { textAlign: 'center', color: Colors.textMuted, marginTop: 4 },
  aciklama: { marginTop: 16, color: Colors.textSecondary, lineHeight: 22 },
  stok: { marginTop: 12, fontSize: 16, fontWeight: '600', color: Colors.success },
  meta: { marginTop: 6, color: Colors.textMuted, fontSize: 14 },
  kutu: { marginTop: 20, padding: 14, backgroundColor: Colors.surface, borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  kutuBaslik: { fontWeight: '600', color: Colors.text, marginBottom: 8 },
  buton: { marginTop: 24, backgroundColor: Colors.primary, padding: 14, borderRadius: 10, alignItems: 'center' },
  butonText: { color: '#fff', fontWeight: '600' },
  butonIkincil: { marginTop: 12, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  butonIkincilText: { color: Colors.text, fontWeight: '600' },
  hata: { padding: 24, textAlign: 'center', color: Colors.textMuted },
});
