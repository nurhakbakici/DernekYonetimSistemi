/** Boşluk ve TR dışı karakterleri temizler; büyük harf. */
export function ibanNormalizeTr(ham: string): string {
  return ham.replace(/\s+/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** ISO 13616 mod 97-1 (IBAN doğrulama). */
function ibanMod97EsitBir(normalized: string): boolean {
  const yeniden = normalized.slice(4) + normalized.slice(0, 4);
  let genisletilmis = '';
  for (let i = 0; i < yeniden.length; i++) {
    const c = yeniden[i]!;
    if (c >= '0' && c <= '9') genisletilmis += c;
    else if (c >= 'A' && c <= 'Z') genisletilmis += (c.charCodeAt(0) - 55).toString();
    else return false;
  }
  let kalan = 0;
  for (let i = 0; i < genisletilmis.length; i++) {
    kalan = (kalan * 10 + parseInt(genisletilmis[i]!, 10)) % 97;
  }
  return kalan === 1;
}

/** Türkiye IBAN: TR + 24 rakam (26 karakter), kontrol basamakları dahil. */
export function ibanGecerliTr(normalized: string): boolean {
  if (!/^TR\d{24}$/.test(normalized)) return false;
  return ibanMod97EsitBir(normalized);
}

/** Gruplu gösterim (TR00 0000 …). */
export function ibanFormatlaGosterim(normalized: string): string {
  const s = ibanNormalizeTr(normalized);
  if (s.length <= 4) return s;
  return s.replace(/(.{4})/g, '$1 ').trim();
}
