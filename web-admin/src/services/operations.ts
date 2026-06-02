import {
  collection, getDocs, query, where, updateDoc, doc, getDoc, setDoc, deleteField,
} from 'firebase/firestore';
import { db } from '../firebase';
import { uyelikBelgeId } from './dernek';
import type { FeaturePaketId } from '../types';

const AIDAT_VARSAYILAN_MIKTAR = 300;

export interface UyeBilgi {
  uid: string;
  ad: string;
  soyad: string;
  email: string;
  rol: string;
  uyelikDurumu: string;
  uyelikBaslangic: string;
  uyelikId: string;
}

export interface DernekBasvuru {
  id: string;
  ad: string;
  slug: string;
  derbisNo?: string;
  durum: string;
  olusturanUserId: string;
  olusturulmaTarihi: string;
  redMesaji?: string;
}

export async function dernekUyeleriniYukle(dernekId: string): Promise<UyeBilgi[]> {
  const snap = await getDocs(query(collection(db, 'uyelikler'), where('dernekId', '==', dernekId)));
  const list: UyeBilgi[] = [];
  for (const d of snap.docs) {
    const uy = d.data() as Record<string, unknown>;
    const uid = String(uy.userId ?? '');
    try {
      const ps = await getDoc(doc(db, 'users', uid));
      if (!ps.exists()) continue;
      const p = ps.data() as Record<string, unknown>;
      list.push({
        uid,
        ad: String(p.ad ?? ''),
        soyad: String(p.soyad ?? ''),
        email: String(p.email ?? ''),
        rol: String(uy.rol ?? 'aday'),
        uyelikDurumu: String(uy.uyelikDurumu ?? 'beklemede'),
        uyelikBaslangic: String(uy.uyelikBaslangic ?? ''),
        uyelikId: d.id,
      });
    } catch {
      // profil okunamadıysa atla
    }
  }
  list.sort((a, b) => {
    const durum = (s: string) => s === 'aktif' ? 0 : s === 'beklemede' ? 1 : 2;
    return durum(a.uyelikDurumu) - durum(b.uyelikDurumu) || a.ad.localeCompare(b.ad, 'tr');
  });
  return list;
}

export async function uyeRolunuGuncelle(
  uyelikId: string,
  yeniRol: 'admin' | 'uye' | 'aday',
): Promise<void> {
  await updateDoc(doc(db, 'uyelikler', uyelikId), { rol: yeniRol });
}

export async function uyeDurumunuGuncelle(
  uyelikId: string,
  yeniDurum: 'aktif' | 'pasif' | 'beklemede',
): Promise<void> {
  await updateDoc(doc(db, 'uyelikler', uyelikId), { uyelikDurumu: yeniDurum });
}

export async function bekleyenDernekleriYukle(): Promise<DernekBasvuru[]> {
  const snap = await getDocs(query(collection(db, 'dernekler'), where('durum', '==', 'onay_bekliyor')));
  return snap.docs.map((d) => {
    const x = d.data() as Record<string, unknown>;
    return {
      id: d.id,
      ad: String(x.ad ?? ''),
      slug: String(x.slug ?? ''),
      ...(typeof x.derbisNo === 'string' && x.derbisNo.trim()
        ? { derbisNo: String(x.derbisNo).trim() }
        : {}),
      durum: String(x.durum ?? ''),
      olusturanUserId: String(x.olusturanUserId ?? ''),
      olusturulmaTarihi: String(x.olusturulmaTarihi ?? ''),
      ...(x.redMesaji ? { redMesaji: String(x.redMesaji) } : {}),
    };
  }).sort((a, b) => a.olusturulmaTarihi.localeCompare(b.olusturulmaTarihi));
}

export async function dernekBasvurusunuOnayla(dernekId: string, onaylayanUid: string): Promise<void> {
  const dRef = doc(db, 'dernekler', dernekId);
  const dSnap = await getDoc(dRef);
  if (!dSnap.exists()) {
    throw new Error('Dernek bulunamadı.');
  }
  const d = dSnap.data() as Record<string, unknown>;
  if (d.durum !== 'onay_bekliyor') {
    throw new Error('Bu başvuru onay beklemiyor.');
  }
  const olusturan = String(d.olusturanUserId ?? '');
  if (!olusturan) {
    throw new Error('Başvuru sahibi bulunamadı.');
  }

  const iso = new Date().toISOString();
  const bugun = iso.split('T')[0];
  const basvuruPaketleri = Array.isArray(d.paketler) ? (d.paketler as FeaturePaketId[]) : [];

  await updateDoc(dRef, {
    durum: 'aktif',
    katilimKodu: '',
    onaylayanUserId: onaylayanUid,
    onayTarihi: iso,
    redMesaji: deleteField(),
    ...(basvuruPaketleri.includes('acikKapali')
      ? {
        dernekDurumu: {
          acik: true,
          mesaj: 'Derneğimize hoş geldiniz.',
          guncellenmeTarihi: iso,
          guncelleyenKullanici: 'Sistem',
        },
      }
      : {}),
    aidatAylikMiktar: AIDAT_VARSAYILAN_MIKTAR,
  });

  const bid = uyelikBelgeId(olusturan, dernekId);
  const uRef = doc(db, 'uyelikler', bid);
  const uSnap = await getDoc(uRef);
  const uyelikVeri = {
    userId: olusturan,
    dernekId,
    rol: 'admin' as const,
    uyelikDurumu: 'aktif' as const,
    uyelikBaslangic: bugun,
    olusturulmaTarihi: iso,
  };
  if (uSnap.exists()) {
    await updateDoc(uRef, uyelikVeri);
  } else {
    await setDoc(uRef, uyelikVeri);
  }
}

export async function dernekBasvurusunuReddet(dernekId: string, mesaj: string, onaylayanUid: string): Promise<void> {
  await updateDoc(doc(db, 'dernekler', dernekId), {
    durum: 'reddedildi',
    redMesaji: mesaj.trim() || 'Başvuru reddedildi.',
    onaylayanUserId: onaylayanUid,
    onayTarihi: new Date().toISOString(),
  });
}
