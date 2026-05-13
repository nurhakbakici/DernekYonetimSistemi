import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Image } from 'react-native';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useData } from '../../context/DataContext';
import { Colors } from '../../constants/colors';
import ScreenHeader from '../../components/common/ScreenHeader';
import EmptyState from '../../components/common/EmptyState';

export default function DuyurularScreen() {
  const { duyurular, duyuruYukle } = useData();
  const [yukleniyor, setYukleniyor] = useState(false);

  useEffect(() => {
    yukle();
  }, []);

  const yukle = async () => {
    setYukleniyor(true);
    await duyuruYukle();
    setYukleniyor(false);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader baslik="Duyurular" altBaslik="Dernekten haberler" geriButon />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.icerik}
        refreshControl={<RefreshControl refreshing={yukleniyor} onRefresh={yukle} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {duyurular.length === 0 ? (
          <EmptyState ikon="megaphone-outline" baslik="Henüz duyuru yok" aciklama="Yönetici yeni duyuru paylaştığında burada görünür." />
        ) : (
          duyurular.map((d) => (
            <View key={d.id} style={styles.kart}>
              {d.gorselUri ? (
                <Image source={{ uri: d.gorselUri }} style={styles.kartGorsel} resizeMode="cover" />
              ) : null}
              <Text style={styles.baslik}>{d.baslik}</Text>
              <Text style={styles.meta}>
                {format(new Date(d.olusturulmaTarihi), 'd MMMM yyyy, HH:mm', { locale: tr })} · {d.olusturanAdi}
              </Text>
              <Text style={styles.govde}>{d.icerik}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  icerik: { padding: 16, paddingBottom: 32 },
  kart: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  kartGorsel: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: Colors.surfaceVariant,
  },
  baslik: { fontSize: 17, fontWeight: '700', color: Colors.text },
  meta: { fontSize: 12, color: Colors.textMuted, marginTop: 6 },
  govde: { fontSize: 14, color: Colors.textSecondary, marginTop: 12, lineHeight: 22 },
});
