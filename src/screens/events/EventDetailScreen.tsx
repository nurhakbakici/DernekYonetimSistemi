import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { tamUyeOzelliklerineErisir } from '../../utils/userAccess';
import { Colors } from '../../constants/colors';
import ScreenHeader from '../../components/common/ScreenHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

type RouteParams = { etkinlikId: string };

export default function EventDetailScreen() {
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const navigation = useNavigation<any>();
  const { etkinlikId } = route.params;
  const { kullanici } = useAuth();
  const { etkinlikler, etkinlikYukle, etkinlikKatil, etkinlikAyril, etkinlikGuncelle } = useData();
  const [yukleniyor, setYukleniyor] = useState(false);

  useEffect(() => { etkinlikYukle(); }, []);

  const etkinlik = etkinlikler.find(e => e.id === etkinlikId);

  if (!etkinlik) {
    return (
      <View style={styles.container}>
        <ScreenHeader baslik="Etkinlik Detayı" geriButon />
        <View style={styles.merkez}><Text style={styles.hataText}>Etkinlik bulunamadı.</Text></View>
      </View>
    );
  }

  const katiliyorum = etkinlik.katilimcilar.includes(kullanici?.id || '');
  const doldu = etkinlik.maxKatilimci ? etkinlik.katilimcilar.length >= etkinlik.maxKatilimci : false;
  const gectimi = new Date(etkinlik.tarih) < new Date();
  const tamUyelik = tamUyeOzelliklerineErisir(kullanici);

  const handleKatil = async () => {
    if (!kullanici) return;
    setYukleniyor(true);
    try {
      await etkinlikKatil(etkinlikId, kullanici.id);
      Alert.alert('Başarılı', 'Etkinliğe katıldınız!');
    } catch {
      Alert.alert('Hata', 'İşlem başarısız.');
    } finally {
      setYukleniyor(false);
    }
  };

  const handleAyril = async () => {
    if (!kullanici) return;
    Alert.alert('Etkinlikten Ayrıl', 'Etkinlikten ayrılmak istediğinize emin misiniz?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Ayrıl',
        style: 'destructive',
        onPress: async () => {
          setYukleniyor(true);
          try {
            await etkinlikAyril(etkinlikId, kullanici.id);
          } catch {
            Alert.alert('Hata', 'İşlem başarısız.');
          } finally {
            setYukleniyor(false);
          }
        },
      },
    ]);
  };

  const handleOnayla = async () => {
    setYukleniyor(true);
    try {
      await etkinlikGuncelle(etkinlikId, 'onaylandi');
      Alert.alert('Başarılı', 'Etkinlik onaylandı.');
    } catch {
      Alert.alert('Hata', 'İşlem başarısız.');
    } finally {
      setYukleniyor(false);
    }
  };

  const handleReddet = async () => {
    setYukleniyor(true);
    try {
      await etkinlikGuncelle(etkinlikId, 'iptal');
      Alert.alert('İşlem Tamamlandı', 'Etkinlik iptal edildi.');
    } catch {
      Alert.alert('Hata', 'İşlem başarısız.');
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader baslik="Etkinlik Detayı" geriButon />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {etkinlik.gorselUri ? (
          <Image source={{ uri: etkinlik.gorselUri }} style={styles.kapakGorsel} resizeMode="cover" />
        ) : null}
        <View style={styles.etkinlikHeader}>
          <View style={styles.tarihBadge}>
            <Text style={styles.tarihGun}>{format(new Date(etkinlik.tarih), 'd')}</Text>
            <Text style={styles.tarihAyYil}>
              {format(new Date(etkinlik.tarih), 'MMMM yyyy', { locale: tr })}
            </Text>
          </View>
          <Text style={styles.etkinlikBaslik}>{etkinlik.baslik}</Text>
          <StatusBadge durum={etkinlik.durum} />
        </View>

        <View style={styles.bilgiGrid}>
          <View style={styles.bilgiItem}>
            <Ionicons name="time-outline" size={20} color={Colors.primaryLight} />
            <Text style={styles.bilgiLabel}>Başlangıç</Text>
            <Text style={styles.bilgiDeger}>
              {format(new Date(etkinlik.tarih), 'HH:mm')}
            </Text>
          </View>
          {etkinlik.bitisTarihi && (
            <View style={styles.bilgiItem}>
              <Ionicons name="time-outline" size={20} color={Colors.primaryLight} />
              <Text style={styles.bilgiLabel}>Bitiş</Text>
              <Text style={styles.bilgiDeger}>
                {format(new Date(etkinlik.bitisTarihi), 'HH:mm')}
              </Text>
            </View>
          )}
          <View style={styles.bilgiItem}>
            <Ionicons name="people-outline" size={20} color={Colors.primaryLight} />
            <Text style={styles.bilgiLabel}>Katılımcı</Text>
            <Text style={styles.bilgiDeger}>
              {etkinlik.katilimcilar.length}
              {etkinlik.maxKatilimci ? `/${etkinlik.maxKatilimci}` : ''}
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="location-outline" size={16} color={Colors.textMuted} />
          <Text style={styles.infoText}>{etkinlik.konum}</Text>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="person-outline" size={16} color={Colors.textMuted} />
          <Text style={styles.infoText}>{etkinlik.organizator}</Text>
        </View>

        <View style={styles.aciklamaCard}>
          <Text style={styles.aciklamaBaslik}>Hakkında</Text>
          <Text style={styles.aciklamaText}>{etkinlik.aciklama}</Text>
        </View>

        {/* Yönetici: onay sonrası düzenleme */}
        {kullanici?.rol === 'admin' && (etkinlik.durum === 'onaylandi' || etkinlik.durum === 'beklemede') && (
          <View style={styles.adminDuzenleWrap}>
            <TouchableOpacity
              style={styles.duzenleButton}
              onPress={() => navigation.navigate('EditEvent', { etkinlikId: etkinlik.id })}
            >
              <Ionicons name="create-outline" size={20} color={Colors.white} />
              <Text style={styles.butonText}>Etkinliği düzenle</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Admin onay butonları */}
        {kullanici?.rol === 'admin' && etkinlik.durum === 'beklemede' && (
          <View style={styles.adminButonlar}>
            <TouchableOpacity
              style={[styles.onayButton, yukleniyor && { opacity: 0.6 }]}
              onPress={handleOnayla}
              disabled={yukleniyor}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color={Colors.white} />
              <Text style={styles.butonText}>Onayla</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.redButton, yukleniyor && { opacity: 0.6 }]}
              onPress={handleReddet}
              disabled={yukleniyor}
            >
              <Ionicons name="close-circle-outline" size={20} color={Colors.white} />
              <Text style={styles.butonText}>İptal Et</Text>
            </TouchableOpacity>
          </View>
        )}

        {etkinlik.durum === 'onaylandi' && !gectimi && !tamUyelik && (
          <View style={styles.adayUyari}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.warning} />
            <Text style={styles.adayUyariText}>
              Etkinliğe katılmak tam üyelik gerektirir. Başvurunuz yönetici onayından sonra değerlendirilir.
            </Text>
          </View>
        )}

        {/* Katılım butonu */}
        {etkinlik.durum === 'onaylandi' && !gectimi && tamUyelik && (
          <View style={styles.katilimSection}>
            {katiliyorum ? (
              <TouchableOpacity
                style={[styles.ayrilButton, yukleniyor && { opacity: 0.6 }]}
                onPress={handleAyril}
                disabled={yukleniyor}
              >
                <Ionicons name="person-remove-outline" size={20} color={Colors.white} />
                <Text style={styles.butonText}>Etkinlikten Ayrıl</Text>
              </TouchableOpacity>
            ) : doldu ? (
              <View style={styles.doluCard}>
                <Ionicons name="alert-circle-outline" size={20} color={Colors.error} />
                <Text style={styles.doluText}>Etkinlik doldu</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.katilButton, yukleniyor && { opacity: 0.6 }]}
                onPress={handleKatil}
                disabled={yukleniyor}
              >
                <Ionicons name="person-add-outline" size={20} color={Colors.white} />
                <Text style={styles.butonText}>
                  {yukleniyor ? 'İşleniyor...' : 'Katıl'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  kapakGorsel: { width: '100%', height: 200, backgroundColor: Colors.border },
  merkez: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hataText: { color: Colors.textMuted },
  etkinlikHeader: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 10,
  },
  tarihBadge: {
    backgroundColor: Colors.primary + '20',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    width: 70,
  },
  tarihGun: { fontSize: 26, fontWeight: '700', color: Colors.primaryLight },
  tarihAyYil: { fontSize: 11, color: Colors.textMuted, textTransform: 'capitalize' },
  etkinlikBaslik: { fontSize: 20, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  bilgiGrid: { flexDirection: 'row', padding: 16, gap: 12 },
  bilgiItem: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bilgiLabel: { fontSize: 11, color: Colors.textMuted },
  bilgiDeger: { fontSize: 16, fontWeight: '700', color: Colors.text },
  infoCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoText: { fontSize: 14, color: Colors.textSecondary, flex: 1 },
  aciklamaCard: {
    margin: 16,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  aciklamaBaslik: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  aciklamaText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  adminDuzenleWrap: { paddingHorizontal: 16, marginBottom: 12 },
  duzenleButton: {
    backgroundColor: Colors.info,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  adminButonlar: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 12 },
  onayButton: {
    flex: 1,
    backgroundColor: Colors.success,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  redButton: {
    flex: 1,
    backgroundColor: Colors.error,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  butonText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  katilimSection: { paddingHorizontal: 16, marginBottom: 12 },
  katilButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  ayrilButton: {
    backgroundColor: Colors.error,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  doluCard: {
    backgroundColor: Colors.error + '15',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.error + '40',
  },
  doluText: { color: Colors.error, fontWeight: '700', fontSize: 14 },
  adayUyari: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.warning + '12',
    borderWidth: 1,
    borderColor: Colors.warning + '35',
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  adayUyariText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
});
