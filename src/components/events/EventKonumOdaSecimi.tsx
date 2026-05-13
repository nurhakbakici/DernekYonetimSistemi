import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../../context/DataContext';
import { Colors } from '../../constants/colors';
import type { Oda } from '../../types';

type Props = {
  seciliOdaIdleri: string[];
  onSeciliOdaIdleriChange: (ids: string[]) => void;
};

function odaToggle(ids: string[], odaId: string): string[] {
  if (ids.includes(odaId)) return ids.filter(id => id !== odaId);
  return [...ids, odaId];
}

function OdaSatiri({ oda, secili, onPress }: { oda: Oda; secili: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.satir, secili && styles.satirSecili]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.satirSol}>
        <View style={[styles.kutu, secili && styles.kutuSecili]}>
          {secili ? <Ionicons name="checkmark" size={16} color={Colors.white} /> : null}
        </View>
        <View style={styles.satirMetin}>
          <Text style={styles.odaAd}>{oda.ad}</Text>
          {oda.aciklama ? (
            <Text style={styles.odaAciklama} numberOfLines={2}>
              {oda.aciklama}
            </Text>
          ) : null}
        </View>
      </View>
      <Ionicons name="business-outline" size={20} color={secili ? Colors.primaryLight : Colors.textMuted} />
    </TouchableOpacity>
  );
}

export default function EventKonumOdaSecimi({ seciliOdaIdleri, onSeciliOdaIdleriChange }: Props) {
  const { odalar, odaYukle } = useData();

  useEffect(() => {
    odaYukle();
  }, [odaYukle]);

  const aktifOdalar = odalar.filter(o => o.aktif).sort((a, b) => a.ad.localeCompare(b.ad, 'tr'));

  return (
    <View>
      <Text style={styles.altNot}>Bir veya birden fazla oda seçebilirsiniz.</Text>
      {aktifOdalar.length === 0 ? (
        <View style={styles.bosKutu}>
          <Ionicons name="alert-circle-outline" size={20} color={Colors.warning} />
          <Text style={styles.bosMetin}>
            Henüz aktif oda yok. Önce Odalar veya yönetim panelinden oda tanımlayın.
          </Text>
        </View>
      ) : (
        <View style={styles.liste}>
          {aktifOdalar.map(oda => (
            <OdaSatiri
              key={oda.id}
              oda={oda}
              secili={seciliOdaIdleri.includes(oda.id)}
              onPress={() => onSeciliOdaIdleriChange(odaToggle(seciliOdaIdleri, oda.id))}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  altNot: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 10,
    lineHeight: 17,
  },
  liste: { gap: 8 },
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  satirSecili: {
    borderColor: Colors.primaryLight + '80',
    backgroundColor: Colors.primaryDark + '50',
  },
  satirSol: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  kutu: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kutuSecili: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  satirMetin: { flex: 1 },
  odaAd: { fontSize: 15, fontWeight: '600', color: Colors.text },
  odaAciklama: { fontSize: 12, color: Colors.textSecondary, marginTop: 4, lineHeight: 16 },
  bosKutu: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.warning + '12',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.warning + '35',
  },
  bosMetin: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
});
