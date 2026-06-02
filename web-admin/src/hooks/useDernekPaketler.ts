import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dernekGetir } from '../services/dernek';
import type { FeaturePaketId } from '../types';

export function useDernekPaketler() {
  const { seciliDernekId, seciliDernekAd } = useAuth();
  const [paketler, setPaketler] = useState<FeaturePaketId[] | undefined>();
  const [yukleniyor, setYukleniyor] = useState(true);

  const yukle = useCallback(async () => {
    if (!seciliDernekId) return;
    setYukleniyor(true);
    try {
      const d = await dernekGetir(seciliDernekId);
      setPaketler(d?.paketler);
    } finally {
      setYukleniyor(false);
    }
  }, [seciliDernekId]);

  useEffect(() => { void yukle(); }, [yukle]);

  return { seciliDernekId, seciliDernekAd, paketler, yukleniyor, yenile: yukle };
}
