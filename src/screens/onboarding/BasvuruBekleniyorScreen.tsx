import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';
import type { OnboardingStackParamList } from '../../navigation/onboardingTypes';

type Nav = NativeStackNavigationProp<OnboardingStackParamList, 'BasvuruBekleniyor'>;
type Route = RouteProp<OnboardingStackParamList, 'BasvuruBekleniyor'>;

export default function BasvuruBekleniyorScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { cikisYap, kiraciVerileriniYenile } = useAuth();
  const dernekAd = route.params?.dernekAd ?? 'Dernek';

  const yenile = async () => {
    try {
      await kiraciVerileriniYenile();
    } catch {
      // hata yok, navigasyon context değişince tetiklenecek
    }
  };

  const cikisOnay = () => {
    Alert.alert(
      'Çıkış yap',
      'Başka bir hesapla giriş yapmak için çıkış yapabilirsiniz. Mevcut başvurunuz kaybolmaz.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Çıkış yap', style: 'destructive', onPress: () => void cikisYap() },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.icerik}>

        <View style={styles.ikonKutu}>
          <Ionicons name="hourglass-outline" size={56} color={Colors.warning} />
        </View>

        <Text style={styles.baslik}>Başvurunuz alındı</Text>
        <Text style={styles.dernekAd}>{dernekAd}</Text>

        <Text style={styles.aciklama}>
          Aday üyeliğiniz oluşturuldu. Dernek yöneticileri başvurunuzu inceledikten sonra
          onaylandığında uygulama ana sayfasına otomatik olarak geçeceksiniz.
        </Text>

        <View style={styles.adimlarKutu}>
          <AdimSatiri
            ikon="checkmark-circle"
            renk={Colors.success}
            metin="Başvurunuz başarıyla gönderildi"
          />
          <AdimSatiri
            ikon="hourglass-outline"
            renk={Colors.warning}
            metin="Yönetici onayı bekleniyor"
            aktif
          />
          <AdimSatiri
            ikon="lock-open-outline"
            renk={Colors.textMuted}
            metin="Onay sonrası tam erişim açılır"
          />
        </View>

        <TouchableOpacity style={styles.yenileButon} onPress={yenile}>
          <Ionicons name="refresh-outline" size={18} color={Colors.primary} />
          <Text style={styles.yenileText}>Onay durumunu yenile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.geriButon}
          onPress={() => navigation.navigate('DernekSecimi')}
        >
          <Text style={styles.geriText}>Farklı derneğe başvur</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cikisButon} onPress={cikisOnay}>
          <Text style={styles.cikisText}>Çıkış yap</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AdimSatiri({ ikon, renk, metin, aktif }: {
  ikon: keyof typeof Ionicons.glyphMap;
  renk: string;
  metin: string;
  aktif?: boolean;
}) {
  return (
    <View style={styles.adim}>
      <Ionicons name={ikon} size={20} color={renk} />
      <Text style={[styles.adimMetin, aktif && { color: Colors.text, fontWeight: '600' }]}>
        {metin}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
  },
  icerik: {
    marginHorizontal: 24,
    padding: 28,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  ikonKutu: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.warning + '18',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: Colors.warning + '35',
  },
  baslik: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  dernekAd: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primaryLight,
    marginBottom: 14,
    textAlign: 'center',
  },
  aciklama: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  adimlarKutu: {
    width: '100%',
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 14,
    padding: 16,
    gap: 14,
    marginBottom: 24,
  },
  adim: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  adimMetin: {
    fontSize: 14,
    color: Colors.textMuted,
    flex: 1,
  },
  yenileButon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: Colors.primary + '18',
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    marginBottom: 12,
    width: '100%',
    justifyContent: 'center',
  },
  yenileText: { fontSize: 15, fontWeight: '600', color: Colors.primary },
  geriButon: {
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 4,
  },
  geriText: { fontSize: 14, color: Colors.textMuted, fontWeight: '500' },
  cikisButon: { paddingVertical: 10 },
  cikisText: { fontSize: 13, color: Colors.error + 'cc' },
});
