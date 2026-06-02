/**
 * Özellik paketleri — her dernek `dernekler.paketler` içinde hangilerinin açık olduğunu tutar.
 * Yeni modül eklerken buraya id + etiket ekleyin; MainNavigator / DataContext ile hizalayın.
 */
export const FEATURE_PAKETLERI = [
  { id: 'duyurular', etiket: 'Duyurular', aciklama: 'Ana sayfa ve duyuru yönetimi' },
  { id: 'odalar', etiket: 'Odalar & rezervasyon', aciklama: 'Oda listesi ve rezervasyon takvimi' },
  { id: 'kutuphane', etiket: 'Kütüphane', aciklama: 'Kitap ve ödünç işlemleri' },
  { id: 'etkinlikler', etiket: 'Etkinlikler', aciklama: 'Etkinlik takvimi ve katılım' },
  { id: 'burslar', etiket: 'Burslar', aciklama: 'Burs programları ve başvurular' },
  { id: 'aidat', etiket: 'Aidat', aciklama: 'Aylık aidat ve dekont onayı' },
  { id: 'uyelik', etiket: 'Üyelik yönetimi', aciklama: 'Üye onayı ve üyelik ekranı' },
  { id: 'acikKapali', etiket: 'Açık / kapalı durumu', aciklama: 'Derneğin üyelere açık veya kapalı olduğunu gösterir ve yönetir' },
  { id: 'gonulluluk', etiket: 'Gönüllülük & görevler', aciklama: 'Gönüllü ilanları, başvuru ve onay' },
  { id: 'envanter', etiket: 'Envanter takibi', aciklama: 'Demirbaş, zimmet ve iade' },
] as const;

export type FeaturePaketId = (typeof FEATURE_PAKETLERI)[number]['id'];

export const TUM_PAKET_IDLERI: FeaturePaketId[] = FEATURE_PAKETLERI.map((p) => p.id);

export function varsayilanPaketler(): FeaturePaketId[] {
  return [...TUM_PAKET_IDLERI];
}
