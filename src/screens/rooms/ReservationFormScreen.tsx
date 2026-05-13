import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';
import ScreenHeader from '../../components/common/ScreenHeader';
import { format, addDays } from 'date-fns';
import { tr } from 'date-fns/locale';

type RouteParams = { odaId: string };

const SAATLER = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];

export default function ReservationFormScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const { odaId } = route.params;
  const { kullanici } = useAuth();
  const { odalar, rezervasyonlar, rezervasyonEkle, odaYukle, rezervasyonYukle } = useData();

  const [tarih, setTarih] = useState('');
  const [baslangicSaati, setBaslangicSaati] = useState('');
  const [bitisSaati, setBitisSaati] = useState('');
  const [amac, setAmac] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);

  const oda = odalar.find(o => o.id === odaId);

  useEffect(() => {
    odaYukle();
    rezervasyonYukle();
  }, []);

  const bugundenItibaren = Array.from({ length: 30 }, (_, i) => {
    const date = addDays(new Date(), i);
    return format(date, 'yyyy-MM-dd');
  });

  const seciliGunRezervasyonlari = rezervasyonlar.filter(
    r => r.odaId === odaId && r.tarih === tarih && r.durum !== 'iptal'
  );

  const saatMüsaitMi = (saat: string) => {
    return !seciliGunRezervasyonlari.some(r => {
      const baslangic = r.baslangicSaati;
      const bitis = r.bitisSaati;
      return saat >= baslangic && saat < bitis;
    });
  };

  const handleRezervasyon = async () => {
    if (!tarih || !baslangicSaati || !bitisSaati || !amac.trim()) {
      Alert.alert('Hata', 'Tüm alanları doldurun.');
      return;
    }

    if (baslangicSaati >= bitisSaati) {
      Alert.alert('Hata', 'Bitiş saati başlangıç saatinden sonra olmalıdır.');
      return;
    }

    if (!kullanici) return;

    setYukleniyor(true);
    try {
      await rezervasyonEkle({
        odaId,
        odaAdi: oda?.ad || '',
        kullaniciId: kullanici.id,
        kullaniciAdi: `${kullanici.ad} ${kullanici.soyad}`,
        tarih,
        baslangicSaati,
        bitisSaati,
        amac: amac.trim(),
        durum: 'beklemede',
      });
      Alert.alert(
        'Rezervasyon Talebi Alındı',
        'Rezervasyon talebiniz yönetim kuruluna iletildi. Onay sonrası bilgilendirileceksiniz.',
        [{ text: 'Tamam', onPress: () => navigation.goBack() }]
      );
    } catch {
      Alert.alert('Hata', 'Rezervasyon oluşturulamadı.');
    } finally {
      setYukleniyor(false);
    }
  };

  if (!oda) {
    return (
      <View style={styles.container}>
        <ScreenHeader baslik="Rezervasyon" geriButon />
        <View style={styles.hata}><Text style={styles.hataText}>Oda bulunamadı.</Text></View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader baslik="Oda Rezervasyonu" altBaslik={oda.ad} geriButon />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.odaBilgiCard}>
          <View style={styles.odaIkon}>
            <Ionicons name="business" size={28} color={Colors.primaryLight} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.odaAd}>{oda.ad}</Text>
            <Text style={styles.odaKapasite}>
              <Ionicons name="people-outline" size={12} color={Colors.textMuted} /> {oda.kapasite} kişi kapasiteli
            </Text>
          </View>
        </View>

        {/* Tarih Seçimi */}
        <Text style={styles.label}>Tarih Seçin</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tarihScroll}>
          {bugundenItibaren.map(t => {
            const date = new Date(t);
            return (
              <TouchableOpacity
                key={t}
                style={[styles.tarihButon, tarih === t && styles.tarihButonSecili]}
                onPress={() => { setTarih(t); setBaslangicSaati(''); setBitisSaati(''); }}
              >
                <Text style={[styles.tarihGun, tarih === t && styles.tarihSeciliText]}>
                  {format(date, 'EEE', { locale: tr }).toUpperCase()}
                </Text>
                <Text style={[styles.tarihSayi, tarih === t && styles.tarihSeciliText]}>
                  {format(date, 'd')}
                </Text>
                <Text style={[styles.tarihAy, tarih === t && styles.tarihSeciliText]}>
                  {format(date, 'MMM', { locale: tr })}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {tarih && (
          <>
            <Text style={styles.label}>Başlangıç Saati</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.saatScroll}>
              {SAATLER.map(saat => {
                const musait = saatMüsaitMi(saat);
                return (
                  <TouchableOpacity
                    key={saat}
                    style={[
                      styles.saatButon,
                      baslangicSaati === saat && styles.saatButonSecili,
                      !musait && styles.saatButonDolu,
                    ]}
                    onPress={() => musait && setBaslangicSaati(saat)}
                    disabled={!musait}
                  >
                    <Text style={[
                      styles.saatText,
                      baslangicSaati === saat && styles.saatSeciliText,
                      !musait && styles.saatDoluText,
                    ]}>
                      {saat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.label}>Bitiş Saati</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.saatScroll}>
              {SAATLER.filter(s => !baslangicSaati || s > baslangicSaati).map(saat => {
                const musait = saatMüsaitMi(saat);
                return (
                  <TouchableOpacity
                    key={saat}
                    style={[
                      styles.saatButon,
                      bitisSaati === saat && styles.saatButonSecili,
                      !musait && styles.saatButonDolu,
                    ]}
                    onPress={() => musait && setBitisSaati(saat)}
                    disabled={!musait}
                  >
                    <Text style={[
                      styles.saatText,
                      bitisSaati === saat && styles.saatSeciliText,
                      !musait && styles.saatDoluText,
                    ]}>
                      {saat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        )}

        {seciliGunRezervasyonlari.length > 0 && (
          <View style={styles.mevcutRezCard}>
            <Text style={styles.mevcutRezBaslik}>
              <Ionicons name="information-circle-outline" size={14} color={Colors.info} /> Mevcut Rezervasyonlar
            </Text>
            {seciliGunRezervasyonlari.map(r => (
              <Text key={r.id} style={styles.mevcutRezText}>
                • {r.baslangicSaati} - {r.bitisSaati}: {r.amac}
              </Text>
            ))}
          </View>
        )}

        <Text style={styles.label}>Kullanım Amacı</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Toplantı, oyun gecesi, turnuva vb."
          placeholderTextColor={Colors.textMuted}
          value={amac}
          onChangeText={setAmac}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.rezervasyonButton, yukleniyor && { opacity: 0.6 }]}
          onPress={handleRezervasyon}
          disabled={yukleniyor}
        >
          <Ionicons name="calendar-outline" size={20} color={Colors.white} />
          <Text style={styles.rezervasyonButtonText}>
            {yukleniyor ? 'Gönderiliyor...' : 'Rezervasyon Talebi Gönder'}
          </Text>
        </TouchableOpacity>

        <View style={styles.bilgiBox}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.textMuted} />
          <Text style={styles.bilgiText}>
            Rezervasyon talepleriniz yönetim kurulu tarafından onaylanacaktır. Onay sonrası bildirim alacaksınız.
          </Text>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1, padding: 16 },
  hata: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hataText: { color: Colors.textMuted },
  odaBilgiCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  odaIkon: {
    width: 52,
    height: 52,
    backgroundColor: Colors.primary + '20',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  odaAd: { fontSize: 16, fontWeight: '700', color: Colors.text },
  odaKapasite: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 10,
    marginTop: 16,
  },
  tarihScroll: { marginBottom: 4 },
  saatScroll: { marginBottom: 4 },
  tarihButon: {
    width: 64,
    marginRight: 10,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tarihButonSecili: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tarihGun: { fontSize: 10, color: Colors.textMuted, fontWeight: '600' },
  tarihSayi: { fontSize: 20, fontWeight: '700', color: Colors.text, marginVertical: 2 },
  tarihAy: { fontSize: 10, color: Colors.textMuted },
  tarihSeciliText: { color: Colors.white },
  saatButon: {
    marginRight: 8,
    backgroundColor: Colors.card,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  saatButonSecili: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  saatButonDolu: { backgroundColor: Colors.error + '20', borderColor: Colors.error + '40' },
  saatText: { fontSize: 13, fontWeight: '600', color: Colors.text },
  saatSeciliText: { color: Colors.white },
  saatDoluText: { color: Colors.error },
  mevcutRezCard: {
    backgroundColor: Colors.info + '15',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.info + '40',
  },
  mevcutRezBaslik: { fontSize: 12, fontWeight: '600', color: Colors.info, marginBottom: 6 },
  mevcutRezText: { fontSize: 12, color: Colors.textSecondary, marginBottom: 3 },
  textArea: {
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 12,
    padding: 14,
    color: Colors.text,
    fontSize: 14,
    minHeight: 90,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rezervasyonButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
  },
  rezervasyonButtonText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  bilgiBox: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 10,
    padding: 12,
    gap: 8,
    marginTop: 12,
  },
  bilgiText: { flex: 1, fontSize: 12, color: Colors.textMuted, lineHeight: 18 },
});
