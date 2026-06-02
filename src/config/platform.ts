/**
 * Platform yöneticisi: yalnızca bu UID’ler dernek açılış başvurularını onaylayabilir.
 * Firestore `platformYoneticiler/{uid}` dokümanı da aynı anlama gelir (kurallar için).
 *
 * İstemci tarafı: `EXPO_PUBLIC_PLATFORM_ADMIN_UIDS` virgülle ayrılmış Firebase Auth UID listesi.
 */
export function parsePlatformAdminUidsFromEnv(): string[] {
  const raw = process.env.EXPO_PUBLIC_PLATFORM_ADMIN_UIDS ?? '';
  return raw
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean);
}

export function isPlatformAdminFromEnv(uid: string | undefined | null): boolean {
  if (!uid) return false;
  return parsePlatformAdminUidsFromEnv().includes(uid);
}
