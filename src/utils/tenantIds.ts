/** Firestore `uyelikler` belge kimliği: kullanıcı + dernek eşleşmesi tekil olsun. */
export function uyelikBelgeId(userId: string, dernekId: string): string {
  return `${userId}_${dernekId}`;
}

export function rastgeleKatilimKodu(uzunluk = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < uzunluk; i++) {
    s += chars[Math.floor(Math.random() * chars.length)];
  }
  return s;
}
