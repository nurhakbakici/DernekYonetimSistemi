import type { Burs } from '../types';

const BURS_PROGRAM_SURESI_VARSAYILAN = 12;

/** Kayıtta süre yoksa veya geçersizse varsayılan ay sayısı. */
export function bursProgramSuresiAy(burs: Pick<Burs, 'programSuresiAy'> | null | undefined): number {
  const n = burs?.programSuresiAy;
  if (typeof n === 'number' && Number.isFinite(n) && n >= 1 && n <= 120) return Math.floor(n);
  return BURS_PROGRAM_SURESI_VARSAYILAN;
}
