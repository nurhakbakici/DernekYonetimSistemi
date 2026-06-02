import React, {
  createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode,
} from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  deleteUser,
  fetchSignInMethodsForEmail,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import {
  doc, setDoc, getDoc, collection, query, where, getDocs, addDoc, updateDoc,
} from 'firebase/firestore';
import type { User, UserProfile, Uyelik, DernekFirestore, DernekDurumu, GirisMarkasi, KayitDernekOzeti } from '../types';
import { kullaniciGirebilirMi, normalizeUserRole } from '../utils/userAccess';
import { auth, db, IS_FIREBASE_CONFIGURED } from '../config/firebase';
import { getItem, setItem, removeItem, KEYS } from '../config/storage';
import {
  DEMO_USERS, ODALAR, KITAPLAR, ETKINLIKLER,
  BURSLAR, DERNEK_DURUMU, AIDAT_ODEMELERI, REZERVASYONLAR, ODUNC_ALMALAR, DUYURULAR,
  MOCK_AKTIF_DERNEKLER,
  GONULLU_GOREVLER, GONULLU_BASVURULAR, ENVANTER_KAYITLARI, ENVANTER_ZIMMETLER,
} from '../config/mockData';
import { AIDAT_VARSAYILAN_MIKTAR } from '../constants/aidat';
import type { FeaturePaketId } from '../constants/featurePackages';
import { varsayilanPaketler } from '../constants/featurePackages';
import { isPlatformAdminFromEnv } from '../config/platform';
import { uyelikBelgeId } from '../utils/tenantIds';
import { validateDerbisNo } from '../utils/derbisNo';

interface AuthContextType {
  kullanici: User | null;
  /** Firebase Auth oturumu açık (üyelik / dernek seçimi henüz olmayabilir). */
  oturumAcik: boolean;
  yukleniyor: boolean;
  aktifDernekId: string | null;
  aktifDernek: DernekFirestore | null;
  platformYonetici: boolean;
  /** Oturum açmış kullanıcının aktif dernekleri (dernek değiştirme listesi). */
  uyelikOzetleri: { dernekId: string; dernekAd: string }[];
  /** Oturum kapalıyken giriş / kayıt ekranı markası (AsyncStorage + son çıkış). */
  girisMarkasi: GirisMarkasi;
  girisMarkasiniYenile: () => Promise<void>;
  girisYap: (email: string, sifre: string) => Promise<void>;
  cikisYap: () => Promise<void>;
  kayitOl: (
    ad: string,
    soyad: string,
    email: string,
    sifre: string,
    opsiyon?: { telefon?: string; dernekId?: string; yalnizcaProfil?: boolean },
  ) => Promise<void>;
  /** Oturum açmadan kayıt ekranında kullanılır: aktif dernek listesi. */
  kayitIcinAktifDernekListesi: () => Promise<KayitDernekOzeti[]>;
  sifreSifirlamaEmailGonder: (email: string) => Promise<void>;
  sifreDegistir: (mevcutSifre: string, yeniSifre: string) => Promise<void>;
  aktifDernegiSec: (dernekId: string) => Promise<void>;
  /** Oturum açıkken üyelik yoksa: seçilen aktif derneğe aday başvurusu. */
  dernegeSecimleKatil: (dernekId: string) => Promise<void>;
  dernekAcmaBasvurusuGonder: (ad: string, slug: string, derbisNo: string, paketler: FeaturePaketId[]) => Promise<void>;
  bekleyenDernekBasvurulariniYukle: () => Promise<DernekFirestore[]>;
  dernekBasvurusunuOnayla: (dernekId: string) => Promise<void>;
  dernekBasvurusunuReddet: (dernekId: string, mesaj: string) => Promise<void>;
  paketAktif: (paketId: FeaturePaketId) => boolean;
  kiraciVerileriniYenile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function birlestirKullanici(profil: UserProfile, u: Uyelik, dernekId: string): User {
  return {
    id: profil.id,
    ad: profil.ad,
    soyad: profil.soyad,
    email: profil.email,
    ...(profil.telefon ? { telefon: profil.telefon } : {}),
    rol: normalizeUserRole(u.rol),
    uyelikDurumu: u.uyelikDurumu,
    uyelikBaslangic: u.uyelikBaslangic,
    olusturulmaTarihi: profil.olusturulmaTarihi,
    dernekId,
  };
}

// ── Yerel mod ───────────────────────────────────────────────────────────────

async function initializeLocalData() {
  const initialized = await getItem<boolean>(KEYS.INITIALIZED);
  if (!initialized) {
    await setItem(KEYS.USERS, DEMO_USERS);
    await setItem(KEYS.ODALAR, ODALAR);
    await setItem(KEYS.KITAPLAR, KITAPLAR);
    await setItem(KEYS.ETKINLIKLER, ETKINLIKLER);
    await setItem(KEYS.BURSLAR, BURSLAR);
    await setItem(KEYS.DERNEK_DURUMU, DERNEK_DURUMU);
    await setItem(KEYS.DUYURULAR, DUYURULAR);
    await setItem(KEYS.AIDAT_ODEMELERI, AIDAT_ODEMELERI);
    await setItem(KEYS.AIDAT_AYLIK_MIKTAR, { miktar: AIDAT_VARSAYILAN_MIKTAR });
    await setItem(KEYS.REZERVASYONLAR, REZERVASYONLAR);
    await setItem(KEYS.ODUNC_ALMALAR, ODUNC_ALMALAR);
    await setItem(KEYS.BURS_BASVURULARI, []);
    await setItem(KEYS.GONULLU_GOREVLER, GONULLU_GOREVLER);
    await setItem(KEYS.GONULLU_BASVURULAR, GONULLU_BASVURULAR);
    await setItem(KEYS.ENVANTER, ENVANTER_KAYITLARI);
    await setItem(KEYS.ENVANTER_ZIMMET, ENVANTER_ZIMMETLER);
    await setItem(KEYS.INITIALIZED, true);
  }
}

async function fetchFirebaseProfil(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  const d = snap.data() as Record<string, unknown>;
  return {
    id: uid,
    ad: String(d.ad ?? ''),
    soyad: String(d.soyad ?? ''),
    email: String(d.email ?? '').toLowerCase(),
    ...(typeof d.telefon === 'string' && d.telefon ? { telefon: d.telefon } : {}),
    olusturulmaTarihi: String(d.olusturulmaTarihi ?? new Date().toISOString()),
  };
}

async function fetchUyelikler(uid: string): Promise<Uyelik[]> {
  const q = query(collection(db, 'uyelikler'), where('userId', '==', uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const x = d.data() as Record<string, unknown>;
    return {
      id: d.id,
      userId: String(x.userId ?? ''),
      dernekId: String(x.dernekId ?? ''),
      rol: normalizeUserRole(x.rol),
      uyelikDurumu: (x.uyelikDurumu === 'aktif' || x.uyelikDurumu === 'pasif' || x.uyelikDurumu === 'beklemede')
        ? x.uyelikDurumu
        : 'beklemede',
      uyelikBaslangic: String(x.uyelikBaslangic ?? ''),
      olusturulmaTarihi: String(x.olusturulmaTarihi ?? ''),
    };
  });
}

async function fetchDernek(dernekId: string): Promise<DernekFirestore | null> {
  const snap = await getDoc(doc(db, 'dernekler', dernekId));
  if (!snap.exists()) return null;
  const x = snap.data() as Record<string, unknown>;
  const paketler = Array.isArray(x.paketler) ? (x.paketler as FeaturePaketId[]) : varsayilanPaketler();
  return {
    id: snap.id,
    ad: String(x.ad ?? ''),
    slug: String(x.slug ?? ''),
    ...(typeof x.derbisNo === 'string' && x.derbisNo.trim()
      ? { derbisNo: String(x.derbisNo).trim() }
      : {}),
    durum: (x.durum === 'onay_bekliyor' || x.durum === 'aktif' || x.durum === 'reddedildi')
      ? x.durum
      : 'onay_bekliyor',
    paketler,
    katilimKodu: String(x.katilimKodu ?? ''),
    olusturanUserId: String(x.olusturanUserId ?? ''),
    olusturulmaTarihi: String(x.olusturulmaTarihi ?? ''),
    ...(typeof x.onaylayanUserId === 'string' ? { onaylayanUserId: x.onaylayanUserId } : {}),
    ...(typeof x.onayTarihi === 'string' ? { onayTarihi: x.onayTarihi } : {}),
    ...(typeof x.redMesaji === 'string' ? { redMesaji: x.redMesaji } : {}),
    ...(x.dernekDurumu && typeof x.dernekDurumu === 'object' ? { dernekDurumu: x.dernekDurumu as DernekDurumu } : {}),
    ...(typeof x.aidatAylikMiktar === 'number' ? { aidatAylikMiktar: x.aidatAylikMiktar } : {}),
    ...(typeof x.logoUrl === 'string' && x.logoUrl.trim() ? { logoUrl: x.logoUrl.trim() } : {}),
  };
}

async function fetchKayitIcinAktifDernekListesi(): Promise<KayitDernekOzeti[]> {
  const q = query(collection(db, 'dernekler'), where('durum', '==', 'aktif'));
  const snap = await getDocs(q);
  const rows: KayitDernekOzeti[] = snap.docs.map((d) => {
    const x = d.data() as Record<string, unknown>;
    const ad = String(x.ad ?? '').trim();
    const logoUrl = typeof x.logoUrl === 'string' && x.logoUrl.trim() ? String(x.logoUrl).trim() : undefined;
    return { id: d.id, ad, ...(logoUrl ? { logoUrl } : {}) };
  }).filter((r) => r.ad.length > 0);
  rows.sort((a, b) => a.ad.localeCompare(b.ad, 'tr'));
  return rows;
}

async function platformYoneticiMi(uid: string): Promise<boolean> {
  if (isPlatformAdminFromEnv(uid)) return true;
  const p = await getDoc(doc(db, 'platformYoneticiler', uid));
  return p.exists();
}

async function hesaplaGirisMarkasi(): Promise<GirisMarkasi> {
  const son = await getItem<{ ad?: string; logoUri?: string | null }>(KEYS.SON_DERNEK_MARKA);
  if (son?.ad && String(son.ad).trim()) {
    const ad = String(son.ad).trim();
    const raw = son.logoUri;
    const logoUri = typeof raw === 'string' && raw.trim() ? raw.trim() : null;
    return { tip: 'dernek', ad, logoUri };
  }
  return { tip: 'genel' };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [kullanici, setKullanici] = useState<User | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [oturumAcik, setOturumAcik] = useState(false);
  const [aktifDernekId, setAktifDernekIdState] = useState<string | null>(null);
  const [aktifDernek, setAktifDernek] = useState<DernekFirestore | null>(null);
  const [platformYonetici, setPlatformYonetici] = useState(false);
  const [uyelikOzetleri, setUyelikOzetleri] = useState<{ dernekId: string; dernekAd: string }[]>([]);
  const [girisMarkasi, setGirisMarkasi] = useState<GirisMarkasi>({ tip: 'genel' });
  const profilRef = useRef<UserProfile | null>(null);
  const uyeliklerRef = useRef<Uyelik[]>([]);
  const derneklerRef = useRef<Record<string, DernekFirestore>>({});
  const kayitSuruyorRef = useRef(false);
  const aktifDernekRef = useRef<DernekFirestore | null>(null);

  useEffect(() => {
    aktifDernekRef.current = aktifDernek;
  }, [aktifDernek]);

  const girisMarkasiniYenile = useCallback(async () => {
    setGirisMarkasi(await hesaplaGirisMarkasi());
  }, []);

  useEffect(() => {
    void girisMarkasiniYenile();
  }, [girisMarkasiniYenile]);

  const kiraciVerileriniYenile = useCallback(async () => {
    if (!IS_FIREBASE_CONFIGURED) return;
    const u = auth.currentUser;
    if (!u) return;
    const profil = await fetchFirebaseProfil(u.uid);
    profilRef.current = profil;
    if (!profil) {
      setKullanici(null);
      setAktifDernek(null);
      setUyelikOzetleri([]);
      return;
    }
    const uyelikler = await fetchUyelikler(u.uid);
    uyeliklerRef.current = uyelikler;
    const map: Record<string, DernekFirestore> = {};
    const dernekIds = [...new Set(uyelikler.map((x) => x.dernekId))];
    await Promise.all(dernekIds.map(async (id) => {
      const d = await fetchDernek(id);
      if (d) map[id] = d;
    }));
    derneklerRef.current = map;
    const aktifUyelikler = uyelikler.filter((uy) => map[uy.dernekId]?.durum === 'aktif');
    const ozet: { dernekId: string; dernekAd: string }[] = aktifUyelikler.map((uy) => ({
      dernekId: uy.dernekId,
      dernekAd: map[uy.dernekId]?.ad ?? uy.dernekId,
    }));
    setUyelikOzetleri(ozet);
    let secilen = await getItem<string>(KEYS.AKTIF_DERNEK_ID);
    if (!secilen || !aktifUyelikler.some((x) => x.dernekId === secilen)) {
      secilen = aktifUyelikler[0]?.dernekId ?? null;
      if (secilen) await setItem(KEYS.AKTIF_DERNEK_ID, secilen);
      else await removeItem(KEYS.AKTIF_DERNEK_ID);
    }
    setAktifDernekIdState(secilen);
    const dAktif = secilen ? map[secilen] ?? null : null;
    setAktifDernek(dAktif && dAktif.durum === 'aktif' ? dAktif : null);
    const uAktif = secilen ? uyelikler.find((x) => x.dernekId === secilen) : undefined;
    if (profil && uAktif && dAktif?.durum === 'aktif') {
      const merged = birlestirKullanici(profil, uAktif, secilen!);
      if (kullaniciGirebilirMi(merged)) {
        setKullanici(merged);
      } else {
        const baska = aktifUyelikler.find((x) => {
          if (x.dernekId === secilen) return false;
          return kullaniciGirebilirMi(birlestirKullanici(profil, x, x.dernekId));
        });
        if (baska) {
          await setItem(KEYS.AKTIF_DERNEK_ID, baska.dernekId);
          setAktifDernekIdState(baska.dernekId);
          setAktifDernek(map[baska.dernekId] ?? null);
          setKullanici(birlestirKullanici(profil, baska, baska.dernekId));
        } else {
          setKullanici(null);
        }
      }
    } else {
      setKullanici(null);
    }
  }, []);

  useEffect(() => {
    if (IS_FIREBASE_CONFIGURED) {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        setOturumAcik(!!firebaseUser);
        if (!firebaseUser) {
          profilRef.current = null;
          uyeliklerRef.current = [];
          derneklerRef.current = {};
          setKullanici(null);
          setAktifDernekIdState(null);
          setAktifDernek(null);
          setUyelikOzetleri([]);
          setPlatformYonetici(false);
          setYukleniyor(false);
          setGirisMarkasi(await hesaplaGirisMarkasi());
          return;
        }
        if (kayitSuruyorRef.current) {
          setKullanici(null);
          setYukleniyor(false);
          return;
        }
        setYukleniyor(true);
        try {
          const profil = await fetchFirebaseProfil(firebaseUser.uid);
          profilRef.current = profil;
          const py = await platformYoneticiMi(firebaseUser.uid);
          setPlatformYonetici(py);
          if (!profil) {
            await signOut(auth);
            setKullanici(null);
            return;
          }
          const uyelikler = await fetchUyelikler(firebaseUser.uid);
          uyeliklerRef.current = uyelikler;
          const map: Record<string, DernekFirestore> = {};
          const dernekIds = [...new Set(uyelikler.map((x) => x.dernekId))];
          await Promise.all(dernekIds.map(async (id) => {
            const d = await fetchDernek(id);
            if (d) map[id] = d;
          }));
          derneklerRef.current = map;
          const aktifUyelikler = uyelikler.filter((uy) => map[uy.dernekId]?.durum === 'aktif');
          const ozet: { dernekId: string; dernekAd: string }[] = aktifUyelikler.map((uy) => ({
            dernekId: uy.dernekId,
            dernekAd: map[uy.dernekId]?.ad ?? uy.dernekId,
          }));
          setUyelikOzetleri(ozet);
          let secilen = await getItem<string>(KEYS.AKTIF_DERNEK_ID);
          if (!secilen || !aktifUyelikler.some((x) => x.dernekId === secilen)) {
            secilen = aktifUyelikler[0]?.dernekId ?? null;
            if (secilen) await setItem(KEYS.AKTIF_DERNEK_ID, secilen);
            else await removeItem(KEYS.AKTIF_DERNEK_ID);
          }
          setAktifDernekIdState(secilen);
          const dAktif = secilen ? map[secilen] ?? null : null;
          setAktifDernek(dAktif && dAktif.durum === 'aktif' ? dAktif : null);
          const uAktif = secilen ? uyelikler.find((x) => x.dernekId === secilen) : undefined;
          if (profil && uAktif && dAktif?.durum === 'aktif') {
            const merged = birlestirKullanici(profil, uAktif, secilen!);
            if (kullaniciGirebilirMi(merged)) {
              setKullanici(merged);
            } else {
              const baska = aktifUyelikler.find((x) => {
                if (x.dernekId === secilen) return false;
                return kullaniciGirebilirMi(birlestirKullanici(profil, x, x.dernekId));
              });
              if (baska) {
                await setItem(KEYS.AKTIF_DERNEK_ID, baska.dernekId);
                setAktifDernekIdState(baska.dernekId);
                setAktifDernek(map[baska.dernekId] ?? null);
                setKullanici(birlestirKullanici(profil, baska, baska.dernekId));
              } else if (aktifUyelikler.length > 0) {
                await signOut(auth);
                setKullanici(null);
              } else {
                setKullanici(null);
              }
            }
          } else {
            setKullanici(null);
          }
        } finally {
          setYukleniyor(false);
        }
      });
      return unsubscribe;
    }
    (async () => {
      await initializeLocalData();
      const kayitliKullanici = await getItem<User>(KEYS.CURRENT_USER);
      setKullanici(kayitliKullanici);
      setOturumAcik(!!kayitliKullanici);
      setYukleniyor(false);
      setGirisMarkasi(await hesaplaGirisMarkasi());
    })();
    return undefined;
  }, []);

  const girisYap = async (email: string, sifre: string) => {
    if (IS_FIREBASE_CONFIGURED) {
      await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), sifre);
      return;
    }
    const users = await getItem<User[]>(KEYS.USERS) || [];
    const bulunan = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!bulunan) throw new Error('Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı.');
    const beklenenSifre = bulunan.rol === 'admin' ? 'admin123' : '123456';
    const kayitliSifre = await getItem<string>(`@sifre_${bulunan.id}`);
    if (sifre !== (kayitliSifre || beklenenSifre)) throw new Error('Şifre hatalı.');
    if (!kullaniciGirebilirMi(bulunan)) {
      if (bulunan.uyelikDurumu === 'pasif') {
        throw new Error('Hesabınız pasif. Lütfen dernek ile iletişime geçin.');
      }
      if (bulunan.rol !== 'aday' && bulunan.uyelikDurumu === 'beklemede') {
        throw new Error('Üyeliğiniz henüz yönetici tarafından onaylanmadı. Onay sonrası giriş yapabilirsiniz.');
      }
      throw new Error('Giriş yapılamıyor. Lütfen dernek ile iletişime geçin.');
    }
    await setItem(KEYS.CURRENT_USER, bulunan);
    setOturumAcik(true);
    setKullanici(bulunan);
  };

  const cikisYap = async () => {
    if (IS_FIREBASE_CONFIGURED) {
      const d = aktifDernekRef.current;
      if (d) {
        await setItem(KEYS.SON_DERNEK_MARKA, {
          ad: d.ad,
          logoUri: d.logoUrl ?? null,
        });
      }
      await removeItem(KEYS.AKTIF_DERNEK_ID);
      await signOut(auth);
    } else {
      await removeItem(KEYS.CURRENT_USER);
    }
    setKullanici(null);
    setOturumAcik(false);
    setAktifDernekIdState(null);
    setAktifDernek(null);
    setUyelikOzetleri([]);
    setGirisMarkasi(await hesaplaGirisMarkasi());
  };

  const kayitOl = async (
    ad: string,
    soyad: string,
    email: string,
    sifre: string,
    opsiyon?: { telefon?: string; dernekId?: string; yalnizcaProfil?: boolean },
  ) => {
    if (IS_FIREBASE_CONFIGURED) {
      const emailNorm = email.trim().toLowerCase();
      const yalnizcaProfil = !!opsiyon?.yalnizcaProfil;
      const dernekIdHam = opsiyon?.dernekId?.trim();
      if (!yalnizcaProfil) {
        if (!dernekIdHam) throw new Error('Üye olmak için bir dernek seçmelisiniz.');
        const dOn = await getDoc(doc(db, 'dernekler', dernekIdHam));
        if (!dOn.exists()) throw new Error('Seçilen dernek bulunamadı.');
        const dDur = (dOn.data() as { durum?: string }).durum;
        if (dDur !== 'aktif') throw new Error('Bu dernek yeni üye kabul etmiyor.');
      }
      kayitSuruyorRef.current = true;
      try {
        try {
          await signOut(auth);
        } catch { /* */ }
        const mevcutYontemler = await fetchSignInMethodsForEmail(auth, emailNorm);
        if (mevcutYontemler.length > 0) {
          throw new Error(
            'Bu e-posta Firebase Authentication’da zaten kayıtlı. Giriş yapın veya farklı bir adres kullanın.',
          );
        }
        const credential = await createUserWithEmailAndPassword(auth, emailNorm, sifre);
        const tel = opsiyon?.telefon?.trim();
        const olusturulmaTarihi = new Date().toISOString();
        try {
          await setDoc(doc(db, 'users', credential.user.uid), {
            ad: ad.trim(),
            soyad: soyad.trim(),
            email: emailNorm,
            ...(tel ? { telefon: tel } : {}),
            olusturulmaTarihi,
          });
          if (!yalnizcaProfil && dernekIdHam) {
            const bid = uyelikBelgeId(credential.user.uid, dernekIdHam);
            const mevcutUy = await getDoc(doc(db, 'uyelikler', bid));
            if (mevcutUy.exists()) throw new Error('Bu dernek için zaten kayıtlısınız.');
            const bugun = new Date().toISOString().split('T')[0];
            await setDoc(doc(db, 'uyelikler', bid), {
              userId: credential.user.uid,
              dernekId: dernekIdHam,
              rol: 'aday',
              uyelikDurumu: 'beklemede',
              uyelikBaslangic: bugun,
              olusturulmaTarihi,
            });
          }
          await signOut(auth);
        } catch (e) {
          try {
            await deleteUser(credential.user);
          } catch {
            await signOut(auth);
          }
          if (e instanceof Error) throw e;
          throw new Error(
            'Hesap oluşturulurken sunucuya kaydedilemedi (ör. Firestore izinleri). Lütfen tekrar deneyin.',
          );
        }
      } finally {
        kayitSuruyorRef.current = false;
      }
    } else {
      const users = await getItem<User[]>(KEYS.USERS) || [];
      if (users.find(u => u.email.toLowerCase() === email.trim().toLowerCase())) {
        throw new Error('Bu e-posta adresi zaten kullanımda.');
      }
      const tel = opsiyon?.telefon?.trim();
      const yeniKullanici: User = {
        id: `user-${Date.now()}`,
        ad,
        soyad,
        email: email.trim().toLowerCase(),
        ...(tel ? { telefon: tel } : {}),
        ...(opsiyon?.dernekId ? { dernekId: opsiyon.dernekId } : {}),
        rol: 'aday',
        uyelikDurumu: 'beklemede',
        uyelikBaslangic: new Date().toISOString().split('T')[0],
        olusturulmaTarihi: new Date().toISOString(),
      };
      users.push(yeniKullanici);
      await setItem(KEYS.USERS, users);
      await setItem(`@sifre_${yeniKullanici.id}`, sifre);
    }
  };

  const kayitIcinAktifDernekListesi = useCallback(async (): Promise<KayitDernekOzeti[]> => {
    if (!IS_FIREBASE_CONFIGURED) return [...MOCK_AKTIF_DERNEKLER];
    return fetchKayitIcinAktifDernekListesi();
  }, []);

  const aktifDernegiSec = useCallback(async (dernekId: string) => {
    if (!IS_FIREBASE_CONFIGURED) return;
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('Oturum yok.');
    const uy = uyeliklerRef.current.find((x) => x.dernekId === dernekId && x.userId === uid);
    if (!uy) throw new Error('Bu dernekte üyeliğiniz yok.');
    const d = await fetchDernek(dernekId);
    if (!d || d.durum !== 'aktif') throw new Error('Dernek aktif değil.');
    await setItem(KEYS.AKTIF_DERNEK_ID, dernekId);
    await kiraciVerileriniYenile();
  }, [kiraciVerileriniYenile]);

  const dernegeSecimleKatil = useCallback(async (dernekId: string) => {
    if (!IS_FIREBASE_CONFIGURED) throw new Error('Yalnızca Firebase modunda kullanılabilir.');
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('Önce giriş yapın.');
    const id = dernekId.trim();
    if (!id) throw new Error('Bir dernek seçin.');
    const d = await fetchDernek(id);
    if (!d || d.durum !== 'aktif') throw new Error('Dernek bulunamadı veya aktif değil.');
    const bid = uyelikBelgeId(uid, id);
    const mevcut = await getDoc(doc(db, 'uyelikler', bid));
    if (mevcut.exists()) throw new Error('Zaten bu derneğe kayıtlısınız.');
    const bugun = new Date().toISOString().split('T')[0];
    const yeni: Omit<Uyelik, 'id'> = {
      userId: uid,
      dernekId: id,
      rol: 'aday',
      uyelikDurumu: 'beklemede',
      uyelikBaslangic: bugun,
      olusturulmaTarihi: new Date().toISOString(),
    };
    await setDoc(doc(db, 'uyelikler', bid), yeni);
    await kiraciVerileriniYenile();
  }, [kiraciVerileriniYenile]);

  const dernekAcmaBasvurusuGonder = useCallback(async (
    ad: string,
    slugRaw: string,
    derbisNoRaw: string,
    paketler: FeaturePaketId[],
  ) => {
    if (!IS_FIREBASE_CONFIGURED) throw new Error('Yalnızca Firebase modunda kullanılabilir.');
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('Önce giriş yapın.');
    const adTrim = ad.trim();
    if (!adTrim) throw new Error('Dernek adı zorunludur.');
    const slug = slugRaw.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (slug.length < 2) throw new Error('Kısa ad (slug) en az 2 karakter olmalıdır.');
    const derbisNo = validateDerbisNo(derbisNoRaw);
    const qSlug = query(collection(db, 'dernekler'), where('slug', '==', slug));
    if (!(await getDocs(qSlug)).empty) throw new Error('Bu kısa ad zaten kullanılıyor.');
    const qDerbis = query(collection(db, 'dernekler'), where('derbisNo', '==', derbisNo));
    if (!(await getDocs(qDerbis)).empty) throw new Error('Bu DERBİS numarası zaten kayıtlı.');
    if (!paketler.length) throw new Error('En az bir özellik paketi seçin.');
    await addDoc(collection(db, 'dernekler'), {
      ad: adTrim,
      slug,
      derbisNo,
      durum: 'onay_bekliyor',
      paketler,
      katilimKodu: '',
      olusturanUserId: uid,
      olusturulmaTarihi: new Date().toISOString(),
    });
  }, []);

  const bekleyenDernekBasvurulariniYukle = useCallback(async (): Promise<DernekFirestore[]> => {
    if (!IS_FIREBASE_CONFIGURED) return [];
    const uid = auth.currentUser?.uid;
    if (!uid || !(await platformYoneticiMi(uid))) {
      throw new Error('Bu işlem yalnızca platform yöneticileri içindir.');
    }
    const q = query(collection(db, 'dernekler'), where('durum', '==', 'onay_bekliyor'));
    const snap = await getDocs(q);
    const out: DernekFirestore[] = [];
    for (const d of snap.docs) {
      const full = await fetchDernek(d.id);
      if (full) out.push(full);
    }
    return out;
  }, []);

  const dernekBasvurusunuOnayla = useCallback(async (dernekId: string) => {
    if (!IS_FIREBASE_CONFIGURED) throw new Error('Yalnızca Firebase modunda.');
    const uid = auth.currentUser?.uid;
    if (!uid || !(await platformYoneticiMi(uid))) {
      throw new Error('Yalnızca platform yöneticisi onaylayabilir.');
    }
    const dRef = doc(db, 'dernekler', dernekId);
    const dSnap = await getDoc(dRef);
    if (!dSnap.exists()) throw new Error('Dernek bulunamadı.');
    const d = dSnap.data() as Record<string, unknown>;
    if (d.durum !== 'onay_bekliyor') throw new Error('Bu başvuru onay beklemiyor.');
    const olusturan = String(d.olusturanUserId ?? '');
    if (!olusturan) throw new Error('Başvuru sahibi bulunamadı.');
    const basvuruPaketleri = Array.isArray(d.paketler) ? (d.paketler as FeaturePaketId[]) : [];
    const varsayilanDurum: DernekDurumu = {
      acik: true,
      mesaj: 'Derneğimize hoş geldiniz.',
      guncellenmeTarihi: new Date().toISOString(),
      guncelleyenKullanici: 'Sistem',
    };
    await updateDoc(dRef, {
      durum: 'aktif',
      katilimKodu: '',
      onaylayanUserId: uid,
      onayTarihi: new Date().toISOString(),
      ...(basvuruPaketleri.includes('acikKapali') ? { dernekDurumu: varsayilanDurum } : {}),
      aidatAylikMiktar: AIDAT_VARSAYILAN_MIKTAR,
    });
    const bid = uyelikBelgeId(olusturan, dernekId);
    const bugun = new Date().toISOString().split('T')[0];
    await setDoc(doc(db, 'uyelikler', bid), {
      userId: olusturan,
      dernekId,
      rol: 'admin',
      uyelikDurumu: 'aktif',
      uyelikBaslangic: bugun,
      olusturulmaTarihi: new Date().toISOString(),
    });
  }, []);

  const dernekBasvurusunuReddet = useCallback(async (dernekId: string, mesaj: string) => {
    if (!IS_FIREBASE_CONFIGURED) throw new Error('Yalnızca Firebase modunda.');
    const uid = auth.currentUser?.uid;
    if (!uid || !(await platformYoneticiMi(uid))) {
      throw new Error('Yalnızca platform yöneticisi reddedebilir.');
    }
    const dRef = doc(db, 'dernekler', dernekId);
    const dSnap = await getDoc(dRef);
    if (!dSnap.exists()) throw new Error('Dernek bulunamadı.');
    const d = dSnap.data() as { durum?: string };
    if (d.durum !== 'onay_bekliyor') throw new Error('Bu başvuru onay beklemiyor.');
    await updateDoc(dRef, {
      durum: 'reddedildi',
      redMesaji: mesaj.trim() || 'Başvuru reddedildi.',
      onaylayanUserId: uid,
      onayTarihi: new Date().toISOString(),
    });
  }, []);

  const paketAktif = useCallback((paketId: FeaturePaketId): boolean => {
    if (!IS_FIREBASE_CONFIGURED) return true;
    const p = aktifDernek?.paketler;
    if (!p?.length) return true;
    return p.includes(paketId);
  }, [aktifDernek]);

  const sifreSifirlamaEmailGonder = async (email: string) => {
    const emailNorm = email.trim().toLowerCase();
    if (!emailNorm) throw new Error('E-posta adresi girin.');
    if (!IS_FIREBASE_CONFIGURED) {
      throw new Error('Şifre sıfırlama yalnızca Firebase ile yapılandırılmış uygulamada kullanılabilir.');
    }
    await sendPasswordResetEmail(auth, emailNorm);
  };

  const sifreDegistir = async (mevcutSifre: string, yeniSifre: string) => {
    if (!yeniSifre || yeniSifre.length < 6) {
      throw new Error('Yeni şifre en az 6 karakter olmalıdır.');
    }
    if (mevcutSifre === yeniSifre) {
      throw new Error('Yeni şifre mevcut şifre ile aynı olamaz.');
    }
    if (IS_FIREBASE_CONFIGURED) {
      const u = auth.currentUser;
      if (!u?.email) throw new Error('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
      const cred = EmailAuthProvider.credential(u.email, mevcutSifre);
      await reauthenticateWithCredential(u, cred);
      await updatePassword(u, yeniSifre);
      return;
    }
    const cur = await getItem<User>(KEYS.CURRENT_USER);
    if (!cur) throw new Error('Oturum bulunamadı.');
    const beklenenSifre = cur.rol === 'admin' ? 'admin123' : '123456';
    const kayitliSifre = await getItem<string>(`@sifre_${cur.id}`);
    if (mevcutSifre !== (kayitliSifre || beklenenSifre)) {
      throw new Error('Mevcut şifre hatalı.');
    }
    await setItem(`@sifre_${cur.id}`, yeniSifre);
  };

  return (
    <AuthContext.Provider value={{
      kullanici,
      oturumAcik,
      yukleniyor,
      aktifDernekId,
      aktifDernek,
      platformYonetici,
      uyelikOzetleri,
      girisMarkasi,
      girisMarkasiniYenile,
      girisYap,
      cikisYap,
      kayitOl,
      kayitIcinAktifDernekListesi,
      sifreSifirlamaEmailGonder,
      sifreDegistir,
      aktifDernegiSec,
      dernegeSecimleKatil,
      dernekAcmaBasvurusuGonder,
      bekleyenDernekBasvurulariniYukle,
      dernekBasvurusunuOnayla,
      dernekBasvurusunuReddet,
      paketAktif,
      kiraciVerileriniYenile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth AuthProvider içinde kullanılmalıdır');
  return context;
}
