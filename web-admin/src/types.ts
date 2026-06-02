export type FeaturePaketId =
  | 'duyurular'
  | 'odalar'
  | 'kutuphane'
  | 'etkinlikler'
  | 'burslar'
  | 'aidat'
  | 'uyelik'
  | 'acikKapali'
  | 'gonulluluk'
  | 'envanter';

export interface DernekDoc {
  id: string;
  ad: string;
  slug: string;
  derbisNo?: string;
  durum: string;
  paketler: FeaturePaketId[];
  aidatAylikMiktar?: number;
  dernekDurumu?: { acik: boolean; mesaj?: string };
}

export interface UyelikDoc {
  id: string;
  userId: string;
  dernekId: string;
  rol: 'admin' | 'uye' | 'aday';
  uyelikDurumu: 'aktif' | 'pasif' | 'beklemede';
  uyelikBaslangic: string;
}

export interface AdminDernekOzet {
  dernekId: string;
  dernekAd: string;
}

export interface AylikVeri {
  ay: string;   // "Oca '25"
  deger: number;
}

export interface DagılımVeri {
  ad: string;
  deger: number;
}

export type KullaniciBildirimTuru = 'odunc_gecikme' | 'aidat_gecikme';

export interface GecikmisOduncKayit {
  id: string;
  kitapBaslik: string;
  kullaniciId: string;
  kullaniciAdi: string;
  iadeTarihi: string;
  oduncTarihi: string;
  sonHatirlatmaTarihi?: string;
}

export interface GecikmisAidatKayit {
  id: string;
  kullaniciId: string;
  kullaniciAdi: string;
  yil: number;
  ay: number;
  miktar: number;
  sonOdemeTarihi: string;
  sonHatirlatmaTarihi?: string;
}

export interface DashboardStats {
  // Üyelik
  toplamUyelik: number;
  aktifUye: number;
  adayBekleyen: number;
  pasifUye: number;
  uyelikDurumDagilim: DagılımVeri[];
  aylikYeniUye: AylikVeri[];         // son 6 ay yeni üye

  // Rezervasyon
  bekleyenRezervasyon: number;
  toplamRezervasyon: number;
  rezervasyonDurumDagilim: DagılımVeri[];
  aylikRezervasyon: AylikVeri[];     // son 6 ay

  // Etkinlik
  onayliEtkinlik: number;
  toplamEtkinlik: number;
  yaklasanEtkinlik: number;          // bugünden sonra

  // Burs
  bekleyenBurs: number;
  onaylanmisBurs: number;
  reddedilenBurs: number;
  toplamBursBasvuru: number;
  bursDurumDagilim: DagılımVeri[];
  aylikBursBasvuru: AylikVeri[];     // son 6 ay
  bursOdenmisOdeme: number;          // onaylı + yatirildi
  bursBekleyenOdeme: number;         // onaylı + odeme beklemede
  bursOdemeDagilim: DagılımVeri[];

  // Aidat
  odenmemisAidat: number;
  odenmisAidat: number;
  aidatOdemeOrani: number;           // 0-100 yüzde
  aylikAidat: AylikVeri[];           // son 6 ay ödenen

  // Kütüphane
  aktifOdunc: number;
  gecikliOdunc: number;
  toplamOdunc: number;

  // Gönüllülük
  acikGonulluGorev: number;
  bekleyenGonulluBasvuru: number;
  toplamGonulluGorev: number;

  // Envanter
  aktifZimmet: number;
  toplamEnvanter: number;
}
