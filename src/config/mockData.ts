import type { KayitDernekOzeti } from '../types';

export {
  DEMO_ADMIN,
  DEMO_USER,
  DEMO_ADAY,
  DEMO_USERS,
  ODALAR,
  KITAPLAR,
  ETKINLIKLER,
  BURSLAR,
  BURS_BASVURULARI,
  DERNEK_DURUMU,
  DUYURULAR,
  AIDAT_ODEMELERI,
  REZERVASYONLAR,
  ODUNC_ALMALAR,
  GONULLU_GOREVLER,
  GONULLU_BASVURULAR,
  ENVANTER_KAYITLARI,
  ENVANTER_ZIMMETLER,
} from './mockDataRich';

/** Firebase kapalı demo modda kayıt / dernek seçim listesi için örnek aktif dernekler. */
export const MOCK_AKTIF_DERNEKLER: KayitDernekOzeti[] = [
  { id: 'local-demo-alfa', ad: 'Alfa Kültür Derneği (demo)' },
  { id: 'local-demo-beta', ad: 'Beta Spor ve Oyun Derneği (demo)' },
];
