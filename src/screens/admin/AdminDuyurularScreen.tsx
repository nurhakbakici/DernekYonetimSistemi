import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { galeridenGorselSec } from '../../utils/galeriSec';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';
import ScreenHeader from '../../components/common/ScreenHeader';
import EmptyState from '../../components/common/EmptyState';
import type { Duyuru } from '../../types';

export default function AdminDuyurularScreen() {
  const { kullanici } = useAuth();
  const { duyurular, duyuruYukle, duyuruEkle, duyuruGuncelle, duyuruSil } = useData();
  const [yukleniyor, setYukleniyor] = useState(false);
  const [gonderiliyor, setGonderiliyor] = useState(false);

  const [baslik, setBaslik] = useState('');
  const [icerik, setIcerik] = useState('');
  const [yeniGorselUri, setYeniGorselUri] = useState<string | null>(null);

  const [duzenleModal, setDuzenleModal] = useState<Duyuru | null>(null);
  const [duzBaslik, setDuzBaslik] = useState('');
  const [duzIcerik, setDuzIcerik] = useState('');
  const [duzYeniGorsel, setDuzYeniGorsel] = useState<string | null>(null);
  const [duzGorselKaldir, setDuzGorselKaldir] = useState(false);

  useEffect(() => {
    yukle();
  }, []);

  useEffect(() => {
    if (!duzenleModal) return;
    setDuzBaslik(duzenleModal.baslik);
    setDuzIcerik(duzenleModal.icerik);
    setDuzYeniGorsel(null);
    setDuzGorselKaldir(false);
  }, [duzenleModal]);

  const yukle = async () => {
    setYukleniyor(true);
    await duyuruYukle();
    setYukleniyor(false);
  };

  const gonder = async () => {
    const b = baslik.trim();
    const i = icerik.trim();
    if (!b || !i) {
      Alert.alert('Eksik bilgi', 'Başlık ve metin zorunludur.');
      return;
    }
    if (!kullanici?.id) return;
    setGonderiliyor(true);
    try {
      const gorsel = yeniGorselUri ?? undefined;
      await duyuruEkle(
        {
          baslik: b,
          icerik: i,
          olusturulmaTarihi: new Date().toISOString(),
          olusturanId: kullanici.id,
          olusturanAdi: `${kullanici.ad} ${kullanici.soyad}`,
        },
        gorsel,
      );
      setBaslik('');
      setIcerik('');
      setYeniGorselUri(null);
      Alert.alert('Yayında', 'Duyuru tüm üyelere iletildi.');
    } catch (e) {
      const m = e instanceof Error ? e.message : 'Gönderilemedi.';
      Alert.alert('Hata', m);
    } finally {
      setGonderiliyor(false);
    }
  };

  const silOnay = (d: Duyuru) => {
    Alert.alert('Duyuruyu sil', 'Bu duyuru kalıcı olarak silinecek.', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          try {
            await duyuruSil(d.id);
          } catch (e) {
            const m = e instanceof Error ? e.message : 'Silinemedi.';
            Alert.alert('Hata', m);
          }
        },
      },
    ]);
  };

  const duzenleKaydet = async () => {
    if (!duzenleModal) return;
    const b = duzBaslik.trim();
    const i = duzIcerik.trim();
    if (!b || !i) {
      Alert.alert('Eksik bilgi', 'Başlık ve metin zorunludur.');
      return;
    }
    setGonderiliyor(true);
    try {
      let gorsel: 'degismedi' | { yerelUri: string } | 'kaldir' = 'degismedi';
      if (duzYeniGorsel) gorsel = { yerelUri: duzYeniGorsel };
      else if (duzGorselKaldir) gorsel = 'kaldir';

      await duyuruGuncelle(
        duzenleModal.id,
        { baslik: b, icerik: i },
        gorsel,
      );
      setDuzenleModal(null);
      Alert.alert('Tamam', 'Duyuru güncellendi.');
    } catch (e) {
      const m = e instanceof Error ? e.message : 'Kaydedilemedi.';
      Alert.alert('Hata', m);
    } finally {
      setGonderiliyor(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader baslik="Duyuru yönetimi" altBaslik="Tüm üyelere duyuru" geriButon />

      <ScrollView
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={yukleniyor} onRefresh={yukle} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.bolum}>Yeni duyuru</Text>
        <Text style={styles.label}>Başlık</Text>
        <TextInput
          style={styles.input}
          value={baslik}
          onChangeText={setBaslik}
          placeholder="Kısa başlık"
          placeholderTextColor={Colors.textMuted}
        />
        <Text style={styles.label}>Metin</Text>
        <TextInput
          style={[styles.input, styles.metinAlani]}
          value={icerik}
          onChangeText={setIcerik}
          placeholder="Duyuru metni"
          placeholderTextColor={Colors.textMuted}
          multiline
          textAlignVertical="top"
        />

        <Text style={styles.label}>Görsel (isteğe bağlı)</Text>
        <View style={styles.gorselSatir}>
          <TouchableOpacity style={styles.gorselBtn} onPress={async () => setYeniGorselUri(await galeridenGorselSec())}>
            <Ionicons name="image-outline" size={20} color={Colors.primaryLight} />
            <Text style={styles.gorselBtnText}>{yeniGorselUri ? 'Görseli değiştir' : 'Galeriden seç'}</Text>
          </TouchableOpacity>
          {yeniGorselUri ? (
            <TouchableOpacity onPress={() => setYeniGorselUri(null)} hitSlop={12}>
              <Text style={styles.gorselKaldir}>Kaldır</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        {yeniGorselUri ? (
          <Image source={{ uri: yeniGorselUri }} style={styles.onizleme} resizeMode="cover" />
        ) : null}

        <TouchableOpacity
          style={[styles.gonderBtn, gonderiliyor && { opacity: 0.65 }]}
          onPress={gonder}
          disabled={gonderiliyor}
        >
          <Text style={styles.gonderBtnText}>{gonderiliyor ? 'Gönderiliyor…' : 'Duyuruyu yayınla'}</Text>
        </TouchableOpacity>

        <Text style={[styles.bolum, { marginTop: 28 }]}>Geçmiş duyurular</Text>
        {duyurular.length === 0 ? (
          <EmptyState ikon="document-text-outline" baslik="Kayıt yok" />
        ) : (
          duyurular.map((d) => (
            <View key={d.id} style={styles.kart}>
              {d.gorselUri ? (
                <Image source={{ uri: d.gorselUri }} style={styles.kartGorsel} resizeMode="cover" />
              ) : null}
              <Text style={styles.kartBaslik}>{d.baslik}</Text>
              <Text style={styles.kartMeta}>
                {format(new Date(d.olusturulmaTarihi), 'd MMM yyyy HH:mm', { locale: tr })}
                {d.guncellenmeTarihi ? ` · düzenlendi` : ''}
              </Text>
              <Text style={styles.kartGovde} numberOfLines={4}>
                {d.icerik}
              </Text>
              <View style={styles.kartAksiyon}>
                <TouchableOpacity style={styles.kartBtn} onPress={() => setDuzenleModal(d)}>
                  <Ionicons name="create-outline" size={18} color={Colors.primaryLight} />
                  <Text style={styles.kartBtnText}>Düzenle</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.kartBtnSil} onPress={() => silOnay(d)}>
                  <Ionicons name="trash-outline" size={18} color={Colors.error} />
                  <Text style={styles.kartBtnSilText}>Sil</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 24 }} />
      </ScrollView>

      <Modal visible={!!duzenleModal} animationType="slide" transparent onRequestClose={() => setDuzenleModal(null)}>
        <KeyboardAvoidingView
          style={styles.modalDis}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalIc}>
            <Text style={styles.modalBaslik}>Duyuruyu düzenle</Text>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Başlık</Text>
              <TextInput
                style={styles.input}
                value={duzBaslik}
                onChangeText={setDuzBaslik}
                placeholderTextColor={Colors.textMuted}
              />
              <Text style={styles.label}>Metin</Text>
              <TextInput
                style={[styles.input, styles.metinAlani]}
                value={duzIcerik}
                onChangeText={setDuzIcerik}
                multiline
                textAlignVertical="top"
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={styles.label}>Görsel</Text>
              {!duzGorselKaldir && duzenleModal?.gorselUri && !duzYeniGorsel ? (
                <Image source={{ uri: duzenleModal.gorselUri }} style={styles.onizleme} resizeMode="cover" />
              ) : null}
              {duzYeniGorsel ? (
                <Image source={{ uri: duzYeniGorsel }} style={styles.onizleme} resizeMode="cover" />
              ) : null}

              <View style={styles.gorselSatir}>
                <TouchableOpacity
                  style={styles.gorselBtn}
                  onPress={async () => {
                    setDuzGorselKaldir(false);
                    setDuzYeniGorsel(await galeridenGorselSec());
                  }}
                >
                  <Ionicons name="image-outline" size={20} color={Colors.primaryLight} />
                  <Text style={styles.gorselBtnText}>
                    {duzYeniGorsel || duzenleModal?.gorselUri ? 'Görseli değiştir' : 'Galeriden seç'}
                  </Text>
                </TouchableOpacity>
              </View>
              {(duzenleModal?.gorselUri || duzYeniGorsel) && !duzGorselKaldir ? (
                <TouchableOpacity
                  style={styles.gorselKaldirSatir}
                  onPress={() => {
                    setDuzYeniGorsel(null);
                    setDuzGorselKaldir(true);
                  }}
                >
                  <Text style={styles.gorselKaldir}>Mevcut görseli kaldır</Text>
                </TouchableOpacity>
              ) : null}
              {duzGorselKaldir && !duzYeniGorsel ? (
                <Text style={styles.gorselUyari}>Yayında görsel olmayacak.</Text>
              ) : null}

              <View style={styles.modalSatir}>
                <TouchableOpacity style={styles.modalIptal} onPress={() => setDuzenleModal(null)}>
                  <Text style={styles.modalIptalText}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalKaydet, gonderiliyor && { opacity: 0.65 }]}
                  onPress={duzenleKaydet}
                  disabled={gonderiliyor}
                >
                  <Text style={styles.modalKaydetText}>{gonderiliyor ? '…' : 'Kaydet'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1, paddingHorizontal: 16 },
  bolum: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 12, marginTop: 8 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 },
  input: {
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 12,
    padding: 14,
    color: Colors.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
  },
  metinAlani: { minHeight: 120 },
  gorselSatir: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 10 },
  gorselBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary + '55',
    backgroundColor: Colors.primary + '10',
  },
  gorselBtnText: { fontSize: 14, fontWeight: '600', color: Colors.primaryLight },
  gorselKaldir: { fontSize: 14, fontWeight: '600', color: Colors.error },
  gorselKaldirSatir: { marginBottom: 12 },
  gorselUyari: { fontSize: 12, color: Colors.textMuted, marginBottom: 12 },
  onizleme: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginBottom: 14,
    backgroundColor: Colors.surfaceVariant,
  },
  gonderBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  gonderBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  kart: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  kartGorsel: {
    width: '100%',
    height: 140,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: Colors.surfaceVariant,
  },
  kartBaslik: { fontSize: 15, fontWeight: '700', color: Colors.text },
  kartMeta: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  kartGovde: { fontSize: 13, color: Colors.textSecondary, marginTop: 8, lineHeight: 20 },
  kartAksiyon: { flexDirection: 'row', gap: 12, marginTop: 12 },
  kartBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primary + '44',
    backgroundColor: Colors.primary + '0c',
  },
  kartBtnText: { fontSize: 13, fontWeight: '600', color: Colors.primaryLight },
  kartBtnSil: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.error + '55',
    backgroundColor: Colors.error + '10',
  },
  kartBtnSilText: { fontSize: 13, fontWeight: '600', color: Colors.error },
  modalDis: {
    flex: 1,
    backgroundColor: '#000a',
    justifyContent: 'flex-end',
  },
  modalIc: {
    maxHeight: '88%',
    backgroundColor: Colors.card,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 20,
    paddingBottom: 28,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalBaslik: { fontSize: 17, fontWeight: '700', color: Colors.text, marginBottom: 16 },
  modalSatir: { flexDirection: 'row', gap: 12, marginTop: 16 },
  modalIptal: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalIptalText: { color: Colors.textSecondary, fontWeight: '600' },
  modalKaydet: { flex: 1, padding: 14, alignItems: 'center', borderRadius: 12, backgroundColor: Colors.primary },
  modalKaydetText: { color: Colors.white, fontWeight: '700' },
});
