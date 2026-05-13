import React, {
  createContext, useContext, useState, useEffect, useRef, ReactNode,
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
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { User } from '../types';
import { kullaniciGirebilirMi, normalizeUserRole } from '../utils/userAccess';
import { auth, db, IS_FIREBASE_CONFIGURED } from '../config/firebase';
import { getItem, setItem, removeItem, KEYS } from '../config/storage';
import {
  DEMO_ADMIN, DEMO_USER, DEMO_ADAY, ODALAR, KITAPLAR, ETKINLIKLER,
  BURSLAR, DERNEK_DURUMU, AIDAT_ODEMELERI, REZERVASYONLAR, ODUNC_ALMALAR, DUYURULAR,
} from '../config/mockData';
import { AIDAT_VARSAYILAN_MIKTAR } from '../constants/aidat';

interface AuthContextType {
  kullanici: User | null;
  yukleniyor: boolean;
  girisYap: (email: string, sifre: string) => Promise<void>;
  cikisYap: () => Promise<void>;
  kayitOl: (ad: string, soyad: string, email: string, sifre: string, telefon?: string) => Promise<void>;
  /** E-posta ile şifre sıfırlama bağlantısı gönderir (Firebase). */
  sifreSifirlamaEmailGonder: (email: string) => Promise<void>;
  /** Oturum açıkken mevcut şifreyi doğrulayıp yeni şifre belirler. */
  sifreDegistir: (mevcutSifre: string, yeniSifre: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Yerel mod (Firebase yapılandırılmamışsa) ──────────────────────────────────

async function initializeLocalData() {
  const initialized = await getItem<boolean>(KEYS.INITIALIZED);
  if (!initialized) {
    await setItem(KEYS.USERS, [DEMO_ADMIN, DEMO_USER, DEMO_ADAY]);
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
    await setItem(KEYS.INITIALIZED, true);
  }
}

// ── Firebase mod yardımcıları ─────────────────────────────────────────────────

async function fetchFirebaseUser(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  const d = snap.data() as Partial<User>;
  return {
    ...d,
    id: uid,
    rol: normalizeUserRole(d.rol),
  } as User;
}

async function createFirebaseUser(uid: string, userData: User) {
  const temiz = Object.fromEntries(
    Object.entries(userData as unknown as Record<string, unknown>).filter(([, v]) => v !== undefined),
  );
  await setDoc(doc(db, 'users', uid), temiz);
}

// ─────────────────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [kullanici, setKullanici] = useState<User | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  /** true iken listener Firestore profili yazılmadan signOut yapmaz (kayıt takılıyordu). */
  const kayitSuruyorRef = useRef(false);

  useEffect(() => {
    if (IS_FIREBASE_CONFIGURED) {
      // Firebase Auth oturum durumunu dinle
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          const userData = await fetchFirebaseUser(firebaseUser.uid);
          if (kayitSuruyorRef.current) {
            setKullanici(null);
            setYukleniyor(false);
            return;
          }
          if (!userData || !kullaniciGirebilirMi(userData)) {
            await signOut(auth);
            setKullanici(null);
          } else {
            setKullanici(userData);
          }
        } else {
          setKullanici(null);
        }
        setYukleniyor(false);
      });
      return unsubscribe;
    } else {
      // Yerel mod
      (async () => {
        await initializeLocalData();
        const kayitliKullanici = await getItem<User>(KEYS.CURRENT_USER);
        setKullanici(kayitliKullanici);
        setYukleniyor(false);
      })();
    }
  }, []);

  // ── Giriş ─────────────────────────────────────────────────────────────────

  const girisYap = async (email: string, sifre: string) => {
    if (IS_FIREBASE_CONFIGURED) {
      const credential = await signInWithEmailAndPassword(auth, email, sifre);
      const userData = await fetchFirebaseUser(credential.user.uid);
      if (!userData) {
        await signOut(auth);
        throw new Error('Kullanıcı verisi bulunamadı.');
      }
      if (!kullaniciGirebilirMi(userData)) {
        await signOut(auth);
        if (userData.uyelikDurumu === 'pasif') {
          throw new Error('Hesabınız pasif. Lütfen dernek ile iletişime geçin.');
        }
        if (userData.rol !== 'aday' && userData.uyelikDurumu === 'beklemede') {
          throw new Error('Üyeliğiniz henüz yönetici tarafından onaylanmadı. Onay sonrası giriş yapabilirsiniz.');
        }
        throw new Error('Giriş yapılamıyor. Lütfen dernek ile iletişime geçin.');
      }
      setKullanici(userData);
    } else {
      const users = await getItem<User[]>(KEYS.USERS) || [];
      const bulunan = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!bulunan) throw new Error('Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı.');
      const beklenenSifre = bulunan.rol === 'admin' ? 'admin123' : '123456'; // aday + üye: demo şifre
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
      setKullanici(bulunan);
    }
  };

  // ── Çıkış ─────────────────────────────────────────────────────────────────

  const cikisYap = async () => {
    if (IS_FIREBASE_CONFIGURED) {
      await signOut(auth);
    } else {
      await removeItem(KEYS.CURRENT_USER);
    }
    setKullanici(null);
  };

  // ── Kayıt ─────────────────────────────────────────────────────────────────

  const kayitOl = async (ad: string, soyad: string, email: string, sifre: string, telefon?: string) => {
    if (IS_FIREBASE_CONFIGURED) {
      const emailNorm = email.trim().toLowerCase();
      kayitSuruyorRef.current = true;
      try {
        /* Yarım kalan oturumlar createUser ile çakışmasın */
        try {
          await signOut(auth);
        } catch {
          /* çıkış yoksa sorun değil */
        }

        const mevcutYontemler = await fetchSignInMethodsForEmail(auth, emailNorm);
        if (mevcutYontemler.length > 0) {
          throw new Error(
            'Bu e-posta Firebase Authentication’da zaten kayıtlı (Firestore’daki “users” listesiyle karıştırılmamalı). '
            + 'Konsolda Build → Authentication → Users sekmesine bakın. Giriş yapın veya yönetici eski kaydı silsin.',
          );
        }

        const credential = await createUserWithEmailAndPassword(auth, emailNorm, sifre);
        const tel = telefon?.trim();
        const yeniKullanici: User = {
          id: credential.user.uid,
          ad,
          soyad,
          email: emailNorm,
          ...(tel ? { telefon: tel } : {}),
          rol: 'aday',
          uyelikDurumu: 'beklemede',
          uyelikBaslangic: new Date().toISOString().split('T')[0],
          olusturulmaTarihi: new Date().toISOString(),
        };
        try {
          await createFirebaseUser(credential.user.uid, yeniKullanici);
          await signOut(auth);
        } catch (firestoreHata) {
          /* Auth kullanıcısı oluştu ama profil yazılamadı; yarım hesap bırakmayalım */
          try {
            await deleteUser(credential.user);
          } catch {
            await signOut(auth);
          }
          throw new Error(
            'Hesap oluşturulurken sunucuya kaydedilemedi (ör. Firestore izinleri). '
            + 'Lütfen tekrar deneyin veya yönetici ile iletişime geçin.',
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
      const tel = telefon?.trim();
      const yeniKullanici: User = {
        id: `user-${Date.now()}`,
        ad,
        soyad,
        email: email.trim().toLowerCase(),
        ...(tel ? { telefon: tel } : {}),
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

  const sifreSifirlamaEmailGonder = async (email: string) => {
    const emailNorm = email.trim().toLowerCase();
    if (!emailNorm) throw new Error('E-posta adresi girin.');
    if (!IS_FIREBASE_CONFIGURED) {
      throw new Error(
        'Şifre sıfırlama e-postası yalnızca Firebase ile yapılandırılmış uygulamada kullanılabilir. '
        + 'Demo (yerel) modda README’deki örnek şifreleri kullanın veya yönetici ile iletişime geçin.',
      );
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
      kullanici, yukleniyor, girisYap, cikisYap, kayitOl,
      sifreSifirlamaEmailGonder, sifreDegistir,
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
