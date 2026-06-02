import type { FeaturePaketId } from '../types';

export function dernekPaketAktif(
  paketler: FeaturePaketId[] | undefined,
  paketId: FeaturePaketId,
): boolean {
  return (paketler ?? []).includes(paketId);
}

/** Dashboard alt başlığı için aktif modül özet etiketleri */
export function dashboardOzetMetni(paketler: FeaturePaketId[] | undefined): string {
  const parcalar: string[] = [];
  if (dernekPaketAktif(paketler, 'uyelik')) parcalar.push('üyelik');
  if (dernekPaketAktif(paketler, 'odalar')) parcalar.push('rezervasyon');
  if (dernekPaketAktif(paketler, 'etkinlikler')) parcalar.push('etkinlik');
  if (dernekPaketAktif(paketler, 'burslar')) parcalar.push('burs');
  if (dernekPaketAktif(paketler, 'aidat')) parcalar.push('aidat');
  if (dernekPaketAktif(paketler, 'kutuphane')) parcalar.push('kütüphane');
  if (dernekPaketAktif(paketler, 'gonulluluk')) parcalar.push('gönüllülük');
  if (dernekPaketAktif(paketler, 'envanter')) parcalar.push('envanter');
  if (parcalar.length === 0) return 'Seçili modüllere göre özet';
  return `${parcalar.join(', ')} özeti`;
}
