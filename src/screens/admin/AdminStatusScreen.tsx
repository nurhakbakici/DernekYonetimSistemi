import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import EmptyState from '../../components/common/EmptyState';
import { Colors } from '../../constants/colors';
import ScreenHeader from '../../components/common/ScreenHeader';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function AdminStatusScreen() {
  const { dernekDurumu, dernekDurumuYukle, dernekDurumuGuncelle } = useData();
  const { kullanici, paketAktif } = useAuth();
  const [acik, setAcik] = useState(false);
  const [mesaj, setMesaj] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);

  useEffect(() => {
    yukle();
  }, []);

  const yukle = async () => {
    await dernekDurumuYukle();
  };

  useEffect(() => {
    if (dernekDurumu) {
      setAcik(dernekDurumu.acik);
      setMesaj(dernekDurumu.mesaj || '');
    }
  }, [dernekDurumu]);

  const handleGuncelle = async () => {
    if (!kullanici) return;
    setYukleniyor(true);
    try {
      await dernekDurumuGuncelle(acik, mesaj, `${kullanici.ad} ${kullanici.soyad}`);
      Alert.alert('Başarılı', 'Dernek durumu güncellendi.');
    } catch {
      Alert.alert('Hata', 'Güncelleme başarısız.');
    } finally {
      setYukleniyor(false);
    }
  };

  if (!paketAktif('acikKapali')) {
    return (
      <View style={styles.container}>
        <ScreenHeader baslik="Dernek Durumu" altBaslik="Modül kapalı" geriButon />
        <EmptyState
          ikon="power-outline"
          baslik="Modül etkin değil"
          aciklama="Açık/kapalı durumu bu dernek için modül listesinde kapalı. Web yönetim panelinden Modüller sekmesinden açabilirsiniz."
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader baslik="Dernek Durumu" altBaslik="Açık/Kapalı yönetimi" geriButon />
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">

        <View style={[styles.durumKart, acik ? styles.acikKart : styles.kapaliKart]}>
          <Ionicons
            name={acik ? 'checkmark-circle' : 'close-circle'}
            size={64}
            color={acik ? Colors.success : Colors.error}
          />
          <Text style={[styles.durumBaslik, acik ? { color: Colors.success } : { color: Colors.error }]}>
            Dernek {acik ? 'AÇIK' : 'KAPALI'}
          </Text>
          {dernekDurumu?.mesaj && (
            <Text style={styles.durumMesaj}>{dernekDurumu.mesaj}</Text>
          )}
          {dernekDurumu?.guncellenmeTarihi && (
            <Text style={styles.sonGuncelleme}>
              Son güncelleme: {format(new Date(dernekDurumu.guncellenmeTarihi), 'd MMMM HH:mm', { locale: tr })}
            </Text>
          )}
        </View>

        <View style={styles.ayarlar}>
          <Text style={styles.sectionBaslik}>Durumu Güncelle</Text>

          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleBaslik}>Dernek Durumu</Text>
              <Text style={styles.toggleAciklama}>Üyeler ana sayfada bu durumu görecek</Text>
            </View>
            <Switch
              value={acik}
              onValueChange={setAcik}
              trackColor={{ false: Colors.error + '60', true: Colors.success + '60' }}
              thumbColor={acik ? Colors.success : Colors.error}
            />
          </View>

          <View style={styles.hizliButonlar}>
            <TouchableOpacity
              style={[styles.hizliButon, styles.acikButon, acik && styles.secili]}
              onPress={() => setAcik(true)}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color={acik ? Colors.white : Colors.success} />
              <Text style={[styles.hizliButonText, acik && styles.hizliButonTextSecili]}>Açık</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.hizliButon, styles.kapaliButon, !acik && styles.kapaliSecili]}
              onPress={() => setAcik(false)}
            >
              <Ionicons name="close-circle-outline" size={18} color={!acik ? Colors.white : Colors.error} />
              <Text style={[styles.hizliButonText, !acik && styles.hizliButonTextSecili]}>Kapalı</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Durum Mesajı</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Örn: Bugün 14:00-22:00 saatleri arasında açığız!"
            placeholderTextColor={Colors.textMuted}
            value={mesaj}
            onChangeText={setMesaj}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <View style={styles.sablonlar}>
            <Text style={styles.sablonBaslik}>Hızlı Mesajlar</Text>
            {[
              'Bugün 14:00 - 22:00 saatleri arasında açığız!',
              'Hafta sonu etkinliği için özel açılış saatleri: 10:00 - 20:00',
              'Bugün kapalıyız. Yarın normal saatlerimizde açılacağız.',
              'Özel etkinlik nedeniyle sadece kayıtlı katılımcılara açığız.',
            ].map((sablon, idx) => (
              <TouchableOpacity key={idx} style={styles.sablonItem} onPress={() => setMesaj(sablon)}>
                <Ionicons name="flash-outline" size={14} color={Colors.primaryLight} />
                <Text style={styles.sablonText}>{sablon}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.guncelleButton, yukleniyor && { opacity: 0.6 }]}
            onPress={handleGuncelle}
            disabled={yukleniyor}
          >
            <Ionicons name="save-outline" size={20} color={Colors.white} />
            <Text style={styles.guncelleText}>{yukleniyor ? 'Kaydediliyor...' : 'Durumu Güncelle'}</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  durumKart: {
    margin: 16,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    gap: 8,
  },
  acikKart: { backgroundColor: Colors.success + '15', borderColor: Colors.success + '60' },
  kapaliKart: { backgroundColor: Colors.error + '15', borderColor: Colors.error + '60' },
  durumBaslik: { fontSize: 26, fontWeight: '800', letterSpacing: 2 },
  durumMesaj: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  sonGuncelleme: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  ayarlar: { paddingHorizontal: 16 },
  sectionBaslik: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 16 },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  toggleBaslik: { fontSize: 15, fontWeight: '600', color: Colors.text },
  toggleAciklama: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  hizliButonlar: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  hizliButon: {
    flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 8, borderRadius: 12, padding: 12, borderWidth: 2,
  },
  acikButon: { borderColor: Colors.success, backgroundColor: 'transparent' },
  kapaliButon: { borderColor: Colors.error, backgroundColor: 'transparent' },
  secili: { backgroundColor: Colors.success },
  kapaliSecili: { backgroundColor: Colors.error },
  hizliButonText: { fontSize: 14, fontWeight: '700', color: Colors.text },
  hizliButonTextSecili: { color: Colors.white },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 },
  input: {
    backgroundColor: Colors.surfaceVariant, borderRadius: 12, padding: 14,
    color: Colors.text, fontSize: 14, borderWidth: 1, borderColor: Colors.border,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  sablonlar: { marginTop: 16 },
  sablonBaslik: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 },
  sablonItem: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: Colors.card, borderRadius: 10, padding: 10,
    marginBottom: 8, borderWidth: 1, borderColor: Colors.border,
  },
  sablonText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  guncelleButton: {
    backgroundColor: Colors.primary, borderRadius: 14, padding: 16,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 16,
  },
  guncelleText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
});
