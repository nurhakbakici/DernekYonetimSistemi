import { useState, useCallback, MutableRefObject } from 'react';
import type { GonulluGorev, GonulluBasvuru, Envanter, EnvanterZimmet } from '../types';
import { getItem, setItem, KEYS } from '../config/storage';
import { IS_FIREBASE_CONFIGURED } from '../config/firebase';

type YukleFn = <T>(fsCol: string, localKey: string, setter: (v: T[]) => void) => Promise<void>;
type FsAddFn = <T extends { id?: string }>(col: string, data: Omit<T, 'id'>) => Promise<string>;
type FsUpdateFn = (col: string, id: string, data: object) => Promise<void>;
type FsDeleteFn = (col: string, id: string) => Promise<void>;
type FirestoreTemizFn = <T extends Record<string, unknown>>(obj: T) => T;

function onayliBasvuruSayisi(basvurular: GonulluBasvuru[], gorevId: string): number {
  return basvurular.filter(b => b.gorevId === gorevId && b.durum === 'onaylandi').length;
}

export function useGonullulukEnvanterSlice(deps: {
  tenantIdRef: MutableRefObject<string | null>;
  yukle: YukleFn;
  fsAdd: FsAddFn;
  fsUpdate: FsUpdateFn;
  fsDelete: FsDeleteFn;
  firestoreTemiz: FirestoreTemizFn;
}) {
  const { tenantIdRef, yukle, fsAdd, fsUpdate, fsDelete, firestoreTemiz } = deps;

  const [gonulluGorevler, setGonulluGorevler] = useState<GonulluGorev[]>([]);
  const [gonulluBasvurular, setGonulluBasvurular] = useState<GonulluBasvuru[]>([]);
  const [envanterKayitlari, setEnvanterKayitlari] = useState<Envanter[]>([]);
  const [envanterZimmetler, setEnvanterZimmetler] = useState<EnvanterZimmet[]>([]);

  const reset = useCallback(() => {
    setGonulluGorevler([]);
    setGonulluBasvurular([]);
    setEnvanterKayitlari([]);
    setEnvanterZimmetler([]);
  }, []);

  const gonulluGorevYukle = useCallback(
    () => yukle<GonulluGorev>('gonulluGorevler', KEYS.GONULLU_GOREVLER, setGonulluGorevler),
    [yukle],
  );
  const gonulluBasvuruYukle = useCallback(
    () => yukle<GonulluBasvuru>('gonulluBasvurular', KEYS.GONULLU_BASVURULAR, setGonulluBasvurular),
    [yukle],
  );
  const envanterYukle = useCallback(
    () => yukle<Envanter>('envanterler', KEYS.ENVANTER, setEnvanterKayitlari),
    [yukle],
  );
  const envanterZimmetYukle = useCallback(
    () => yukle<EnvanterZimmet>('envanterZimmetler', KEYS.ENVANTER_ZIMMET, setEnvanterZimmetler),
    [yukle],
  );

  const gonulluGorevEkle = useCallback(async (gorev: Omit<GonulluGorev, 'id' | 'olusturulmaTarihi'>) => {
    const data = {
      ...gorev,
      durum: gorev.durum ?? 'acik',
      olusturulmaTarihi: new Date().toISOString(),
    };
    if (IS_FIREBASE_CONFIGURED) {
      const tid = tenantIdRef.current;
      if (!tid) throw new Error('Dernek bağlamı yok.');
      const id = await fsAdd('gonulluGorevler', { ...data, dernekId: tid } as Omit<GonulluGorev, 'id'>);
      setGonulluGorevler(prev => [...prev, { ...data, id, dernekId: tid }]);
    } else {
      const yeni: GonulluGorev = { ...data, id: `gorev-${Date.now()}` };
      const guncel = [...gonulluGorevler, yeni];
      await setItem(KEYS.GONULLU_GOREVLER, guncel);
      setGonulluGorevler(guncel);
    }
  }, [gonulluGorevler, fsAdd, tenantIdRef]);

  const gonulluGorevGuncelle = useCallback(async (id: string, veri: Partial<GonulluGorev>) => {
    if (IS_FIREBASE_CONFIGURED) await fsUpdate('gonulluGorevler', id, firestoreTemiz(veri as Record<string, unknown>));
    const guncel = gonulluGorevler.map(g => (g.id === id ? { ...g, ...veri } : g));
    if (!IS_FIREBASE_CONFIGURED) await setItem(KEYS.GONULLU_GOREVLER, guncel);
    setGonulluGorevler(guncel);
  }, [gonulluGorevler, fsUpdate, firestoreTemiz]);

  const gonulluGorevSil = useCallback(async (id: string) => {
    if (IS_FIREBASE_CONFIGURED) {
      await fsDelete('gonulluGorevler', id);
      const ilgili = gonulluBasvurular.filter(b => b.gorevId === id);
      for (const b of ilgili) await fsDelete('gonulluBasvurular', b.id);
      setGonulluBasvurular(prev => prev.filter(b => b.gorevId !== id));
      setGonulluGorevler(prev => prev.filter(g => g.id !== id));
    } else {
      const gBasvuru = gonulluBasvurular.filter(b => b.gorevId !== id);
      const gGorev = gonulluGorevler.filter(g => g.id !== id);
      await setItem(KEYS.GONULLU_BASVURULAR, gBasvuru);
      await setItem(KEYS.GONULLU_GOREVLER, gGorev);
      setGonulluBasvurular(gBasvuru);
      setGonulluGorevler(gGorev);
    }
  }, [gonulluGorevler, gonulluBasvurular, fsDelete]);

  const gonulluBasvur = useCallback(async (
    gorevId: string,
    gorevBaslik: string,
    kullaniciId: string,
    kullaniciAdi: string,
  ) => {
    const gorev = gonulluGorevler.find(g => g.id === gorevId);
    if (!gorev) throw new Error('Görev bulunamadı.');
    if (gorev.durum !== 'acik') throw new Error('Bu göreve başvuru kapalı.');
    if (gonulluBasvurular.some(b => b.gorevId === gorevId && b.kullaniciId === kullaniciId)) {
      throw new Error('Bu göreve zaten başvurdunuz.');
    }
    const onayli = onayliBasvuruSayisi(gonulluBasvurular, gorevId);
    if (onayli >= gorev.kontenjan) throw new Error('Kontenjan dolu.');

    const data: Omit<GonulluBasvuru, 'id'> = {
      gorevId,
      gorevBaslik,
      kullaniciId,
      kullaniciAdi,
      basvuruTarihi: new Date().toISOString().split('T')[0],
      durum: 'beklemede',
    };
    if (IS_FIREBASE_CONFIGURED) {
      const tid = tenantIdRef.current;
      if (!tid) throw new Error('Dernek bağlamı yok.');
      const id = await fsAdd('gonulluBasvurular', { ...data, dernekId: tid });
      setGonulluBasvurular(prev => [...prev, { ...data, id, dernekId: tid }]);
    } else {
      const yeni: GonulluBasvuru = { ...data, id: `gb-${Date.now()}` };
      const guncel = [...gonulluBasvurular, yeni];
      await setItem(KEYS.GONULLU_BASVURULAR, guncel);
      setGonulluBasvurular(guncel);
    }
  }, [gonulluGorevler, gonulluBasvurular, fsAdd, tenantIdRef]);

  const gonulluBasvuruGuncelle = useCallback(async (id: string, durum: GonulluBasvuru['durum']) => {
    const basvuru = gonulluBasvurular.find(b => b.id === id);
    if (!basvuru) throw new Error('Başvuru bulunamadı.');
    if (durum === 'onaylandi') {
      const gorev = gonulluGorevler.find(g => g.id === basvuru.gorevId);
      if (gorev && onayliBasvuruSayisi(gonulluBasvurular, basvuru.gorevId) >= gorev.kontenjan) {
        throw new Error('Kontenjan dolu; onay verilemez.');
      }
    }
    if (IS_FIREBASE_CONFIGURED) await fsUpdate('gonulluBasvurular', id, { durum });
    const guncel = gonulluBasvurular.map(b => (b.id === id ? { ...b, durum } : b));
    if (!IS_FIREBASE_CONFIGURED) await setItem(KEYS.GONULLU_BASVURULAR, guncel);
    setGonulluBasvurular(guncel);
  }, [gonulluBasvurular, gonulluGorevler, fsUpdate]);

  const envanterEkle = useCallback(async (kayit: Omit<Envanter, 'id' | 'olusturulmaTarihi'>) => {
    const data = {
      ...kayit,
      musaitAdet: kayit.musaitAdet ?? kayit.toplamAdet,
      olusturulmaTarihi: new Date().toISOString().split('T')[0],
    };
    if (IS_FIREBASE_CONFIGURED) {
      const tid = tenantIdRef.current;
      if (!tid) throw new Error('Dernek bağlamı yok.');
      const id = await fsAdd('envanterler', { ...data, dernekId: tid } as Omit<Envanter, 'id'>);
      setEnvanterKayitlari(prev => [...prev, { ...data, id, dernekId: tid }]);
    } else {
      const yeni: Envanter = { ...data, id: `env-${Date.now()}` };
      const guncel = [...envanterKayitlari, yeni];
      await setItem(KEYS.ENVANTER, guncel);
      setEnvanterKayitlari(guncel);
    }
  }, [envanterKayitlari, fsAdd, tenantIdRef]);

  const envanterGuncelle = useCallback(async (id: string, veri: Partial<Envanter>) => {
    const mevcut = envanterKayitlari.find(e => e.id === id);
    if (!mevcut) throw new Error('Kayıt bulunamadı.');
    if (veri.toplamAdet !== undefined || veri.musaitAdet !== undefined) {
      const toplam = veri.toplamAdet ?? mevcut.toplamAdet;
      const musait = veri.musaitAdet ?? mevcut.musaitAdet;
      if (musait > toplam) throw new Error('Müsait adet toplam adetten fazla olamaz.');
      const aktifZimmet = envanterZimmetler.filter(
        z => z.envanterId === id && z.durum === 'aktif',
      ).length;
      if (toplam - musait < aktifZimmet) {
        throw new Error('Aktif zimmet sayısı müsait adet ile uyumsuz.');
      }
    }
    if (IS_FIREBASE_CONFIGURED) await fsUpdate('envanterler', id, firestoreTemiz(veri as Record<string, unknown>));
    const guncel = envanterKayitlari.map(e => (e.id === id ? { ...e, ...veri } : e));
    if (!IS_FIREBASE_CONFIGURED) await setItem(KEYS.ENVANTER, guncel);
    setEnvanterKayitlari(guncel);
  }, [envanterKayitlari, envanterZimmetler, fsUpdate, firestoreTemiz]);

  const envanterSil = useCallback(async (id: string) => {
    const aktif = envanterZimmetler.some(z => z.envanterId === id && z.durum === 'aktif');
    if (aktif) throw new Error('Aktif zimmeti olan demirbaş silinemez.');
    if (IS_FIREBASE_CONFIGURED) {
      await fsDelete('envanterler', id);
      const ilgili = envanterZimmetler.filter(z => z.envanterId === id);
      for (const z of ilgili) await fsDelete('envanterZimmetler', z.id);
      setEnvanterZimmetler(prev => prev.filter(z => z.envanterId !== id));
      setEnvanterKayitlari(prev => prev.filter(e => e.id !== id));
    } else {
      const gZimmet = envanterZimmetler.filter(z => z.envanterId !== id);
      const gEnvanter = envanterKayitlari.filter(e => e.id !== id);
      await setItem(KEYS.ENVANTER_ZIMMET, gZimmet);
      await setItem(KEYS.ENVANTER, gEnvanter);
      setEnvanterZimmetler(gZimmet);
      setEnvanterKayitlari(gEnvanter);
    }
  }, [envanterKayitlari, envanterZimmetler, fsDelete]);

  const envanterZimmetVer = useCallback(async (
    envanterId: string,
    envanterAd: string,
    kullaniciId: string,
    kullaniciAdi: string,
    planlananIade?: string,
    not?: string,
  ) => {
    const env = envanterKayitlari.find(e => e.id === envanterId);
    if (!env) throw new Error('Demirbaş bulunamadı.');
    if (env.musaitAdet < 1) throw new Error('Stokta müsait adet yok.');
    if (env.durum === 'arizali') throw new Error('Arızalı demirbaş zimmetlenemez.');

    const data: Omit<EnvanterZimmet, 'id'> = {
      envanterId,
      envanterAd,
      kullaniciId,
      kullaniciAdi,
      zimmetTarihi: new Date().toISOString().split('T')[0],
      durum: 'aktif',
      ...(planlananIade ? { planlananIade } : {}),
      ...(not ? { not } : {}),
    };

    const yeniMusait = env.musaitAdet - 1;
    if (IS_FIREBASE_CONFIGURED) {
      const tid = tenantIdRef.current;
      if (!tid) throw new Error('Dernek bağlamı yok.');
      const id = await fsAdd('envanterZimmetler', { ...data, dernekId: tid });
      await fsUpdate('envanterler', envanterId, { musaitAdet: yeniMusait });
      setEnvanterKayitlari(prev => prev.map(e => (
        e.id === envanterId ? { ...e, musaitAdet: yeniMusait } : e
      )));
      setEnvanterZimmetler(prev => [...prev, { ...data, id, dernekId: tid }]);
    } else {
      const yeni: EnvanterZimmet = { ...data, id: `zim-${Date.now()}` };
      const gZimmet = [...envanterZimmetler, yeni];
      const gEnvanter = envanterKayitlari.map(e => (
        e.id === envanterId ? { ...e, musaitAdet: yeniMusait } : e
      ));
      await setItem(KEYS.ENVANTER_ZIMMET, gZimmet);
      await setItem(KEYS.ENVANTER, gEnvanter);
      setEnvanterZimmetler(gZimmet);
      setEnvanterKayitlari(gEnvanter);
    }
  }, [envanterKayitlari, envanterZimmetler, fsAdd, fsUpdate, tenantIdRef]);

  const envanterZimmetIade = useCallback(async (zimmetId: string) => {
    const zimmet = envanterZimmetler.find(z => z.id === zimmetId);
    if (!zimmet || zimmet.durum !== 'aktif') throw new Error('Zimmet kaydı bulunamadı.');
    const env = envanterKayitlari.find(e => e.id === zimmet.envanterId);
    if (!env) throw new Error('Demirbaş bulunamadı.');

    const bugun = new Date().toISOString().split('T')[0];
    const yeniMusait = Math.min(env.toplamAdet, env.musaitAdet + 1);
    const patch = { durum: 'iade_edildi' as const, gercekIadeTarihi: bugun };

    if (IS_FIREBASE_CONFIGURED) {
      await fsUpdate('envanterZimmetler', zimmetId, patch);
      await fsUpdate('envanterler', zimmet.envanterId, { musaitAdet: yeniMusait });
    }
    const gZimmet = envanterZimmetler.map(z => (z.id === zimmetId ? { ...z, ...patch } : z));
    const gEnvanter = envanterKayitlari.map(e => (
      e.id === zimmet.envanterId ? { ...e, musaitAdet: yeniMusait } : e
    ));
    if (!IS_FIREBASE_CONFIGURED) {
      await setItem(KEYS.ENVANTER_ZIMMET, gZimmet);
      await setItem(KEYS.ENVANTER, gEnvanter);
    }
    setEnvanterZimmetler(gZimmet);
    setEnvanterKayitlari(gEnvanter);
  }, [envanterKayitlari, envanterZimmetler, fsUpdate]);

  return {
    gonulluGorevler,
    gonulluBasvurular,
    envanterKayitlari,
    envanterZimmetler,
    resetGonullulukEnvanter: reset,
    gonulluGorevYukle,
    gonulluBasvuruYukle,
    envanterYukle,
    envanterZimmetYukle,
    gonulluGorevEkle,
    gonulluGorevGuncelle,
    gonulluGorevSil,
    gonulluBasvur,
    gonulluBasvuruGuncelle,
    envanterEkle,
    envanterGuncelle,
    envanterSil,
    envanterZimmetVer,
    envanterZimmetIade,
    onayliBasvuruSayisi: (gorevId: string) => onayliBasvuruSayisi(gonulluBasvurular, gorevId),
  };
}

export type GonullulukEnvanterSlice = ReturnType<typeof useGonullulukEnvanterSlice>;
