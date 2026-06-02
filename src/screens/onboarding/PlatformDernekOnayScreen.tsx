import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import type { DernekFirestore } from '../../types';
import { Colors } from '../../constants/colors';
import ScreenHeader from '../../components/common/ScreenHeader';

export default function PlatformDernekOnayScreen() {
  const { bekleyenDernekBasvurulariniYukle, dernekBasvurusunuOnayla, dernekBasvurusunuReddet } = useAuth();
  const [liste, setListe] = useState<DernekFirestore[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [redModal, setRedModal] = useState<DernekFirestore | null>(null);
  const [redMesaj, setRedMesaj] = useState('');

  const yukle = useCallback(async () => {
    setYukleniyor(true);
    try {
      const l = await bekleyenDernekBasvurulariniYukle();
      setListe(l);
    } catch (e) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'Liste yüklenemedi.');
      setListe([]);
    } finally {
      setYukleniyor(false);
    }
  }, [bekleyenDernekBasvurulariniYukle]);

  useFocusEffect(
    useCallback(() => {
      void yukle();
    }, [yukle]),
  );

  const onayla = (d: DernekFirestore) => {
    Alert.alert('Onay', `"${d.ad}" derneğini onaylamak istiyor musunuz?`, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Onayla',
        onPress: async () => {
          try {
            await dernekBasvurusunuOnayla(d.id);
            Alert.alert('Tamam', 'Dernek aktifleştirildi. Kurucuya yönetici üyeliği atandı. Üyeler kayıtta dernek seçerek katılır.');
            await yukle();
          } catch (e) {
            Alert.alert('Hata', e instanceof Error ? e.message : 'Onay başarısız.');
          }
        },
      },
    ]);
  };

  const reddetGonder = async () => {
    if (!redModal) return;
    const mesaj = redMesaj.trim();
    if (!mesaj) {
      Alert.alert('Uyarı', 'Gerekçe yazın.');
      return;
    }
    try {
      await dernekBasvurusunuReddet(redModal.id, mesaj);
      setRedModal(null);
      setRedMesaj('');
      await yukle();
    } catch (e) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'Red başarısız.');
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader baslik="Dernek onayları" altBaslik="Bekleyen başvurular" geriButon />
      {yukleniyor ? (
        <Text style={styles.bos}>Yükleniyor…</Text>
      ) : (
        <FlatList
          data={liste}
          keyExtractor={(item) => item.id}
          contentContainerStyle={liste.length === 0 ? styles.bosListe : undefined}
          ListEmptyComponent={<Text style={styles.bos}>Bekleyen başvuru yok.</Text>}
          renderItem={({ item }) => (
            <View style={styles.kart}>
              <Text style={styles.ad}>{item.ad}</Text>
              <Text style={styles.slug}>/{item.slug}</Text>
              {item.derbisNo ? (
                <Text style={styles.derbis}>DERBİS: {item.derbisNo}</Text>
              ) : null}
              <Text style={styles.paket}>
                Paketler: {item.paketler?.join(', ') ?? '—'}
              </Text>
              <View style={styles.row}>
                <TouchableOpacity style={styles.onayBtn} onPress={() => onayla(item)}>
                  <Text style={styles.onayText}>Onayla</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.redBtn}
                  onPress={() => {
                    setRedMesaj('');
                    setRedModal(item);
                  }}
                >
                  <Text style={styles.redText}>Reddet</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={!!redModal} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalWrap}
        >
          <View style={styles.modalKutu}>
            <Text style={styles.modalBaslik}>Red gerekçesi</Text>
            <Text style={styles.modalAlt}>{redModal?.ad}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Kısa açıklama"
              placeholderTextColor={Colors.textMuted}
              multiline
              value={redMesaj}
              onChangeText={setRedMesaj}
            />
            <View style={styles.modalRow}>
              <TouchableOpacity style={styles.modalIptal} onPress={() => setRedModal(null)}>
                <Text style={styles.modalIptalText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalGonder} onPress={reddetGonder}>
                <Text style={styles.modalGonderText}>Reddet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  bos: { textAlign: 'center', color: Colors.textMuted, marginTop: 24, paddingHorizontal: 24 },
  bosListe: { flexGrow: 1, justifyContent: 'center' },
  kart: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ad: { fontSize: 17, fontWeight: '700', color: Colors.text },
  slug: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  derbis: { fontSize: 13, color: Colors.primary, marginTop: 6, fontWeight: '600' },
  paket: { fontSize: 12, color: Colors.textMuted, marginTop: 8 },
  row: { flexDirection: 'row', gap: 12, marginTop: 14 },
  onayBtn: {
    flex: 1,
    backgroundColor: Colors.success,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  onayText: { color: '#fff', fontWeight: '700' },
  redBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.error,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  redText: { color: Colors.error, fontWeight: '700' },
  modalWrap: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  modalKutu: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 18,
  },
  modalBaslik: { fontSize: 17, fontWeight: '700', color: Colors.text },
  modalAlt: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  modalInput: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    color: Colors.text,
  },
  modalRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  modalIptal: { paddingVertical: 10, paddingHorizontal: 16 },
  modalIptalText: { color: Colors.textMuted, fontWeight: '600' },
  modalGonder: {
    backgroundColor: Colors.error,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  modalGonderText: { color: '#fff', fontWeight: '700' },
});
