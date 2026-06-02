import type { FeaturePaketId } from '../types';
import { dernekPaketAktif } from '../utils/paketler';

export const YONETIM_NAV: {
  to: string;
  label: string;
  paket: FeaturePaketId;
  icon: string;
}[] = [
  { to: '/yonetim/duyurular', label: 'Duyurular', paket: 'duyurular', icon: '📢' },
  { to: '/yonetim/rezervasyonlar', label: 'Rezervasyonlar', paket: 'odalar', icon: '🏠' },
  { to: '/yonetim/odalar', label: 'Odalar', paket: 'odalar', icon: '🚪' },
  { to: '/yonetim/kutuphane', label: 'Kütüphane', paket: 'kutuphane', icon: '📚' },
  { to: '/yonetim/etkinlikler', label: 'Etkinlikler', paket: 'etkinlikler', icon: '🗓️' },
  { to: '/yonetim/burslar', label: 'Burslar', paket: 'burslar', icon: '🎓' },
  { to: '/yonetim/aidat', label: 'Aidat', paket: 'aidat', icon: '💳' },
  { to: '/yonetim/gonulluluk', label: 'Gönüllülük', paket: 'gonulluluk', icon: '🤝' },
  { to: '/yonetim/envanter', label: 'Envanter', paket: 'envanter', icon: '📦' },
];

export function aktifYonetimNav(paketler: FeaturePaketId[] | undefined) {
  return YONETIM_NAV.filter((item) => dernekPaketAktif(paketler, item.paket));
}
