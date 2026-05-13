import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl, Modal, Pressable, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../../context/DataContext';
import { BursBasvurusu } from '../../types';
import { Colors } from '../../constants/colors';
import ScreenHeader from '../../components/common/ScreenHeader';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { bursProgramSuresiAy } from '../../utils/bursSuresi';
import { ibanFormatlaGosterim } from '../../utils/iban';
import * as Clipboard from 'expo-clipboard';

export default function AdminScholarshipsScreen() {
  const { bursBasvurulari, bursBasvuruYukle, bursBasvuruGuncelle, bursBasvuruOdemeGuncelle, burslar, bursYukle } = useData();
  const [yukleniyor, setYukleniyor] = useState(false);
  const [belgeModalUri, setBelgeModalUri] = useState<string | null>(null);
  const [belgeModalBaslik, setBelgeModalBaslik] = useState('');

  useEffect(() => { yukle(); }, []);

  const yukle = async () => {
    setYukleniyor(true);
    await Promise.all([bursBasvuruYukle(), bursYukle()]);
    setYukleniyor(false);
  };

  const belgeBaslikBul = (bursId: string, belgeAlanId: string) => {
    const prog = burslar.find(b => b.id === bursId);
    return prog?.gerekliBelgeler?.find(g => g.id === belgeAlanId)?.baslik ?? belgeAlanId;
  };

  const belgeAc = (uri: string, baslik: string) => {
    setBelgeModalBaslik(baslik);
    setBelgeModalUri(uri);
  };

  const bekleyenler = bursBasvurulari.filter(b => b.durum === 'beklemede');
  const diger = bursBasvurulari.filter(b => b.durum !== 'beklemede');
  const sirali = [...bekleyenler, ...diger];

  const handleKarar = (basvuru: BursBasvurusu, karar: 'onaylandi' | 'reddedildi') => {
    const mesaj = karar === 'onaylandi' ? 'Başvuruyu onaylamak istiyor musunuz?' : 'Başvuruyu reddetmek istiyor musunuz?';
    Alert.alert(
      karar === 'onaylandi' ? 'Başvuruyu Onayla' : 'Başvuruyu Reddet',
      mesaj,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: karar === 'onaylandi' ? 'Onayla' : 'Reddet',
          style: karar === 'reddedildi' ? 'destructive' : 'default',
          onPress: () => bursBasvuruGuncelle(basvuru.id, karar),
        },
      ]
    );
  };

  const odemeIsaretle = (basvuru: BursBasvurusu, yatirildi: boolean) => {
    const mesaj = yatirildi
      ? 'Burs tutarının üyeye yatırıldığını işaretlemek istiyor musunuz?'
      : 'Ödeme durumunu “beklemede” olarak geri almak istiyor musunuz?';
    Alert.alert(yatirildi ? 'Ödeme yatırıldı' : 'Ödeme beklemede', mesaj, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Evet',
        onPress: async () => {
          try {
            await bursBasvuruOdemeGuncelle(basvuru.id, yatirildi);
          } catch (e) {
            Alert.alert('Hata', e instanceof Error ? e.message : 'İşlem yapılamadı.');
          }
        },
      },
    ]);
  };

  const renderBasvuru = ({ item }: { item: BursBasvurusu }) => {
    const odeme = item.durum === 'onaylandi'
      ? (item.bursOdemeDurumu === 'yatirildi' ? 'yatirildi' : 'beklemede')
      : null;
    const prog = burslar.find(b => b.id === item.bursId);

    return (
      <View style={styles.basvuruKart}>
        <View style={styles.basvuruHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.kullaniciAdi}>{item.kullaniciAdi}</Text>
            <Text style={styles.bursAdi}>{item.bursAdi}</Text>
            {prog ? (
              <Text style={styles.programSure}>Program süresi: {bursProgramSuresiAy(prog)} ay</Text>
            ) : null}
          </View>
          <StatusBadge durum={item.durum} kucuk />
        </View>
        <Text style={styles.basvuruTarih}>Başvuru: {item.basvuruTarihi}</Text>

        {item.durum === 'onaylandi' && (
          <View style={styles.ibanAdmin}>
            {item.iban ? (
              <>
                <Text style={styles.ibanAdminEtiket}>IBAN</Text>
                <Text selectable style={styles.ibanAdminDeger}>{ibanFormatlaGosterim(item.iban)}</Text>
                <TouchableOpacity
                  style={styles.ibanKopyaBtn}
                  onPress={async () => {
                    await Clipboard.setStringAsync(item.iban!);
                    Alert.alert('Kopyalandı', 'IBAN panoya kopyalandı.');
                  }}
                >
                  <Ionicons name="copy-outline" size={16} color={Colors.primaryLight} />
                  <Text style={styles.ibanKopyaText}>Panoya kopyala</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.ibanBekleniyor}>
                IBAN henüz girilmedi — başvuran, burs detayından IBAN kaydı yapabilir.
              </Text>
            )}
          </View>
        )}

        {item.belgelerUri && Object.keys(item.belgelerUri).length > 0 ? (
          <View style={styles.belgeListe}>
            {Object.entries(item.belgelerUri).map(([kid, uri]) => {
              if (!uri) return null;
              const baslik = belgeBaslikBul(item.bursId, kid);
              return (
                <TouchableOpacity
                  key={kid}
                  style={styles.belgeSatir}
                  onPress={() => belgeAc(uri, baslik)}
                >
                  <Ionicons name="document-text-outline" size={18} color={Colors.primaryLight} />
                  <Text style={styles.belgeLink} numberOfLines={2}>{baslik}</Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              );
            })}
          </View>
        ) : item.belgeUri ? (
          <TouchableOpacity style={styles.belgeSatir} onPress={() => belgeAc(item.belgeUri!, 'Başvuru belgesi (eski)')}>
            <Ionicons name="document-text-outline" size={18} color={Colors.primaryLight} />
            <Text style={styles.belgeLink}>Tek belge (eski kayıt)</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        ) : (
          <Text style={styles.belgeYok}>Belge yok.</Text>
        )}

        {odeme ? (
          <View style={styles.odemeSatir}>
            <Ionicons
              name={odeme === 'yatirildi' ? 'checkmark-done-circle' : 'hourglass-outline'}
              size={18}
              color={odeme === 'yatirildi' ? Colors.success : Colors.warning}
            />
            <Text style={styles.odemeMetin}>
              {odeme === 'yatirildi'
                ? `Burs yatırıldı${item.bursOdemeTarihi ? ` (${item.bursOdemeTarihi})` : ''}`
                : 'Burs ödemesi henüz yatırılmadı'}
            </Text>
          </View>
        ) : null}

        {item.notlar && (
          <View style={styles.notCard}>
            <Text style={styles.notText}>{item.notlar}</Text>
          </View>
        )}

        {item.durum === 'beklemede' && (
          <View style={styles.aksiyonlar}>
            <TouchableOpacity style={styles.onayButton} onPress={() => handleKarar(item, 'onaylandi')}>
              <Ionicons name="checkmark-outline" size={16} color={Colors.white} />
              <Text style={styles.aksiyonText}>Onayla</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.redButton} onPress={() => handleKarar(item, 'reddedildi')}>
              <Ionicons name="close-outline" size={16} color={Colors.white} />
              <Text style={styles.aksiyonText}>Reddet</Text>
            </TouchableOpacity>
          </View>
        )}

        {item.durum === 'onaylandi' && (
          <View style={styles.odemeButonlar}>
            {odeme !== 'yatirildi' ? (
              <TouchableOpacity style={styles.odemeYatirBtn} onPress={() => odemeIsaretle(item, true)}>
                <Ionicons name="cash-outline" size={16} color={Colors.white} />
                <Text style={styles.aksiyonText}>Yatırıldı işaretle</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.odemeGeriBtn} onPress={() => odemeIsaretle(item, false)}>
                <Ionicons name="arrow-undo-outline" size={16} color={Colors.text} />
                <Text style={styles.odemeGeriText}>Ödemeyi beklemede al</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader baslik="Burs Başvuruları" altBaslik="Belge ve ödeme takibi" geriButon />
      <FlatList
        data={sirali}
        keyExtractor={item => item.id}
        renderItem={renderBasvuru}
        contentContainerStyle={styles.liste}
        refreshControl={<RefreshControl refreshing={yukleniyor} onRefresh={yukle} tintColor={Colors.primary} />}
        ListEmptyComponent={<EmptyState ikon="school-outline" baslik="Başvuru bulunamadı" />}
        showsVerticalScrollIndicator={false}
      />

      <Modal visible={!!belgeModalUri} transparent animationType="fade" onRequestClose={() => { setBelgeModalUri(null); setBelgeModalBaslik(''); }}>
        <Pressable style={styles.modalDis} onPress={() => { setBelgeModalUri(null); setBelgeModalBaslik(''); }}>
          <Pressable style={styles.modalIc} onPress={e => e.stopPropagation()}>
            <View style={styles.modalUst}>
              <Text style={styles.modalBaslik} numberOfLines={2}>{belgeModalBaslik || 'Belge'}</Text>
              <TouchableOpacity onPress={() => { setBelgeModalUri(null); setBelgeModalBaslik(''); }} hitSlop={12}>
                <Ionicons name="close" size={26} color={Colors.text} />
              </TouchableOpacity>
            </View>
            {belgeModalUri ? (
              <Image source={{ uri: belgeModalUri }} style={styles.modalImg} resizeMode="contain" />
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  liste: { padding: 16 },
  basvuruKart: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    marginBottom: 12, borderWidth: 1, borderColor: Colors.border,
  },
  basvuruHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6, gap: 8 },
  kullaniciAdi: { fontSize: 15, fontWeight: '700', color: Colors.text },
  bursAdi: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  programSure: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  basvuruTarih: { fontSize: 12, color: Colors.textMuted, marginBottom: 8 },
  ibanAdmin: {
    marginBottom: 10,
    padding: 12,
    backgroundColor: Colors.info + '10',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.info + '35',
  },
  ibanAdminEtiket: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, marginBottom: 6 },
  ibanAdminDeger: { fontSize: 14, fontWeight: '700', color: Colors.text, letterSpacing: 0.3, marginBottom: 10 },
  ibanKopyaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ibanKopyaText: { fontSize: 13, fontWeight: '600', color: Colors.primaryLight },
  ibanBekleniyor: { fontSize: 12, color: Colors.warning, fontWeight: '600', lineHeight: 18 },
  belgeSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 10,
    marginBottom: 8,
  },
  belgeListe: { marginBottom: 4 },
  belgeLink: { flex: 1, fontSize: 13, fontWeight: '600', color: Colors.primaryLight },
  belgeYok: { fontSize: 12, color: Colors.textMuted, fontStyle: 'italic', marginBottom: 10 },
  odemeSatir: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  odemeMetin: { flex: 1, fontSize: 13, color: Colors.textSecondary },
  notCard: {
    backgroundColor: Colors.surfaceVariant, borderRadius: 8, padding: 10, marginBottom: 10,
  },
  notText: { fontSize: 13, color: Colors.textSecondary, fontStyle: 'italic' },
  aksiyonlar: { flexDirection: 'row', gap: 10 },
  onayButton: {
    flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 6, backgroundColor: Colors.success, borderRadius: 10, padding: 10,
  },
  redButton: {
    flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 6, backgroundColor: Colors.error, borderRadius: 10, padding: 10,
  },
  odemeButonlar: { marginTop: 4 },
  odemeYatirBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 8, backgroundColor: Colors.primary, borderRadius: 10, padding: 12,
  },
  odemeGeriBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 8, backgroundColor: Colors.surfaceVariant, borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  odemeGeriText: { fontSize: 13, fontWeight: '600', color: Colors.text },
  aksiyonText: { color: Colors.white, fontSize: 13, fontWeight: '600' },
  modalDis: {
    flex: 1, backgroundColor: Colors.overlay, justifyContent: 'center', padding: 20,
  },
  modalIc: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 12,
    maxHeight: '88%',
  },
  modalUst: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 10,
  },
  modalBaslik: { fontSize: 16, fontWeight: '700', color: Colors.text },
  modalImg: { width: '100%', height: 360, borderRadius: 12, backgroundColor: Colors.surfaceVariant },
});
