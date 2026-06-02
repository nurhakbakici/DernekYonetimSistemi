/**
 * Firebase Storage yükleme yardımcısı.
 *
 * Yerel dosya URI → Firebase Storage → HTTPS download URL.
 * IS_FIREBASE_CONFIGURED false ise yerelGorseliDataUriye() yedek olarak kullanılır.
 */

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { storage, IS_FIREBASE_CONFIGURED } from '../config/firebase';
import { yerelGorseliDataUriye } from './gorselDataUri';

/**
 * Dosyayı Firebase Storage'a yükler ve HTTPS indirme URL'sini döner.
 * @param yerelUri  expo-image-picker veya expo-file-system'den gelen dosya URI'si
 * @param storagePath  örn. "aidatDekontlar/dernekId/dosyaAdi.jpg"
 */
export async function uploadFileToStorage(yerelUri: string, storagePath: string): Promise<string> {
  if (!IS_FIREBASE_CONFIGURED) {
    // Demo mod: data URI olarak koru (geri dönük uyumluluk)
    return yerelGorseliDataUriye(yerelUri);
  }

  // React Native FileSystem ile dosyayı binary oku
  let blob: Blob;
  if (Platform.OS === 'web') {
    const res = await fetch(yerelUri);
    blob = await res.blob();
  } else {
    const base64 = await FileSystem.readAsStringAsync(yerelUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const byteChars = atob(base64);
    const byteNums = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      byteNums[i] = byteChars.charCodeAt(i);
    }
    blob = new Blob([byteNums], { type: 'image/jpeg' });
  }

  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
  return getDownloadURL(storageRef);
}

/** Fotoğrafın dosya adı için güvenli zaman damgası üretir. */
export function timestampedFileName(prefix: string): string {
  return `${prefix}_${Date.now()}.jpg`;
}
