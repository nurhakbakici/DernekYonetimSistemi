import type { User, UserRole } from '../types';

export function normalizeUserRole(rol: unknown): UserRole {
  if (rol === 'admin' || rol === 'uye' || rol === 'aday') return rol;
  return 'uye';
}

/** Oturum açılabilir mi (pasif hariç; aday her zaman; üye/yönetici yalnızca üyelik aktif). */
export function kullaniciGirebilirMi(u: Pick<User, 'rol' | 'uyelikDurumu'>): boolean {
  if (u.uyelikDurumu === 'pasif') return false;
  if (u.rol === 'aday') return true;
  return u.uyelikDurumu === 'aktif';
}

/** Odalar, kütüphane, aidat vb. tam üye özellikleri. */
export function tamUyeOzelliklerineErisir(u: User | null | undefined): boolean {
  if (!u || u.uyelikDurumu === 'pasif') return false;
  if (u.rol === 'aday') return false;
  if (u.rol === 'admin') return true;
  return u.uyelikDurumu === 'aktif';
}

export function rolGosterimMetni(rol: UserRole): string {
  switch (rol) {
    case 'admin':
      return 'Yönetici';
    case 'aday':
      return 'Aday Üye';
    default:
      return 'Üye';
  }
}
