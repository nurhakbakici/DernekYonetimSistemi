/**
 * Sunum / demo için zengin örnek veri (yerel AsyncStorage modu).
 */
import type {
  User, Oda, Kitap, Etkinlik, Burs, BursBasvurusu, Duyuru, AidatOdemesi,
  Rezervasyon, OduncAlma, GonulluGorev, GonulluBasvuru, Envanter, EnvanterZimmet,
  DernekDurumu,
} from '../types';

const gun = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
};
const isoGun = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
};
const saat = (tarih: string, h: number, m = 0) =>
  `${tarih}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;

export const DEMO_ADMIN: User = {
  id: 'admin-001',
  ad: 'Yönetici',
  soyad: 'Demo',
  email: 'admin@demo.com',
  telefon: '0532 000 0001',
  rol: 'admin',
  uyelikDurumu: 'aktif',
  uyelikBaslangic: '2020-01-01',
  olusturulmaTarihi: '2020-01-01',
};

export const DEMO_USER: User = {
  id: 'user-001',
  ad: 'Ayşe',
  soyad: 'Kaya',
  email: 'uye@demo.com',
  telefon: '0533 111 2233',
  rol: 'uye',
  uyelikDurumu: 'aktif',
  uyelikBaslangic: '2024-01-15',
  olusturulmaTarihi: '2024-01-15',
};

export const DEMO_ADAY: User = {
  id: 'user-002',
  ad: 'Mehmet',
  soyad: 'Yılmaz',
  email: 'aday@demo.com',
  telefon: '0534 222 3344',
  rol: 'aday',
  uyelikDurumu: 'beklemede',
  uyelikBaslangic: '2025-06-01',
  olusturulmaTarihi: '2025-06-01',
};

export const DEMO_USERS: User[] = [
  DEMO_ADMIN,
  DEMO_USER,
  DEMO_ADAY,
  {
    id: 'user-003', ad: 'Zeynep', soyad: 'Arslan', email: 'zeynep@demo.com', telefon: '0535 333 4455',
    rol: 'uye', uyelikDurumu: 'aktif', uyelikBaslangic: '2023-09-01', olusturulmaTarihi: '2023-09-01',
  },
  {
    id: 'user-004', ad: 'Can', soyad: 'Demir', email: 'can@demo.com', telefon: '0536 444 5566',
    rol: 'uye', uyelikDurumu: 'aktif', uyelikBaslangic: '2024-03-10', olusturulmaTarihi: '2024-03-10',
  },
  {
    id: 'user-005', ad: 'Elif', soyad: 'Şahin', email: 'elif@demo.com', telefon: '0537 555 6677',
    rol: 'uye', uyelikDurumu: 'pasif', uyelikBaslangic: '2022-05-01', olusturulmaTarihi: '2022-05-01',
  },
  {
    id: 'user-006', ad: 'Burak', soyad: 'Öztürk', email: 'burak@demo.com', telefon: '0538 666 7788',
    rol: 'aday', uyelikDurumu: 'beklemede', uyelikBaslangic: '2025-05-20', olusturulmaTarihi: '2025-05-20',
  },
  {
    id: 'user-007', ad: 'Selin', soyad: 'Koç', email: 'selin@demo.com', telefon: '0539 777 8899',
    rol: 'uye', uyelikDurumu: 'aktif', uyelikBaslangic: '2025-01-08', olusturulmaTarihi: '2025-01-08',
  },
  {
    id: 'user-008', ad: 'Emre', soyad: 'Aydın', email: 'emre@demo.com', telefon: '0540 888 9900',
    rol: 'uye', uyelikDurumu: 'aktif', uyelikBaslangic: '2024-11-01', olusturulmaTarihi: '2024-11-01',
  },
];

export const ODALAR: Oda[] = [
  { id: 'oda-001', ad: 'Büyük Salon', aciklama: 'Turnuva ve genel kurul', kapasite: 24, ozellikler: ['Projeksiyon', 'WiFi', 'Klima'], aktif: true },
  { id: 'oda-002', ad: 'Strateji Odası', aciklama: 'Masa oyunları', kapasite: 8, ozellikler: ['Geniş Masa', 'WiFi'], aktif: true },
  { id: 'oda-003', ad: 'RPG Odası', aciklama: 'D&D ve Pathfinder', kapasite: 6, ozellikler: ['Ses Sistemi', 'Loş Işık'], aktif: true },
  { id: 'oda-004', ad: 'Kütüphane', aciklama: 'Sessiz çalışma', kapasite: 4, ozellikler: ['WiFi'], aktif: true },
  { id: 'oda-005', ad: 'Bahçe', aciklama: 'Açık hava etkinlikleri', kapasite: 30, ozellikler: ['WiFi'], aktif: true },
  { id: 'oda-006', ad: 'Atölye', aciklama: 'Boyama ve craft', kapasite: 10, ozellikler: ['Havalandırma'], aktif: false },
];

export const KITAPLAR: Kitap[] = [
  { id: 'k-01', baslik: 'D&D Oyuncu El Kitabı 5e', yazar: 'Wizards of the Coast', kategori: 'RPG', toplamAdet: 4, musaitAdet: 2, yayinYili: 2014 },
  { id: 'k-02', baslik: 'D&D DM Rehberi', yazar: 'Wizards of the Coast', kategori: 'RPG', toplamAdet: 2, musaitAdet: 1, yayinYili: 2014 },
  { id: 'k-03', baslik: 'Pathfinder 2e Core', yazar: 'Paizo', kategori: 'RPG', toplamAdet: 2, musaitAdet: 2, yayinYili: 2019 },
  { id: 'k-04', baslik: 'Catan Strateji', yazar: 'K. Teuber', kategori: 'Strateji', toplamAdet: 3, musaitAdet: 3, yayinYili: 2018 },
  { id: 'k-05', baslik: 'Ticket to Ride', yazar: 'A. Moon', kategori: 'Aile', toplamAdet: 2, musaitAdet: 0, yayinYili: 2020 },
  { id: 'k-06', baslik: 'Pandemic Rehber', yazar: 'M. Leacock', kategori: 'Kooperatif', toplamAdet: 1, musaitAdet: 1, yayinYili: 2020 },
  { id: 'k-07', baslik: 'Azul Tasarım Notları', yazar: 'M. Kiesling', kategori: 'Bulmaca', toplamAdet: 1, musaitAdet: 1, yayinYili: 2021 },
  { id: 'k-08', baslik: 'Gloomhaven Kılavuz', yazar: 'İ. Childres', kategori: 'RPG', toplamAdet: 1, musaitAdet: 0, yayinYili: 2022 },
  { id: 'k-09', baslik: 'Dernek Yönetimi', yazar: 'İçişleri', kategori: 'Mevzuat', toplamAdet: 5, musaitAdet: 4, yayinYili: 2020 },
  { id: 'k-10', baslik: 'STK Gönüllülük', yazar: 'Çeşitli', kategori: 'Rehber', toplamAdet: 3, musaitAdet: 2, yayinYili: 2021 },
];

export const ETKINLIKLER: Etkinlik[] = [
  { id: 'e-01', baslik: 'Catan Şampiyonası', aciklama: 'Aylık turnuva', tarih: saat(gun(7), 14), bitisTarihi: saat(gun(7), 19), konum: 'Büyük Salon', organizator: 'YK', organizatorId: 'admin-001', durum: 'onaylandi', maxKatilimci: 16, katilimcilar: ['user-001', 'user-003', 'user-004'], olusturulmaTarihi: isoGun(-10) },
  { id: 'e-02', baslik: 'D&D One-Shot', aciklama: 'Yeni başlayanlar', tarih: saat(gun(10), 15), bitisTarihi: saat(gun(10), 20), konum: 'RPG Odası', organizator: 'Ayşe Kaya', organizatorId: 'user-001', durum: 'onaylandi', maxKatilimci: 6, katilimcilar: ['user-007'], olusturulmaTarihi: isoGun(-5) },
  { id: 'e-03', baslik: 'Warhammer Günü', aciklama: 'Boyama atölyesi', tarih: saat(gun(14), 11), konum: 'Atölye', organizator: 'Can Demir', organizatorId: 'user-004', durum: 'beklemede', maxKatilimci: 10, katilimcilar: [], olusturulmaTarihi: isoGun(-2) },
  { id: 'e-04', baslik: 'Genel Kurul', aciklama: 'Yıllık olağan', tarih: saat(gun(21), 14), bitisTarihi: saat(gun(21), 17), konum: 'Büyük Salon', organizator: 'YK', organizatorId: 'admin-001', durum: 'onaylandi', maxKatilimci: 50, katilimcilar: [], olusturulmaTarihi: isoGun(-20) },
  { id: 'e-05', baslik: 'Magic Turnuvası', aciklama: 'Standard format', tarih: saat(gun(3), 13), konum: 'Strateji Odası', organizator: 'Emre Aydın', organizatorId: 'user-008', durum: 'onaylandi', maxKatilimci: 8, katilimcilar: ['user-008'], olusturulmaTarihi: isoGun(-1) },
  { id: 'e-06', baslik: 'Kooperatif Oyun Gecesi', aciklama: 'Pandemic, Forbidden Island', tarih: saat(gun(-5), 18), konum: 'Büyük Salon', organizator: 'Zeynep Arslan', organizatorId: 'user-003', durum: 'onaylandi', maxKatilimci: 12, katilimcilar: ['user-001', 'user-003'], olusturulmaTarihi: isoGun(-30) },
  { id: 'e-07', baslik: 'Yaz Pikniği', aciklama: 'Bahçede açık hava', tarih: saat(gun(30), 10), konum: 'Bahçe', organizator: 'Selin Koç', organizatorId: 'user-007', durum: 'beklemede', katilimcilar: [], olusturulmaTarihi: isoGun(-1) },
];

export const BURSLAR: Burs[] = [
  { id: 'b-01', ad: 'Oyun Tasarımı Bursu', aciklama: 'Tasarım bölümü öğrencileri', miktar: 8000, programSuresiAy: 10, saglayanKurum: 'Kule Sakinleri', sonBasvuruTarihi: gun(45), gereksinimler: ['3. sınıf+', 'Min 2.50 GNO'], gerekliBelgeler: [{ id: 'tr', baslik: 'Transkript' }, { id: 'ob', baslik: 'Öğrenci belgesi' }], durum: 'aktif', olusturulmaTarihi: isoGun(-60) },
  { id: 'b-02', ad: 'Genel Destek Bursu', aciklama: 'Mali destek', miktar: 4000, programSuresiAy: 6, saglayanKurum: 'Kule Sakinleri', sonBasvuruTarihi: gun(20), gereksinimler: ['Aktif üye'], gerekliBelgeler: [{ id: 'gelir', baslik: 'Gelir belgesi' }], durum: 'aktif', olusturulmaTarihi: isoGun(-40) },
  { id: 'b-03', ad: 'Etkinlik Organizasyon Bursu', aciklama: 'Etkinlik gönüllüleri', miktar: 2500, programSuresiAy: 4, saglayanKurum: 'Sponsor A.Ş.', sonBasvuruTarihi: gun(-10), gereksinimler: ['En az 2 etkinlik katılımı'], durum: 'kapali', olusturulmaTarihi: isoGun(-90) },
];

export const BURS_BASVURULARI: BursBasvurusu[] = [
  { id: 'bb-01', bursId: 'b-01', bursAdi: 'Oyun Tasarımı Bursu', kullaniciId: 'user-001', kullaniciAdi: 'Ayşe Kaya', basvuruTarihi: gun(-8), durum: 'onaylandi', bursOdemeDurumu: 'beklemede', iban: 'TR330006100519786457841326' },
  { id: 'bb-02', bursId: 'b-01', bursAdi: 'Oyun Tasarımı Bursu', kullaniciId: 'user-004', kullaniciAdi: 'Can Demir', basvuruTarihi: gun(-6), durum: 'beklemede' },
  { id: 'bb-03', bursId: 'b-02', bursAdi: 'Genel Destek Bursu', kullaniciId: 'user-003', kullaniciAdi: 'Zeynep Arslan', basvuruTarihi: gun(-4), durum: 'onaylandi', bursOdemeDurumu: 'yatirildi', bursOdemeTarihi: gun(-1), iban: 'TR760006400000112233445566' },
  { id: 'bb-04', bursId: 'b-02', bursAdi: 'Genel Destek Bursu', kullaniciId: 'user-007', kullaniciAdi: 'Selin Koç', basvuruTarihi: gun(-3), durum: 'reddedildi', notlar: 'Belge eksik' },
  { id: 'bb-05', bursId: 'b-02', bursAdi: 'Genel Destek Bursu', kullaniciId: 'user-008', kullaniciAdi: 'Emre Aydın', basvuruTarihi: gun(-2), durum: 'beklemede' },
];

export const DUYURULAR: Duyuru[] = [
  { id: 'd-01', baslik: 'Genel kurul — 15 Haziran', icerik: 'Olağan genel kurulumuz Cumartesi 14:00’te. Gündem mail ile iletildi.', olusturulmaTarihi: isoGun(-1), olusturanId: 'admin-001', olusturanAdi: 'Yönetici Demo' },
  { id: 'd-02', baslik: 'Aidat hatırlatması', icerik: 'Mayıs aidatı için son ödeme tarihi 31 Mayıs. Dekont yükleyebilirsiniz.', olusturulmaTarihi: isoGun(-3), olusturanId: 'admin-001', olusturanAdi: 'Yönetici Demo' },
  { id: 'd-03', baslik: 'Yeni kütüphane kitapları', icerik: '12 yeni RPG ve strateji kitabı rafta. Ödünç süresi 14 gün.', olusturulmaTarihi: isoGun(-5), olusturanId: 'admin-001', olusturanAdi: 'Yönetici Demo' },
  { id: 'd-04', baslik: 'Gönüllü aranıyor', icerik: 'Catan turnuvası için 6 gönüllü ihtiyacımız var. Uygulamadan başvurun.', olusturulmaTarihi: isoGun(-2), olusturanId: 'admin-001', olusturanAdi: 'Yönetici Demo' },
  { id: 'd-05', baslik: 'Dernek kapalı — bakım', icerik: '22 Mayıs Çarşamba tam gün teknik bakım. Rezervasyon alınmaz.', olusturulmaTarihi: isoGun(-7), olusturanId: 'admin-001', olusturanAdi: 'Yönetici Demo' },
];

export const DERNEK_DURUMU: DernekDurumu = {
  acik: true,
  mesaj: 'Bugün 12:00–22:00 açığız · Catan turnuvası bu hafta sonu!',
  guncellenmeTarihi: isoGun(0),
  guncelleyenKullanici: 'Yönetici Demo',
};

function aidatSatir(id: string, uid: string, ad: string, yil: number, ay: number, odendi: boolean, ek?: Partial<AidatOdemesi>): AidatOdemesi {
  return {
    id,
    kullaniciId: uid,
    kullaniciAdi: ad,
    yil,
    ay,
    miktar: 300,
    odendi,
    sonOdemeTarihi: `${yil}-${String(ay).padStart(2, '0')}-28`,
    ...ek,
  };
}

const y = new Date().getFullYear();
const m = new Date().getMonth() + 1;
export const AIDAT_ODEMELERI: AidatOdemesi[] = [
  aidatSatir('a-01', 'user-001', 'Ayşe Kaya', y, m, false),
  aidatSatir('a-02', 'user-001', 'Ayşe Kaya', y, m === 1 ? 12 : m - 1, true, { odemeTarihi: gun(-15) }),
  aidatSatir('a-03', 'user-003', 'Zeynep Arslan', y, m, true, { odemeTarihi: gun(-5) }),
  aidatSatir('a-04', 'user-004', 'Can Demir', y, m, false, { redAciklamasi: 'Dekont okunamadı' }),
  aidatSatir('a-05', 'user-007', 'Selin Koç', y, m, false),
  aidatSatir('a-06', 'user-008', 'Emre Aydın', y, m, true, { odemeTarihi: gun(-2) }),
  aidatSatir('a-07', 'admin-001', 'Yönetici Demo', y, m, true, { odemeTarihi: gun(-10) }),
];

export const REZERVASYONLAR: Rezervasyon[] = [
  { id: 'r-01', odaId: 'oda-001', odaAdi: 'Büyük Salon', kullaniciId: 'user-001', kullaniciAdi: 'Ayşe Kaya', tarih: gun(2), baslangicSaati: '14:00', bitisSaati: '17:00', amac: 'Oyun gecesi', durum: 'onaylandi', olusturulmaTarihi: isoGun(-3) },
  { id: 'r-02', odaId: 'oda-002', odaAdi: 'Strateji Odası', kullaniciId: 'user-004', kullaniciAdi: 'Can Demir', tarih: gun(3), baslangicSaati: '10:00', bitisSaati: '13:00', amac: 'Warhammer', durum: 'beklemede', olusturulmaTarihi: isoGun(-1) },
  { id: 'r-03', odaId: 'oda-003', odaAdi: 'RPG Odası', kullaniciId: 'user-003', kullaniciAdi: 'Zeynep Arslan', tarih: gun(5), baslangicSaati: '15:00', bitisSaati: '20:00', amac: 'Kampanya', durum: 'onaylandi', olusturulmaTarihi: isoGun(-4) },
  { id: 'r-04', odaId: 'oda-001', odaAdi: 'Büyük Salon', kullaniciId: 'admin-001', kullaniciAdi: 'Yönetici Demo', tarih: gun(1), baslangicSaati: '09:00', bitisSaati: '12:00', amac: 'YK toplantısı', durum: 'onaylandi', olusturulmaTarihi: isoGun(-2) },
  { id: 'r-05', odaId: 'oda-004', odaAdi: 'Kütüphane', kullaniciId: 'user-007', kullaniciAdi: 'Selin Koç', tarih: gun(4), baslangicSaati: '18:00', bitisSaati: '20:00', amac: 'Çalışma', durum: 'beklemede', olusturulmaTarihi: isoGun(0) },
  { id: 'r-06', odaId: 'oda-002', odaAdi: 'Strateji Odası', kullaniciId: 'user-008', kullaniciAdi: 'Emre Aydın', tarih: gun(-2), baslangicSaati: '14:00', bitisSaati: '16:00', amac: 'Magic', durum: 'onaylandi', olusturulmaTarihi: isoGun(-10) },
  { id: 'r-07', odaId: 'oda-005', odaAdi: 'Bahçe', kullaniciId: 'user-001', kullaniciAdi: 'Ayşe Kaya', tarih: gun(12), baslangicSaati: '11:00', bitisSaati: '15:00', amac: 'Piknik hazırlık', durum: 'iptal', olusturulmaTarihi: isoGun(-6) },
];

export const ODUNC_ALMALAR: OduncAlma[] = [
  { id: 'o-01', kitapId: 'k-01', kitapBaslik: 'D&D Oyuncu El Kitabı 5e', kullaniciId: 'user-001', kullaniciAdi: 'Ayşe Kaya', oduncTarihi: gun(-20), iadeTarihi: gun(-5), durum: 'gecikti' },
  { id: 'o-02', kitapId: 'k-05', kitapBaslik: 'Ticket to Ride', kullaniciId: 'user-004', kullaniciAdi: 'Can Demir', oduncTarihi: gun(-7), iadeTarihi: gun(7), durum: 'aktif' },
  { id: 'o-03', kitapId: 'k-08', kitapBaslik: 'Gloomhaven Kılavuz', kullaniciId: 'user-003', kullaniciAdi: 'Zeynep Arslan', oduncTarihi: gun(-14), iadeTarihi: gun(0), durum: 'gecikti' },
  { id: 'o-04', kitapId: 'k-04', kitapBaslik: 'Catan Strateji', kullaniciId: 'user-008', kullaniciAdi: 'Emre Aydın', oduncTarihi: gun(-30), iadeTarihi: gun(-16), durum: 'iade_edildi' },
];

export const GONULLU_GOREVLER: GonulluGorev[] = [
  { id: 'g-01', baslik: 'Turnuva karşılama', aciklama: 'Kayıt masası', tarih: gun(7), baslangicSaati: '09:00', bitisSaati: '13:00', konum: 'Büyük Salon', kontenjan: 8, durum: 'acik', olusturanId: 'admin-001', olusturanAdi: 'Yönetici Demo', olusturulmaTarihi: isoGun(-5) },
  { id: 'g-02', baslik: 'Kütüphane sayım', aciklama: 'Raf etiketleme', tarih: gun(12), konum: 'Kütüphane', kontenjan: 4, durum: 'acik', olusturanId: 'admin-001', olusturanAdi: 'Yönetici Demo', olusturulmaTarihi: isoGun(-3) },
  { id: 'g-03', baslik: 'Sosyal medya', aciklama: 'Etkinlik fotoğrafları', tarih: gun(14), kontenjan: 2, durum: 'acik', olusturanId: 'admin-001', olusturanAdi: 'Yönetici Demo', olusturulmaTarihi: isoGun(-2) },
  { id: 'g-04', baslik: 'Genel kurul düzeni', aciklama: 'Salon hazırlığı', tarih: gun(21), kontenjan: 6, durum: 'kapali', olusturanId: 'admin-001', olusturanAdi: 'Yönetici Demo', olusturulmaTarihi: isoGun(-15) },
  { id: 'g-05', baslik: 'Bahçe temizlik', aciklama: 'Piknik öncesi', tarih: gun(28), konum: 'Bahçe', kontenjan: 10, durum: 'acik', olusturanId: 'admin-001', olusturanAdi: 'Yönetici Demo', olusturulmaTarihi: isoGun(-1) },
];

export const GONULLU_BASVURULAR: GonulluBasvuru[] = [
  { id: 'gb-01', gorevId: 'g-01', gorevBaslik: 'Turnuva karşılama', kullaniciId: 'user-001', kullaniciAdi: 'Ayşe Kaya', basvuruTarihi: gun(-4), durum: 'onaylandi' },
  { id: 'gb-02', gorevId: 'g-01', gorevBaslik: 'Turnuva karşılama', kullaniciId: 'user-003', kullaniciAdi: 'Zeynep Arslan', basvuruTarihi: gun(-3), durum: 'onaylandi' },
  { id: 'gb-03', gorevId: 'g-01', gorevBaslik: 'Turnuva karşılama', kullaniciId: 'user-007', kullaniciAdi: 'Selin Koç', basvuruTarihi: gun(-2), durum: 'beklemede' },
  { id: 'gb-04', gorevId: 'g-02', gorevBaslik: 'Kütüphane sayım', kullaniciId: 'user-004', kullaniciAdi: 'Can Demir', basvuruTarihi: gun(-1), durum: 'beklemede' },
  { id: 'gb-05', gorevId: 'g-03', gorevBaslik: 'Sosyal medya', kullaniciId: 'user-008', kullaniciAdi: 'Emre Aydın', basvuruTarihi: gun(0), durum: 'onaylandi' },
];

export const ENVANTER_KAYITLARI: Envanter[] = [
  { id: 'en-01', ad: 'Projeksiyon Epson', kategori: 'Teknik', toplamAdet: 2, musaitAdet: 1, lokasyon: 'Depo A', durum: 'kullanilabilir', olusturulmaTarihi: '2024-01-10' },
  { id: 'en-02', ad: 'Catan kutusu', kategori: 'Oyun', toplamAdet: 6, musaitAdet: 5, lokasyon: 'Oyun odası', durum: 'kullanilabilir', olusturulmaTarihi: '2023-06-01' },
  { id: 'en-03', ad: 'Hoparlör JBL', kategori: 'Teknik', toplamAdet: 2, musaitAdet: 0, lokasyon: 'Bakım', durum: 'bakim', olusturulmaTarihi: '2022-11-01' },
  { id: 'en-04', ad: 'Zar seti (20 yüz)', kategori: 'Oyun', toplamAdet: 15, musaitAdet: 12, lokasyon: 'RPG odası', durum: 'kullanilabilir', olusturulmaTarihi: '2024-03-15' },
  { id: 'en-05', ad: 'Fotoğraf tripod', kategori: 'Teknik', toplamAdet: 1, musaitAdet: 0, lokasyon: 'Etkinlik', durum: 'kullanilabilir', olusturulmaTarihi: '2025-01-20' },
  { id: 'en-06', ad: 'Masa (katlanır)', kategori: 'Mobilya', toplamAdet: 8, musaitAdet: 6, lokasyon: 'Depo B', durum: 'kullanilabilir', olusturulmaTarihi: '2021-08-01' },
  { id: 'en-07', ad: 'Miniatür boya seti', kategori: 'Atölye', toplamAdet: 4, musaitAdet: 3, lokasyon: 'Atölye', durum: 'kullanilabilir', olusturulmaTarihi: '2024-09-01' },
];

export const ENVANTER_ZIMMETLER: EnvanterZimmet[] = [
  { id: 'z-01', envanterId: 'en-01', envanterAd: 'Projeksiyon Epson', kullaniciId: 'user-001', kullaniciAdi: 'Ayşe Kaya', zimmetTarihi: gun(-5), planlananIade: gun(5), durum: 'aktif' },
  { id: 'z-02', envanterId: 'en-05', envanterAd: 'Fotoğraf tripod', kullaniciId: 'user-008', kullaniciAdi: 'Emre Aydın', zimmetTarihi: gun(-2), planlananIade: gun(10), durum: 'aktif' },
  { id: 'z-03', envanterId: 'en-02', envanterAd: 'Catan kutusu', kullaniciId: 'user-004', kullaniciAdi: 'Can Demir', zimmetTarihi: gun(-20), gercekIadeTarihi: gun(-8), durum: 'iade_edildi' },
];
