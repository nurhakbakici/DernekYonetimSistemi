import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';
import ScreenHeader from '../../components/common/ScreenHeader';
import StatusBadge from '../../components/common/StatusBadge';

type RouteParams = { gorevId: string };

export default function VolunteerTaskDetailScreen() {
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const { gorevId } = route.params;
  const { kullanici } = useAuth();
  const {
    gonulluGorevler, gonulluBasvurular, gonulluGorevYukle, gonulluBasvuruYukle,
    gonulluBasvur, onayliGonulluSayisi,
  } = useData();
  const [yukleniyor, setYukleniyor] = useState(false);

  useEffect(() => {
    void Promise.all([gonulluGorevYukle(), gonulluBasvuruYukle()]);
  }, []);

  const gorev = gonulluGorevler.find(g => g.id === gorevId);
  const basvurum = gonulluBasvurular.find(b => b.gorevId === gorevId && b.kullaniciId === kullanici?.id);
  const onayli = onayliGonulluSayisi(gorevId);
  const kontenjanDolu = gorev ? onayli >= gorev.kontenjan : false;

  const handleBasvur = () => {
    if (!kullanici || !gorev) return;
    Alert.alert('Gönüllü başvurusu', `"${gorev.baslik}" görevine başvurmak istiyor musunuz?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Başvur',
        onPress: async () => {
          setYukleniyor(true);
          try {
            await gonulluBasvur(gorevId, gorev.baslik, kullanici.id, `${kullanici.ad} ${kullanici.soyad}`);
            await gonulluBasvuruYukle();
            Alert.alert('Başarılı', 'Başvurunuz alındı. Yönetici onayından sonra bilgilendirileceksiniz.');
          } catch (e) {
            Alert.alert('Hata', e instanceof Error ? e.message : 'Başvuru yapılamadı.');
          } finally {
            setYukleniyor(false);
          }
        },
      },
    ]);
  };

  if (!gorev) {
    return (
      <View style={styles.container}>
        <ScreenHeader baslik="Görev" geriButon />
        <Text style={styles.hata}>Görev bulunamadı.</Text>
      </View>
    );
  }

  const basvuruAcik = gorev.durum === 'acik' && !basvurum && !kontenjanDolu && kullanici?.rol !== 'admin';

  return (
    <View style={styles.container}>
      <ScreenHeader baslik="Gönüllü görev" geriButon />
      <ScrollView style={styles.scroll}>
        <Text style={styles.baslik}>{gorev.baslik}</Text>
        <StatusBadge durum={gorev.durum === 'acik' ? 'onaylandi' : gorev.durum === 'tamamlandi' ? 'onaylandi' : 'beklemede'} kucuk />
        <Text style={styles.aciklama}>{gorev.aciklama}</Text>
        <View style={styles.satir}>
          <Ionicons name="calendar-outline" size={18} color={Colors.textMuted} />
          <Text style={styles.satirText}>{gorev.tarih}{gorev.baslangicSaati ? ` ${gorev.baslangicSaati}` : ''}</Text>
        </View>
        {gorev.konum && (
          <View style={styles.satir}>
            <Ionicons name="location-outline" size={18} color={Colors.textMuted} />
            <Text style={styles.satirText}>{gorev.konum}</Text>
          </View>
        )}
        <View style={styles.satir}>
          <Ionicons name="people-outline" size={18} color={Colors.textMuted} />
          <Text style={styles.satirText}>{onayli} / {gorev.kontenjan} onaylı gönüllü</Text>
        </View>
        {basvurum && (
          <View style={styles.basvuruKutu}>
            <Text style={styles.basvuruBaslik}>Başvurunuz</Text>
            <StatusBadge durum={basvurum.durum} />
            <Text style={styles.basvuruTarih}>Tarih: {basvurum.basvuruTarihi}</Text>
          </View>
        )}
        {basvuruAcik && (
          <TouchableOpacity style={styles.buton} onPress={handleBasvur} disabled={yukleniyor}>
            <Text style={styles.butonText}>{yukleniyor ? 'Gönderiliyor…' : 'Gönüllü olarak başvur'}</Text>
          </TouchableOpacity>
        )}
        {kontenjanDolu && !basvurum && gorev.durum === 'acik' && (
          <Text style={styles.uyari}>Kontenjan dolu.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16 },
  baslik: { fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  aciklama: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22, marginVertical: 12 },
  satir: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  satirText: { fontSize: 14, color: Colors.textSecondary },
  basvuruKutu: { marginTop: 16, padding: 12, backgroundColor: Colors.surface, borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  basvuruBaslik: { fontWeight: '600', color: Colors.text, marginBottom: 6 },
  basvuruTarih: { fontSize: 13, color: Colors.textMuted, marginTop: 6 },
  buton: { marginTop: 20, backgroundColor: Colors.primary, padding: 14, borderRadius: 10, alignItems: 'center' },
  butonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  uyari: { marginTop: 12, color: Colors.warning, fontSize: 14 },
  hata: { padding: 24, color: Colors.textMuted, textAlign: 'center' },
});
