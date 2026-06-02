import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Tüm AsyncStorage anahtarları tek yerde tanımlı.
 * Prefix: @dernekapp_ — uygulama genelinde standart.
 */
const KEYS = {
  USERS: '@dernekapp_users',
  ODALAR: '@dernekapp_odalar',
  REZERVASYONLAR: '@dernekapp_rezervasyonlar',
  KITAPLAR: '@dernekapp_kitaplar',
  ODUNC_ALMALAR: '@dernekapp_odunc',
  BURSLAR: '@dernekapp_burslar',
  BURS_BASVURULARI: '@dernekapp_burs_basvuru',
  GONULLU_GOREVLER: '@dernekapp_gonullu_gorev',
  GONULLU_BASVURULAR: '@dernekapp_gonullu_basvuru',
  ENVANTER: '@dernekapp_envanter',
  ENVANTER_ZIMMET: '@dernekapp_envanter_zimmet',
  ETKINLIKLER: '@dernekapp_etkinlikler',
  DERNEK_DURUMU: '@dernekapp_durum',
  AIDAT_ODEMELERI: '@dernekapp_aidat',
  /** Tek belge: { miktar: number } — aylık dernek aidatı */
  AIDAT_AYLIK_MIKTAR: '@dernekapp_aidat_aylik_miktar',
  DUYURULAR: '@dernekapp_duyurular',
  CURRENT_USER: '@dernekapp_current_user',
  /** Firebase: son seçilen dernek (çoklu üyelik). */
  AKTIF_DERNEK_ID: '@dernekapp_aktif_dernek_id',
  /** Çıkış öncesi son aktif dernek adı + logo + slug (giriş ekranı markası). */
  SON_DERNEK_MARKA: '@dernekapp_son_dernek',
  /** Girişten sonra dernek başvuru formuna yönlendir. */
  DERNEK_BASVURU_NIYETI: '@dernekapp_basvuru_niyet',
  INITIALIZED: '@dernekapp_initialized',
};

export async function getItem<T>(key: string): Promise<T | null> {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export async function setItem(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export async function removeItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export { KEYS };
