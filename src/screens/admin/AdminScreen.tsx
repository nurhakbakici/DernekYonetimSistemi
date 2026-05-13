import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../../context/DataContext';
import { Colors } from '../../constants/colors';
import ScreenHeader from '../../components/common/ScreenHeader';

interface AdminKart {
  ikon: keyof typeof Ionicons.glyphMap;
  baslik: string;
  aciklama: string;
  renk: string;
  onPress: () => void;
  sayac?: number;
}

export default function AdminScreen() {
  const navigation = useNavigation<any>();
  const {
    rezervasyonlar, rezervasyonYukle,
    etkinlikler, etkinlikYukle,
    aidatOdemeleri, aidatYukle,
    bursBasvurulari, bursBasvuruYukle,
    kullanicilar, kullaniciYukle,
    duyuruYukle,
  } = useData();

  useEffect(() => {
    rezervasyonYukle();
    etkinlikYukle();
    aidatYukle();
    bursBasvuruYukle();
    kullaniciYukle();
    duyuruYukle();
  }, []);

  const bekleyenRezervasyonlar = rezervasyonlar.filter(r => r.durum === 'beklemede').length;
  const bekleyenEtkinlikler = etkinlikler.filter(e => e.durum === 'beklemede').length;
  const odenmemisAidatlar = aidatOdemeleri.filter(a => !a.odendi).length;
  const bekleyenBurslar = bursBasvurulari.filter(b => b.durum === 'beklemede').length;
  const bursOdemeBekleyen = bursBasvurulari.filter(
    b => b.durum === 'onaylandi' && b.bursOdemeDurumu !== 'yatirildi',
  ).length;
  const toplam = bekleyenRezervasyonlar + bekleyenEtkinlikler + bekleyenBurslar;

  const kartlar: AdminKart[] = [
    {
      ikon: 'calendar',
      baslik: 'Rezervasyonlar',
      aciklama: 'Oda rezervasyonlarını yönet',
      renk: Colors.info,
      onPress: () => navigation.navigate('AdminReservations'),
      sayac: bekleyenRezervasyonlar,
    },
    {
      ikon: 'calendar-outline',
      baslik: 'Etkinlikler',
      aciklama: 'Etkinlikleri onayla/iptal et',
      renk: Colors.secondary,
      onPress: () => navigation.navigate('AdminEvents'),
      sayac: bekleyenEtkinlikler,
    },
    {
      ikon: 'card',
      baslik: 'Aidat Yönetimi',
      aciklama: 'Üye aidat ödemelerini takip et',
      renk: Colors.purple,
      onPress: () => navigation.navigate('AdminMembership'),
      sayac: odenmemisAidatlar,
    },
    {
      ikon: 'school',
      baslik: 'Burs Başvuruları',
      aciklama:
        bursOdemeBekleyen > 0
          ? `Başvuruları incele; ${bursOdemeBekleyen} onaylı başvuruda ödeme henüz işaretlenmemiş.`
          : 'Başvuruları incele, belge ve ödeme durumunu yönet',
      renk: Colors.gold,
      onPress: () => navigation.navigate('AdminScholarships'),
      sayac: bekleyenBurslar,
    },
    {
      ikon: 'add-circle-outline',
      baslik: 'Yeni Burs Programı',
      aciklama: 'Sisteme yeni burs ilanı ekle',
      renk: Colors.primaryLight,
      onPress: () => navigation.navigate('AdminAddScholarship'),
    },
    {
      ikon: 'megaphone',
      baslik: 'Duyurular',
      aciklama: 'Üyelere duyuru yayınla',
      renk: Colors.warning,
      onPress: () => navigation.navigate('AdminDuyurular'),
    },
    {
      ikon: 'power',
      baslik: 'Dernek Durumu',
      aciklama: 'Açık/kapalı durumunu güncelle',
      renk: Colors.success,
      onPress: () => navigation.navigate('AdminStatus'),
    },
    {
      ikon: 'people',
      baslik: 'Üye Yönetimi',
      aciklama: 'Üyeleri görüntüle ve yönet',
      renk: Colors.error,
      onPress: () => navigation.navigate('AdminUsers'),
      sayac: kullanicilar.filter(
        u => u.rol === 'aday' || (u.rol === 'uye' && u.uyelikDurumu === 'beklemede')
      ).length,
    },
  ];

  return (
    <View style={styles.container}>
      <ScreenHeader baslik="Yönetici Paneli" altBaslik="Kule Sakinleri Derneği" geriButon />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {toplam > 0 && (
          <View style={styles.uyariCard}>
            <Ionicons name="notifications" size={20} color={Colors.warning} />
            <Text style={styles.uyariText}>
              {toplam} bekleyen işlem var
            </Text>
          </View>
        )}

        <Text style={styles.sectionBaslik}>Yönetim Araçları</Text>

        <View style={styles.grid}>
          {kartlar.map((kart, idx) => (
            <TouchableOpacity key={idx} style={styles.kart} onPress={kart.onPress}>
              <View style={[styles.kartIkon, { backgroundColor: kart.renk + '20' }]}>
                <Ionicons name={kart.ikon} size={28} color={kart.renk} />
                {kart.sayac && kart.sayac > 0 ? (
                  <View style={styles.sayacBadge}>
                    <Text style={styles.sayacText}>{kart.sayac}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.kartBaslik}>{kart.baslik}</Text>
              <Text style={styles.kartAciklama}>{kart.aciklama}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  uyariCard: {
    margin: 16,
    backgroundColor: Colors.warning + '15',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.warning + '40',
  },
  uyariText: { flex: 1, color: Colors.warning, fontWeight: '600', fontSize: 14 },
  sectionBaslik: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 8,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 12 },
  kart: {
    width: '45%',
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 140,
  },
  kartIkon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  sayacBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  sayacText: { color: Colors.white, fontSize: 11, fontWeight: '700' },
  kartBaslik: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  kartAciklama: { fontSize: 11, color: Colors.textMuted, lineHeight: 16 },
});
