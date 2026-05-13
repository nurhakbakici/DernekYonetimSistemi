import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

type DurumTipi = 'beklemede' | 'onaylandi' | 'iptal' | 'aktif' | 'pasif' | 'iade_edildi' | 'gecikti' | 'kapali' | 'reddedildi';

const durumRenkleri: Record<DurumTipi, { bg: string; text: string; label: string }> = {
  beklemede: { bg: Colors.warningLight, text: Colors.warning, label: 'Beklemede' },
  onaylandi: { bg: Colors.successLight, text: Colors.success, label: 'Onaylandı' },
  iptal: { bg: Colors.errorLight, text: Colors.error, label: 'İptal' },
  aktif: { bg: Colors.successLight, text: Colors.success, label: 'Aktif' },
  pasif: { bg: Colors.errorLight, text: Colors.error, label: 'Pasif' },
  iade_edildi: { bg: Colors.successLight, text: Colors.success, label: 'İade Edildi' },
  gecikti: { bg: Colors.errorLight, text: Colors.error, label: 'Gecikmiş' },
  kapali: { bg: Colors.errorLight, text: Colors.error, label: 'Kapalı' },
  reddedildi: { bg: Colors.errorLight, text: Colors.error, label: 'Reddedildi' },
};

interface Props {
  durum: DurumTipi;
  kucuk?: boolean;
}

export default function StatusBadge({ durum, kucuk }: Props) {
  const renkler = durumRenkleri[durum] || durumRenkleri.beklemede;

  return (
    <View style={[styles.badge, { backgroundColor: renkler.bg }, kucuk && styles.kucuk]}>
      <Text style={[styles.text, { color: renkler.text }, kucuk && styles.kucukText]}>
        {renkler.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  kucuk: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  kucukText: {
    fontSize: 10,
  },
});
