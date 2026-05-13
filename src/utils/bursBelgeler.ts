import type { BursGerekliBelge } from '../types';

/** Önceden tanımlı belge türleri — seçildiğinde sabit `id` kullanılır */
export const BURS_BELGE_SABLONLARI: BursGerekliBelge[] = [
  { id: 'belge-transkript', baslik: 'Transkript' },
  { id: 'belge-ogrenci', baslik: 'Öğrenci belgesi' },
  { id: 'belge-kimlik', baslik: 'Kimlik fotokopisi' },
  { id: 'belge-ikamet', baslik: 'İkametgah' },
  { id: 'belge-gelir', baslik: 'Gelir / mali durum belgesi' },
  { id: 'belge-niyet', baslik: 'Niyet mektubu' },
];

export function yeniOzelBelgeId(): string {
  return `belge-${Date.now()}`;
}
