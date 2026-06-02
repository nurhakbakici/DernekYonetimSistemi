import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';
import ScreenHeader from '../../components/common/ScreenHeader';
import { IS_FIREBASE_CONFIGURED } from '../../config/firebase';
import { getItem, removeItem, KEYS } from '../../config/storage';
import type { OnboardingStackParamList } from '../../navigation/onboardingTypes';
import type { KayitDernekOzeti } from '../../types';
import DernekSecimDropdown from '../../components/auth/DernekSecimDropdown';

type Nav = NativeStackNavigationProp<OnboardingStackParamList, 'DernekSecimi'>;

export default function OnboardingDernekScreen() {
  const navigation = useNavigation<Nav>();
  const {
    dernegeSecimleKatil, kiraciVerileriniYenile, cikisYap, kayitIcinAktifDernekListesi,
  } = useAuth();
  const [dernekler, setDernekler] = useState<KayitDernekOzeti[]>([]);
  const [listeYukleniyor, setListeYukleniyor] = useState(true);
  const [secilenDernekId, setSecilenDernekId] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);

  const listeyiYukle = useCallback(async () => {
    if (!IS_FIREBASE_CONFIGURED) {
      setDernekler([]);
      setListeYukleniyor(false);
      return;
    }
    setListeYukleniyor(true);
    try {
      const l = await kayitIcinAktifDernekListesi();
      setDernekler(l);
    } catch {
      setDernekler([]);
    } finally {
      setListeYukleniyor(false);
    }
  }, [kayitIcinAktifDernekListesi]);

  useEffect(() => {
    void listeyiYukle();
  }, [listeyiYukle]);

  useFocusEffect(
    useCallback(() => {
      let iptal = false;
      (async () => {
        const niyet = await getItem<boolean>(KEYS.DERNEK_BASVURU_NIYETI);
        if (!iptal && niyet) {
          await removeItem(KEYS.DERNEK_BASVURU_NIYETI);
          navigation.navigate('DernekBasvuruForm');
        }
      })();
      return () => {
        iptal = true;
      };
    }, [navigation]),
  );

  const basvur = async () => {
    if (!IS_FIREBASE_CONFIGURED) {
      Alert.alert('Firebase', 'Bu akış yalnızca Firebase ile çalışır.');
      return;
    }
    if (!secilenDernekId) {
      Alert.alert('Dernek seçin', 'Açılır listeden başvurmak istediğiniz derneği seçin.');
      return;
    }
    setYukleniyor(true);
    try {
      await dernegeSecimleKatil(secilenDernekId);
      await kiraciVerileriniYenile();
      const dernekAd = dernekler.find((d) => d.id === secilenDernekId)?.ad ?? 'Dernek';
      navigation.navigate('BasvuruBekleniyor', { dernekAd });
      setSecilenDernekId(null);
    } catch (e) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'İşlem başarısız.');
    } finally {
      setYukleniyor(false);
    }
  };

  const cikisOnay = () => {
    Alert.alert(
      'Çıkış yap',
      'Başka bir hesapla giriş yapmak veya kayıt ekranına dönmek için çıkış yapabilirsiniz.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Çıkış yap', style: 'destructive', onPress: () => void cikisYap() },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader baslik="Derneğe bağlanın" altBaslik="Dernek seçin, yönetici onayı bekleyin" />
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.bilgiKutu}>
          <Text style={styles.bilgiBaslik}>Neden bu ekrandasınız?</Text>
          <Text style={styles.bilgiMetin}>
            Oturumunuz açık ancak henüz hiçbir aktif dernekte kaydınız yok. Açılır listeden üye olmak istediğiniz
            derneği seçip başvurun; ilgili dernek yöneticileri onayladığında ana sayfaya geçersiniz.
          </Text>
        </View>

        {IS_FIREBASE_CONFIGURED ? (
          <DernekSecimDropdown
            etiket="Katılmak istediğiniz dernek"
            dernekler={dernekler}
            secilenId={secilenDernekId}
            onSecim={setSecilenDernekId}
            yukleniyor={listeYukleniyor}
            aciklama="Katılım kodu gerekmez; yalnızca dernek seçmeniz yeterlidir."
          />
        ) : null}

        <TouchableOpacity
          style={[styles.button, (!secilenDernekId || yukleniyor || !IS_FIREBASE_CONFIGURED) && styles.buttonDisabled]}
          onPress={basvur}
          disabled={!secilenDernekId || yukleniyor || !IS_FIREBASE_CONFIGURED}
        >
          <Text style={styles.buttonText}>{yukleniyor ? 'Gönderiliyor…' : 'Seçtiğim derneğe başvur'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cikisButton} onPress={cikisOnay}>
          <Text style={styles.cikisText}>Çıkış yap (farklı hesap)</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1, paddingHorizontal: 20, paddingBottom: 32 },
  bilgiKutu: {
    marginTop: 8,
    marginBottom: 16,
    padding: 14,
    backgroundColor: Colors.infoLight + '18',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.info + '35',
  },
  bilgiBaslik: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  bilgiMetin: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cikisButton: { marginTop: 24, alignItems: 'center', paddingVertical: 12 },
  cikisText: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
});
