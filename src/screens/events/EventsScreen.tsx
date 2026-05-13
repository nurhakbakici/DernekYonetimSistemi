import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Etkinlik } from '../../types';
import { Colors } from '../../constants/colors';
import ScreenHeader from '../../components/common/ScreenHeader';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { format, parse } from 'date-fns';
import { tr } from 'date-fns/locale';

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

type SekmeType = 'yaklaşan' | 'tum' | 'bekleyen';
type GorunumType = 'liste' | 'takvim';

export default function EventsScreen() {
  const navigation = useNavigation<any>();
  const { etkinlikler, etkinlikYukle } = useData();
  const { kullanici } = useAuth();
  const [yukleniyor, setYukleniyor] = useState(false);
  const [sekme, setSekme] = useState<SekmeType>('yaklaşan');
  const [gorunum, setGorunum] = useState<GorunumType>('liste');
  const [takvimSeciliGun, setTakvimSeciliGun] = useState(() => format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => { yukle(); }, []);

  const yukle = async () => {
    setYukleniyor(true);
    await etkinlikYukle();
    setYukleniyor(false);
  };

  const filtreliEtkinlikler = useMemo(
    () =>
      etkinlikler
        .filter(e => {
          const gelecekte = new Date(e.tarih) >= new Date();
          if (sekme === 'yaklaşan') return e.durum === 'onaylandi' && gelecekte;
          if (sekme === 'tum') return e.durum === 'onaylandi';
          if (sekme === 'bekleyen') return e.durum === 'beklemede';
          return true;
        })
        .sort((a, b) => new Date(a.tarih).getTime() - new Date(b.tarih).getTime()),
    [etkinlikler, sekme],
  );

  const bekleyenSayisi = etkinlikler.filter(e => e.durum === 'beklemede').length;

  const takvimdeIsaretliTarihler = useMemo(() => {
    const marks: Record<string, Record<string, unknown>> = {};
    for (const e of filtreliEtkinlikler) {
      const key = format(new Date(e.tarih), 'yyyy-MM-dd');
      marks[key] = { ...(marks[key] || {}), marked: true, dotColor: Colors.primaryLight };
    }
    const secili = marks[takvimSeciliGun] || {};
    marks[takvimSeciliGun] = {
      ...secili,
      selected: true,
      selectedColor: Colors.primary,
      selectedTextColor: Colors.white,
    };
    return marks;
  }, [filtreliEtkinlikler, takvimSeciliGun]);

  const takvimGunEtkinlikleri = useMemo(
    () =>
      filtreliEtkinlikler
        .filter(e => format(new Date(e.tarih), 'yyyy-MM-dd') === takvimSeciliGun)
        .sort((a, b) => new Date(a.tarih).getTime() - new Date(b.tarih).getTime()),
    [filtreliEtkinlikler, takvimSeciliGun],
  );

  const listeVerisi = gorunum === 'liste' ? filtreliEtkinlikler : takvimGunEtkinlikleri;

  const takvimBasligiMetni = useMemo(() => {
    const d = parse(takvimSeciliGun, 'yyyy-MM-dd', new Date());
    return format(d, 'd MMMM yyyy, EEEE', { locale: tr });
  }, [takvimSeciliGun]);

  const takvimBaslik = useCallback(
    () => (
      <View style={styles.takvimBaslikWrap}>
        <Calendar
          firstDay={1}
          enableSwipeMonths
          markedDates={takvimdeIsaretliTarihler}
          markingType="dot"
          onDayPress={day => setTakvimSeciliGun(day.dateString)}
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
          style={styles.takvim}
        />
        <Text style={styles.takvimGunBaslik}>{takvimBasligiMetni}</Text>
        <Text style={styles.takvimAltNot}>Bu günün etkinlikleri aşağıda listelenir.</Text>
      </View>
    ),
    [takvimBasligiMetni, takvimdeIsaretliTarihler],
  );

  const renderEtkinlik = ({ item }: { item: Etkinlik }) => {
    const katiliyorum = item.katilimcilar.includes(kullanici?.id || '');
    const doldu = item.maxKatilimci ? item.katilimcilar.length >= item.maxKatilimci : false;
    const gectimi = new Date(item.tarih) < new Date();

    return (
      <TouchableOpacity
        style={[styles.etkinlikKart, gectimi && styles.gectimKart]}
        onPress={() => navigation.navigate('EventDetail', { etkinlikId: item.id })}
      >
        <View style={styles.tarihBox}>
          <Text style={styles.tarihGun}>
            {format(new Date(item.tarih), 'd', { locale: tr })}
          </Text>
          <Text style={styles.tarihAy}>
            {format(new Date(item.tarih), 'MMM', { locale: tr }).toUpperCase()}
          </Text>
        </View>

        <View style={styles.etkinlikBilgi}>
          <View style={styles.etkinlikHeader}>
            <Text style={styles.etkinlikBaslik} numberOfLines={2}>{item.baslik}</Text>
            {sekme === 'bekleyen' && <StatusBadge durum={item.durum} kucuk />}
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.metaText}>{format(new Date(item.tarih), 'HH:mm')}</Text>
            <Ionicons name="location-outline" size={12} color={Colors.textMuted} style={{ marginLeft: 8 }} />
            <Text style={styles.metaText} numberOfLines={1}>{item.konum}</Text>
          </View>

          <View style={styles.etkinlikFooter}>
            <View style={styles.katilimciInfo}>
              <Ionicons name="people-outline" size={13} color={Colors.textMuted} />
              <Text style={styles.katilimciText}>
                {item.katilimcilar.length}
                {item.maxKatilimci ? `/${item.maxKatilimci}` : ''} katılımcı
              </Text>
            </View>
            {katiliyorum && (
              <View style={styles.katiliyorumBadge}>
                <Ionicons name="checkmark-circle" size={12} color={Colors.success} />
                <Text style={styles.katiliyorumText}>Katılıyorum</Text>
              </View>
            )}
            {doldu && !katiliyorum && (
              <View style={styles.doluBadge}>
                <Text style={styles.doluText}>Dolu</Text>
              </View>
            )}
          </View>
        </View>

        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        baslik="Etkinlikler"
        altBaslik="Liste veya takvimden takip edin"
        sagButon={kullanici?.rol === 'admin' ? {
          ikon: 'add',
          onPress: () => navigation.navigate('AddEvent'),
        } : undefined}
      />

      <View style={styles.gorunumSatiri}>
        <TouchableOpacity
          style={[styles.gorunumBtn, gorunum === 'liste' && styles.gorunumBtnAktif]}
          onPress={() => setGorunum('liste')}
        >
          <Ionicons name="list" size={16} color={gorunum === 'liste' ? Colors.white : Colors.textMuted} />
          <Text style={[styles.gorunumBtnText, gorunum === 'liste' && styles.gorunumBtnTextAktif]}>Liste</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.gorunumBtn, gorunum === 'takvim' && styles.gorunumBtnAktif]}
          onPress={() => {
            setGorunum('takvim');
            setTakvimSeciliGun(format(new Date(), 'yyyy-MM-dd'));
          }}
        >
          <Ionicons name="calendar-outline" size={16} color={gorunum === 'takvim' ? Colors.white : Colors.textMuted} />
          <Text style={[styles.gorunumBtnText, gorunum === 'takvim' && styles.gorunumBtnTextAktif]}>Takvim</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sekmeler}>
        <TouchableOpacity
          style={[styles.sekme, sekme === 'yaklaşan' && styles.aktifSekme]}
          onPress={() => setSekme('yaklaşan')}
        >
          <Text style={[styles.sekmeText, sekme === 'yaklaşan' && styles.aktifSekmeText]}>Yaklaşan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sekme, sekme === 'tum' && styles.aktifSekme]}
          onPress={() => setSekme('tum')}
        >
          <Text style={[styles.sekmeText, sekme === 'tum' && styles.aktifSekmeText]}>Tümü</Text>
        </TouchableOpacity>
        {kullanici?.rol === 'admin' && (
          <TouchableOpacity
            style={[styles.sekme, sekme === 'bekleyen' && styles.aktifSekme]}
            onPress={() => setSekme('bekleyen')}
          >
            <Text style={[styles.sekmeText, sekme === 'bekleyen' && styles.aktifSekmeText]}>
              Onay Bekleyen {bekleyenSayisi > 0 && `(${bekleyenSayisi})`}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={listeVerisi}
        keyExtractor={item => item.id}
        renderItem={renderEtkinlik}
        ListHeaderComponent={gorunum === 'takvim' ? takvimBaslik : null}
        contentContainerStyle={[
          styles.liste,
          listeVerisi.length === 0 ? styles.listeBos : null,
        ]}
        refreshControl={<RefreshControl refreshing={yukleniyor} onRefresh={yukle} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <EmptyState
            ikon="calendar-outline"
            baslik={gorunum === 'takvim' ? 'Bu günde etkinlik yok' : 'Etkinlik bulunamadı'}
            aciklama={
              gorunum === 'takvim'
                ? 'Takvimden başka bir gün seçebilir veya üstteki sekmeyle filtreyi değiştirebilirsiniz.'
                : 'Bu kategoride etkinlik bulunmuyor.'
            }
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  gorunumSatiri: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
    gap: 10,
  },
  gorunumBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gorunumBtnAktif: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryLight + '50',
  },
  gorunumBtnText: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  gorunumBtnTextAktif: { color: Colors.white },
  takvimBaslikWrap: { marginBottom: 8 },
  takvim: {
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  takvimGunBaslik: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  takvimAltNot: { fontSize: 12, color: Colors.textMuted, marginBottom: 4 },
  sekmeler: { flexDirection: 'row', padding: 16, paddingBottom: 8, gap: 8 },
  sekme: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  aktifSekme: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  sekmeText: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  aktifSekmeText: { color: Colors.white },
  liste: { padding: 16 },
  listeBos: { flexGrow: 1 },
  etkinlikKart: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gectimKart: { opacity: 0.6 },
  tarihBox: {
    width: 50,
    height: 58,
    backgroundColor: Colors.primary + '20',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  tarihGun: { fontSize: 20, fontWeight: '700', color: Colors.primaryLight },
  tarihAy: { fontSize: 10, color: Colors.textMuted },
  etkinlikBilgi: { flex: 1 },
  etkinlikHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  etkinlikBaslik: { flex: 1, fontSize: 14, fontWeight: '700', color: Colors.text },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 2,
  },
  metaText: { fontSize: 12, color: Colors.textMuted, marginLeft: 2 },
  etkinlikFooter: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  katilimciInfo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  katilimciText: { fontSize: 12, color: Colors.textMuted },
  katiliyorumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  katiliyorumText: { fontSize: 11, color: Colors.success, fontWeight: '600' },
  doluBadge: {
    backgroundColor: Colors.error + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  doluText: { fontSize: 11, color: Colors.error, fontWeight: '600' },
});
