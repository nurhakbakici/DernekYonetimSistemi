import React, { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import Constants from 'expo-constants';
import { onSnapshot, query, collection, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { db, IS_FIREBASE_CONFIGURED } from '../config/firebase';
import { getItem, setItem } from '../config/storage';
import type { Duyuru } from '../types';

const ANDROID_CHANNEL_ID = 'duyurular';

/** Expo Go + Android: SDK 53+ ile uzaktan bildirim kaldırıldı; modül yüklenince konsolda ERROR basılıyor — modülü hiç import etmiyoruz. */
function bildirimModuluKullanma(): boolean {
  if (Platform.OS === 'web') return false;
  if (Platform.OS === 'android' && Constants.appOwnership === 'expo') return false;
  return true;
}

type NotificationsModule = typeof import('expo-notifications');
let notificationsYuklendi: NotificationsModule | null | undefined;

async function notificationsModulu(): Promise<NotificationsModule | null> {
  if (!bildirimModuluKullanma()) return null;
  if (notificationsYuklendi !== undefined) return notificationsYuklendi;
  try {
    notificationsYuklendi = await import('expo-notifications');
  } catch {
    notificationsYuklendi = null;
  }
  return notificationsYuklendi;
}

function lastBildirStorageKey(kullaniciId: string) {
  return `@kule_last_duyuru_bildir_${kullaniciId}`;
}

async function bildirDuyuru(duyuru: Duyuru) {
  if (Platform.OS === 'web') return;
  const Notifications = await notificationsModulu();
  if (!Notifications) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: duyuru.baslik,
        body: duyuru.icerik.length > 180 ? `${duyuru.icerik.slice(0, 177)}…` : duyuru.icerik,
        data: { duyuruId: duyuru.id },
        ...(Platform.OS === 'android' ? { android: { channelId: ANDROID_CHANNEL_ID } } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 1,
      },
    });
  } catch {
    // izin yok veya simülatör kısıtı
  }
}

/**
 * Giriş sonrası: Firestore’da yeni duyuru eklenince yerel bildirim.
 * Yerel modda: periyodik yükleme + yeni üst kayıt algılama.
 */
export default function DuyuruNotificationBridge() {
  const { kullanici } = useAuth();
  const { duyurular, duyuruYukle } = useData();
  const ilkSnapshot = useRef(true);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (Platform.OS === 'web' || !bildirimModuluKullanma()) return;
    let iptal = false;
    void (async () => {
      const Notifications = await notificationsModulu();
      if (iptal || !Notifications) return;
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
      if (Platform.OS === 'android') {
        void Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
          name: 'Duyurular',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
        });
      }
      void Notifications.requestPermissionsAsync();
    })();
    return () => {
      iptal = true;
    };
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      appState.current = s;
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!kullanici?.id || Platform.OS === 'web') return;

    if (IS_FIREBASE_CONFIGURED) {
      const q = query(collection(db, 'duyurular'), orderBy('olusturulmaTarihi', 'desc'), limit(25));
      const unsub = onSnapshot(q, async (snap) => {
        if (ilkSnapshot.current) {
          ilkSnapshot.current = false;
          await duyuruYukle();
          return;
        }
        await duyuruYukle();
        for (const change of snap.docChanges()) {
          if (change.type !== 'added') continue;
          const d = { id: change.doc.id, ...change.doc.data() } as Duyuru;
          if (d.olusturanId === kullanici.id) continue;
          void bildirDuyuru(d);
        }
      });
      return () => {
        unsub();
        ilkSnapshot.current = true;
      };
    }

    const iv = setInterval(() => {
      if (appState.current !== 'active') return;
      void duyuruYukle();
    }, 45000);
    return () => clearInterval(iv);
  }, [duyuruYukle, kullanici?.id]);

  useEffect(() => {
    if (!kullanici?.id || Platform.OS === 'web' || IS_FIREBASE_CONFIGURED) return;
    if (!duyurular.length) return;

    const enYeni = duyurular[0];
    let iptal = false;
    (async () => {
      const onceki = await getItem<string>(lastBildirStorageKey(kullanici.id));
      if (iptal) return;
      if (onceki === null || onceki === undefined) {
        await setItem(lastBildirStorageKey(kullanici.id), enYeni.id);
        return;
      }
      if (onceki !== enYeni.id) {
        if (enYeni.olusturanId !== kullanici.id) {
          await bildirDuyuru(enYeni);
        }
        await setItem(lastBildirStorageKey(kullanici.id), enYeni.id);
      }
    })();
    return () => {
      iptal = true;
    };
  }, [duyurular, kullanici?.id]);

  return null;
}
