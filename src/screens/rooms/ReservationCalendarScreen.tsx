import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { format, parse } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useData } from '../../context/DataContext';
import { Rezervasyon } from '../../types';
import { Colors } from '../../constants/colors';
import ScreenHeader from '../../components/common/ScreenHeader';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';

LocaleConfig.locales.tr = {
  monthNames: [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
  ],
  monthNamesShort: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
  dayNames: ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'],
  dayNamesShort: ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'],
  today: 'Bugün',
};
LocaleConfig.defaultLocale = 'tr';

/** İptal dışı tüm talepler takvimde görünür (bekleyen + onaylı doluluğu gösterir). */
function rezervasyonGorunurMu(r: Rezervasyon) {
  return r.durum !== 'iptal';
}

export default function ReservationCalendarScreen() {
  const navigation = useNavigation<any>();
  const { odalar, odaYukle, rezervasyonlar, rezervasyonYukle } = useData();
  const [yukleniyor, setYukleniyor] = useState(false);
  const [seciliGun, setSeciliGun] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [seciliOdaId, setSeciliOdaId] = useState<string>('tumu');

  useEffect(() => {
    void yukle();
  }, []);

  const yukle = async () => {
    setYukleniyor(true);
    await Promise.all([odaYukle(), rezervasyonYukle()]);
    setYukleniyor(false);
  };

  const aktifOdalar = useMemo(() => odalar.filter(o => o.aktif), [odalar]);

  const filtreliRezervasyonlar = useMemo(
    () =>
      rezervasyonlar.filter(r => {
        if (!rezervasyonGorunurMu(r)) return false;
        if (seciliOdaId === 'tumu') return true;
        return r.odaId === seciliOdaId;
      }),
    [rezervasyonlar, seciliOdaId],
  );

  const isaretliTarihler = useMemo(() => {
    const byDay = new Map<string, { onayli: boolean; bekleyen: boolean }>();
    for (const r of filtreliRezervasyonlar) {
      const cur = byDay.get(r.tarih) || { onayli: false, bekleyen: false };
      if (r.durum === 'onaylandi') cur.onayli = true;
      if (r.durum === 'beklemede') cur.bekleyen = true;
      byDay.set(r.tarih, cur);
    }
    const marks: Record<string, Record<string, unknown>> = {};
    for (const [gun, v] of byDay) {
      const dots: { color: string }[] = [];
      if (v.onayli) dots.push({ color: Colors.success });
      if (v.bekleyen) dots.push({ color: Colors.warning });
      if (dots.length > 0) marks[gun] = { marked: true, dots };
    }
    const secili = marks[seciliGun] || {};
    marks[seciliGun] = {
      ...secili,
      selected: true,
      selectedColor: Colors.primary,
      selectedTextColor: Colors.white,
    };
    return marks;
  }, [filtreliRezervasyonlar, seciliGun]);

  const gunlukRezervasyonlar = useMemo(
    () =>
      [...filtreliRezervasyonlar]
        .filter(r => r.tarih === seciliGun)
        .sort(
          (a, b) =>
            a.baslangicSaati.localeCompare(b.baslangicSaati) ||
            a.odaAdi.localeCompare(b.odaAdi, 'tr'),
        ),
    [filtreliRezervasyonlar, seciliGun],
  );

  const gunBasligi = useMemo(() => {
    const d = parse(seciliGun, 'yyyy-MM-dd', new Date());
    return format(d, 'd MMMM yyyy, EEEE', { locale: tr });
  }, [seciliGun]);

  const takvimBaslik = useCallback(
    () => (
      <View style={styles.takvimWrap}>
        <Calendar
          firstDay={1}
          enableSwipeMonths
          markedDates={isaretliTarihler}
          markingType="multi-dot"
          onDayPress={day => setSeciliGun(day.dateString)}
          theme={{
            backgroundColor: Colors.card,
            calendarBackground: Colors.card,
            textSectionTitleColor: Colors.textMuted,
            selectedDayBackgroundColor: Colors.primary,
            selectedDayTextColor: Colors.white,
            todayTextColor: Colors.primaryLight,
            dayTextColor: Colors.text,
            textDisabledColor: Colors.textMuted + '99',
            dotColor: Colors.primaryLight,
            selectedDotColor: Colors.white,
            arrowColor: Colors.primaryLight,
            monthTextColor: Colors.text,
            indicatorColor: Colors.primaryLight,
            textDayFontWeight: '500',
            textMonthFontWeight: '700',
            textDayHeaderFontWeight: '600',
          }}
        />
        <Text style={styles.filtreLabel}>Oda filtresi</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.odaChipSatir}
        >
          <TouchableOpacity
            style={[styles.odaChip, seciliOdaId === 'tumu' && styles.odaChipSecili]}
            onPress={() => setSeciliOdaId('tumu')}
          >
            <Text style={[styles.odaChipText, seciliOdaId === 'tumu' && styles.odaChipTextSecili]}>Tüm odalar</Text>
          </TouchableOpacity>
          {aktifOdalar.map(o => (
            <TouchableOpacity
              key={o.id}
              style={[styles.odaChip, seciliOdaId === o.id && styles.odaChipSecili]}
              onPress={() => setSeciliOdaId(o.id)}
            >
              <Text
                style={[styles.odaChipText, seciliOdaId === o.id && styles.odaChipTextSecili]}
                numberOfLines={1}
              >
                {o.ad}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.lejant}>
          <View style={styles.lejantSatir}>
            <View style={[styles.lejantNokta, { backgroundColor: Colors.success }]} />
            <Text style={styles.lejantText}>Onaylı</Text>
          </View>
          <View style={styles.lejantSatir}>
            <View style={[styles.lejantNokta, { backgroundColor: Colors.warning }]} />
            <Text style={styles.lejantText}>Onay bekliyor</Text>
          </View>
        </View>
        <Text style={styles.gunBaslik}>{gunBasligi}</Text>
      </View>
    ),
    [aktifOdalar, gunBasligi, isaretliTarihler, seciliOdaId],
  );

  const renderRez = ({ item }: { item: Rezervasyon }) => (
    <TouchableOpacity
      style={styles.rezKart}
      onPress={() => navigation.navigate('ReservationForm', { odaId: item.odaId })}
      activeOpacity={0.75}
    >
      <View style={styles.rezKartUst}>
        <View style={styles.rezSaatWrap}>
          <Ionicons name="time-outline" size={18} color={Colors.primaryLight} />
          <Text style={styles.rezSaat}>
            {item.baslangicSaati} – {item.bitisSaati}
          </Text>
        </View>
        <StatusBadge durum={item.durum} kucuk />
      </View>
      <Text style={styles.rezOda}>{item.odaAdi}</Text>
      <Text style={styles.rezKisi}>{item.kullaniciAdi}</Text>
      <Text style={styles.rezAmac} numberOfLines={2}>{item.amac}</Text>
      <Text style={styles.rezIpucu}>Bu oda için rezervasyon yapmak için dokunun</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader
        baslik="Doluluk takvimi"
        altBaslik="Tüm odaların rezervasyonları"
        geriButon
      />
      <FlatList
        data={gunlukRezervasyonlar}
        keyExtractor={item => item.id}
        renderItem={renderRez}
        ListHeaderComponent={takvimBaslik}
        contentContainerStyle={styles.liste}
        refreshControl={<RefreshControl refreshing={yukleniyor} onRefresh={yukle} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <EmptyState
            ikon="calendar-outline"
            baslik="Bu gün rezervasyon yok"
            aciklama="Seçilen tarih ve oda filtresine uygun kayıt bulunmuyor."
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  takvimWrap: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filtreLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  odaChipSatir: { paddingHorizontal: 12, paddingBottom: 12, gap: 8, flexDirection: 'row', alignItems: 'center' },
  odaChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surfaceVariant,
    borderWidth: 1,
    borderColor: Colors.border,
    maxWidth: 200,
  },
  odaChipSecili: {
    backgroundColor: Colors.primary + '22',
    borderColor: Colors.primary,
  },
  odaChipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  odaChipTextSecili: { color: Colors.primary },
  lejant: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  lejantSatir: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lejantNokta: { width: 8, height: 8, borderRadius: 4 },
  lejantText: { fontSize: 11, color: Colors.textMuted },
  gunBaslik: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  liste: { padding: 16, paddingTop: 8, flexGrow: 1 },
  rezKart: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rezKartUst: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rezSaatWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rezSaat: { fontSize: 15, fontWeight: '700', color: Colors.text },
  rezOda: { fontSize: 14, fontWeight: '600', color: Colors.primaryLight, marginBottom: 4 },
  rezKisi: { fontSize: 13, color: Colors.textSecondary, marginBottom: 4 },
  rezAmac: { fontSize: 13, color: Colors.text, lineHeight: 19 },
  rezIpucu: { fontSize: 11, color: Colors.textMuted, marginTop: 10, fontStyle: 'italic' },
});
