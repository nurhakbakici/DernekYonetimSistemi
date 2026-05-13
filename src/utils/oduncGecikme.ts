import { OduncAlma } from '../types';

/** YYYY-MM-DD (yerel gün, ISO ile uyumlu karşılaştırma) */
export function bugununTarihStr(): string {
  return new Date().toISOString().split('T')[0];
}

/** İade tarihi geçmiş aktif kayıtları gecikti yapar; yanlışlıkla gecikmiş işaretlenmiş ama tarih uzatılmışsa aktife döner. */
export function oduncKayitlarindaGecikmeleriIsle(kayitlar: OduncAlma[]): OduncAlma[] {
  const bugun = bugununTarihStr();
  return kayitlar.map(o => {
    if (o.durum === 'iade_edildi') return o;
    if (o.durum === 'aktif' && o.iadeTarihi < bugun) return { ...o, durum: 'gecikti' as const };
    if (o.durum === 'gecikti' && o.iadeTarihi >= bugun) return { ...o, durum: 'aktif' as const };
    return o;
  });
}

export function oduncGecikmeDegisenler(onceki: OduncAlma[], sonraki: OduncAlma[]): OduncAlma[] {
  const mapOnce = new Map(onceki.map(o => [o.id, o]));
  return sonraki.filter(s => {
    const eski = mapOnce.get(s.id);
    return eski && eski.durum !== s.durum;
  });
}
