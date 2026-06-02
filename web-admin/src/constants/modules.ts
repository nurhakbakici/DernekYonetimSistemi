import type { FeaturePaketId } from '../types';

export type ModuleAccent = 'blue' | 'green' | 'amber' | 'purple' | 'cyan' | 'red' | 'gold';

export const FEATURE_PAKETLERI: {
  id: FeaturePaketId;
  etiket: string;
  aciklama: string;
  icon: string;
  accent: ModuleAccent;
}[] = [
  { id: 'duyurular', etiket: 'Duyurular', aciklama: 'Ana sayfa ve duyuru yönetimi', icon: '📢', accent: 'blue' },
  { id: 'odalar', etiket: 'Odalar & rezervasyon', aciklama: 'Oda listesi ve rezervasyon takvimi', icon: '🏠', accent: 'cyan' },
  { id: 'kutuphane', etiket: 'Kütüphane', aciklama: 'Kitap ve ödünç işlemleri', icon: '📚', accent: 'green' },
  { id: 'etkinlikler', etiket: 'Etkinlikler', aciklama: 'Etkinlik takvimi ve katılım', icon: '🗓️', accent: 'purple' },
  { id: 'burslar', etiket: 'Burslar', aciklama: 'Burs programları ve başvurular', icon: '🎓', accent: 'amber' },
  { id: 'aidat', etiket: 'Aidat', aciklama: 'Aylık aidat ve dekont onayı', icon: '💳', accent: 'gold' },
  { id: 'uyelik', etiket: 'Üyelik yönetimi', aciklama: 'Üye onayı ve üyelik ekranı', icon: '👤', accent: 'red' },
  { id: 'acikKapali', etiket: 'Açık / kapalı', aciklama: 'Dernek açılış durumu ve bilgilendirme mesajı', icon: '🚪', accent: 'green' },
  { id: 'gonulluluk', etiket: 'Gönüllülük', aciklama: 'Gönüllü görev ilanları ve başvurular', icon: '🤝', accent: 'cyan' },
  { id: 'envanter', etiket: 'Envanter', aciklama: 'Demirbaş listesi ve zimmet', icon: '📦', accent: 'amber' },
];

export const TUM_PAKET_IDLERI: FeaturePaketId[] = FEATURE_PAKETLERI.map((p) => p.id);
