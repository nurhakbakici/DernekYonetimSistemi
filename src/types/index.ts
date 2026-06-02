import type { FeaturePaketId } from '../constants/featurePackages';

export type UserRole = 'admin' | 'uye' | 'aday';

/** Firestore `users/{uid}` — kiracıdan bağımsız profil (rol burada tutulmaz). */
export interface UserProfile {
  id: string;
  ad: string;
  soyad: string;
  email: string;
  telefon?: string;
  olusturulmaTarihi: string;
}

/** Firestore `uyelikler/{userId}_{dernekId}` */
export interface Uyelik {
  id: string;
  userId: string;
  dernekId: string;
  rol: UserRole;
  uyelikDurumu: 'aktif' | 'pasif' | 'beklemede';
  uyelikBaslangic: string;
  olusturulmaTarihi: string;
}

export type DernekKayitDurumu = 'onay_bekliyor' | 'aktif' | 'reddedildi';

/** Oturum kapalıyken giriş / kayıt ekranında gösterilecek son dernek markası. */
export type GirisMarkasi =
  | { tip: 'genel' }
  | { tip: 'dernek'; ad: string; logoUri: string | null };

/** Firestore `dernekler/{id}` */
export interface DernekFirestore {
  id: string;
  ad: string;
  slug: string;
  /** DERBİS (Dernek Bilgi Sistemi) kayıt numarası. */
  derbisNo?: string;
  durum: DernekKayitDurumu;
  /** Açık özellik paketi id’leri (bkz. `FEATURE_PAKETLERI`). */
  paketler: FeaturePaketId[];
  /** Üyelerin derneğe katılması için paylaşılan kod (büyük harf). Kullanılmayan alan. */
  katilimKodu?: string;
  /**
   * Aidat takibinin başladığı tarih (YYYY-MM-DD).
   * Belirtilmezse `AIDAT_BASLANGIC_YIL`/`AIDAT_BASLANGIC_AY` sabitleri kullanılır.
   */
  aidatBaslangicTarihi?: string;
  olusturanUserId: string;
  olusturulmaTarihi: string;
  onaylayanUserId?: string;
  onayTarihi?: string;
  redMesaji?: string;
  /** Dernek kapalı/açık mesajı (önceki `ayarlar/dernekDurumu` yerine). */
  dernekDurumu?: DernekDurumu;
  aidatAylikMiktar?: number;
  /** HTTPS logo adresi (giriş / ana sayfa). */
  logoUrl?: string;
}

/** Kayıt veya “derneğe bağlan” ekranında listelenen aktif dernek satırı. */
export interface KayitDernekOzeti {
  id: string;
  ad: string;
  logoUrl?: string;
}

/** Oturumdaki birleşik kullanıcı: profil + seçili dernekteki üyelik. */
export interface User {
  id: string;
  ad: string;
  soyad: string;
  email: string;
  telefon?: string;
  rol: UserRole;
  uyelikDurumu: 'aktif' | 'pasif' | 'beklemede';
  uyelikBaslangic: string;
  olusturulmaTarihi: string;
  /** Firebase çok kiracılı modda aktif dernek. Yerel demo modda kullanılmayabilir. */
  dernekId?: string;
}

export interface Oda {
  id: string;
  ad: string;
  aciklama: string;
  kapasite: number;
  ozellikler: string[];
  aktif: boolean;
  resimUrl?: string;
  /** Firebase çok kiracı */
  dernekId?: string;
}

export interface Rezervasyon {
  id: string;
  odaId: string;
  odaAdi: string;
  kullaniciId: string;
  kullaniciAdi: string;
  tarih: string;
  baslangicSaati: string;
  bitisSaati: string;
  amac: string;
  durum: 'beklemede' | 'onaylandi' | 'iptal';
  olusturulmaTarihi: string;
  dernekId?: string;
}

export interface Kitap {
  id: string;
  baslik: string;
  yazar: string;
  isbn?: string;
  kategori: string;
  toplamAdet: number;
  musaitAdet: number;
  aciklama?: string;
  yayinYili?: number;
  resimUrl?: string;
  dernekId?: string;
}

export interface OduncAlma {
  id: string;
  kitapId: string;
  kitapBaslik: string;
  kullaniciId: string;
  kullaniciAdi: string;
  oduncTarihi: string;
  iadeTarihi: string;
  gercekIadeTarihi?: string;
  durum: 'aktif' | 'iade_edildi' | 'gecikti';
  dernekId?: string;
}

/** Başvuruda ayrı yüklenecek zorunlu belge alanı (yönetici burs oluştururken seçer) */
export interface BursGerekliBelge {
  id: string;
  baslik: string;
}

export interface Burs {
  id: string;
  ad: string;
  aciklama: string;
  miktar: number;
  /** Burs programının destek süresi (ay). Eski kayıtlarda yoksa arayüzde varsayılan kullanılır. */
  programSuresiAy?: number;
  saglayanKurum: string;
  sonBasvuruTarihi: string;
  gereksinimler: string[];
  /** Boş veya yoksa başvuruda belge yüklemesi istenmez */
  gerekliBelgeler?: BursGerekliBelge[];
  durum: 'aktif' | 'kapali';
  olusturulmaTarihi: string;
  dernekId?: string;
}

export interface BursBasvurusu {
  id: string;
  bursId: string;
  bursAdi: string;
  kullaniciId: string;
  kullaniciAdi: string;
  basvuruTarihi: string;
  durum: 'beklemede' | 'onaylandi' | 'reddedildi';
  notlar?: string;
  /** Onay sonrası ödeme için başvuranın IBAN’ı (TR…, boşluksuz saklanır) */
  iban?: string;
  ibanGuncellenmeTarihi?: string;
  /** Eski tek belge alanı (geriye dönük uyumluluk) */
  belgeUri?: string;
  /** Belge alanı id → JPEG data URI */
  belgelerUri?: Record<string, string>;
  /** Yalnızca durum onaylandıktan sonra: burs ödemesinin hesaba yatırılıp yatırılmadığı */
  bursOdemeDurumu?: 'beklemede' | 'yatirildi';
  bursOdemeTarihi?: string;
  dernekId?: string;
}

export interface Etkinlik {
  id: string;
  baslik: string;
  aciklama: string;
  tarih: string;
  bitisTarihi?: string;
  /** Seçilen oda adları, virgülle ayrılmış (örn. "Büyük Salon, Strateji Odası") */
  konum: string;
  organizator: string;
  organizatorId: string;
  durum: 'beklemede' | 'onaylandi' | 'iptal';
  maxKatilimci?: number;
  katilimcilar: string[];
  olusturulmaTarihi: string;
  /** Yerel URI veya sıkıştırılmış JPEG data URI (Firestore / yerel depo) */
  gorselUri?: string;
  dernekId?: string;
}

export interface DernekDurumu {
  acik: boolean;
  mesaj?: string;
  guncellenmeTarihi: string;
  guncelleyenKullanici: string;
}

/** Yöneticinin belirli bir üyeye gönderdiği hatırlatma (mobil bildirim + uygulama içi). */
export interface KullaniciBildirimi {
  id: string;
  dernekId: string;
  kullaniciId: string;
  baslik: string;
  icerik: string;
  tur: 'odunc_gecikme' | 'aidat_gecikme';
  ilgiliKayitId: string;
  olusturulmaTarihi: string;
  okundu?: boolean;
  olusturanAdminId: string;
  olusturanAdminAdi: string;
}

/** Yönetici duyurusu; tüm giriş yapmış kullanıcılar görür. */
export interface Duyuru {
  id: string;
  baslik: string;
  icerik: string;
  olusturulmaTarihi: string;
  olusturanId: string;
  olusturanAdi: string;
  /** Yerel dosya URI veya Firebase Storage indirme URL’si */
  gorselUri?: string;
  /** Son düzenleme (isteğe bağlı) */
  guncellenmeTarihi?: string;
  dernekId?: string;
}

/** `duyuruGuncelle` görsel davranışı */
export type DuyuruGorselSecenek = 'degismedi' | { yerelUri: string } | 'kaldir';

/** `etkinlikDetayGuncelle` görsel davranışı (duyurularla aynı model) */
export type EtkinlikGorselSecenek = DuyuruGorselSecenek;

/** Yönetici etkinlik alanı güncellemesi; null = alanı kaldır (bitiş saati / katılım sınırı) */
export type EtkinlikDetayAlanlari = Partial<Pick<Etkinlik, 'baslik' | 'aciklama' | 'tarih' | 'konum'>> & {
  bitisTarihi?: string | null;
  maxKatilimci?: number | null;
};

export interface AidatOdemesi {
  id: string;
  kullaniciId: string;
  kullaniciAdi: string;
  yil: number;
  /** 1–12; aylık aidat için zorunlu (2025 Ocak ve sonrası) */
  ay: number;
  miktar: number;
  /** Yönetici dekontu onayladığında true */
  odendi: boolean;
  odemeTarihi?: string;
  sonOdemeTarihi: string;
  notlar?: string;
  /** JPEG data URI veya (eski kayıtlar) yerel dosya yolu — yeni yüklemeler data URI */
  dekontUri?: string;
  dekontYuklenmeTarihi?: string;
  /** Yönetici reddi; yeni dekont yüklenince temizlenir */
  redAciklamasi?: string;
  onaylayanAdminId?: string;
  onaylayanAdminAdi?: string;
  dernekId?: string;
}

export interface GonulluGorev {
  id: string;
  baslik: string;
  aciklama: string;
  tarih: string;
  baslangicSaati?: string;
  bitisSaati?: string;
  konum?: string;
  kontenjan: number;
  durum: 'acik' | 'kapali' | 'tamamlandi';
  olusturanId: string;
  olusturanAdi: string;
  olusturulmaTarihi: string;
  dernekId?: string;
}

export interface GonulluBasvuru {
  id: string;
  gorevId: string;
  gorevBaslik: string;
  kullaniciId: string;
  kullaniciAdi: string;
  basvuruTarihi: string;
  durum: 'beklemede' | 'onaylandi' | 'reddedildi';
  dernekId?: string;
}

export interface Envanter {
  id: string;
  ad: string;
  kategori: string;
  aciklama?: string;
  toplamAdet: number;
  musaitAdet: number;
  lokasyon?: string;
  seriNo?: string;
  durum: 'kullanilabilir' | 'bakim' | 'arizali';
  olusturulmaTarihi: string;
  dernekId?: string;
}

export interface EnvanterZimmet {
  id: string;
  envanterId: string;
  envanterAd: string;
  kullaniciId: string;
  kullaniciAdi: string;
  zimmetTarihi: string;
  planlananIade?: string;
  gercekIadeTarihi?: string;
  durum: 'aktif' | 'iade_edildi';
  not?: string;
  dernekId?: string;
}
