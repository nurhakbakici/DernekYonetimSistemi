import {
  addDoc, collection, deleteDoc, deleteField, doc, getDocs, query, updateDoc, where,
} from 'firebase/firestore';
import { db } from '../firebase';

function bugunIso() {
  return new Date().toISOString();
}
function bugunTarih() {
  return bugunIso().split('T')[0];
}

function mapDocs<T>(snap: { docs: { id: string; data: () => Record<string, unknown> }[] }, map: (id: string, x: Record<string, unknown>) => T): T[] {
  return snap.docs.map((d) => map(d.id, d.data()));
}

async function tenantQuery(col: string, dernekId: string) {
  return getDocs(query(collection(db, col), where('dernekId', '==', dernekId)));
}

// ── Rezervasyon ─────────────────────────────────────────────────────────────

export interface RezervasyonRow {
  id: string;
  odaAdi: string;
  kullaniciAdi: string;
  tarih: string;
  baslangicSaati: string;
  bitisSaati: string;
  amac: string;
  durum: string;
  olusturulmaTarihi: string;
}

export async function rezervasyonlariYukle(dernekId: string): Promise<RezervasyonRow[]> {
  const snap = await tenantQuery('rezervasyonlar', dernekId);
  return mapDocs(snap, (id, x) => ({
    id,
    odaAdi: String(x.odaAdi ?? ''),
    kullaniciAdi: String(x.kullaniciAdi ?? ''),
    tarih: String(x.tarih ?? ''),
    baslangicSaati: String(x.baslangicSaati ?? ''),
    bitisSaati: String(x.bitisSaati ?? ''),
    amac: String(x.amac ?? ''),
    durum: String(x.durum ?? 'beklemede'),
    olusturulmaTarihi: String(x.olusturulmaTarihi ?? ''),
  })).sort((a, b) => b.olusturulmaTarihi.localeCompare(a.olusturulmaTarihi));
}

export async function rezervasyonDurumGuncelle(id: string, durum: 'onaylandi' | 'iptal' | 'beklemede') {
  await updateDoc(doc(db, 'rezervasyonlar', id), { durum });
}

// ── Burs ───────────────────────────────────────────────────────────────────

export interface BursRow {
  id: string;
  ad: string;
  miktar: number;
  sonBasvuruTarihi: string;
  durum: string;
  saglayanKurum: string;
  aciklama: string;
}

export interface BursBasvuruRow {
  id: string;
  bursId: string;
  bursAdi: string;
  kullaniciAdi: string;
  basvuruTarihi: string;
  durum: string;
  iban?: string;
  bursOdemeDurumu?: string;
  bursOdemeTarihi?: string;
  notlar?: string;
  belgeUri?: string;
  belgelerUri?: Record<string, string>;
}

export async function burslariYukle(dernekId: string): Promise<BursRow[]> {
  const snap = await tenantQuery('burslar', dernekId);
  return mapDocs(snap, (id, x) => ({
    id,
    ad: String(x.ad ?? ''),
    miktar: Number(x.miktar ?? 0),
    sonBasvuruTarihi: String(x.sonBasvuruTarihi ?? ''),
    durum: String(x.durum ?? 'aktif'),
    saglayanKurum: String(x.saglayanKurum ?? ''),
    aciklama: String(x.aciklama ?? ''),
  }));
}

export async function bursBasvurulariniYukle(dernekId: string): Promise<BursBasvuruRow[]> {
  const snap = await tenantQuery('bursBasvurulari', dernekId);
  return mapDocs(snap, (id, x) => ({
    id,
    bursId: String(x.bursId ?? ''),
    bursAdi: String(x.bursAdi ?? ''),
    kullaniciAdi: String(x.kullaniciAdi ?? ''),
    basvuruTarihi: String(x.basvuruTarihi ?? ''),
    durum: String(x.durum ?? 'beklemede'),
    ...(typeof x.iban === 'string' ? { iban: x.iban } : {}),
    ...(typeof x.bursOdemeDurumu === 'string' ? { bursOdemeDurumu: x.bursOdemeDurumu } : {}),
    ...(typeof x.bursOdemeTarihi === 'string' ? { bursOdemeTarihi: x.bursOdemeTarihi } : {}),
    ...(typeof x.notlar === 'string' ? { notlar: x.notlar } : {}),
    ...(typeof x.belgeUri === 'string' ? { belgeUri: x.belgeUri } : {}),
    ...(x.belgelerUri && typeof x.belgelerUri === 'object' ? { belgelerUri: x.belgelerUri as Record<string, string> } : {}),
  })).sort((a, b) => {
    if (a.durum === 'beklemede' && b.durum !== 'beklemede') return -1;
    if (b.durum === 'beklemede' && a.durum !== 'beklemede') return 1;
    return b.basvuruTarihi.localeCompare(a.basvuruTarihi);
  });
}

export async function bursEkle(dernekId: string, veri: {
  ad: string; aciklama: string; miktar: number; saglayanKurum: string;
  sonBasvuruTarihi: string; gereksinimler: string[];
}) {
  await addDoc(collection(db, 'burslar'), {
    ...veri,
    durum: 'aktif',
    olusturulmaTarihi: bugunIso(),
    dernekId,
  });
}

export async function bursSil(id: string) {
  const basSnap = await getDocs(query(collection(db, 'bursBasvurulari'), where('bursId', '==', id)));
  await Promise.all(basSnap.docs.map((d) => deleteDoc(doc(db, 'bursBasvurulari', d.id))));
  await deleteDoc(doc(db, 'burslar', id));
}

export async function bursBasvuruKarar(id: string, durum: 'onaylandi' | 'reddedildi', notlar?: string) {
  const patch: Record<string, unknown> = { durum };
  if (notlar) patch.notlar = notlar;
  if (durum === 'onaylandi') patch.bursOdemeDurumu = 'beklemede';
  await updateDoc(doc(db, 'bursBasvurulari', id), patch);
}

export async function bursOdemeGuncelle(id: string, yatirildi: boolean, iban?: string) {
  if (yatirildi && !iban?.trim()) throw new Error('IBAN kayıtlı olmadan ödeme işaretlenemez.');
  if (yatirildi) {
    await updateDoc(doc(db, 'bursBasvurulari', id), { bursOdemeDurumu: 'yatirildi', bursOdemeTarihi: bugunTarih() });
  } else {
    await updateDoc(doc(db, 'bursBasvurulari', id), { bursOdemeDurumu: 'beklemede', bursOdemeTarihi: deleteField() });
  }
}

// ── Aidat ──────────────────────────────────────────────────────────────────

export interface AidatRow {
  id: string;
  kullaniciId: string;
  kullaniciAdi: string;
  yil: number;
  ay: number;
  miktar: number;
  odendi: boolean;
  sonOdemeTarihi: string;
  dekontUri?: string;
  redAciklamasi?: string;
  odemeTarihi?: string;
}

export async function aidatlariYukle(dernekId: string): Promise<AidatRow[]> {
  const snap = await tenantQuery('aidatOdemeleri', dernekId);
  return mapDocs(snap, (id, x) => ({
    id,
    kullaniciId: String(x.kullaniciId ?? ''),
    kullaniciAdi: String(x.kullaniciAdi ?? ''),
    yil: Number(x.yil ?? 0),
    ay: Number(x.ay ?? 0),
    miktar: Number(x.miktar ?? 0),
    odendi: Boolean(x.odendi),
    sonOdemeTarihi: String(x.sonOdemeTarihi ?? ''),
    ...(typeof x.dekontUri === 'string' ? { dekontUri: x.dekontUri } : {}),
    ...(typeof x.redAciklamasi === 'string' ? { redAciklamasi: x.redAciklamasi } : {}),
    ...(typeof x.odemeTarihi === 'string' ? { odemeTarihi: x.odemeTarihi } : {}),
  })).sort((a, b) => `${b.yil}-${b.ay}`.localeCompare(`${a.yil}-${a.ay}`));
}

export async function aidatOnayla(id: string, adminId: string, adminAdi: string) {
  await updateDoc(doc(db, 'aidatOdemeleri', id), {
    odendi: true,
    odemeTarihi: bugunTarih(),
    onaylayanAdminId: adminId,
    onaylayanAdminAdi: adminAdi,
    redAciklamasi: deleteField(),
  });
}

export async function aidatReddet(id: string, aciklama: string) {
  await updateDoc(doc(db, 'aidatOdemeleri', id), {
    dekontUri: deleteField(),
    dekontYuklenmeTarihi: deleteField(),
    redAciklamasi: aciklama || 'Dekont onaylanmadı.',
  });
}

export async function aidatManuelOde(id: string) {
  await updateDoc(doc(db, 'aidatOdemeleri', id), { odendi: true, odemeTarihi: bugunTarih() });
}

export async function aidatAylikMiktarGuncelle(dernekId: string, miktar: number) {
  await updateDoc(doc(db, 'dernekler', dernekId), { aidatAylikMiktar: miktar });
}

// ── Gönüllülük ─────────────────────────────────────────────────────────────

export interface GonulluGorevRow {
  id: string;
  baslik: string;
  tarih: string;
  kontenjan: number;
  durum: string;
  konum?: string;
}

export interface GonulluBasvuruRow {
  id: string;
  gorevId: string;
  gorevBaslik: string;
  kullaniciAdi: string;
  basvuruTarihi: string;
  durum: string;
}

export async function gonulluGorevleriYukle(dernekId: string): Promise<GonulluGorevRow[]> {
  const snap = await tenantQuery('gonulluGorevler', dernekId);
  return mapDocs(snap, (id, x) => ({
    id,
    baslik: String(x.baslik ?? ''),
    tarih: String(x.tarih ?? ''),
    kontenjan: Number(x.kontenjan ?? 0),
    durum: String(x.durum ?? 'acik'),
    ...(typeof x.konum === 'string' ? { konum: x.konum } : {}),
  }));
}

export async function gonulluBasvurulariniYukle(dernekId: string): Promise<GonulluBasvuruRow[]> {
  const snap = await tenantQuery('gonulluBasvurular', dernekId);
  return mapDocs(snap, (id, x) => ({
    id,
    gorevId: String(x.gorevId ?? ''),
    gorevBaslik: String(x.gorevBaslik ?? ''),
    kullaniciAdi: String(x.kullaniciAdi ?? ''),
    basvuruTarihi: String(x.basvuruTarihi ?? ''),
    durum: String(x.durum ?? 'beklemede'),
  }));
}

export async function gonulluGorevEkle(dernekId: string, adminId: string, adminAdi: string, veri: {
  baslik: string; aciklama: string; tarih: string; kontenjan: number; konum?: string;
}) {
  await addDoc(collection(db, 'gonulluGorevler'), {
    ...veri,
    durum: 'acik',
    olusturanId: adminId,
    olusturanAdi: adminAdi,
    olusturulmaTarihi: bugunIso(),
    dernekId,
  });
}

export async function gonulluGorevSil(id: string) {
  const basSnap = await getDocs(query(collection(db, 'gonulluBasvurular'), where('gorevId', '==', id)));
  await Promise.all(basSnap.docs.map((d) => deleteDoc(doc(db, 'gonulluBasvurular', d.id))));
  await deleteDoc(doc(db, 'gonulluGorevler', id));
}

export async function gonulluBasvuruKarar(id: string, durum: 'onaylandi' | 'reddedildi', gorevId: string, dernekId: string) {
  if (durum === 'onaylandi') {
    const [gSnap, bSnap] = await Promise.all([
      getDocs(query(collection(db, 'gonulluGorevler'), where('dernekId', '==', dernekId))),
      getDocs(query(collection(db, 'gonulluBasvurular'), where('gorevId', '==', gorevId))),
    ]);
    const gorev = gSnap.docs.find((d) => d.id === gorevId)?.data();
    const kontenjan = Number(gorev?.kontenjan ?? 0);
    const onayli = bSnap.docs.filter((d) => d.data().durum === 'onaylandi').length;
    if (onayli >= kontenjan) throw new Error('Kontenjan dolu.');
  }
  await updateDoc(doc(db, 'gonulluBasvurular', id), { durum });
}

// ── Kütüphane ──────────────────────────────────────────────────────────────

export interface KitapRow {
  id: string;
  baslik: string;
  yazar: string;
  kategori: string;
  toplamAdet: number;
  musaitAdet: number;
}

export async function kitaplariYukle(dernekId: string): Promise<KitapRow[]> {
  const snap = await tenantQuery('kitaplar', dernekId);
  return mapDocs(snap, (id, x) => ({
    id,
    baslik: String(x.baslik ?? ''),
    yazar: String(x.yazar ?? ''),
    kategori: String(x.kategori ?? ''),
    toplamAdet: Number(x.toplamAdet ?? 0),
    musaitAdet: Number(x.musaitAdet ?? 0),
  })).sort((a, b) => a.baslik.localeCompare(b.baslik, 'tr'));
}

export async function kitapEkle(dernekId: string, veri: {
  baslik: string; yazar: string; kategori: string; toplamAdet: number; isbn?: string; aciklama?: string;
}) {
  await addDoc(collection(db, 'kitaplar'), {
    ...veri,
    musaitAdet: veri.toplamAdet,
    dernekId,
  });
}

export async function kitapGuncelle(id: string, veri: Partial<{ baslik: string; yazar: string; kategori: string; toplamAdet: number; musaitAdet: number }>) {
  await updateDoc(doc(db, 'kitaplar', id), veri);
}

export async function kitapSil(id: string) {
  await deleteDoc(doc(db, 'kitaplar', id));
}

// ── Odalar ─────────────────────────────────────────────────────────────────

export interface OdaRow {
  id: string;
  ad: string;
  aciklama: string;
  kapasite: number;
  aktif: boolean;
  ozellikler: string[];
}

export async function odalariYukle(dernekId: string): Promise<OdaRow[]> {
  const snap = await tenantQuery('odalar', dernekId);
  return mapDocs(snap, (id, x) => ({
    id,
    ad: String(x.ad ?? ''),
    aciklama: String(x.aciklama ?? ''),
    kapasite: Number(x.kapasite ?? 0),
    aktif: x.aktif !== false,
    ozellikler: Array.isArray(x.ozellikler) ? x.ozellikler.map(String) : [],
  }));
}

export async function odaEkle(dernekId: string, veri: { ad: string; aciklama: string; kapasite: number; ozellikler: string[] }) {
  await addDoc(collection(db, 'odalar'), { ...veri, aktif: true, dernekId });
}

export async function odaGuncelle(id: string, veri: Partial<{ ad: string; aciklama: string; kapasite: number; aktif: boolean; ozellikler: string[] }>) {
  await updateDoc(doc(db, 'odalar', id), veri);
}

// ── Etkinlik ───────────────────────────────────────────────────────────────

export interface EtkinlikRow {
  id: string;
  baslik: string;
  tarih: string;
  konum: string;
  organizator: string;
  durum: string;
  katilimcilar: string[];
}

export async function etkinlikleriYukle(dernekId: string): Promise<EtkinlikRow[]> {
  const snap = await tenantQuery('etkinlikler', dernekId);
  return mapDocs(snap, (id, x) => ({
    id,
    baslik: String(x.baslik ?? ''),
    tarih: String(x.tarih ?? ''),
    konum: String(x.konum ?? ''),
    organizator: String(x.organizator ?? ''),
    durum: String(x.durum ?? 'beklemede'),
    katilimcilar: Array.isArray(x.katilimcilar) ? x.katilimcilar.map(String) : [],
  })).sort((a, b) => b.tarih.localeCompare(a.tarih));
}

export async function etkinlikDurumGuncelle(id: string, durum: 'onaylandi' | 'iptal' | 'beklemede') {
  await updateDoc(doc(db, 'etkinlikler', id), { durum });
}

export async function etkinlikEkle(dernekId: string, adminId: string, adminAdi: string, veri: {
  baslik: string; aciklama: string; tarih: string; konum: string;
}) {
  await addDoc(collection(db, 'etkinlikler'), {
    ...veri,
    organizator: adminAdi,
    organizatorId: adminId,
    durum: 'onaylandi',
    katilimcilar: [],
    olusturulmaTarihi: bugunIso(),
    dernekId,
  });
}

// ── Duyuru ─────────────────────────────────────────────────────────────────

export interface DuyuruRow {
  id: string;
  baslik: string;
  icerik: string;
  olusturulmaTarihi: string;
  olusturanAdi: string;
}

export async function duyurulariYukle(dernekId: string): Promise<DuyuruRow[]> {
  const snap = await tenantQuery('duyurular', dernekId);
  return mapDocs(snap, (id, x) => ({
    id,
    baslik: String(x.baslik ?? ''),
    icerik: String(x.icerik ?? ''),
    olusturulmaTarihi: String(x.olusturulmaTarihi ?? ''),
    olusturanAdi: String(x.olusturanAdi ?? ''),
  })).sort((a, b) => b.olusturulmaTarihi.localeCompare(a.olusturulmaTarihi));
}

export async function duyuruEkle(dernekId: string, adminId: string, adminAdi: string, baslik: string, icerik: string) {
  await addDoc(collection(db, 'duyurular'), {
    baslik,
    icerik,
    olusturanId: adminId,
    olusturanAdi: adminAdi,
    olusturulmaTarihi: bugunIso(),
    dernekId,
  });
}

export async function duyuruGuncelle(id: string, baslik: string, icerik: string) {
  await updateDoc(doc(db, 'duyurular', id), {
    baslik,
    icerik,
    guncellenmeTarihi: bugunIso(),
  });
}

export async function duyuruSil(id: string) {
  await deleteDoc(doc(db, 'duyurular', id));
}

// ── Envanter & zimmet ──────────────────────────────────────────────────────

export interface EnvanterRow {
  id: string;
  ad: string;
  kategori: string;
  aciklama?: string;
  toplamAdet: number;
  musaitAdet: number;
  lokasyon?: string;
  seriNo?: string;
  durum: string;
}

export interface ZimmetRow {
  id: string;
  envanterId: string;
  envanterAd: string;
  kullaniciId: string;
  kullaniciAdi: string;
  zimmetTarihi: string;
  planlananIade?: string;
  gercekIadeTarihi?: string;
  durum: string;
  not?: string;
}

export async function envanterleriYukle(dernekId: string): Promise<EnvanterRow[]> {
  const snap = await tenantQuery('envanterler', dernekId);
  return mapDocs(snap, (id, x) => ({
    id,
    ad: String(x.ad ?? ''),
    kategori: String(x.kategori ?? ''),
    toplamAdet: Number(x.toplamAdet ?? 0),
    musaitAdet: Number(x.musaitAdet ?? 0),
    durum: String(x.durum ?? 'kullanilabilir'),
    ...(typeof x.aciklama === 'string' ? { aciklama: x.aciklama } : {}),
    ...(typeof x.lokasyon === 'string' ? { lokasyon: x.lokasyon } : {}),
    ...(typeof x.seriNo === 'string' ? { seriNo: x.seriNo } : {}),
  })).sort((a, b) => a.ad.localeCompare(b.ad, 'tr'));
}

export async function zimmetleriYukle(dernekId: string): Promise<ZimmetRow[]> {
  const snap = await tenantQuery('envanterZimmetler', dernekId);
  return mapDocs(snap, (id, x) => ({
    id,
    envanterId: String(x.envanterId ?? ''),
    envanterAd: String(x.envanterAd ?? ''),
    kullaniciId: String(x.kullaniciId ?? ''),
    kullaniciAdi: String(x.kullaniciAdi ?? ''),
    zimmetTarihi: String(x.zimmetTarihi ?? ''),
    durum: String(x.durum ?? 'aktif'),
    ...(typeof x.planlananIade === 'string' ? { planlananIade: x.planlananIade } : {}),
    ...(typeof x.gercekIadeTarihi === 'string' ? { gercekIadeTarihi: x.gercekIadeTarihi } : {}),
    ...(typeof x.not === 'string' ? { not: x.not } : {}),
  })).sort((a, b) => b.zimmetTarihi.localeCompare(a.zimmetTarihi));
}

export async function envanterEkle(dernekId: string, veri: {
  ad: string; kategori: string; toplamAdet: number; lokasyon?: string; aciklama?: string; durum?: string;
}) {
  const adet = veri.toplamAdet;
  await addDoc(collection(db, 'envanterler'), {
    ad: veri.ad,
    kategori: veri.kategori,
    toplamAdet: adet,
    musaitAdet: adet,
    durum: veri.durum ?? 'kullanilabilir',
    olusturulmaTarihi: bugunTarih(),
    ...(veri.lokasyon ? { lokasyon: veri.lokasyon } : {}),
    ...(veri.aciklama ? { aciklama: veri.aciklama } : {}),
    dernekId,
  });
}

export async function envanterGuncelle(id: string, veri: Partial<{
  ad: string; kategori: string; toplamAdet: number; musaitAdet: number; lokasyon: string; durum: string;
}>) {
  await updateDoc(doc(db, 'envanterler', id), veri);
}

export async function envanterSil(id: string, dernekId: string) {
  const zSnap = await getDocs(query(collection(db, 'envanterZimmetler'), where('dernekId', '==', dernekId), where('envanterId', '==', id)));
  const aktif = zSnap.docs.some((d) => d.data().durum === 'aktif');
  if (aktif) throw new Error('Aktif zimmeti olan demirbaş silinemez.');
  await Promise.all(zSnap.docs.map((d) => deleteDoc(doc(db, 'envanterZimmetler', d.id))));
  await deleteDoc(doc(db, 'envanterler', id));
}

export async function zimmetVer(dernekId: string, params: {
  envanterId: string;
  envanterAd: string;
  kullaniciId: string;
  kullaniciAdi: string;
  planlananIade?: string;
  not?: string;
}) {
  const envSnap = await getDocs(query(collection(db, 'envanterler'), where('dernekId', '==', dernekId)));
  const envDoc = envSnap.docs.find((d) => d.id === params.envanterId);
  if (!envDoc) throw new Error('Demirbaş bulunamadı.');
  const env = envDoc.data();
  const musait = Number(env.musaitAdet ?? 0);
  if (musait < 1) throw new Error('Stokta müsait adet yok.');
  if (env.durum === 'arizali') throw new Error('Arızalı demirbaş zimmetlenemez.');

  await addDoc(collection(db, 'envanterZimmetler'), {
    envanterId: params.envanterId,
    envanterAd: params.envanterAd,
    kullaniciId: params.kullaniciId,
    kullaniciAdi: params.kullaniciAdi,
    zimmetTarihi: bugunTarih(),
    durum: 'aktif',
    dernekId,
    ...(params.planlananIade ? { planlananIade: params.planlananIade } : {}),
    ...(params.not ? { not: params.not } : {}),
  });
  await updateDoc(doc(db, 'envanterler', params.envanterId), { musaitAdet: musait - 1 });
}

export async function zimmetIade(zimmetId: string, envanterId: string, dernekId: string) {
  const envSnap = await getDocs(query(collection(db, 'envanterler'), where('dernekId', '==', dernekId)));
  const envDoc = envSnap.docs.find((d) => d.id === envanterId);
  if (!envDoc) throw new Error('Demirbaş bulunamadı.');
  const env = envDoc.data();
  const toplam = Number(env.toplamAdet ?? 0);
  const musait = Number(env.musaitAdet ?? 0);
  const yeniMusait = Math.min(toplam, musait + 1);

  await updateDoc(doc(db, 'envanterZimmetler', zimmetId), {
    durum: 'iade_edildi',
    gercekIadeTarihi: bugunTarih(),
  });
  await updateDoc(doc(db, 'envanterler', envanterId), { musaitAdet: yeniMusait });
}
