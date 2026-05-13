import type { Oda } from '../types';

/** Virgülle ayrılmış konum metnini oda adlarıyla eşleşen id listesine çevirir (sıra korunur). */
export function konumMetnindenOdaIdleri(konum: string, odalar: Oda[]): string[] {
  const parts = konum.split(',').map(s => s.trim()).filter(Boolean);
  const ids: string[] = [];
  for (const p of parts) {
    const o = odalar.find(oda => oda.ad === p);
    if (o && !ids.includes(o.id)) ids.push(o.id);
  }
  return ids;
}

export function konumMetnindenEslesmeyenParcalar(konum: string, odalar: Oda[]): string[] {
  const parts = konum.split(',').map(s => s.trim()).filter(Boolean);
  const unmatched: string[] = [];
  for (const p of parts) {
    const o = odalar.find(oda => oda.ad === p);
    if (!o) unmatched.push(p);
  }
  return unmatched;
}

/** Seçili oda id sırasına göre Firestore / liste için virgülle ayrılmış konum metni. */
export function odaIdlerindenKonumMetni(ids: string[], odalar: Oda[]): string {
  return ids
    .map(id => odalar.find(o => o.id === id)?.ad)
    .filter((ad): ad is string => Boolean(ad))
    .join(', ');
}
