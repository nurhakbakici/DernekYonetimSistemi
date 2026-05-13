/** Firebase Auth `auth/...` kodunu hatadan çıkarır. */
function authHataKodu(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const c = (error as { code?: unknown }).code;
    if (typeof c === 'string' && c.startsWith('auth/')) return c;
  }
  if (error instanceof Error) {
    const m = /\((auth\/[^)]+)\)/.exec(error.message);
    if (m) return m[1];
  }
  return undefined;
}

const TR: Record<string, string> = {
  'auth/email-already-in-use':
    'Bu e-posta Firebase’de oturum açma (Authentication) tarafında zaten var; Firestore’daki kullanıcı dokümanı olmayabilir. '
    + 'Konsolda Authentication → Users listesine bakın. Giriş yapın, şifre sıfırlayın veya yöneticiden çift kaydı temizlemesini isteyin.',
  'auth/invalid-email': 'Geçersiz e-posta adresi.',
  'auth/weak-password': 'Şifre çok zayıf. En az 6 karakter ve daha güçlü bir şifre seçin.',
  'auth/network-request-failed': 'Ağ hatası. İnternet bağlantınızı kontrol edin.',
  'auth/too-many-requests': 'Çok fazla deneme yapıldı. Lütfen bir süre sonra tekrar deneyin.',
  'auth/operation-not-allowed': 'Bu giriş yöntemi şu an kullanılamıyor. Yönetici ile iletişime geçin.',
  'auth/user-disabled': 'Bu hesap devre dışı bırakılmış.',
  'auth/user-not-found': 'E-posta veya şifre hatalı.',
  'auth/wrong-password': 'E-posta veya şifre hatalı.',
  'auth/invalid-credential': 'E-posta veya şifre hatalı.',
  'auth/invalid-login-credentials': 'E-posta veya şifre hatalı.',
  'auth/missing-email': 'E-posta adresi gerekli.',
  'auth/missing-password': 'Şifre gerekli.',
  'auth/internal-error': 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.',
  'auth/account-exists-with-different-credential':
    'Bu e-posta farklı bir giriş yöntemiyle kayıtlı.',
  'auth/requires-recent-login':
    'Güvenlik nedeniyle şifre değiştirmek için önce çıkış yapıp tekrar giriş yapmanız gerekir.',
};

/**
 * Kayıt / giriş ekranlarında gösterilecek kullanıcı dostu metin.
 * Uygulamanın kendi Türkçe `Error` mesajlarını aynen döndürür.
 */
export function firebaseAuthHataMetni(error: unknown): string {
  const kod = authHataKodu(error);
  if (kod && TR[kod]) return TR[kod];

  if (error instanceof Error) {
    const { message } = error;
    /* Sadece Firebase Auth biçimi; "permissions" vb. içinde yanlışlıkla "auth" yakalanmasın */
    const firebaseAuthUyarisi =
      message.startsWith('Firebase:') || /\((auth\/[^)]+)\)/.test(message);
    if (firebaseAuthUyarisi) {
      return kod ? (TR[kod] ?? 'İşlem tamamlanamadı. Lütfen bilgilerinizi kontrol edin.') : 'İşlem tamamlanamadı. Lütfen bilgilerinizi kontrol edin.';
    }
    return message;
  }
  return 'Beklenmeyen bir hata oluştu.';
}
