import {
  collection, getDocs, query, where,
} from 'firebase/firestore';
import { db } from '../firebase';
import { dernekPaketAktif } from '../utils/paketler';
import type { AylikVeri, DashboardStats, FeaturePaketId } from '../types';

function sonNAy(n: number): string[] {
  const result: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push(d.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' }));
  }
  return result;
}

function ayEtiketi(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' });
}

function zeroBuckets(labels: string[]): Map<string, number> {
  const m = new Map<string, number>();
  labels.forEach((l) => m.set(l, 0));
  return m;
}

function bosSnap() {
  return { docs: [] as { data: () => Record<string, unknown> }[], size: 0 };
}

export async function dernekIstatistikleriYukle(
  dernekId: string,
  paketler: FeaturePaketId[] = [],
): Promise<DashboardStats> {
  const p = (id: FeaturePaketId) => dernekPaketAktif(paketler, id);

  const [
    uyelikSnap,
    rezSnap,
    etkSnap,
    bursSnap,
    aidatSnap,
    oduncSnap,
    gonulluGorevSnap,
    gonulluBasvuruSnap,
    envanterSnap,
    zimmetSnap,
  ] = await Promise.all([
    p('uyelik')
      ? getDocs(query(collection(db, 'uyelikler'), where('dernekId', '==', dernekId)))
      : Promise.resolve(bosSnap()),
    p('odalar')
      ? getDocs(query(collection(db, 'rezervasyonlar'), where('dernekId', '==', dernekId)))
      : Promise.resolve(bosSnap()),
    p('etkinlikler')
      ? getDocs(query(collection(db, 'etkinlikler'), where('dernekId', '==', dernekId)))
      : Promise.resolve(bosSnap()),
    p('burslar')
      ? getDocs(query(collection(db, 'bursBasvurulari'), where('dernekId', '==', dernekId)))
      : Promise.resolve(bosSnap()),
    p('aidat')
      ? getDocs(query(collection(db, 'aidatOdemeleri'), where('dernekId', '==', dernekId)))
      : Promise.resolve(bosSnap()),
    p('kutuphane')
      ? getDocs(query(collection(db, 'oduncAlmalar'), where('dernekId', '==', dernekId)))
      : Promise.resolve(bosSnap()),
    p('gonulluluk')
      ? getDocs(query(collection(db, 'gonulluGorevler'), where('dernekId', '==', dernekId)))
      : Promise.resolve(bosSnap()),
    p('gonulluluk')
      ? getDocs(query(collection(db, 'gonulluBasvurular'), where('dernekId', '==', dernekId)))
      : Promise.resolve(bosSnap()),
    p('envanter')
      ? getDocs(query(collection(db, 'envanterler'), where('dernekId', '==', dernekId)))
      : Promise.resolve(bosSnap()),
    p('envanter')
      ? getDocs(query(collection(db, 'envanterZimmetler'), where('dernekId', '==', dernekId)))
      : Promise.resolve(bosSnap()),
  ]);

  const labels6 = sonNAy(6);

  let aktifUye = 0;
  let adayBekleyen = 0;
  let pasifUye = 0;
  const durumSayac: Record<string, number> = { aktif: 0, beklemede: 0, pasif: 0 };
  const yeniUyeBuckets = zeroBuckets(labels6);

  if (p('uyelik')) {
    uyelikSnap.docs.forEach((d) => {
      const x = d.data() as { rol?: string; uyelikDurumu?: string; olusturulmaTarihi?: string; uyelikBaslangic?: string };
      const durum = x.uyelikDurumu === 'aktif' || x.uyelikDurumu === 'pasif' || x.uyelikDurumu === 'beklemede'
        ? x.uyelikDurumu : 'beklemede';
      durumSayac[durum] = (durumSayac[durum] ?? 0) + 1;
      if (x.rol === 'aday' || durum === 'beklemede') adayBekleyen += 1;
      else if (durum === 'aktif') aktifUye += 1;
      else if (durum === 'pasif') pasifUye += 1;

      const t = x.olusturulmaTarihi ?? x.uyelikBaslangic ?? '';
      if (t) {
        const ay = ayEtiketi(t);
        if (yeniUyeBuckets.has(ay)) yeniUyeBuckets.set(ay, (yeniUyeBuckets.get(ay) ?? 0) + 1);
      }
    });
  }

  const uyelikDurumDagilim = [
    { ad: 'Aktif', deger: durumSayac.aktif ?? 0 },
    { ad: 'Onay bekliyor', deger: durumSayac.beklemede ?? 0 },
    { ad: 'Pasif', deger: durumSayac.pasif ?? 0 },
  ].filter((x) => x.deger > 0);

  const aylikYeniUye: AylikVeri[] = labels6.map((ay) => ({ ay, deger: yeniUyeBuckets.get(ay) ?? 0 }));

  const rezDurum: Record<string, number> = {};
  let bekleyenRezervasyon = 0;
  const rezBuckets = zeroBuckets(labels6);

  if (p('odalar')) {
    rezSnap.docs.forEach((d) => {
      const x = d.data() as { durum?: string; olusturulmaTarihi?: string; tarih?: string };
      const durum = x.durum ?? 'beklemede';
      rezDurum[durum] = (rezDurum[durum] ?? 0) + 1;
      if (durum === 'beklemede') bekleyenRezervasyon += 1;
      const t = x.olusturulmaTarihi ?? x.tarih ?? '';
      if (t) {
        const ay = ayEtiketi(t);
        if (rezBuckets.has(ay)) rezBuckets.set(ay, (rezBuckets.get(ay) ?? 0) + 1);
      }
    });
  }

  const rezervasyonDurumDagilim = Object.entries(rezDurum).map(([k, v]) => ({
    ad: k === 'onaylandi' ? 'Onaylı' : k === 'beklemede' ? 'Beklemede' : k === 'iptal' ? 'İptal' : k,
    deger: v,
  }));

  const aylikRezervasyon: AylikVeri[] = labels6.map((ay) => ({ ay, deger: rezBuckets.get(ay) ?? 0 }));

  let onayliEtkinlik = 0;
  let yaklasanEtkinlik = 0;
  const simdi = new Date();

  if (p('etkinlikler')) {
    etkSnap.docs.forEach((d) => {
      const x = d.data() as { durum?: string; tarih?: string; baslangicTarihi?: string };
      if (x.durum === 'onaylandi') onayliEtkinlik += 1;
      const t = x.tarih ?? x.baslangicTarihi ?? '';
      if (t && new Date(t) > simdi) yaklasanEtkinlik += 1;
    });
  }

  let bekleyenBurs = 0;
  let onaylanmisBurs = 0;
  let reddedilenBurs = 0;
  let bursOdenmisOdeme = 0;
  let bursBekleyenOdeme = 0;
  const bursDurum: Record<string, number> = {};
  const bursBuckets = zeroBuckets(labels6);

  if (p('burslar')) {
    bursSnap.docs.forEach((d) => {
      const x = d.data() as {
        durum?: string;
        basvuruTarihi?: string;
        olusturulmaTarihi?: string;
        bursOdemeDurumu?: string;
      };
      const durum = x.durum ?? 'beklemede';
      bursDurum[durum] = (bursDurum[durum] ?? 0) + 1;
      if (durum === 'beklemede') bekleyenBurs += 1;
      else if (durum === 'onaylandi') {
        onaylanmisBurs += 1;
        if (x.bursOdemeDurumu === 'yatirildi') bursOdenmisOdeme += 1;
        else bursBekleyenOdeme += 1;
      } else if (durum === 'reddedildi') reddedilenBurs += 1;

      const t = x.basvuruTarihi ?? x.olusturulmaTarihi ?? '';
      if (t) {
        const ay = ayEtiketi(t);
        if (bursBuckets.has(ay)) bursBuckets.set(ay, (bursBuckets.get(ay) ?? 0) + 1);
      }
    });
  }

  const bursDurumDagilim = [
    { ad: 'Onaylı', deger: bursDurum.onaylandi ?? 0 },
    { ad: 'Beklemede', deger: bursDurum.beklemede ?? 0 },
    { ad: 'Reddedildi', deger: bursDurum.reddedildi ?? 0 },
  ].filter((x) => x.deger > 0);

  const bursOdemeDagilim = [
    { ad: 'Ödeme yapıldı', deger: bursOdenmisOdeme },
    { ad: 'Ödeme bekliyor', deger: bursBekleyenOdeme },
  ].filter((x) => x.deger > 0);

  const aylikBursBasvuru: AylikVeri[] = labels6.map((ay) => ({ ay, deger: bursBuckets.get(ay) ?? 0 }));

  let odenmisAidat = 0;
  let odenmemisAidat = 0;
  const aidatBuckets = zeroBuckets(labels6);

  if (p('aidat')) {
    aidatSnap.docs.forEach((d) => {
      const x = d.data() as { odendi?: boolean; odemeTarihi?: string; olusturulmaTarihi?: string; ay?: string };
      if (x.odendi) {
        odenmisAidat += 1;
        const t = x.odemeTarihi ?? x.olusturulmaTarihi ?? x.ay ?? '';
        if (t) {
          const ay = ayEtiketi(t);
          if (aidatBuckets.has(ay)) aidatBuckets.set(ay, (aidatBuckets.get(ay) ?? 0) + 1);
        }
      } else {
        odenmemisAidat += 1;
      }
    });
  }

  const toplamAidat = odenmisAidat + odenmemisAidat;
  const aidatOdemeOrani = toplamAidat > 0 ? Math.round((odenmisAidat / toplamAidat) * 100) : 0;
  const aylikAidat: AylikVeri[] = labels6.map((ay) => ({ ay, deger: aidatBuckets.get(ay) ?? 0 }));

  let aktifOdunc = 0;
  let gecikliOdunc = 0;

  if (p('kutuphane')) {
    oduncSnap.docs.forEach((d) => {
      const x = d.data() as { durum?: string };
      if (x.durum === 'gecikti') gecikliOdunc += 1;
      else if (x.durum === 'aktif') aktifOdunc += 1;
    });
  }

  let acikGonulluGorev = 0;
  let bekleyenGonulluBasvuru = 0;
  if (p('gonulluluk')) {
    gonulluGorevSnap.docs.forEach((d) => {
      const x = d.data() as { durum?: string };
      if (x.durum === 'acik') acikGonulluGorev += 1;
    });
    gonulluBasvuruSnap.docs.forEach((d) => {
      const x = d.data() as { durum?: string };
      if (x.durum === 'beklemede') bekleyenGonulluBasvuru += 1;
    });
  }

  let aktifZimmet = 0;
  if (p('envanter')) {
    zimmetSnap.docs.forEach((d) => {
      const x = d.data() as { durum?: string };
      if (x.durum === 'aktif') aktifZimmet += 1;
    });
  }

  return {
    toplamUyelik: uyelikSnap.size,
    aktifUye,
    adayBekleyen,
    pasifUye,
    uyelikDurumDagilim,
    aylikYeniUye,

    bekleyenRezervasyon,
    toplamRezervasyon: rezSnap.size,
    rezervasyonDurumDagilim,
    aylikRezervasyon,

    onayliEtkinlik,
    toplamEtkinlik: etkSnap.size,
    yaklasanEtkinlik,

    bekleyenBurs,
    onaylanmisBurs,
    reddedilenBurs,
    toplamBursBasvuru: bursSnap.size,
    bursDurumDagilim,
    aylikBursBasvuru,
    bursOdenmisOdeme,
    bursBekleyenOdeme,
    bursOdemeDagilim,

    odenmemisAidat,
    odenmisAidat,
    aidatOdemeOrani,
    aylikAidat,

    aktifOdunc,
    gecikliOdunc,
    toplamOdunc: oduncSnap.size,

    acikGonulluGorev,
    bekleyenGonulluBasvuru,
    toplamGonulluGorev: gonulluGorevSnap.size,

    aktifZimmet,
    toplamEnvanter: envanterSnap.size,
  };
}
