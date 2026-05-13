import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types';
import { Colors } from '../../constants/colors';
import { rolGosterimMetni } from '../../utils/userAccess';
import ScreenHeader from '../../components/common/ScreenHeader';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';

export default function AdminUsersScreen() {
  const { kullanici } = useAuth();
  const { kullanicilar, kullaniciYukle, kullaniciGuncelle } = useData();
  const [yukleniyor, setYukleniyor] = useState(false);

  useEffect(() => { yukle(); }, []);

  const yukle = async () => {
    setYukleniyor(true);
    await kullaniciYukle();
    setYukleniyor(false);
  };

  const adminSayisi = kullanicilar.filter(u => u.rol === 'admin').length;

  const siralanan = [...kullanicilar].sort((a, b) => {
    if (a.rol === 'aday' && b.rol !== 'aday') return -1;
    if (b.rol === 'aday' && a.rol !== 'aday') return 1;
    if (a.uyelikDurumu === 'beklemede') return -1;
    if (b.uyelikDurumu === 'beklemede') return 1;
    return 0;
  });

  const handleUyelikDurumu = (uye: User, yeniDurum: User['uyelikDurumu']) => {
    const mesajlar: Record<string, string> = {
      aktif: 'Üyeliği aktifleştirmek istiyor musunuz?',
      pasif: 'Üyeliği pasif yapmak istiyor musunuz?',
      beklemede: 'Üyeliği beklemeye almak istiyor musunuz?',
    };
    Alert.alert('Üyelik Durumu', mesajlar[yeniDurum], [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Onayla',
        onPress: () => kullaniciGuncelle(uye.id, { uyelikDurumu: yeniDurum }),
      },
    ]);
  };

  const handleRol = (uye: User, yeniRol: User['rol'], ek?: Partial<User>) => {
    const aciklama =
      yeniRol === 'admin' ? 'Bu kullanıcıya yönetici yetkisi verilsin mi?' :
        yeniRol === 'uye' ? 'Kullanıcı tam üye (üye rolü) olarak güncellensin mi?' :
          'Kullanıcı aday üye olarak işaretlensin mi?';
    Alert.alert('Rol Güncelleme', aciklama, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Onayla', onPress: () => kullaniciGuncelle(uye.id, { rol: yeniRol, ...ek }) },
    ]);
  };

  const handleTamUye = (uye: User) => {
    Alert.alert(
      'Tam üyelik',
      `${uye.ad} ${uye.soyad} tam üye yapılsın mı? (Üye rolü + aktif üyelik)`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Tam üye yap',
          onPress: () => kullaniciGuncelle(uye.id, { rol: 'uye', uyelikDurumu: 'aktif' }),
        },
      ],
    );
  };

  const renderUye = ({ item }: { item: User }) => {
    const benimHesabim = item.id === kullanici?.id;
    const sonYonetici = adminSayisi === 1 && item.rol === 'admin';

    return (
      <View style={styles.uyeKart}>
        <View style={styles.uyeHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.ad.charAt(0)}{item.soyad.charAt(0)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.uyeAdi}>{item.ad} {item.soyad}</Text>
            <Text style={styles.uyeEmail}>{item.email}</Text>
          </View>
          <View style={styles.rozetler}>
            <View style={[
              styles.rolRozet,
              item.rol === 'admin' && styles.adminRolRozet,
              item.rol === 'aday' && styles.adayRolRozet,
            ]}>
              <Text style={[
                styles.rolText,
                item.rol === 'admin' && styles.adminRolText,
                item.rol === 'aday' && styles.adayRolText,
              ]}>
                {rolGosterimMetni(item.rol)}
              </Text>
            </View>
            <StatusBadge durum={item.uyelikDurumu} kucuk />
          </View>
        </View>

        {item.telefon && (
          <View style={styles.bilgiRow}>
            <Ionicons name="call-outline" size={13} color={Colors.textMuted} />
            <Text style={styles.bilgiText}>{item.telefon}</Text>
          </View>
        )}

        <View style={styles.bilgiRow}>
          <Ionicons name="calendar-outline" size={13} color={Colors.textMuted} />
          <Text style={styles.bilgiText}>Üyelik: {item.uyelikBaslangic}</Text>
        </View>

        {!benimHesabim && item.rol !== 'admin' && (
          <View style={styles.durumButonlar}>
            {item.uyelikDurumu !== 'aktif' && (
              <TouchableOpacity style={styles.aktifButton} onPress={() => handleUyelikDurumu(item, 'aktif')}>
                <Text style={styles.durumButtonText}>Aktif Et</Text>
              </TouchableOpacity>
            )}
            {item.uyelikDurumu !== 'pasif' && (
              <TouchableOpacity style={styles.pasifButton} onPress={() => handleUyelikDurumu(item, 'pasif')}>
                <Text style={styles.durumButtonText}>Pasif Et</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {!benimHesabim && (
          <View style={styles.rolSatir}>
            {item.rol === 'aday' && (
              <TouchableOpacity style={styles.tamUyeBtn} onPress={() => handleTamUye(item)}>
                <Text style={styles.tamUyeBtnText}>Tam üye yap</Text>
              </TouchableOpacity>
            )}
            {item.rol === 'uye' && (
              <TouchableOpacity
                style={styles.ikincilBtn}
                onPress={() => handleRol(item, 'aday', { uyelikDurumu: 'beklemede' })}
              >
                <Text style={styles.ikincilBtnText}>Adaya çevir</Text>
              </TouchableOpacity>
            )}
            {item.rol !== 'admin' && (
              <TouchableOpacity style={styles.yoneticiBtn} onPress={() => handleRol(item, 'admin', { uyelikDurumu: 'aktif' })}>
                <Text style={styles.yoneticiBtnText}>Yönetici yap</Text>
              </TouchableOpacity>
            )}
            {item.rol === 'admin' && !sonYonetici && (
              <TouchableOpacity
                style={styles.ikincilBtn}
                onPress={() => handleRol(item, 'uye', { uyelikDurumu: 'aktif' })}
              >
                <Text style={styles.ikincilBtnText}>Yönetici kaldır</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader baslik="Üye Yönetimi" altBaslik={`${kullanicilar.length} kullanıcı`} geriButon />
      <FlatList
        data={siralanan}
        keyExtractor={item => item.id}
        renderItem={renderUye}
        contentContainerStyle={styles.liste}
        refreshControl={<RefreshControl refreshing={yukleniyor} onRefresh={yukle} tintColor={Colors.primary} />}
        ListEmptyComponent={<EmptyState ikon="people-outline" baslik="Kullanıcı bulunamadı" />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  liste: { padding: 16, paddingBottom: 32 },
  uyeKart: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    marginBottom: 12, borderWidth: 1, borderColor: Colors.border,
  },
  uyeHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: Colors.white },
  uyeAdi: { fontSize: 15, fontWeight: '700', color: Colors.text },
  uyeEmail: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  rozetler: { gap: 4, alignItems: 'flex-end' },
  rolRozet: {
    backgroundColor: Colors.primary + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  adminRolRozet: { backgroundColor: Colors.gold + '20' },
  adayRolRozet: { backgroundColor: Colors.warning + '18' },
  rolText: { fontSize: 10, color: Colors.primaryLight, fontWeight: '700' },
  adminRolText: { color: Colors.gold },
  adayRolText: { color: Colors.warning },
  bilgiRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  bilgiText: { fontSize: 12, color: Colors.textMuted },
  durumButonlar: { flexDirection: 'row', gap: 10, marginTop: 10 },
  aktifButton: {
    flex: 1, backgroundColor: Colors.success, borderRadius: 10, padding: 9, alignItems: 'center',
  },
  pasifButton: {
    flex: 1, backgroundColor: Colors.error + '90', borderRadius: 10, padding: 9, alignItems: 'center',
  },
  durumButtonText: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  rolSatir: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tamUyeBtn: {
    backgroundColor: Colors.success,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  tamUyeBtnText: { color: Colors.white, fontSize: 11, fontWeight: '700' },
  yoneticiBtn: {
    backgroundColor: Colors.gold + '35',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  yoneticiBtnText: { color: Colors.gold, fontSize: 11, fontWeight: '700' },
  ikincilBtn: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ikincilBtnText: { color: Colors.textSecondary, fontSize: 11, fontWeight: '600' },
});
