import {
  addDoc, collection, doc, getDocs, query, updateDoc, where,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { GecikmisAidatKayit, GecikmisOduncKayit, KullaniciBildirimTuru } from '../types';

function bugununTarihStr(): string {
  return new Date().toISOString().split('T')[0];
}

function oduncGecikmisMi(o: { durum?: string; iadeTarihi?: string }): boolean {
  if (o.durum === 'iade_edildi') return false;
  if (o.durum === 'gecikti') return true;
  const bugun = bugununTarihStr();
  return o.durum === 'aktif' && Boolean(o.iadeTarihi && o.iadeTarihi < bugun);
}

function aidatGecikmisMi(a: { odendi?: boolean; sonOdemeTarihi?: string }): boolean {
  if (a.odendi) return false;
  const bugun = bugununTarihStr();
  return Boolean(a.sonOdemeTarihi && a.sonOdemeTarihi < bugun);
}

const AY_ADLARI = ['', 'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

export async function gecikmisOduncleriYukle(dernekId: string): Promise<GecikmisOduncKayit[]> {
  const snap = await getDocs(query(collection(db, 'oduncAlmalar'), where('dernekId', '==', dernekId)));
  return snap.docs
    .map((d) => {
      const x = d.data() as Record<string, unknown>;
      return {
        id: d.id,
        kitapBaslik: String(x.kitapBaslik ?? ''),
        kullaniciId: String(x.kullaniciId ?? ''),
        kullaniciAdi: String(x.kullaniciAdi ?? ''),
        iadeTarihi: String(x.iadeTarihi ?? ''),
        oduncTarihi: String(x.oduncTarihi ?? ''),
        ...(typeof x.sonHatirlatmaTarihi === 'string' ? { sonHatirlatmaTarihi: x.sonHatirlatmaTarihi } : {}),
      };
    })
    .filter(oduncGecikmisMi)
    .sort((a, b) => a.iadeTarihi.localeCompare(b.iadeTarihi));
}

export async function gecikmisAidatlariYukle(dernekId: string): Promise<GecikmisAidatKayit[]> {
  const snap = await getDocs(query(collection(db, 'aidatOdemeleri'), where('dernekId', '==', dernekId)));
  return snap.docs
    .map((d) => {
      const x = d.data() as Record<string, unknown>;
      const kayit: GecikmisAidatKayit & { odendi?: boolean } = {
        id: d.id,
        kullaniciId: String(x.kullaniciId ?? ''),
        kullaniciAdi: String(x.kullaniciAdi ?? ''),
        yil: Number(x.yil ?? 0),
        ay: Number(x.ay ?? 0),
        miktar: Number(x.miktar ?? 0),
        sonOdemeTarihi: String(x.sonOdemeTarihi ?? ''),
        ...(typeof x.sonHatirlatmaTarihi === 'string' ? { sonHatirlatmaTarihi: x.sonHatirlatmaTarihi } : {}),
        odendi: Boolean(x.odendi),
      };
      return kayit;
    })
    .filter((a) => aidatGecikmisMi(a))
    .map(({ odendi: _o, ...kayit }) => kayit)
    .sort((a, b) => `${b.yil}-${b.ay}`.localeCompare(`${a.yil}-${a.ay}`));
}

function oduncBildirimMetni(k: GecikmisOduncKayit) {
  return {
    baslik: 'Kitap iade hatırlatması',
    icerik: `"${k.kitapBaslik}" kitabının son iade tarihi (${k.iadeTarihi}) geçmiştir. Lütfen en kısa sürede iade edin.`,
  };
}

function aidatBildirimMetni(k: GecikmisAidatKayit) {
  const ayAd = AY_ADLARI[k.ay] ?? String(k.ay);
  return {
    baslik: 'Aidat ödeme hatırlatması',
    icerik: `${ayAd} ${k.yil} aidat ödemeniz (${k.miktar} ₺) son ödeme tarihini (${k.sonOdemeTarihi}) geçmiştir. Lütfen dekontunuzu yükleyin.`,
  };
}

export async function hatirlatmaBildirimiGonder(params: {
  dernekId: string;
  tur: KullaniciBildirimTuru;
  kayit: GecikmisOduncKayit | GecikmisAidatKayit;
  adminId: string;
  adminAdi: string;
}): Promise<void> {
  const { dernekId, tur, kayit, adminId, adminAdi } = params;
  const { baslik, icerik } = tur === 'odunc_gecikme'
    ? oduncBildirimMetni(kayit as GecikmisOduncKayit)
    : aidatBildirimMetni(kayit as GecikmisAidatKayit);

  const simdi = new Date().toISOString();
  await addDoc(collection(db, 'kullaniciBildirimleri'), {
    dernekId,
    kullaniciId: kayit.kullaniciId,
    baslik,
    icerik,
    tur,
    ilgiliKayitId: kayit.id,
    olusturulmaTarihi: simdi,
    okundu: false,
    olusturanAdminId: adminId,
    olusturanAdminAdi: adminAdi,
  });

  const koleksiyon = tur === 'odunc_gecikme' ? 'oduncAlmalar' : 'aidatOdemeleri';
  await updateDoc(doc(db, koleksiyon, kayit.id), { sonHatirlatmaTarihi: simdi });
}

export async function topluHatirlatmaGonder(params: {
  dernekId: string;
  tur: KullaniciBildirimTuru;
  kayitlar: (GecikmisOduncKayit | GecikmisAidatKayit)[];
  adminId: string;
  adminAdi: string;
}): Promise<{ basarili: number; hatali: number }> {
  let basarili = 0;
  let hatali = 0;
  for (const kayit of params.kayitlar) {
    try {
      await hatirlatmaBildirimiGonder({
        dernekId: params.dernekId,
        tur: params.tur,
        kayit,
        adminId: params.adminId,
        adminAdi: params.adminAdi,
      });
      basarili += 1;
    } catch {
      hatali += 1;
    }
  }
  return { basarili, hatali };
}
