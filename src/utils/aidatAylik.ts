import { format, endOfMonth } from 'date-fns';
import { tr } from 'date-fns/locale';
import type { AidatOdemesi } from '../types';
import { AIDAT_BASLANGIC_AY, AIDAT_BASLANGIC_YIL } from '../constants/aidat';

export interface AylikAidatSlot {
  yil: number;
  ay: number;
  /** Firestore / yerelde kayıt yoksa undefined */
  kayit?: AidatOdemesi;
}

/**
 * Başlangıç tarihi → bu ay (dahil) tüm aylar.
 * @param baslangicTarihi  Dernek `aidatBaslangicTarihi` (YYYY-MM-DD); belirtilmezse sabit kullanılır.
 */
export function aylarBaslangictanSimdiye(baslangicTarihi?: string): { yil: number; ay: number }[] {
  const out: { yil: number; ay: number }[] = [];
  let y: number;
  let m: number;
  if (baslangicTarihi) {
    const d = new Date(baslangicTarihi);
    y = d.getFullYear();
    m = d.getMonth() + 1;
  } else {
    y = AIDAT_BASLANGIC_YIL;
    m = AIDAT_BASLANGIC_AY;
  }
  const now = new Date();
  const endY = now.getFullYear();
  const endM = now.getMonth() + 1;
  while (y < endY || (y === endY && m <= endM)) {
    out.push({ yil: y, ay: m });
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out.reverse();
}

export function aySonOdemeTarihi(yil: number, ay: number): string {
  const d = endOfMonth(new Date(yil, ay - 1, 1));
  return format(d, 'yyyy-MM-dd');
}

export function ayEtiketi(yil: number, ay: number): string {
  return format(new Date(yil, ay - 1, 1), 'MMMM yyyy', { locale: tr });
}

export function birlestirAylikAidat(
  kullaniciId: string,
  tumAidatlar: AidatOdemesi[],
  baslangicTarihi?: string,
): AylikAidatSlot[] {
  const benim = tumAidatlar.filter(a => a.kullaniciId === kullaniciId);
  return aylarBaslangictanSimdiye(baslangicTarihi).map(({ yil, ay }) => {
    const kayit = benim.find(a => a.yil === yil && (a.ay ?? 0) === ay);
    return { yil, ay, kayit };
  });
}

export function aidatDurumuEtiketi(k?: AidatOdemesi): 'tamam' | 'onay_bekliyor' | 'red' | 'bekliyor' {
  if (!k) return 'bekliyor';
  if (k.odendi) return 'tamam';
  if (k.redAciklamasi) return 'red';
  if (k.dekontUri) return 'onay_bekliyor';
  return 'bekliyor';
}
