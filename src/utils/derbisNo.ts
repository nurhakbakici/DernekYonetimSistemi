/** DERBİS (Dernek Bilgi Sistemi) kayıt numarası — boşlukları temizler. */
export function normalizeDerbisNo(raw: string): string {
  return raw.trim().replace(/\s/g, '');
}

export function validateDerbisNo(raw: string): string {
  const n = normalizeDerbisNo(raw);
  if (!n) {
    throw new Error('DERBİS numarası zorunludur.');
  }
  const digits = n.replace(/-/g, '');
  if (!/^\d+$/.test(digits)) {
    throw new Error('DERBİS numarası yalnızca rakam içermelidir.');
  }
  if (digits.length < 4 || digits.length > 15) {
    throw new Error('DERBİS numarası 4–15 haneli olmalıdır.');
  }
  return digits;
}
