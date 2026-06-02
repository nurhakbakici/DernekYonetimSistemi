import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

/** Virgülle ayrılmış platform yönetici e-postaları (`.env` → `VITE_PLATFORM_ADMIN_EMAILS`). */
function platformAdminEmailsFromEnv(): string[] {
  const raw = import.meta.env.VITE_PLATFORM_ADMIN_EMAILS as string | undefined;
  return (raw ?? 'admin@kulesakinleri.com')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export async function platformYoneticiMi(uid: string, email: string | null | undefined): Promise<boolean> {
  const snap = await getDoc(doc(db, 'platformYoneticiler', uid));
  if (snap.exists()) return true;
  const mail = email?.trim().toLowerCase();
  if (!mail) return false;
  return platformAdminEmailsFromEnv().includes(mail);
}

export function firebaseHataMetni(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err) {
    const code = String((err as { code: string }).code);
    if (code === 'permission-denied') {
      return 'Yetki reddedildi. Firestore kurallarını dağıttığınızdan ve platform yöneticisi olduğunuzdan emin olun.';
    }
    if ('message' in err && typeof (err as { message: string }).message === 'string') {
      return (err as { message: string }).message;
    }
  }
  if (err instanceof Error) return err.message;
  return 'İşlem başarısız.';
}
