import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, setDoc, query, where, orderBy, getDoc, deleteField, writeBatch,
} from 'firebase/firestore';
import {
  Oda, Rezervasyon, Kitap, OduncAlma, Burs, BursBasvurusu,
  Etkinlik, EtkinlikDetayAlanlari, EtkinlikGorselSecenek, DernekDurumu, AidatOdemesi, User, Duyuru, DuyuruGorselSecenek,
} from '../types';
import { normalizeUserRole } from '../utils/userAccess';
import { db, IS_FIREBASE_CONFIGURED } from '../config/firebase';
import * as FileSystem from 'expo-file-system/legacy';
import { getItem, setItem, KEYS } from '../config/storage';
import { AIDAT_VARSAYILAN_MIKTAR } from '../constants/aidat';
import { aylarBaslangictanSimdiye, aySonOdemeTarihi } from '../utils/aidatAylik';
import { yerelGorseliDataUriye } from '../utils/gorselDataUri';
import { oduncGecikmeDegisenler, oduncKayitlarindaGecikmeleriIsle } from '../utils/oduncGecikme';
import { ibanGecerliTr, ibanNormalizeTr } from '../utils/iban';

// ─── Firestore yardımcıları ────────────────────────────────────────────────────

async function fsGetAll<T>(col: string): Promise<T[]> {
  const snap = await getDocs(collection(db, col));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as T));
}

async function fsAdd<T extends { id?: string }>(col: string, data: Omit<T, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, col), data);
  return ref.id;
}

async function fsSet(col: string, id: string, data: object) {
  await setDoc(doc(db, col, id), data);
}

async function fsUpdate(col: string, id: string, data: object) {
  await updateDoc(doc(db, col, id), data);
}

async function fsDelete(col: string, id: string) {
  await deleteDoc(doc(db, col, id));
}

function normalizeOdendi(v: unknown): boolean {
  if (v === true || v === 'true' || v === 1) return true;
  if (v === false || v === 'false' || v === 0) return false;
  return false;
}

function normalizeAidatDoc(a: AidatOdemesi): AidatOdemesi {
  const ay = typeof a.ay === 'number' && a.ay >= 1 && a.ay <= 12 ? a.ay : 1;
  return { ...a, ay, odendi: normalizeOdendi((a as { odendi?: unknown }).odendi) };
}

/** Aynı id iki kez gelirse (yerel id çakışması / yarış) liste key uyarılarını önler. */
function dedupeByIdKeepFirst<T extends { id: string }>(arr: T[]): T[] {
  const seen = new Set<string>();
  return arr.filter((x) => {
    if (seen.has(x.id)) return false;
    seen.add(x.id);
    return true;
  });
}

function firestoreTemiz<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

function uygulaEtkinlikDetayPatch(
  e: Etkinlik,
  veri: EtkinlikDetayAlanlari,
  yeniGorsel: undefined | 'kaldir' | string,
): Etkinlik {
  let next: Etkinlik = { ...e };
  if (veri.baslik !== undefined) next = { ...next, baslik: veri.baslik };
  if (veri.aciklama !== undefined) next = { ...next, aciklama: veri.aciklama };
  if (veri.tarih !== undefined) next = { ...next, tarih: veri.tarih };
  if (veri.konum !== undefined) next = { ...next, konum: veri.konum };
  if ('bitisTarihi' in veri) {
    if (veri.bitisTarihi == null || veri.bitisTarihi === '') {
      const { bitisTarihi: _b, ...rest } = next;
      next = rest as Etkinlik;
    } else {
      next = { ...next, bitisTarihi: veri.bitisTarihi };
    }
  }
  if ('maxKatilimci' in veri) {
    if (veri.maxKatilimci == null) {
      const { maxKatilimci: _m, ...rest } = next;
      next = rest as Etkinlik;
    } else {
      next = { ...next, maxKatilimci: veri.maxKatilimci };
    }
  }
  if (yeniGorsel === 'kaldir') {
    const { gorselUri: _g, ...rest } = next;
    next = rest as Etkinlik;
  } else if (typeof yeniGorsel === 'string') {
    next = { ...next, gorselUri: yeniGorsel };
  }
  return next;
}

type DuyuruGorselKayitSonuc = { dataUri: string };

/**
 * Gorseli 480 px genislige kucultup JPEG q=0.45 ile base64 data URI uretir.
 * Firebase Storage kullanmaz -- veri gorselUri olarak Firestore dokumana yazilir.
 */
async function duyuruGorseliKaydet(yerelUri: string): Promise<DuyuruGorselKayitSonuc> {
  const dataUri = await yerelGorseliDataUriye(yerelUri);
  return { dataUri };
}

// ─── Context tipi ─────────────────────────────────────────────────────────────

interface DataContextType {
  odalar: Oda[];
  odaYukle: () => Promise<void>;
  odaEkle: (oda: Omit<Oda, 'id'>) => Promise<void>;
  odaGuncelle: (id: string, oda: Partial<Oda>) => Promise<void>;

  rezervasyonlar: Rezervasyon[];
  rezervasyonYukle: () => Promise<void>;
  rezervasyonEkle: (rez: Omit<Rezervasyon, 'id' | 'olusturulmaTarihi'>) => Promise<void>;
  rezervasyonGuncelle: (id: string, durum: Rezervasyon['durum']) => Promise<void>;
  rezervasyonSil: (id: string) => Promise<void>;

  kitaplar: Kitap[];
  kitapYukle: () => Promise<void>;
  kitapEkle: (kitap: Omit<Kitap, 'id'>) => Promise<void>;
  kitapGuncelle: (id: string, kitap: Partial<Kitap>) => Promise<void>;
  kitapSil: (id: string) => Promise<void>;

  oduncAlmalar: OduncAlma[];
  oduncYukle: () => Promise<void>;
  oduncAl: (kitapId: string, kullaniciId: string, kullaniciAdi: string) => Promise<void>;
  oduncIadeEt: (oduncId: string, kitapId: string) => Promise<void>;

  burslar: Burs[];
  bursYukle: () => Promise<void>;
  bursEkle: (burs: Omit<Burs, 'id' | 'olusturulmaTarihi'>) => Promise<void>;
  bursGuncelle: (id: string, burs: Partial<Burs>) => Promise<void>;
  /** Burs programını ve bu bursa ait tüm başvuruları siler (yönetici). */
  bursSil: (id: string) => Promise<void>;

  bursBasvurulari: BursBasvurusu[];
  bursBasvuruYukle: () => Promise<void>;
  bursBasvur: (
    bursId: string,
    bursAdi: string,
    kullaniciId: string,
    kullaniciAdi: string,
    secenek: { belgelerYerel: Record<string, string> },
  ) => Promise<void>;
  bursBasvuruGuncelle: (id: string, durum: BursBasvurusu['durum'], notlar?: string) => Promise<void>;
  /** Onaylı başvuruda burs tutarının yatırıldığını işaretle / geri al */
  bursBasvuruOdemeGuncelle: (id: string, yatirildi: boolean) => Promise<void>;
  /** Onay sonrası başvuran IBAN kaydı (yalnızca başvuru sahibi) */
  bursBasvuruIbanKaydet: (basvuruId: string, kullaniciId: string, ibanHam: string) => Promise<void>;

  etkinlikler: Etkinlik[];
  etkinlikYukle: () => Promise<void>;
  etkinlikEkle: (
    etkinlik: Omit<Etkinlik, 'id' | 'olusturulmaTarihi' | 'katilimcilar' | 'durum'>,
    secenek?: { gorselYerelUri?: string; baslangicDurumu?: 'beklemede' | 'onaylandi' },
  ) => Promise<void>;
  etkinlikGuncelle: (id: string, durum: Etkinlik['durum']) => Promise<void>;
  /** Yönetici: onaylı veya beklemedeki etkinliğin metin/tarih/görsel alanlarını günceller */
  etkinlikDetayGuncelle: (
    id: string,
    veri: EtkinlikDetayAlanlari,
    gorsel?: EtkinlikGorselSecenek,
  ) => Promise<void>;
  etkinlikKatil: (id: string, kullaniciId: string) => Promise<void>;
  etkinlikAyril: (id: string, kullaniciId: string) => Promise<void>;

  dernekDurumu: DernekDurumu | null;
  dernekDurumuYukle: () => Promise<void>;
  dernekDurumuGuncelle: (acik: boolean, mesaj: string, guncelleyenKullanici: string) => Promise<void>;

  duyurular: Duyuru[];
  duyuruYukle: () => Promise<void>;
  /** İsteğe bağlı yerel görsel URI’si; kayıt sonrası yüklenir. */
  duyuruEkle: (duyuru: Omit<Duyuru, 'id'>, gorselYerelUri?: string) => Promise<void>;
  duyuruGuncelle: (
    id: string,
    veri: Partial<Pick<Duyuru, 'baslik' | 'icerik'>>,
    gorsel?: DuyuruGorselSecenek,
  ) => Promise<void>;
  duyuruSil: (id: string) => Promise<void>;

  aidatOdemeleri: AidatOdemesi[];
  aidatYukle: () => Promise<void>;
  aidatEkle: (aidat: Omit<AidatOdemesi, 'id'>) => Promise<string>;
  /** Kısmi güncelleme (dekont, onay, red) */
  aidatGuncelle: (id: string, veri: Partial<AidatOdemesi>) => Promise<void>;
  /** Yönetici dekontu onaylar */
  aidatOnayla: (id: string, adminId: string, adminAdi: string) => Promise<void>;
  /** Yönetici dekontu reddeder; üye yeniden yükleyebilir */
  aidatReddet: (id: string, aciklama: string) => Promise<void>;
  /** Eski: doğrudan ödendi (dekont dışı); yönetici manuel işaret */
  aidatOde: (id: string) => Promise<void>;

  /** Dernek aylık aidat tutarı (kayıtsız aylar ve varsayılan) */
  aidatAylikMiktari: number;
  aidatAylikMiktariYukle: () => Promise<number>;
  aidatAylikMiktariGuncelle: (miktar: number) => Promise<void>;

  kullanicilar: User[];
  kullaniciYukle: () => Promise<void>;
  kullaniciGuncelle: (id: string, veri: Partial<User>) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function DataProvider({ children }: { children: ReactNode }) {
  const [odalar, setOdalar] = useState<Oda[]>([]);
  const [rezervasyonlar, setRezervasyanlar] = useState<Rezervasyon[]>([]);
  const [kitaplar, setKitaplar] = useState<Kitap[]>([]);
  const [oduncAlmalar, setOduncAlmalar] = useState<OduncAlma[]>([]);
  const [burslar, setBurslar] = useState<Burs[]>([]);
  const [bursBasvurulari, setBursBasvurulari] = useState<BursBasvurusu[]>([]);
  const [etkinlikler, setEtkinlikler] = useState<Etkinlik[]>([]);
  const etkinliklerRef = useRef<Etkinlik[]>([]);
  etkinliklerRef.current = etkinlikler;
  const [dernekDurumu, setDernekDurumu] = useState<DernekDurumu | null>(null);
  const [duyurular, setDuyurular] = useState<Duyuru[]>([]);
  const duyurularRef = useRef<Duyuru[]>([]);
  duyurularRef.current = duyurular;
  const [aidatOdemeleri, setAidatOdemeleri] = useState<AidatOdemesi[]>([]);
  const [aidatAylikMiktari, setAidatAylikMiktari] = useState(AIDAT_VARSAYILAN_MIKTAR);
  const [kullanicilar, setKullanicilar] = useState<User[]>([]);

  // ── Genel yükle/kaydet yardımcıları ────────────────────────────────────────

  async function yukle<T>(fsCol: string, localKey: string, setter: (v: T[]) => void) {
    if (IS_FIREBASE_CONFIGURED) {
      const data = await fsGetAll<T>(fsCol);
      setter(data);
    } else {
      const data = await getItem<T[]>(localKey);
      setter(data || []);
    }
  }

  // ── Odalar ─────────────────────────────────────────────────────────────────

  const odaYukle = useCallback(() => yukle<Oda>('odalar', KEYS.ODALAR, setOdalar), []);

  const odaEkle = useCallback(async (oda: Omit<Oda, 'id'>) => {
    if (IS_FIREBASE_CONFIGURED) {
      const id = await fsAdd('odalar', oda);
      setOdalar(prev => [...prev, { ...oda, id }]);
    } else {
      const yeni: Oda = { ...oda, id: `oda-${Date.now()}` };
      const guncel = [...odalar, yeni];
      await setItem(KEYS.ODALAR, guncel);
      setOdalar(guncel);
    }
  }, [odalar]);

  const odaGuncelle = useCallback(async (id: string, veri: Partial<Oda>) => {
    if (IS_FIREBASE_CONFIGURED) {
      await fsUpdate('odalar', id, veri);
    }
    const guncel = odalar.map(o => o.id === id ? { ...o, ...veri } : o);
    if (!IS_FIREBASE_CONFIGURED) await setItem(KEYS.ODALAR, guncel);
    setOdalar(guncel);
  }, [odalar]);

  // ── Rezervasyonlar ─────────────────────────────────────────────────────────

  const rezervasyonYukle = useCallback(() => yukle<Rezervasyon>('rezervasyonlar', KEYS.REZERVASYONLAR, setRezervasyanlar), []);

  const rezervasyonEkle = useCallback(async (rez: Omit<Rezervasyon, 'id' | 'olusturulmaTarihi'>) => {
    const data = { ...rez, olusturulmaTarihi: new Date().toISOString() };
    if (IS_FIREBASE_CONFIGURED) {
      const id = await fsAdd('rezervasyonlar', data);
      setRezervasyanlar(prev => [...prev, { ...data, id }]);
    } else {
      const yeni: Rezervasyon = { ...data, id: `rez-${Date.now()}` };
      const guncel = [...rezervasyonlar, yeni];
      await setItem(KEYS.REZERVASYONLAR, guncel);
      setRezervasyanlar(guncel);
    }
  }, [rezervasyonlar]);

  const rezervasyonGuncelle = useCallback(async (id: string, durum: Rezervasyon['durum']) => {
    if (IS_FIREBASE_CONFIGURED) await fsUpdate('rezervasyonlar', id, { durum });
    const guncel = rezervasyonlar.map(r => r.id === id ? { ...r, durum } : r);
    if (!IS_FIREBASE_CONFIGURED) await setItem(KEYS.REZERVASYONLAR, guncel);
    setRezervasyanlar(guncel);
  }, [rezervasyonlar]);

  const rezervasyonSil = useCallback(async (id: string) => {
    if (IS_FIREBASE_CONFIGURED) await fsDelete('rezervasyonlar', id);
    const guncel = rezervasyonlar.filter(r => r.id !== id);
    if (!IS_FIREBASE_CONFIGURED) await setItem(KEYS.REZERVASYONLAR, guncel);
    setRezervasyanlar(guncel);
  }, [rezervasyonlar]);

  // ── Kitaplar ───────────────────────────────────────────────────────────────

  const kitapYukle = useCallback(() => yukle<Kitap>('kitaplar', KEYS.KITAPLAR, setKitaplar), []);

  const kitapEkle = useCallback(async (kitap: Omit<Kitap, 'id'>) => {
    if (IS_FIREBASE_CONFIGURED) {
      const id = await fsAdd('kitaplar', kitap);
      setKitaplar(prev => [...prev, { ...kitap, id }]);
    } else {
      const yeni: Kitap = { ...kitap, id: `kitap-${Date.now()}` };
      const guncel = [...kitaplar, yeni];
      await setItem(KEYS.KITAPLAR, guncel);
      setKitaplar(guncel);
    }
  }, [kitaplar]);

  const kitapGuncelle = useCallback(async (id: string, veri: Partial<Kitap>) => {
    if (IS_FIREBASE_CONFIGURED) await fsUpdate('kitaplar', id, veri);
    const guncel = kitaplar.map(k => k.id === id ? { ...k, ...veri } : k);
    if (!IS_FIREBASE_CONFIGURED) await setItem(KEYS.KITAPLAR, guncel);
    setKitaplar(guncel);
  }, [kitaplar]);

  const kitapSil = useCallback(async (id: string) => {
    if (IS_FIREBASE_CONFIGURED) await fsDelete('kitaplar', id);
    const guncel = kitaplar.filter(k => k.id !== id);
    if (!IS_FIREBASE_CONFIGURED) await setItem(KEYS.KITAPLAR, guncel);
    setKitaplar(guncel);
  }, [kitaplar]);

  // ── Ödünç Almalar ──────────────────────────────────────────────────────────

  const oduncYukle = useCallback(async () => {
    let raw: OduncAlma[];
    if (IS_FIREBASE_CONFIGURED) {
      raw = await fsGetAll<OduncAlma>('oduncAlmalar');
    } else {
      raw = (await getItem<OduncAlma[]>(KEYS.ODUNC_ALMALAR)) || [];
    }
    const merged = oduncKayitlarindaGecikmeleriIsle(raw);
    const degisenler = oduncGecikmeDegisenler(raw, merged);
    if (degisenler.length > 0) {
      if (IS_FIREBASE_CONFIGURED) {
        await Promise.all(degisenler.map(o => fsUpdate('oduncAlmalar', o.id, { durum: o.durum })));
      } else {
        await setItem(KEYS.ODUNC_ALMALAR, merged);
      }
    }
    setOduncAlmalar(merged);
  }, []);

  const oduncAl = useCallback(async (kitapId: string, kullaniciId: string, kullaniciAdi: string) => {
    const kitap = kitaplar.find(k => k.id === kitapId);
    if (!kitap || kitap.musaitAdet <= 0) throw new Error('Bu kitap şu anda mevcut değil.');

    const zatenOdunc = oduncAlmalar.some(
      o =>
        o.kitapId === kitapId &&
        o.kullaniciId === kullaniciId &&
        (o.durum === 'aktif' || o.durum === 'gecikti'),
    );
    if (zatenOdunc) {
      throw new Error('Bu kitap için zaten aktif bir ödünç kaydınız var. Önce iade edin.');
    }

    const iadeTarihi = new Date();
    iadeTarihi.setDate(iadeTarihi.getDate() + 14);

    const oduncData = {
      kitapId, kitapBaslik: kitap.baslik, kullaniciId, kullaniciAdi,
      oduncTarihi: new Date().toISOString().split('T')[0],
      iadeTarihi: iadeTarihi.toISOString().split('T')[0],
      durum: 'aktif' as const,
    };

    if (IS_FIREBASE_CONFIGURED) {
      const id = await fsAdd('oduncAlmalar', oduncData);
      setOduncAlmalar(prev => [...prev, { ...oduncData, id }]);
      await fsUpdate('kitaplar', kitapId, { musaitAdet: kitap.musaitAdet - 1 });
    } else {
      const yeni: OduncAlma = { ...oduncData, id: `odunc-${Date.now()}` };
      const guncelOdunc = [...oduncAlmalar, yeni];
      await setItem(KEYS.ODUNC_ALMALAR, guncelOdunc);
      setOduncAlmalar(guncelOdunc);
      const guncelKitap = kitaplar.map(k => k.id === kitapId ? { ...k, musaitAdet: k.musaitAdet - 1 } : k);
      await setItem(KEYS.KITAPLAR, guncelKitap);
      setKitaplar(guncelKitap);
    }
    setKitaplar(prev => prev.map(k => k.id === kitapId ? { ...k, musaitAdet: k.musaitAdet - 1 } : k));
  }, [kitaplar, oduncAlmalar]);

  const oduncIadeEt = useCallback(async (oduncId: string, kitapId: string) => {
    const guncelleme = { durum: 'iade_edildi' as const, gercekIadeTarihi: new Date().toISOString().split('T')[0] };
    if (IS_FIREBASE_CONFIGURED) {
      await fsUpdate('oduncAlmalar', oduncId, guncelleme);
      const kitap = kitaplar.find(k => k.id === kitapId);
      if (kitap) await fsUpdate('kitaplar', kitapId, { musaitAdet: kitap.musaitAdet + 1 });
    } else {
      const guncelOdunc = oduncAlmalar.map(o => o.id === oduncId ? { ...o, ...guncelleme } : o);
      await setItem(KEYS.ODUNC_ALMALAR, guncelOdunc);
      setOduncAlmalar(guncelOdunc);
      const guncelKitap = kitaplar.map(k => k.id === kitapId ? { ...k, musaitAdet: k.musaitAdet + 1 } : k);
      await setItem(KEYS.KITAPLAR, guncelKitap);
      setKitaplar(guncelKitap);
      return;
    }
    setOduncAlmalar(prev => prev.map(o => o.id === oduncId ? { ...o, ...guncelleme } : o));
    setKitaplar(prev => prev.map(k => k.id === kitapId ? { ...k, musaitAdet: k.musaitAdet + 1 } : k));
  }, [oduncAlmalar, kitaplar]);

  // ── Burslar ────────────────────────────────────────────────────────────────

  const bursYukle = useCallback(() => yukle<Burs>('burslar', KEYS.BURSLAR, setBurslar), []);

  const bursEkle = useCallback(async (burs: Omit<Burs, 'id' | 'olusturulmaTarihi'>) => {
    const data = { ...burs, olusturulmaTarihi: new Date().toISOString() };
    if (IS_FIREBASE_CONFIGURED) {
      const id = await fsAdd('burslar', data);
      setBurslar(prev => [...prev, { ...data, id }]);
    } else {
      const yeni: Burs = { ...data, id: `burs-${Date.now()}` };
      const guncel = [...burslar, yeni];
      await setItem(KEYS.BURSLAR, guncel);
      setBurslar(guncel);
    }
  }, [burslar]);

  const bursGuncelle = useCallback(async (id: string, veri: Partial<Burs>) => {
    if (IS_FIREBASE_CONFIGURED) await fsUpdate('burslar', id, veri);
    const guncel = burslar.map(b => b.id === id ? { ...b, ...veri } : b);
    if (!IS_FIREBASE_CONFIGURED) await setItem(KEYS.BURSLAR, guncel);
    setBurslar(guncel);
  }, [burslar]);

  const bursSil = useCallback(async (id: string) => {
    const bagliBasvurular = bursBasvurulari.filter(b => b.bursId === id);
    if (IS_FIREBASE_CONFIGURED) {
      for (const b of bagliBasvurular) {
        await fsDelete('bursBasvurulari', b.id);
      }
      await fsDelete('burslar', id);
      setBursBasvurulari(prev => prev.filter(b => b.bursId !== id));
      setBurslar(prev => prev.filter(b => b.id !== id));
    } else {
      const gBasvuru = bursBasvurulari.filter(b => b.bursId !== id);
      const gBurs = burslar.filter(b => b.id !== id);
      await setItem(KEYS.BURS_BASVURULARI, gBasvuru);
      await setItem(KEYS.BURSLAR, gBurs);
      setBursBasvurulari(gBasvuru);
      setBurslar(gBurs);
    }
  }, [burslar, bursBasvurulari]);

  // ── Burs Başvuruları ───────────────────────────────────────────────────────

  const bursBasvuruYukle = useCallback(() => yukle<BursBasvurusu>('bursBasvurulari', KEYS.BURS_BASVURULARI, setBursBasvurulari), []);

  const bursBasvur = useCallback(async (
    bursId: string,
    bursAdi: string,
    kullaniciId: string,
    kullaniciAdi: string,
    secenek: { belgelerYerel: Record<string, string> },
  ) => {
    if (bursBasvurulari.find(b => b.bursId === bursId && b.kullaniciId === kullaniciId)) {
      throw new Error('Bu bursa zaten başvurdunuz.');
    }
    const bursKayit = burslar.find(b => b.id === bursId);
    const gerekli = bursKayit?.gerekliBelgeler ?? [];

    const temel: Pick<BursBasvurusu, 'bursId' | 'bursAdi' | 'kullaniciId' | 'kullaniciAdi' | 'basvuruTarihi' | 'durum'> = {
      bursId,
      bursAdi,
      kullaniciId,
      kullaniciAdi,
      basvuruTarihi: new Date().toISOString().split('T')[0],
      durum: 'beklemede',
    };

    let belgelerUri: Record<string, string> | undefined;
    if (gerekli.length > 0) {
      const bel = secenek.belgelerYerel;
      if (!bel) throw new Error('Belgelerinizi yükleyin.');
      belgelerUri = {};
      for (const g of gerekli) {
        const yerel = bel[g.id]?.trim();
        if (!yerel) throw new Error(`"${g.baslik}" belgesi zorunludur.`);
        belgelerUri[g.id] = await yerelGorseliDataUriye(yerel, { genislik: 960, kalite: 0.52 });
      }
    }

    const data: Omit<BursBasvurusu, 'id'> = belgelerUri
      ? { ...temel, belgelerUri }
      : { ...temel };

    if (IS_FIREBASE_CONFIGURED) {
      const id = await fsAdd('bursBasvurulari', data);
      setBursBasvurulari(prev => [...prev, { ...data, id }]);
    } else {
      const yeni: BursBasvurusu = { ...data, id: `basv-${Date.now()}` };
      const guncel = [...bursBasvurulari, yeni];
      await setItem(KEYS.BURS_BASVURULARI, guncel);
      setBursBasvurulari(guncel);
    }
  }, [bursBasvurulari, burslar]);

  const bursBasvuruGuncelle = useCallback(async (id: string, durum: BursBasvurusu['durum'], notlar?: string) => {
    const mevcut = bursBasvurulari.find(b => b.id === id);
    const veri: Partial<BursBasvurusu> = { durum };
    if (notlar) veri.notlar = notlar;
    if (durum === 'onaylandi') {
      veri.bursOdemeDurumu = mevcut?.bursOdemeDurumu ?? 'beklemede';
    }
    if (IS_FIREBASE_CONFIGURED) await fsUpdate('bursBasvurulari', id, firestoreTemiz(veri as unknown as Record<string, unknown>));
    const guncel = bursBasvurulari.map(b => b.id === id ? { ...b, ...veri } : b);
    if (!IS_FIREBASE_CONFIGURED) await setItem(KEYS.BURS_BASVURULARI, guncel);
    setBursBasvurulari(guncel);
  }, [bursBasvurulari]);

  const bursBasvuruOdemeGuncelle = useCallback(async (id: string, yatirildi: boolean) => {
    const mevcut = bursBasvurulari.find(b => b.id === id);
    if (!mevcut || mevcut.durum !== 'onaylandi') {
      throw new Error('Yalnızca onaylanmış başvurularda ödeme durumu güncellenebilir.');
    }
    if (yatirildi && !mevcut.iban?.trim()) {
      throw new Error('Ödeme yatırıldı işaretlenmeden önce başvuranın IBAN bilgisinin kayıtlı olması gerekir.');
    }
    const bugun = new Date().toISOString().split('T')[0];
    if (IS_FIREBASE_CONFIGURED) {
      if (yatirildi) {
        await fsUpdate('bursBasvurulari', id, { bursOdemeDurumu: 'yatirildi', bursOdemeTarihi: bugun });
      } else {
        await fsUpdate('bursBasvurulari', id, { bursOdemeDurumu: 'beklemede', bursOdemeTarihi: deleteField() });
      }
    }
    const guncel = bursBasvurulari.map(b => {
      if (b.id !== id) return b;
      if (yatirildi) return { ...b, bursOdemeDurumu: 'yatirildi' as const, bursOdemeTarihi: bugun };
      const { bursOdemeTarihi: _t, ...rest } = { ...b, bursOdemeDurumu: 'beklemede' as const };
      return rest;
    });
    if (!IS_FIREBASE_CONFIGURED) await setItem(KEYS.BURS_BASVURULARI, guncel);
    setBursBasvurulari(guncel);
  }, [bursBasvurulari]);

  const bursBasvuruIbanKaydet = useCallback(async (basvuruId: string, kullaniciId: string, ibanHam: string) => {
    const mevcut = bursBasvurulari.find(b => b.id === basvuruId);
    if (!mevcut) throw new Error('Başvuru bulunamadı.');
    if (mevcut.kullaniciId !== kullaniciId) throw new Error('Bu başvuruyu yalnızca sahibi güncelleyebilir.');
    if (mevcut.durum !== 'onaylandi') throw new Error('IBAN yalnızca onaylanmış başvurular için girilebilir.');
    const iban = ibanNormalizeTr(ibanHam);
    if (!ibanGecerliTr(iban)) {
      throw new Error('Geçerli bir Türkiye IBAN’ı girin (TR ile başlayan 26 karakter, kontrol rakamları doğru olmalı).');
    }
    const ibanGuncellenmeTarihi = new Date().toISOString().split('T')[0];
    const veri: Partial<BursBasvurusu> = { iban, ibanGuncellenmeTarihi };
    if (IS_FIREBASE_CONFIGURED) {
      await fsUpdate('bursBasvurulari', basvuruId, firestoreTemiz(veri as unknown as Record<string, unknown>));
    }
    const guncel = bursBasvurulari.map(b => b.id === basvuruId ? { ...b, ...veri } : b);
    if (!IS_FIREBASE_CONFIGURED) await setItem(KEYS.BURS_BASVURULARI, guncel);
    setBursBasvurulari(guncel);
  }, [bursBasvurulari]);

  // ── Etkinlikler ────────────────────────────────────────────────────────────

  const etkinlikYukle = useCallback(() => yukle<Etkinlik>('etkinlikler', KEYS.ETKINLIKLER, setEtkinlikler), []);

  const etkinlikEkle = useCallback(async (
    etkinlik: Omit<Etkinlik, 'id' | 'olusturulmaTarihi' | 'katilimcilar' | 'durum'>,
    secenek?: { gorselYerelUri?: string; baslangicDurumu?: 'beklemede' | 'onaylandi' },
  ) => {
    const { gorselUri: _g, ...temel } = etkinlik as Omit<Etkinlik, 'id' | 'olusturulmaTarihi' | 'katilimcilar' | 'durum'>;
    const durum = secenek?.baslangicDurumu ?? 'beklemede';
    const data = {
      ...temel,
      durum,
      katilimcilar: [] as string[],
      olusturulmaTarihi: new Date().toISOString(),
    };
    let newId: string;
    if (IS_FIREBASE_CONFIGURED) {
      newId = await fsAdd('etkinlikler', data);
      setEtkinlikler(prev => [...prev, { ...data, id: newId }]);
    } else {
      newId = `etk-${Date.now()}`;
      const yeni: Etkinlik = { ...data, id: newId };
      const guncel = [...etkinliklerRef.current, yeni];
      await setItem(KEYS.ETKINLIKLER, guncel);
      setEtkinlikler(guncel);
    }
    const yerel = secenek?.gorselYerelUri;
    if (!yerel) return;
    const { dataUri } = await duyuruGorseliKaydet(yerel);
    if (IS_FIREBASE_CONFIGURED) {
      await fsUpdate('etkinlikler', newId, { gorselUri: dataUri });
    }
    setEtkinlikler(prev => {
      const next = prev.map(e => (e.id === newId ? { ...e, gorselUri: dataUri } : e));
      if (!IS_FIREBASE_CONFIGURED) void setItem(KEYS.ETKINLIKLER, next);
      return next;
    });
  }, []);

  const etkinlikGuncelle = useCallback(async (id: string, durum: Etkinlik['durum']) => {
    if (IS_FIREBASE_CONFIGURED) await fsUpdate('etkinlikler', id, { durum });
    const guncel = etkinliklerRef.current.map(e => e.id === id ? { ...e, durum } : e);
    if (!IS_FIREBASE_CONFIGURED) await setItem(KEYS.ETKINLIKLER, guncel);
    setEtkinlikler(guncel);
  }, []);

  const etkinlikDetayGuncelle = useCallback(
    async (id: string, veri: EtkinlikDetayAlanlari, gorsel: EtkinlikGorselSecenek = 'degismedi') => {
      const veriDolu = Object.keys(veri).length > 0;
      if (!veriDolu && gorsel === 'degismedi') return;
      const mevcut = etkinliklerRef.current.find(e => e.id === id);
      if (!mevcut) throw new Error('Etkinlik bulunamadı.');

      type GorselSonuc = undefined | 'kaldir' | string;
      let yeniGorsel: GorselSonuc;
      if (gorsel === 'degismedi') {
        yeniGorsel = undefined;
      } else if (gorsel === 'kaldir') {
        yeniGorsel = 'kaldir';
      } else {
        const { dataUri } = await duyuruGorseliKaydet(gorsel.yerelUri);
        yeniGorsel = dataUri;
      }

      const patchFs: Record<string, unknown> = {};
      if (veri.baslik !== undefined) patchFs.baslik = veri.baslik;
      if (veri.aciklama !== undefined) patchFs.aciklama = veri.aciklama;
      if (veri.tarih !== undefined) patchFs.tarih = veri.tarih;
      if (veri.konum !== undefined) patchFs.konum = veri.konum;
      if ('bitisTarihi' in veri) {
        if (veri.bitisTarihi == null || veri.bitisTarihi === '') {
          patchFs.bitisTarihi = deleteField();
        } else {
          patchFs.bitisTarihi = veri.bitisTarihi;
        }
      }
      if ('maxKatilimci' in veri) {
        if (veri.maxKatilimci == null) {
          patchFs.maxKatilimci = deleteField();
        } else {
          patchFs.maxKatilimci = veri.maxKatilimci;
        }
      }
      if (yeniGorsel === 'kaldir') {
        patchFs.gorselUri = deleteField();
      } else if (typeof yeniGorsel === 'string') {
        patchFs.gorselUri = yeniGorsel;
      }

      const temizPatch = firestoreTemiz(patchFs as Record<string, unknown>);
      if (Object.keys(temizPatch).length > 0) {
        if (IS_FIREBASE_CONFIGURED) {
          await updateDoc(doc(db, 'etkinlikler', id), temizPatch);
        } else {
          const data = (await getItem<Etkinlik[]>(KEYS.ETKINLIKLER)) || [];
          const guncel = data.map((e) => {
            if (e.id !== id) return e;
            return uygulaEtkinlikDetayPatch(e, veri, yeniGorsel);
          });
          await setItem(KEYS.ETKINLIKLER, guncel);
        }
      }

      setEtkinlikler((prev) =>
        prev.map((e) => (e.id === id ? uygulaEtkinlikDetayPatch(e, veri, yeniGorsel) : e)),
      );
    },
    [],
  );

  const etkinlikKatil = useCallback(async (id: string, kullaniciId: string) => {
    const etkinlik = etkinlikler.find(e => e.id === id);
    if (!etkinlik) return;
    const yeniKatilimcilar = [...etkinlik.katilimcilar, kullaniciId];
    if (IS_FIREBASE_CONFIGURED) await fsUpdate('etkinlikler', id, { katilimcilar: yeniKatilimcilar });
    const guncel = etkinlikler.map(e => e.id === id ? { ...e, katilimcilar: yeniKatilimcilar } : e);
    if (!IS_FIREBASE_CONFIGURED) await setItem(KEYS.ETKINLIKLER, guncel);
    setEtkinlikler(guncel);
  }, [etkinlikler]);

  const etkinlikAyril = useCallback(async (id: string, kullaniciId: string) => {
    const etkinlik = etkinlikler.find(e => e.id === id);
    if (!etkinlik) return;
    const yeniKatilimcilar = etkinlik.katilimcilar.filter(k => k !== kullaniciId);
    if (IS_FIREBASE_CONFIGURED) await fsUpdate('etkinlikler', id, { katilimcilar: yeniKatilimcilar });
    const guncel = etkinlikler.map(e => e.id === id ? { ...e, katilimcilar: yeniKatilimcilar } : e);
    if (!IS_FIREBASE_CONFIGURED) await setItem(KEYS.ETKINLIKLER, guncel);
    setEtkinlikler(guncel);
  }, [etkinlikler]);

  // ── Dernek Durumu ──────────────────────────────────────────────────────────

  const dernekDurumuYukle = useCallback(async () => {
    if (IS_FIREBASE_CONFIGURED) {
      const snap = await getDoc(doc(db, 'ayarlar', 'dernekDurumu'));
      setDernekDurumu(snap.exists() ? (snap.data() as DernekDurumu) : null);
    } else {
      const data = await getItem<DernekDurumu>(KEYS.DERNEK_DURUMU);
      setDernekDurumu(data);
    }
  }, []);

  const dernekDurumuGuncelle = useCallback(async (acik: boolean, mesaj: string, guncelleyenKullanici: string) => {
    const yeni: DernekDurumu = { acik, mesaj, guncellenmeTarihi: new Date().toISOString(), guncelleyenKullanici };
    if (IS_FIREBASE_CONFIGURED) {
      await fsSet('ayarlar', 'dernekDurumu', yeni);
    } else {
      await setItem(KEYS.DERNEK_DURUMU, yeni);
    }
    setDernekDurumu(yeni);
  }, []);

  // ── Duyurular ───────────────────────────────────────────────────────────────

  const duyuruYukle = useCallback(async () => {
    if (IS_FIREBASE_CONFIGURED) {
      const q = query(collection(db, 'duyurular'), orderBy('olusturulmaTarihi', 'desc'));
      const snap = await getDocs(q);
      setDuyurular(
        dedupeByIdKeepFirst(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Duyuru))),
      );
    } else {
      const data = await getItem<Duyuru[]>(KEYS.DUYURULAR);
      const liste = (data || []).slice().sort(
        (a, b) => new Date(b.olusturulmaTarihi).getTime() - new Date(a.olusturulmaTarihi).getTime(),
      );
      setDuyurular(dedupeByIdKeepFirst(liste));
    }
  }, []);

  const duyuruEkle = useCallback(async (duyuru: Omit<Duyuru, 'id'>, gorselYerelUri?: string) => {
    const { gorselUri: _g, guncellenmeTarihi: _gu, ...duyuruTemel } = duyuru as Omit<Duyuru, 'id'>;
    const temiz = firestoreTemiz({ ...duyuruTemel } as Record<string, unknown>);
    let newId: string;
    if (IS_FIREBASE_CONFIGURED) {
      const ref = await addDoc(collection(db, 'duyurular'), temiz);
      newId = ref.id;
      setDuyurular((prev) => dedupeByIdKeepFirst([{ ...duyuruTemel, id: newId }, ...prev]));
    } else {
      newId = `duyuru-${Date.now()}`;
      const yeni: Duyuru = { ...duyuruTemel, id: newId };
      setDuyurular((prev) => {
        const guncel = dedupeByIdKeepFirst([yeni, ...prev]);
        void setItem(KEYS.DUYURULAR, guncel);
        return guncel;
      });
    }
    if (!gorselYerelUri) return;
    const { dataUri } = await duyuruGorseliKaydet(gorselYerelUri);
    if (IS_FIREBASE_CONFIGURED) {
      await fsUpdate('duyurular', newId, { gorselUri: dataUri });
    }
    setDuyurular((prev) => {
      const next = dedupeByIdKeepFirst(prev.map((d) => (d.id === newId ? { ...d, gorselUri: dataUri } : d)));
      if (!IS_FIREBASE_CONFIGURED) void setItem(KEYS.DUYURULAR, next);
      return next;
    });
  }, []);

  const duyuruGuncelle = useCallback(
    async (
      id: string,
      veri: Partial<Pick<Duyuru, 'baslik' | 'icerik'>>,
      gorsel: DuyuruGorselSecenek = 'degismedi',
    ) => {
      if (Object.keys(veri).length === 0 && gorsel === 'degismedi') {
        return;
      }
      const mevcut = duyurularRef.current.find((d) => d.id === id);
      if (!mevcut) throw new Error('Duyuru bulunamadı.');
      const guncellenmeTarihi = new Date().toISOString();
      type GorselSonuc = undefined | 'kaldir' | string;
      let yeniGorsel: GorselSonuc;

      if (gorsel === 'degismedi') {
        yeniGorsel = undefined;
      } else if (gorsel === 'kaldir') {
        yeniGorsel = 'kaldir';
      } else {
        const { dataUri } = await duyuruGorseliKaydet(gorsel.yerelUri);
        yeniGorsel = dataUri;
      }

      const patchFs: Record<string, unknown> = { ...veri, guncellenmeTarihi };
      if (yeniGorsel === 'kaldir') {
        patchFs.gorselUri = deleteField();
      } else if (typeof yeniGorsel === 'string') {
        patchFs.gorselUri = yeniGorsel;
      }
      const temizPatch = firestoreTemiz(patchFs as Record<string, unknown>);

      if (IS_FIREBASE_CONFIGURED) {
        await updateDoc(doc(db, 'duyurular', id), temizPatch);
      } else {
        const data = (await getItem<Duyuru[]>(KEYS.DUYURULAR)) || [];
        const guncel = data.map((d) => {
          if (d.id !== id) return d;
          let next: Duyuru = { ...d, ...veri, guncellenmeTarihi };
          if (yeniGorsel === 'kaldir') {
            const { gorselUri: _go, ...rest } = next;
            next = rest as Duyuru;
          } else if (typeof yeniGorsel === 'string') {
            next = { ...next, gorselUri: yeniGorsel };
          }
          return next;
        });
        await setItem(KEYS.DUYURULAR, guncel);
      }

      setDuyurular((prev) =>
        dedupeByIdKeepFirst(
          prev.map((d) => {
            if (d.id !== id) return d;
            let next: Duyuru = { ...d, ...veri, guncellenmeTarihi };
            if (yeniGorsel === 'kaldir') {
              const { gorselUri: _go, ...rest } = next;
              next = rest as Duyuru;
            } else if (typeof yeniGorsel === 'string') {
              next = { ...next, gorselUri: yeniGorsel };
            }
            return next;
          }),
        ),
      );
    },
    [],
  );

  const duyuruSil = useCallback(async (id: string) => {
    if (IS_FIREBASE_CONFIGURED) {
      await fsDelete('duyurular', id);
    } else {
      const data = (await getItem<Duyuru[]>(KEYS.DUYURULAR)) || [];
      const guncel = data.filter((d) => d.id !== id);
      await setItem(KEYS.DUYURULAR, guncel);
    }
    setDuyurular((prev) => prev.filter((d) => d.id !== id));
  }, []);

  // ── Aidat aylık miktar (ayarlar) ─────────────────────────────────────────────

  const aidatAylikMiktariYukle = useCallback(async (): Promise<number> => {
    let n = AIDAT_VARSAYILAN_MIKTAR;
    if (IS_FIREBASE_CONFIGURED) {
      const snap = await getDoc(doc(db, 'ayarlar', 'aidatAylikMiktar'));
      if (snap.exists()) {
        const raw = (snap.data() as { miktar?: unknown }).miktar;
        n = typeof raw === 'number' && Number.isFinite(raw) && raw > 0 ? raw : AIDAT_VARSAYILAN_MIKTAR;
      }
    } else {
      const data = await getItem<{ miktar?: number }>(KEYS.AIDAT_AYLIK_MIKTAR);
      n = data?.miktar != null && Number.isFinite(data.miktar) && data.miktar > 0 ? data.miktar : AIDAT_VARSAYILAN_MIKTAR;
    }
    setAidatAylikMiktari(n);
    return n;
  }, []);

  const aidatAylikMiktariGuncelle = useCallback(async (miktar: number) => {
    if (!Number.isFinite(miktar) || miktar <= 0) {
      throw new Error('Geçerli pozitif bir tutar girin.');
    }
    const yuvarla = Math.round(miktar * 100) / 100;
    if (IS_FIREBASE_CONFIGURED) {
      await fsSet('ayarlar', 'aidatAylikMiktar', {
        miktar: yuvarla,
        guncellenmeTarihi: new Date().toISOString(),
      });
    } else {
      await setItem(KEYS.AIDAT_AYLIK_MIKTAR, { miktar: yuvarla });
    }
    setAidatAylikMiktari(yuvarla);
  }, []);

  // ── Aidat Ödemeleri ────────────────────────────────────────────────────────

  const aidatYukle = useCallback(async () => {
    const miktarVal = await aidatAylikMiktariYukle();
    let mevcut: AidatOdemesi[];
    if (IS_FIREBASE_CONFIGURED) {
      const data = await fsGetAll<AidatOdemesi>('aidatOdemeleri');
      mevcut = data.map(normalizeAidatDoc);
    } else {
      const data = await getItem<AidatOdemesi[]>(KEYS.AIDAT_ODEMELERI);
      mevcut = (data || []).map(normalizeAidatDoc);
    }
    setAidatOdemeleri(dedupeByIdKeepFirst(mevcut));

    let uyeler: User[];
    if (IS_FIREBASE_CONFIGURED) {
      const raw = await fsGetAll<User>('users');
      uyeler = raw.map((u) => ({ ...u, rol: normalizeUserRole(u.rol) }));
    } else {
      uyeler = ((await getItem<User[]>(KEYS.USERS)) || []).map((u) => ({ ...u, rol: normalizeUserRole(u.rol) }));
    }
    setKullanicilar(uyeler);

    const aidatUyeleri = uyeler.filter(
      (u) => u.rol === 'uye' && (u.uyelikDurumu === 'aktif' || u.uyelikDurumu === 'beklemede'),
    );
    const aylar = aylarBaslangictanSimdiye();
    const toAdd: Omit<AidatOdemesi, 'id'>[] = [];
    for (const u of aidatUyeleri) {
      for (const { yil, ay } of aylar) {
        const varMi = mevcut.some((a) => a.kullaniciId === u.id && a.yil === yil && (a.ay ?? 1) === ay);
        if (!varMi) {
          toAdd.push({
            kullaniciId: u.id,
            kullaniciAdi: `${u.ad} ${u.soyad}`,
            yil,
            ay,
            miktar: miktarVal,
            odendi: false,
            sonOdemeTarihi: aySonOdemeTarihi(yil, ay),
          });
        }
      }
    }

    if (toAdd.length > 0) {
      if (IS_FIREBASE_CONFIGURED) {
        const BATCH = 450;
        for (let i = 0; i < toAdd.length; i += BATCH) {
          const batch = writeBatch(db);
          const parca = toAdd.slice(i, i + BATCH);
          for (const row of parca) {
            const ref = doc(collection(db, 'aidatOdemeleri'));
            batch.set(
              ref,
              firestoreTemiz({
                kullaniciId: row.kullaniciId,
                kullaniciAdi: row.kullaniciAdi,
                yil: row.yil,
                ay: row.ay,
                miktar: row.miktar,
                odendi: false,
                sonOdemeTarihi: row.sonOdemeTarihi,
              } as Record<string, unknown>),
            );
          }
          await batch.commit();
        }
        const son = await fsGetAll<AidatOdemesi>('aidatOdemeleri');
        setAidatOdemeleri(dedupeByIdKeepFirst(son.map(normalizeAidatDoc)));
      } else {
        const ts = Date.now();
        const yeni: AidatOdemesi[] = toAdd.map((row, idx) =>
          normalizeAidatDoc({
            ...row,
            id: `aidat-${ts}-${idx}-${Math.random().toString(36).slice(2, 11)}`,
          } as AidatOdemesi),
        );
        const guncel = dedupeByIdKeepFirst([...yeni, ...mevcut]);
        await setItem(KEYS.AIDAT_ODEMELERI, guncel);
        setAidatOdemeleri(dedupeByIdKeepFirst(guncel.map(normalizeAidatDoc)));
      }
    }
  }, [aidatAylikMiktariYukle]);

  const aidatEkle = useCallback(async (aidat: Omit<AidatOdemesi, 'id'>): Promise<string> => {
    const dup = aidatOdemeleri.find(
      a => a.kullaniciId === aidat.kullaniciId && a.yil === aidat.yil && a.ay === aidat.ay,
    );
    if (dup) {
      throw new Error('Bu üye ve ay için zaten kayıt var.');
    }
    const kayit = normalizeAidatDoc({ ...aidat, ay: aidat.ay } as AidatOdemesi);
    if (IS_FIREBASE_CONFIGURED) {
      const id = await fsAdd('aidatOdemeleri', firestoreTemiz({ ...kayit } as Record<string, unknown>));
      setAidatOdemeleri((prev) => dedupeByIdKeepFirst([...prev, { ...kayit, id }]));
      return id;
    }
    const id = `aidat-${Date.now()}`;
    const yeni: AidatOdemesi = { ...kayit, id };
    const guncel = dedupeByIdKeepFirst([...aidatOdemeleri, yeni]);
    await setItem(KEYS.AIDAT_ODEMELERI, guncel);
    setAidatOdemeleri(dedupeByIdKeepFirst(guncel));
    return id;
  }, [aidatOdemeleri]);

  const aidatGuncelle = useCallback(async (id: string, veri: Partial<AidatOdemesi>) => {
    const fsPayload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(veri)) {
      if (v !== undefined) fsPayload[k] = v;
    }
    if (veri.dekontUri) {
      fsPayload.redAciklamasi = deleteField();
    }
    if (IS_FIREBASE_CONFIGURED && Object.keys(fsPayload).length > 0) {
      await fsUpdate('aidatOdemeleri', id, fsPayload);
    }
    const guncel = aidatOdemeleri.map((a) => {
      if (a.id !== id) return a;
      const merged = normalizeAidatDoc({ ...a, ...veri } as AidatOdemesi);
      if (veri.dekontUri) delete merged.redAciklamasi;
      return merged;
    });
    if (!IS_FIREBASE_CONFIGURED) await setItem(KEYS.AIDAT_ODEMELERI, guncel);
    setAidatOdemeleri(dedupeByIdKeepFirst(guncel));
  }, [aidatOdemeleri]);

  const aidatOnayla = useCallback(async (id: string, adminId: string, adminAdi: string) => {
    const bugun = new Date().toISOString().split('T')[0];
    if (IS_FIREBASE_CONFIGURED) {
      await fsUpdate('aidatOdemeleri', id, {
        odendi: true,
        odemeTarihi: bugun,
        onaylayanAdminId: adminId,
        onaylayanAdminAdi: adminAdi,
        redAciklamasi: deleteField(),
      });
    }
    const guncel = aidatOdemeleri.map((a) => {
      if (a.id !== id) return a;
      const { redAciklamasi: _r, ...onceki } = a;
      return normalizeAidatDoc({
        ...onceki,
        odendi: true,
        odemeTarihi: bugun,
        onaylayanAdminId: adminId,
        onaylayanAdminAdi: adminAdi,
      });
    });
    if (!IS_FIREBASE_CONFIGURED) await setItem(KEYS.AIDAT_ODEMELERI, guncel);
    setAidatOdemeleri(dedupeByIdKeepFirst(guncel));
  }, [aidatOdemeleri]);

  const aidatReddet = useCallback(async (id: string, aciklama: string) => {
    if (IS_FIREBASE_CONFIGURED) {
      await fsUpdate('aidatOdemeleri', id, {
        dekontUri: deleteField(),
        dekontYuklenmeTarihi: deleteField(),
        redAciklamasi: aciklama || 'Dekont onaylanmadı.',
      });
    }
    const guncel = aidatOdemeleri.map(a => (a.id === id ? normalizeAidatDoc({
      ...a,
      dekontUri: undefined,
      dekontYuklenmeTarihi: undefined,
      redAciklamasi: aciklama || 'Dekont onaylanmadı.',
    }) : a));
    if (!IS_FIREBASE_CONFIGURED) await setItem(KEYS.AIDAT_ODEMELERI, guncel);
    setAidatOdemeleri(dedupeByIdKeepFirst(guncel));
  }, [aidatOdemeleri]);

  const aidatOde = useCallback(async (id: string) => {
    const bugun = new Date().toISOString().split('T')[0];
    const guncelleme = { odendi: true, odemeTarihi: bugun };
    if (IS_FIREBASE_CONFIGURED) await fsUpdate('aidatOdemeleri', id, guncelleme);
    const guncel = aidatOdemeleri.map(a => a.id === id ? { ...a, ...guncelleme } : a);
    if (!IS_FIREBASE_CONFIGURED) await setItem(KEYS.AIDAT_ODEMELERI, guncel);
    setAidatOdemeleri(dedupeByIdKeepFirst(guncel));
  }, [aidatOdemeleri]);

  // ── Kullanıcılar ───────────────────────────────────────────────────────────

  const kullaniciYukle = useCallback(async () => {
    if (IS_FIREBASE_CONFIGURED) {
      const data = await fsGetAll<User>('users');
      setKullanicilar(data.map(u => ({ ...u, rol: normalizeUserRole(u.rol) })));
    } else {
      const data = await getItem<User[]>(KEYS.USERS);
      setKullanicilar((data || []).map(u => ({ ...u, rol: normalizeUserRole(u.rol) })));
    }
  }, []);

  const kullaniciGuncelle = useCallback(async (id: string, veri: Partial<User>) => {
    const merge = (u: User): User => ({
      ...u,
      ...veri,
      rol: veri.rol !== undefined ? normalizeUserRole(veri.rol) : u.rol,
    });
    if (IS_FIREBASE_CONFIGURED) {
      await fsUpdate('users', id, veri);
      setKullanicilar(prev => prev.map(u => (u.id === id ? merge(u) : u)));
    } else {
      const data = await getItem<User[]>(KEYS.USERS) || [];
      const guncel = data.map(u => (u.id === id ? merge(u) : u));
      await setItem(KEYS.USERS, guncel);
      setKullanicilar(guncel);
    }
  }, []);

  return (
    <DataContext.Provider value={{
      odalar, odaYukle, odaEkle, odaGuncelle,
      rezervasyonlar, rezervasyonYukle, rezervasyonEkle, rezervasyonGuncelle, rezervasyonSil,
      kitaplar, kitapYukle, kitapEkle, kitapGuncelle, kitapSil,
      oduncAlmalar, oduncYukle, oduncAl, oduncIadeEt,
      burslar, bursYukle, bursEkle, bursGuncelle, bursSil,
      bursBasvurulari, bursBasvuruYukle, bursBasvur, bursBasvuruGuncelle, bursBasvuruOdemeGuncelle, bursBasvuruIbanKaydet,
      etkinlikler, etkinlikYukle, etkinlikEkle, etkinlikGuncelle, etkinlikDetayGuncelle, etkinlikKatil, etkinlikAyril,
      dernekDurumu, dernekDurumuYukle, dernekDurumuGuncelle,
      duyurular, duyuruYukle, duyuruEkle, duyuruGuncelle, duyuruSil,
      aidatOdemeleri, aidatYukle, aidatEkle, aidatGuncelle, aidatOnayla, aidatReddet, aidatOde,
      aidatAylikMiktari, aidatAylikMiktariYukle, aidatAylikMiktariGuncelle,
      kullanicilar, kullaniciYukle, kullaniciGuncelle,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData DataProvider içinde kullanılmalıdır');
  return context;
}