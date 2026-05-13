import {
  Oda, Kitap, Etkinlik, Burs, DernekDurumu, AidatOdemesi, Rezervasyon, OduncAlma, BursBasvurusu, User, Duyuru,
} from '../types';

export const DEMO_ADMIN: User = {
  id: 'admin-001',
  ad: 'Yönetici',
  soyad: 'Admin',
  email: 'admin@kulesakinleri.com',
  telefon: '0532 000 0000',
  rol: 'admin',
  uyelikDurumu: 'aktif',
  uyelikBaslangic: '2020-01-01',
  olusturulmaTarihi: '2020-01-01',
};

export const DEMO_USER: User = {
  id: 'user-001',
  ad: 'Demo',
  soyad: 'Kullanıcı',
  email: 'uye@kulesakinleri.com',
  telefon: '0533 000 0000',
  rol: 'uye',
  uyelikDurumu: 'aktif',
  uyelikBaslangic: '2024-01-15',
  olusturulmaTarihi: '2024-01-15',
};

export const DEMO_ADAY: User = {
  id: 'user-002',
  ad: 'Demo',
  soyad: 'Aday',
  email: 'aday@kulesakinleri.com',
  telefon: '0534 000 0000',
  rol: 'aday',
  uyelikDurumu: 'beklemede',
  uyelikBaslangic: '2025-01-01',
  olusturulmaTarihi: '2025-01-01',
};

export const ODALAR: Oda[] = [
  {
    id: 'oda-001',
    ad: 'Büyük Salon',
    aciklama: 'Turnuvalar ve büyük grup etkinlikleri için ana salon',
    kapasite: 20,
    ozellikler: ['Projeksiyon', 'Whiteboard', 'WiFi', 'Klima'],
    aktif: true,
  },
  {
    id: 'oda-002',
    ad: 'Strateji Odası',
    aciklama: 'Masa üstü strateji oyunları için özel oda',
    kapasite: 8,
    ozellikler: ['Geniş Masa', 'WiFi', 'Klima'],
    aktif: true,
  },
  {
    id: 'oda-003',
    ad: 'Rol Yapma Odası',
    aciklama: 'D&D ve diğer RPG oyunları için özel oda',
    kapasite: 6,
    ozellikler: ['Loş Aydınlatma', 'WiFi', 'Ses Sistemi'],
    aktif: true,
  },
  {
    id: 'oda-004',
    ad: 'Kütüphane Okuma Alanı',
    aciklama: 'Sessiz okuma ve küçük grup çalışmaları için',
    kapasite: 4,
    ozellikler: ['WiFi', 'Kitaplık Erişimi'],
    aktif: true,
  },
];

export const KITAPLAR: Kitap[] = [
  {
    id: 'kitap-001',
    baslik: 'Dungeons & Dragons Oyuncu El Kitabı',
    yazar: 'Wizards of the Coast',
    kategori: 'RPG',
    toplamAdet: 3,
    musaitAdet: 2,
    aciklama: 'D&D 5. Baskı temel oyuncu el kitabı',
    yayinYili: 2014,
  },
  {
    id: 'kitap-002',
    baslik: 'Catan Strateji Rehberi',
    yazar: 'Klaus Teuber',
    kategori: 'Strateji',
    toplamAdet: 2,
    musaitAdet: 2,
    aciklama: 'Catan oyunu için kapsamlı strateji rehberi',
    yayinYili: 2019,
  },
  {
    id: 'kitap-003',
    baslik: 'Pathfinder Temel Kural Kitabı',
    yazar: 'Paizo Publishing',
    kategori: 'RPG',
    toplamAdet: 2,
    musaitAdet: 1,
    aciklama: 'Pathfinder 2. Baskı temel kural kitabı',
    yayinYili: 2019,
  },
  {
    id: 'kitap-004',
    baslik: 'Pandemic Resmi Rehber',
    yazar: 'Matt Leacock',
    kategori: 'Kooperatif',
    toplamAdet: 1,
    musaitAdet: 1,
    aciklama: 'Pandemic serisi için oyun rehberi',
    yayinYili: 2020,
  },
  {
    id: 'kitap-005',
    baslik: 'Azul: Tasarımcının Notları',
    yazar: 'Michael Kiesling',
    kategori: 'Bulmaca',
    toplamAdet: 1,
    musaitAdet: 0,
    aciklama: 'Azul oyununun tasarım süreci ve stratejileri',
    yayinYili: 2021,
  },
];

export const ETKINLIKLER: Etkinlik[] = [
  {
    id: 'etk-001',
    baslik: 'Aylık Turnuva: Catan Şampiyonası',
    aciklama: 'Her ay düzenlenen Catan turnuvamız bu ay özel ödüllü!',
    tarih: '2026-05-20T14:00:00',
    bitisTarihi: '2026-05-20T19:00:00',
    konum: 'Büyük Salon',
    organizator: 'Yönetim Kurulu',
    organizatorId: 'admin-001',
    durum: 'onaylandi',
    maxKatilimci: 16,
    katilimcilar: ['user-001'],
    olusturulmaTarihi: '2026-05-01',
  },
  {
    id: 'etk-002',
    baslik: 'D&D Kampanya Başlangıcı',
    aciklama: 'Yeni başlayanlar için D&D 5e kampanya oturumu',
    tarih: '2026-05-25T15:00:00',
    bitisTarihi: '2026-05-25T20:00:00',
    konum: 'Rol Yapma Odası',
    organizator: 'Demo Kullanıcı',
    organizatorId: 'user-001',
    durum: 'beklemede',
    maxKatilimci: 6,
    katilimcilar: [],
    olusturulmaTarihi: '2026-05-08',
  },
];

export const BURSLAR: Burs[] = [
  {
    id: 'burs-001',
    ad: 'Oyun Tasarımı Burs Programı',
    aciklama: 'Oyun tasarımı alanında eğitim gören öğrenciler için yıllık burs',
    miktar: 5000,
    programSuresiAy: 10,
    saglayanKurum: 'Kule Sakinleri Derneği',
    sonBasvuruTarihi: '2026-06-30',
    gereksinimler: ['Oyun tasarımı bölümü öğrencisi olmak', 'Not ortalaması min. 2.5/4.0', 'Dernek üyesi olmak'],
    gerekliBelgeler: [
      { id: 'belge-transkript', baslik: 'Transkript' },
      { id: 'belge-ogrenci', baslik: 'Öğrenci belgesi' },
    ],
    durum: 'aktif',
    olusturulmaTarihi: '2026-04-01',
  },
  {
    id: 'burs-002',
    ad: 'Genel Öğrenci Destek Bursu',
    aciklama: 'Mali desteğe ihtiyaç duyan dernek üyesi öğrenciler için',
    miktar: 3000,
    programSuresiAy: 6,
    saglayanKurum: 'Kule Sakinleri Derneği',
    sonBasvuruTarihi: '2026-05-31',
    gereksinimler: ['Aktif dernek üyesi olmak', 'Öğrenci olmak', 'Başvuru formu doldurmak'],
    gerekliBelgeler: [
      { id: 'belge-transkript', baslik: 'Transkript' },
      { id: 'belge-gelir', baslik: 'Gelir / mali durum belgesi' },
      { id: 'belge-ikamet', baslik: 'İkametgah' },
    ],
    durum: 'aktif',
    olusturulmaTarihi: '2026-03-15',
  },
];

export const DERNEK_DURUMU: DernekDurumu = {
  acik: true,
  mesaj: 'Bugün 14:00 - 22:00 saatleri arasında açığız!',
  guncellenmeTarihi: new Date().toISOString(),
  guncelleyenKullanici: 'Yönetici Admin',
};

export const DUYURULAR: Duyuru[] = [
  {
    id: 'duyuru-001',
    baslik: 'Genel kurul hatırlatması',
    icerik: 'Yıllık genel kurul 15 Haziran Cumartesi 14:00’te dernek merkezinde yapılacaktır. Katılımınızı rica ederiz.',
    olusturulmaTarihi: new Date(Date.now() - 86400000 * 2).toISOString(),
    olusturanId: 'admin-001',
    olusturanAdi: 'Yönetici Admin',
  },
];

export const AIDAT_ODEMELERI: AidatOdemesi[] = [
  {
    id: 'aidat-001',
    kullaniciId: 'user-001',
    kullaniciAdi: 'Demo Kullanıcı',
    yil: 2026,
    ay: 1,
    miktar: 300,
    odendi: true,
    odemeTarihi: '2026-01-10',
    sonOdemeTarihi: '2026-01-31',
  },
  {
    id: 'aidat-002',
    kullaniciId: 'user-001',
    kullaniciAdi: 'Demo Kullanıcı',
    yil: 2025,
    ay: 1,
    miktar: 250,
    odendi: true,
    odemeTarihi: '2025-01-05',
    sonOdemeTarihi: '2025-01-31',
  },
];

export const REZERVASYONLAR: Rezervasyon[] = [
  {
    id: 'rez-001',
    odaId: 'oda-001',
    odaAdi: 'Büyük Salon',
    kullaniciId: 'user-001',
    kullaniciAdi: 'Demo Kullanıcı',
    tarih: '2026-05-15',
    baslangicSaati: '15:00',
    bitisSaati: '18:00',
    amac: 'Haftalık oyun gecesi',
    durum: 'onaylandi',
    olusturulmaTarihi: '2026-05-10',
  },
  {
    id: 'rez-002',
    odaId: 'oda-002',
    odaAdi: 'Strateji Odası',
    kullaniciId: 'admin-001',
    kullaniciAdi: 'Yönetici Admin',
    tarih: '2026-05-20',
    baslangicSaati: '10:00',
    bitisSaati: '13:00',
    amac: 'Kulüp yönetim toplantısı',
    durum: 'beklemede',
    olusturulmaTarihi: '2026-05-11',
  },
];

export const ODUNC_ALMALAR: OduncAlma[] = [
  {
    id: 'odunc-001',
    kitapId: 'kitap-001',
    kitapBaslik: 'Dungeons & Dragons Oyuncu El Kitabı',
    kullaniciId: 'user-001',
    kullaniciAdi: 'Demo Kullanıcı',
    oduncTarihi: '2026-05-01',
    iadeTarihi: '2026-05-15',
    durum: 'gecikti',
  },
];

export const BURS_BASVURULARI: BursBasvurusu[] = [];
