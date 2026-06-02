import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import type { AdminDernekOzet, DernekDoc, FeaturePaketId, UyelikDoc } from '../types';

export function uyelikBelgeId(userId: string, dernekId: string): string {
  return `${userId}_${dernekId}`;
}

export async function yoneticiDernekleriniYukle(uid: string): Promise<AdminDernekOzet[]> {
  const q = query(
    collection(db, 'uyelikler'),
    where('userId', '==', uid),
    where('rol', '==', 'admin'),
    where('uyelikDurumu', '==', 'aktif'),
  );
  const snap = await getDocs(q);
  const out: AdminDernekOzet[] = [];
  for (const d of snap.docs) {
    const uy = d.data() as Omit<UyelikDoc, 'id'>;
    const dernekSnap = await getDoc(doc(db, 'dernekler', uy.dernekId));
    if (!dernekSnap.exists()) continue;
    const dernek = dernekSnap.data() as { ad?: string; durum?: string };
    if (dernek.durum !== 'aktif') continue;
    out.push({
      dernekId: uy.dernekId,
      dernekAd: String(dernek.ad ?? uy.dernekId),
    });
  }
  out.sort((a, b) => a.dernekAd.localeCompare(b.dernekAd, 'tr'));
  return out;
}

export async function dernekGetir(dernekId: string): Promise<DernekDoc | null> {
  const snap = await getDoc(doc(db, 'dernekler', dernekId));
  if (!snap.exists()) return null;
  const x = snap.data() as Record<string, unknown>;
  const paketler = Array.isArray(x.paketler) ? (x.paketler as FeaturePaketId[]) : [];
  return {
    id: snap.id,
    ad: String(x.ad ?? ''),
    slug: String(x.slug ?? ''),
    ...(typeof x.derbisNo === 'string' && x.derbisNo.trim()
      ? { derbisNo: String(x.derbisNo).trim() }
      : {}),
    durum: String(x.durum ?? ''),
    paketler,
    ...(typeof x.aidatAylikMiktar === 'number' ? { aidatAylikMiktar: x.aidatAylikMiktar } : {}),
    ...(x.dernekDurumu && typeof x.dernekDurumu === 'object'
      ? { dernekDurumu: x.dernekDurumu as DernekDoc['dernekDurumu'] }
      : {}),
  };
}

export async function dernekPaketleriniGuncelle(
  dernekId: string,
  paketler: FeaturePaketId[],
): Promise<void> {
  if (!paketler.length) {
    throw new Error('En az bir modül seçili olmalıdır.');
  }
  await updateDoc(doc(db, 'dernekler', dernekId), { paketler });
}
