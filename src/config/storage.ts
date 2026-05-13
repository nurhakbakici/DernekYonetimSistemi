import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  USERS: '@kule_users',
  ODALAR: '@kule_odalar',
  REZERVASYONLAR: '@kule_rezervasyonlar',
  KITAPLAR: '@kule_kitaplar',
  ODUNC_ALMALAR: '@kule_odunc',
  BURSLAR: '@kule_burslar',
  BURS_BASVURULARI: '@kule_burs_basvuru',
  ETKINLIKLER: '@kule_etkinlikler',
  DERNEK_DURUMU: '@kule_durum',
  AIDAT_ODEMELERI: '@kule_aidat',
  /** Tek belge: { miktar: number } — aylık dernek aidatı */
  AIDAT_AYLIK_MIKTAR: '@kule_aidat_aylik_miktar',
  DUYURULAR: '@kule_duyurular',
  CURRENT_USER: '@kule_current_user',
  INITIALIZED: '@kule_initialized',
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
