import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

/** Galeriden tek görsel seçer; izin yoksa uyarı verir. */
export async function galeridenGorselSec(): Promise<string | null> {
  const izin = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!izin.granted) {
    Alert.alert('İzin gerekli', 'Görsel seçmek için galeri erişimine izin verin.');
    return null;
  }
  const sonuc = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.82,
  });
  if (sonuc.canceled || !sonuc.assets?.[0]?.uri) return null;
  return sonuc.assets[0].uri;
}
