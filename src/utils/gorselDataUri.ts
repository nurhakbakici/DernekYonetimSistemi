import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Galeriden/kameradan gelen yerel URI’yi sıkıştırılmış JPEG data URI’ye çevirir.
 * Firestore’da saklanınca tüm cihazlarda görüntülenebilir (yerel dosya yolu değil).
 */
export async function yerelGorseliDataUriye(
  yerelUri: string,
  secenek?: { genislik?: number; kalite?: number },
): Promise<string> {
  const genislik = secenek?.genislik ?? 480;
  const kalite = secenek?.kalite ?? 0.45;
  let sonuc: ImageManipulator.ImageResult;
  try {
    sonuc = await ImageManipulator.manipulateAsync(
      yerelUri,
      [{ resize: { width: genislik } }],
      { compress: kalite, format: ImageManipulator.SaveFormat.JPEG, base64: true },
    );
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    throw new Error('Görsel işlenemedi: ' + m);
  }
  if (!sonuc.base64?.length) {
    throw new Error('Görsel base64 verisi boş.');
  }
  return 'data:image/jpeg;base64,' + sonuc.base64;
}
