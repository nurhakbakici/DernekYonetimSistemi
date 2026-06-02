import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';
import ScreenHeader from '../../components/common/ScreenHeader';
import { FEATURE_PAKETLERI, type FeaturePaketId, varsayilanPaketler } from '../../constants/featurePackages';
import { IS_FIREBASE_CONFIGURED } from '../../config/firebase';
import { removeItem, KEYS } from '../../config/storage';
import { validateDerbisNo } from '../../utils/derbisNo';
import type { OnboardingStackParamList } from '../../navigation/onboardingTypes';

type Nav = NativeStackNavigationProp<OnboardingStackParamList, 'DernekBasvuruForm'>;

export default function DernekBasvuruFormScreen() {
  const navigation = useNavigation<Nav>();
  const { dernekAcmaBasvurusuGonder } = useAuth();
  const [dernekAd, setDernekAd] = useState('');
  const [slug, setSlug] = useState('');
  const [derbisNo, setDerbisNo] = useState('');
  const [paketler, setPaketler] = useState<Record<FeaturePaketId, boolean>>(
    () => Object.fromEntries(varsayilanPaketler().map((id) => [id, true])) as Record<FeaturePaketId, boolean>,
  );
  const [yukleniyor, setYukleniyor] = useState(false);

  const secilenPaketler = (): FeaturePaketId[] =>
    (Object.keys(paketler) as FeaturePaketId[]).filter((id) => paketler[id]);

  const basvuru = async () => {
    if (!IS_FIREBASE_CONFIGURED) {
      Alert.alert('Firebase', 'Bu akış yalnızca Firebase ile çalışır.');
      return;
    }
    if (!dernekAd.trim()) {
      Alert.alert('Uyarı', 'Dernek adını girin.');
      return;
    }
    if (!slug.trim()) {
      Alert.alert('Uyarı', 'Kısa ad (slug) girin.');
      return;
    }
    try {
      validateDerbisNo(derbisNo);
    } catch (e) {
      Alert.alert('Uyarı', e instanceof Error ? e.message : 'DERBİS numarası geçersiz.');
      return;
    }
    const p = secilenPaketler();
    if (!p.length) {
      Alert.alert('Uyarı', 'En az bir özellik paketi seçin.');
      return;
    }
    setYukleniyor(true);
    try {
      await dernekAcmaBasvurusuGonder(dernekAd, slug, derbisNo, p);
      await removeItem(KEYS.DERNEK_BASVURU_NIYETI);
      Alert.alert(
        'Başvuru gönderildi',
        'Platform yöneticisi onayladığında derneğiniz açılacak ve size yönetici üyeliği atanacaktır.',
        [{ text: 'Tamam', onPress: () => navigation.goBack() }],
      );
      setDernekAd('');
      setSlug('');
      setDerbisNo('');
    } catch (e) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'İşlem başarısız.');
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader baslik="Dernek başvurusu" altBaslik="Yeni dernek açılışı" geriButon />
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.aciklama}>
          DERBİS numarası ve kısa ad benzersiz olmalıdır. Onay süreci platform yöneticisi tarafından yürütülür.
        </Text>
        <Text style={styles.alanEtiket}>Dernek adı</Text>
        <TextInput
          style={styles.input}
          placeholder="Örn. Kule Sakinleri Derneği"
          placeholderTextColor={Colors.textMuted}
          value={dernekAd}
          onChangeText={setDernekAd}
        />
        <Text style={styles.alanEtiket}>DERBİS numarası</Text>
        <TextInput
          style={styles.input}
          placeholder="Dernek Bilgi Sistemi kayıt no"
          placeholderTextColor={Colors.textMuted}
          value={derbisNo}
          onChangeText={setDerbisNo}
          keyboardType="number-pad"
          maxLength={15}
        />
        <Text style={styles.alanIpucu}>İçişleri Bakanlığı DERBİS kaydındaki dernek numarası (4–15 hane).</Text>
        <Text style={styles.alanEtiket}>Kısa ad (slug)</Text>
        <TextInput
          style={styles.input}
          placeholder="ornek-dernek"
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="none"
          value={slug}
          onChangeText={setSlug}
        />
        <Text style={styles.altBaslik}>Kullanılacak özellik paketleri</Text>
        {FEATURE_PAKETLERI.map((p) => (
          <View key={p.id} style={styles.paketRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.paketEtiket}>{p.etiket}</Text>
              <Text style={styles.paketAciklama}>{p.aciklama}</Text>
            </View>
            <Switch
              value={!!paketler[p.id]}
              onValueChange={(v) => setPaketler((prev) => ({ ...prev, [p.id]: v }))}
            />
          </View>
        ))}
        <TouchableOpacity
          style={[styles.button, yukleniyor && styles.buttonDisabled]}
          onPress={basvuru}
          disabled={yukleniyor}
        >
          <Text style={styles.buttonText}>{yukleniyor ? 'Gönderiliyor…' : 'Başvuruyu gönder'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1, paddingHorizontal: 20, paddingBottom: 32 },
  aciklama: { fontSize: 13, color: Colors.textMuted, marginTop: 8, marginBottom: 16, lineHeight: 18 },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    marginBottom: 12,
    backgroundColor: Colors.surface,
  },
  alanEtiket: { fontSize: 13, fontWeight: '600', color: Colors.textMuted, marginBottom: 6 },
  alanIpucu: { fontSize: 12, color: Colors.textMuted, marginTop: -6, marginBottom: 12, lineHeight: 16 },
  altBaslik: { fontSize: 15, fontWeight: '600', color: Colors.text, marginTop: 8, marginBottom: 8 },
  paketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  paketEtiket: { fontSize: 15, fontWeight: '600', color: Colors.text },
  paketAciklama: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
