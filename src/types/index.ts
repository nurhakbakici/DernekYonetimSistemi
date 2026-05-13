export type UserRole = 'admin' | 'uye' | 'aday';

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
}

export interface Oda {
  id: string;
  ad: string;
  aciklama: string;
  kapasite: number;
  ozellikler: string[];
  aktif: boolean;
  resimUrl?: string;
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
}

export interface DernekDurumu {
  acik: boolean;
  mesaj?: string;
  guncellenmeTarihi: string;
  guncelleyenKullanici: string;
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
}
