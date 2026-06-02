import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, ActivityIndicator, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { KayitDernekOzeti } from '../../types';
import { Colors } from '../../constants/colors';

interface Props {
  dernekler: KayitDernekOzeti[];
  secilenId: string | null;
  onSecim: (id: string) => void;
  yukleniyor?: boolean;
  /** Form üstündeki kısa açıklama */
  aciklama?: string;
  /** Varsayılan: «Üye olacağınız dernek» */
  etiket?: string;
}

export default function DernekSecimDropdown({
  dernekler,
  secilenId,
  onSecim,
  yukleniyor,
  aciklama,
  etiket = 'Üye olacağınız dernek',
}: Props) {
  const [acik, setAcik] = useState(false);
  const secilen = dernekler.find((d) => d.id === secilenId);
  const bos = !yukleniyor && dernekler.length === 0;

  return (
    <View style={styles.wrap}>
      <Text style={styles.baslik}>{etiket}</Text>
      {aciklama ? <Text style={styles.alt}>{aciklama}</Text> : null}

      {yukleniyor ? (
        <ActivityIndicator style={{ marginVertical: 14 }} color={Colors.primaryLight} />
      ) : (
        <>
          <TouchableOpacity
            style={[styles.trigger, bos && styles.triggerDevreDisi]}
            onPress={() => !bos && setAcik(true)}
            disabled={bos}
            accessibilityRole="button"
            accessibilityLabel="Dernek seçimi"
          >
            <Text
              style={secilen ? styles.triggerText : styles.triggerPlaceholder}
              numberOfLines={2}
            >
              {secilen ? secilen.ad : 'Listeden dernek seçin…'}
            </Text>
            <Ionicons name="chevron-down" size={22} color={Colors.textMuted} />
          </TouchableOpacity>
          {bos ? (
            <Text style={styles.uyari}>Kayıt için uygun dernek bulunamadı.</Text>
          ) : null}
        </>
      )}

      <Modal visible={acik} transparent animationType="fade" onRequestClose={() => setAcik(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => setAcik(false)} />
          <View style={styles.sheet}>
            <Text style={styles.sheetBaslik}>Dernek seçin</Text>
            <Text style={styles.sheetAlt}>
              Seçtiğiniz dernekteki yöneticiler başvurunuzu onayladığında tam üyelik açılır.
            </Text>
            <FlatList
              data={dernekler}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              style={styles.liste}
              renderItem={({ item }) => {
                const secili = secilenId === item.id;
                return (
                  <TouchableOpacity
                    style={[styles.satir, secili && styles.satirSecili]}
                    onPress={() => {
                      onSecim(item.id);
                      setAcik(false);
                    }}
                  >
                    <Text style={styles.satirText} numberOfLines={2}>{item.ad}</Text>
                    {secili ? (
                      <Ionicons name="checkmark-circle" size={22} color={Colors.primaryLight} />
                    ) : null}
                  </TouchableOpacity>
                );
              }}
            />
            <TouchableOpacity style={styles.kapat} onPress={() => setAcik(false)}>
              <Text style={styles.kapatText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  baslik: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  alt: { fontSize: 12, color: Colors.textMuted, lineHeight: 18, marginBottom: 10 },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceVariant,
  },
  triggerDevreDisi: { opacity: 0.55 },
  triggerText: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.text, marginRight: 8 },
  triggerPlaceholder: { flex: 1, fontSize: 15, color: Colors.textMuted, marginRight: 8 },
  uyari: { fontSize: 12, color: Colors.warning, marginTop: 8 },
  modalRoot: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    maxHeight: '75%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    zIndex: 1,
  },
  sheetBaslik: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  sheetAlt: { fontSize: 12, color: Colors.textMuted, lineHeight: 18, marginBottom: 12 },
  liste: { maxHeight: 320 },
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: Colors.surfaceVariant,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  satirSecili: {
    borderColor: Colors.primaryLight,
    backgroundColor: Colors.primary + '12',
  },
  satirText: { flex: 1, fontSize: 15, color: Colors.text, fontWeight: '600', marginRight: 8 },
  kapat: { marginTop: 8, paddingVertical: 12, alignItems: 'center' },
  kapatText: { fontSize: 15, fontWeight: '600', color: Colors.primaryLight },
});
