import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { onSnapshot, query, collection, orderBy, limit, where } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { db, IS_FIREBASE_CONFIGURED } from '../config/firebase';
import type { KullaniciBildirimi } from '../types';

const ANDROID_CHANNEL_ID = 'hatirlatmalar';

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

async function bildirHatirlatma(b: KullaniciBildirimi) {
  if (Platform.OS === 'web') return;
  const Notifications = await notificationsModulu();
  if (!Notifications) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: b.baslik,
        body: b.icerik.length > 180 ? `${b.icerik.slice(0, 177)}…` : b.icerik,
        data: { bildirimId: b.id, tur: b.tur, ilgiliKayitId: b.ilgiliKayitId },
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
 * Web yöneticisinin gönderdiği kişisel hatırlatmalar (gecikmiş kitap / aidat).
 */
export default function KullaniciBildirimBridge() {
  const { kullanici, aktifDernekId } = useAuth();
  const ilkSnapshot = useRef(true);

  useEffect(() => {
    if (Platform.OS === 'web' || !bildirimModuluKullanma()) return;
    let iptal = false;
    void (async () => {
      const Notifications = await notificationsModulu();
      if (iptal || !Notifications) return;
      if (Platform.OS === 'android') {
        void Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
          name: 'Hatırlatmalar',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
        });
      }
    })();
    return () => { iptal = true; };
  }, []);

  useEffect(() => {
    if (!kullanici?.id || !aktifDernekId || Platform.OS === 'web' || !IS_FIREBASE_CONFIGURED) return;

    const q = query(
      collection(db, 'kullaniciBildirimleri'),
      where('dernekId', '==', aktifDernekId),
      where('kullaniciId', '==', kullanici.id),
      orderBy('olusturulmaTarihi', 'desc'),
      limit(25),
    );

    const unsub = onSnapshot(q, (snap) => {
      if (ilkSnapshot.current) {
        ilkSnapshot.current = false;
        return;
      }
      for (const change of snap.docChanges()) {
        if (change.type !== 'added') continue;
        const b = { id: change.doc.id, ...change.doc.data() } as KullaniciBildirimi;
        void bildirHatirlatma(b);
      }
    });

    return () => {
      unsub();
      ilkSnapshot.current = true;
    };
  }, [kullanici?.id, aktifDernekId]);

  return null;
}
