import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, RefreshControl, Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { tamUyeOzelliklerineErisir, rolGosterimMetni } from '../../utils/userAccess';
import { Colors } from '../../constants/colors';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface QuickCard {
  ikon: keyof typeof Ionicons.glyphMap;
  baslik: string;
  aciklama: string;
  renk: string;
  onPress: () => void;
}

export default function HomeScreen() {
  const { kullanici, paketAktif } = useAuth();
  const {
    dernekDurumu, dernekDurumuYukle,
    etkinlikler, etkinlikYukle,
    rezervasyonlar, rezervasyonYukle,
    oduncAlmalar, oduncYukle,
    duyurular, duyuruYukle,
    gonulluGorevler, gonulluGorevYukle, gonulluBasvuruYukle,
    envanterKayitlari, envanterYukle, envanterZimmetYukle,
  } = useData();
  const navigation = useNavigation<any>();
  const [yukleniyor, setYukleniyor] = React.useState(false);

  useEffect(() => {
    yukle();
  }, []);

  const yukle = async () => {
    setYukleniyor(true);
    const tam = tamUyeOzelliklerineErisir(kullanici);
    await Promise.all([
      ...(paketAktif('acikKapali') ? [dernekDurumuYukle()] : []),
      duyuruYukle(),
      etkinlikYukle(),
      ...(tam ? [rezervasyonYukle(), oduncYukle()] : []),
      ...(paketAktif('gonulluluk') ? [gonulluGorevYukle(), gonulluBasvuruYukle()] : []),
      ...(paketAktif('envanter') && tam ? [envanterYukle(), envanterZimmetYukle()] : []),
    ]);
    setYukleniyor(false);
  };

  const yaklasanEtkinlikler = etkinlikler
    .filter(e => e.durum === 'onaylandi' && new Date(e.tarih) > new Date())
    .sort((a, b) => new Date(a.tarih).getTime() - new Date(b.tarih).getTime())
    .slice(0, 3);

  const benimRezervasyonlarim = rezervasyonlar.filter(
    r => r.kullaniciId === kullanici?.id && r.durum !== 'iptal'
  );

  const aktifOdunclar = oduncAlmalar.filter(
    o => o.kullaniciId === kullanici?.id && (o.durum === 'aktif' || o.durum === 'gecikti'),
  );

  const gecikmisSayisi = oduncAlmalar.filter(
    o => o.kullaniciId === kullanici?.id && o.durum === 'gecikti',
  ).length;

  const tamUyelik = tamUyeOzelliklerineErisir(kullanici);

  const sonDuyurular = duyurular.slice(0, 3);

  const quickCards: QuickCard[] = [
    ...(tamUyelik && paketAktif('odalar') ? [{
      ikon: 'business-outline' as const,
      baslik: 'Oda Rezervasyon',
      aciklama: `${benimRezervasyonlarim.length} aktif rezervasyon`,
      renk: Colors.info,
      onPress: () => navigation.navigate('Odalar'),
    }] : []),
    ...(tamUyelik && paketAktif('kutuphane') ? [{
      ikon: 'library-outline' as const,
      baslik: 'Kütüphane',
      aciklama: gecikmisSayisi > 0
        ? `${aktifOdunclar.length} ödünç · ${gecikmisSayisi} gecikmiş`
        : `${aktifOdunclar.length} ödünç kitap`,
      renk: Colors.success,
      onPress: () => navigation.navigate('Kutuphane'),
    }] : []),
    ...(tamUyelik && paketAktif('aidat') ? [{
      ikon: 'card-outline' as const,
      baslik: 'Aidat',
      aciklama: kullanici?.uyelikDurumu === 'aktif' ? 'Üyelik aktif' : 'Üyelik beklemede',
      renk: Colors.purple,
      onPress: () => navigation.navigate('Profil', { screen: 'Membership' }),
    }] : []),
    ...(paketAktif('etkinlikler') ? [{
      ikon: 'calendar-outline' as const,
      baslik: 'Etkinlikler',
      aciklama: `${yaklasanEtkinlikler.length} yaklaşan etkinlik`,
      renk: Colors.secondary,
      onPress: () => navigation.navigate('Etkinlikler'),
    }] : []),
    ...(tamUyelik && paketAktif('gonulluluk') ? [{
      ikon: 'hand-left-outline' as const,
      baslik: 'Gönüllülük',
      aciklama: `${gonulluGorevler.filter(g => g.durum === 'acik').length} açık görev`,
      renk: Colors.info,
      onPress: () => navigation.navigate('Profil', { screen: 'VolunteerTasks' }),
    }] : []),
    ...(tamUyelik && paketAktif('envanter') ? [{
      ikon: 'cube-outline' as const,
      baslik: 'Envanter',
      aciklama: `${envanterKayitlari.filter(e => e.musaitAdet > 0).length} müsait demirbaş`,
      renk: Colors.warning,
      onPress: () => navigation.navigate('Profil', { screen: 'Inventory' }),
    }] : []),
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />

      <View style={styles.header}>
        <View>
          <Text style={styles.hosgeldin}>Hoş geldiniz,</Text>
          <Text style={styles.kullaniciAdi}>{kullanici?.ad} {kullanici?.soyad}</Text>
          <Text style={styles.tarih}>
            {format(new Date(), "d MMMM yyyy, EEEE", { locale: tr })}
          </Text>
        </View>
        <View style={styles.rolBadge}>
          <Ionicons
            name={kullanici?.rol === 'admin' ? 'shield-checkmark' : kullanici?.rol === 'aday' ? 'hourglass-outline' : 'person'}
            size={16}
            color={kullanici?.rol === 'admin' ? Colors.gold : kullanici?.rol === 'aday' ? Colors.warning : Colors.primaryLight}
          />
          <Text style={[
            styles.rolText,
            kullanici?.rol === 'admin' && styles.adminText,
            kullanici?.rol === 'aday' && styles.adayText,
          ]}>
            {kullanici ? rolGosterimMetni(kullanici.rol) : ''}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={yukleniyor} onRefresh={yukle} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {paketAktif('acikKapali') && (
          <View
            style={[styles.dernekDurumCard, dernekDurumu?.acik ? styles.acikCard : styles.kapaliCard]}
          >
            <View style={styles.durumSolTaraf}>
              <View style={[styles.durumDot, dernekDurumu?.acik ? styles.acikDot : styles.kapaliDot]} />
              <View>
                <Text style={styles.durumBaslik}>
                  {dernekDurumu?.acik ? 'Dernek Açık' : 'Dernek Kapalı'}
                </Text>
                {dernekDurumu?.mesaj && (
                  <Text style={styles.durumMesaj}>{dernekDurumu.mesaj}</Text>
                )}
              </View>
            </View>
            <Ionicons
              name={dernekDurumu?.acik ? 'checkmark-circle' : 'close-circle'}
              size={32}
              color={dernekDurumu?.acik ? Colors.success : Colors.error}
            />
          </View>
        )}

        <View style={styles.duyuruBolum}>
          <View style={styles.duyuruBolumBaslik}>
            <Text style={styles.duyuruBolumTitle}>Duyurular</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Duyurular')}>
              <Text style={styles.duyuruTumunu}>Tümü</Text>
            </TouchableOpacity>
          </View>
          {sonDuyurular.length === 0 ? (
            <View style={styles.duyuruBos}>
              <Text style={styles.duyuruBosText}>Henüz duyuru bulunmuyor.</Text>
            </View>
          ) : (
            sonDuyurular.map((d) => (
              <TouchableOpacity
                key={d.id}
                style={styles.duyuruKart}
                onPress={() => navigation.navigate('Duyurular')}
                activeOpacity={0.75}
              >
                {d.gorselUri ? (
                  <Image source={{ uri: d.gorselUri }} style={styles.duyuruThumb} resizeMode="cover" />
                ) : (
                  <Ionicons name="megaphone-outline" size={22} color={Colors.warning} style={{ marginRight: 12 }} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.duyuruKartBaslik} numberOfLines={2}>
                    {d.baslik}
                  </Text>
                  <Text style={styles.duyuruKartMeta} numberOfLines={1}>
                    {format(new Date(d.olusturulmaTarihi), 'd MMM yyyy', { locale: tr })} · {d.olusturanAdi}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            ))
          )}
        </View>

        {!tamUyelik && (
          <View style={styles.adayBilgi}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.warning} />
            <Text style={styles.adayBilgiText}>
              Aday üye olarak yalnızca dernek durumu ve etkinlikleri görüntüleyebilirsiniz. Tam üyelik için yönetici onayı bekleniyor.
            </Text>
          </View>
        )}

        {/* Uyarı Kartları */}
        {tamUyelik && gecikmisSayisi > 0 && (
          <TouchableOpacity
            style={styles.uyariCard}
            onPress={() => navigation.navigate('Kutuphane')}
          >
            <Ionicons name="warning" size={20} color={Colors.error} />
            <Text style={styles.uyariText}>
              {gecikmisSayisi} kitabınızın iadesi gecikiyor!
            </Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.error} />
          </TouchableOpacity>
        )}

        {/* Hızlı Erişim */}
        <Text style={styles.sectionBaslik}>Hızlı Erişim</Text>
        <View style={styles.quickGrid}>
          {quickCards.map((card, index) => (
            <TouchableOpacity key={index} style={styles.quickCard} onPress={card.onPress}>
              <View style={[styles.quickIconContainer, { backgroundColor: card.renk + '20' }]}>
                <Ionicons name={card.ikon} size={28} color={card.renk} />
              </View>
              <Text style={styles.quickBaslik}>{card.baslik}</Text>
              <Text style={styles.quickAciklama}>{card.aciklama}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Yaklaşan Etkinlikler */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionBaslik}>Yaklaşan Etkinlikler</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Etkinlikler')}>
            <Text style={styles.tumunuGor}>Tümünü Gör</Text>
          </TouchableOpacity>
        </View>

        {yaklasanEtkinlikler.length === 0 ? (
          <View style={styles.bosKart}>
            <Text style={styles.bosMetin}>Yaklaşan etkinlik bulunmuyor</Text>
          </View>
        ) : (
          yaklasanEtkinlikler.map(etkinlik => (
            <TouchableOpacity
              key={etkinlik.id}
              style={styles.etkinlikKart}
              onPress={() => navigation.navigate('Etkinlikler', { screen: 'EventDetail', params: { etkinlikId: etkinlik.id } })}
            >
              <View style={styles.etkinlikTarihBox}>
                <Text style={styles.etkinlikGun}>
                  {format(new Date(etkinlik.tarih), 'd', { locale: tr })}
                </Text>
                <Text style={styles.etkinlikAy}>
                  {format(new Date(etkinlik.tarih), 'MMM', { locale: tr })}
                </Text>
              </View>
              <View style={styles.etkinlikBilgi}>
                <Text style={styles.etkinlikBaslik}>{etkinlik.baslik}</Text>
                <View style={styles.etkinlikMeta}>
                  <Ionicons name="location-outline" size={12} color={Colors.textMuted} />
                  <Text style={styles.etkinlikMetaText}>{etkinlik.konum}</Text>
                  <Ionicons name="time-outline" size={12} color={Colors.textMuted} style={{ marginLeft: 8 }} />
                  <Text style={styles.etkinlikMetaText}>
                    {format(new Date(etkinlik.tarih), 'HH:mm')}
                  </Text>
                </View>
              </View>
              <View style={[styles.katilimciBadge]}>
                <Text style={styles.katilimciSayi}>{etkinlik.katilimcilar.length}</Text>
                <Text style={styles.katilimciLabel}>kişi</Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* Yönetici Paneli Kısayolu */}
        {kullanici?.rol === 'admin' && (
          <TouchableOpacity
            style={styles.adminCard}
            onPress={() => navigation.navigate('Profil', { screen: 'Admin' })}
          >
            <Ionicons name="settings" size={24} color={Colors.gold} />
            <Text style={styles.adminCardText}>Yönetici Paneli</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.gold} />
          </TouchableOpacity>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primaryDark,
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: Colors.primaryLight + '30',
  },
  hosgeldin: { fontSize: 13, color: Colors.textSecondary },
  kullaniciAdi: { fontSize: 20, fontWeight: '700', color: Colors.text, marginTop: 2 },
  tarih: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  rolBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rolText: { fontSize: 12, color: Colors.primaryLight, fontWeight: '600' },
  adminText: { color: Colors.gold },
  adayText: { color: Colors.warning },
  scroll: { flex: 1 },
  adayBilgi: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.warning + '12',
    borderWidth: 1,
    borderColor: Colors.warning + '35',
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  adayBilgiText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
  dernekDurumCard: {
    margin: 16,
    marginBottom: 0,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
  },
  acikCard: {
    backgroundColor: Colors.success + '15',
    borderColor: Colors.success + '40',
  },
  kapaliCard: {
    backgroundColor: Colors.error + '15',
    borderColor: Colors.error + '40',
  },
  durumSolTaraf: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  durumDot: { width: 12, height: 12, borderRadius: 6 },
  acikDot: { backgroundColor: Colors.success },
  kapaliDot: { backgroundColor: Colors.error },
  durumBaslik: { fontSize: 16, fontWeight: '700', color: Colors.text },
  durumMesaj: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, maxWidth: 220 },
  duyuruBolum: { marginHorizontal: 16, marginTop: 16 },
  duyuruBolumBaslik: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  duyuruBolumTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  duyuruTumunu: { fontSize: 13, color: Colors.primaryLight, fontWeight: '600' },
  duyuruBos: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  duyuruBosText: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
  duyuruKart: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.warning + '35',
  },
  duyuruThumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: Colors.surfaceVariant,
  },
  duyuruKartBaslik: { fontSize: 14, fontWeight: '700', color: Colors.text },
  duyuruKartMeta: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  uyariCard: {
    margin: 16,
    marginBottom: 0,
    backgroundColor: Colors.error + '15',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.error + '40',
  },
  uyariText: { flex: 1, color: Colors.error, fontSize: 13, fontWeight: '600' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionBaslik: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  tumunuGor: { fontSize: 13, color: Colors.primaryLight, fontWeight: '600' },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 12,
  },
  quickCard: {
    width: '45%',
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 140,
  },
  quickIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickBaslik: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  quickAciklama: { fontSize: 11, color: Colors.textMuted },
  bosKart: {
    marginHorizontal: 16,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bosMetin: { color: Colors.textMuted, fontSize: 14 },
  etkinlikKart: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  etkinlikTarihBox: {
    width: 44,
    height: 52,
    backgroundColor: Colors.primary + '20',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  etkinlikGun: { fontSize: 18, fontWeight: '700', color: Colors.primaryLight },
  etkinlikAy: { fontSize: 11, color: Colors.textMuted, textTransform: 'uppercase' },
  etkinlikBilgi: { flex: 1 },
  etkinlikBaslik: { fontSize: 14, fontWeight: '600', color: Colors.text },
  etkinlikMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  etkinlikMetaText: { fontSize: 11, color: Colors.textMuted, marginLeft: 2 },
  katilimciBadge: { alignItems: 'center' },
  katilimciSayi: { fontSize: 16, fontWeight: '700', color: Colors.primaryLight },
  katilimciLabel: { fontSize: 10, color: Colors.textMuted },
  adminCard: {
    margin: 16,
    backgroundColor: Colors.primaryDark,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.gold + '40',
  },
  adminCardText: { flex: 1, fontSize: 15, fontWeight: '700', color: Colors.gold },
});
