import {
  createContext, useContext, useEffect, useState, useCallback, type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase';
import { yoneticiDernekleriniYukle } from '../services/dernek';
import { platformYoneticiMi } from '../services/platform';
import type { AdminDernekOzet } from '../types';

const SECILI_DERNEK_KEY = 'dernekapp_web_secili_dernek';

interface AuthContextType {
  firebaseUser: User | null;
  yukleniyor: boolean;
  yoneticiDernekleri: AdminDernekOzet[];
  seciliDernekId: string | null;
  seciliDernekAd: string | null;
  yetkisiz: boolean;
  /** Platform dernek onayı yetkisi (menü ve rota için). */
  platformYonetici: boolean;
  girisYap: (email: string, sifre: string) => Promise<void>;
  cikisYap: () => Promise<void>;
  dernekSec: (dernekId: string) => void;
  yenileDernekler: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [yoneticiDernekleri, setYoneticiDernekleri] = useState<AdminDernekOzet[]>([]);
  const [seciliDernekId, setSeciliDernekId] = useState<string | null>(null);
  const [yetkisiz, setYetkisiz] = useState(false);
  const [platformYonetici, setPlatformYonetici] = useState(false);

  const seciliDernekAd = yoneticiDernekleri.find((d) => d.dernekId === seciliDernekId)?.dernekAd ?? null;

  const yenileDernekler = useCallback(async () => {
    if (!firebaseUser) {
      setYoneticiDernekleri([]);
      setYetkisiz(false);
      setPlatformYonetici(false);
      return;
    }
    const [liste, platform] = await Promise.all([
      yoneticiDernekleriniYukle(firebaseUser.uid),
      platformYoneticiMi(firebaseUser.uid, firebaseUser.email),
    ]);
    setPlatformYonetici(platform);
    setYoneticiDernekleri(liste);
    setYetkisiz(liste.length === 0);
    const kayitli = sessionStorage.getItem(SECILI_DERNEK_KEY);
    const gecerli = kayitli && liste.some((d) => d.dernekId === kayitli);
    if (gecerli) {
      setSeciliDernekId(kayitli);
    } else if (liste.length === 1) {
      setSeciliDernekId(liste[0].dernekId);
      sessionStorage.setItem(SECILI_DERNEK_KEY, liste[0].dernekId);
    } else {
      setSeciliDernekId(null);
      sessionStorage.removeItem(SECILI_DERNEK_KEY);
    }
  }, [firebaseUser]);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setYukleniyor(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, async (u) => {
      setFirebaseUser(u);
      setYukleniyor(true);
      try {
        if (u) {
          const [liste, platform] = await Promise.all([
            yoneticiDernekleriniYukle(u.uid),
            platformYoneticiMi(u.uid, u.email),
          ]);
          setYoneticiDernekleri(liste);
          setPlatformYonetici(platform);
          setYetkisiz(liste.length === 0);
          const kayitli = sessionStorage.getItem(SECILI_DERNEK_KEY);
          const gecerli = kayitli && liste.some((d) => d.dernekId === kayitli);
          if (gecerli) setSeciliDernekId(kayitli);
          else if (liste.length === 1) {
            setSeciliDernekId(liste[0].dernekId);
            sessionStorage.setItem(SECILI_DERNEK_KEY, liste[0].dernekId);
          } else {
            setSeciliDernekId(null);
            sessionStorage.removeItem(SECILI_DERNEK_KEY);
          }
        } else {
          setYoneticiDernekleri([]);
          setSeciliDernekId(null);
          setYetkisiz(false);
          setPlatformYonetici(false);
          sessionStorage.removeItem(SECILI_DERNEK_KEY);
        }
      } finally {
        setYukleniyor(false);
      }
    });
    return unsub;
  }, [yenileDernekler]);

  const girisYap = async (email: string, sifre: string) => {
    await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), sifre);
  };

  const cikisYap = async () => {
    sessionStorage.removeItem(SECILI_DERNEK_KEY);
    await signOut(auth);
  };

  const dernekSec = (dernekId: string) => {
    setSeciliDernekId(dernekId);
    sessionStorage.setItem(SECILI_DERNEK_KEY, dernekId);
  };

  return (
    <AuthContext.Provider value={{
      firebaseUser,
      yukleniyor,
      yoneticiDernekleri,
      seciliDernekId,
      seciliDernekAd,
      yetkisiz,
      platformYonetici,
      girisYap,
      cikisYap,
      dernekSec,
      yenileDernekler,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth AuthProvider içinde kullanılmalıdır');
  return ctx;
}
