/* eslint-disable no-console */
/**
 * Firestore seed script (client SDK).
 *
 * Kullanım:
 * 1) Kök dizinde `.env` oluştur: `copy .env.example .env` (veya `cp .env.example .env`)
 * 2) `.env` içinde `EXPO_PUBLIC_FIREBASE_*` ve `SEED_ADMIN_*` değerlerini doldur.
 * 3) `npm run seed:firestore`
 *
 * Ortam değişkenleri: `EXPO_PUBLIC_FIREBASE_*` (önerilen) veya `FIREBASE_*` / `FIREBASE_API_KEY` vb.
 *
 * Not: Bu script Firebase client SDK kullandığı için, Auth üzerinde bu kullanıcıyı
 * createUserWithEmailAndPassword ile oluşturur (yoksa). Varsa signIn yapar.
 */

const path = require("path");
// eslint-disable-next-line @typescript-eslint/no-var-requires
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { initializeApp } = require("firebase/app");
const {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} = require("firebase/auth");
const {
  getFirestore,
  doc,
  setDoc,
  collection,
  addDoc,
  getDocs,
  query,
  limit,
} = require("firebase/firestore");

const firebaseConfig = {
  apiKey:
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY ||
    process.env.FIREBASE_API_KEY ||
    "YOUR_API_KEY",
  authDomain:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    process.env.FIREBASE_AUTH_DOMAIN ||
    "YOUR_AUTH_DOMAIN",
  projectId:
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.FIREBASE_PROJECT_ID ||
    "YOUR_PROJECT_ID",
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    process.env.FIREBASE_STORAGE_BUCKET ||
    "YOUR_STORAGE_BUCKET",
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    process.env.FIREBASE_MESSAGING_SENDER_ID ||
    "YOUR_MESSAGING_SENDER_ID",
  appId:
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID ||
    process.env.FIREBASE_APP_ID ||
    "YOUR_APP_ID",
};

function assertConfigured() {
  const bos =
    !firebaseConfig.apiKey ||
    firebaseConfig.apiKey === "YOUR_API_KEY" ||
    !firebaseConfig.projectId ||
    firebaseConfig.projectId === "YOUR_PROJECT_ID";
  if (bos) {
    throw new Error(
      "Firebase config eksik. Proje kökünde `.env` dosyası oluşturun (`.env.example` şablonu) ve " +
        "`EXPO_PUBLIC_FIREBASE_API_KEY`, `EXPO_PUBLIC_FIREBASE_PROJECT_ID` vb. değerleri doldurun; " +
        "veya `FIREBASE_API_KEY` / `FIREBASE_PROJECT_ID` ortam değişkenlerini ayarlayın."
    );
  }
}

async function ensureAdminAuth(auth, email, password) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  } catch (e) {
    // Kullanıcı yoksa oluştur
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    return cred.user;
  }
}

async function alreadySeeded(db) {
  const q = query(collection(db, "odalar"), limit(1));
  const snap = await getDocs(q);
  return !snap.empty;
}

async function main() {
  assertConfigured();

  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error(
      "Eksik env. PowerShell:\n$env:SEED_ADMIN_EMAIL=\"admin@kulesakinleri.com\"\n$env:SEED_ADMIN_PASSWORD=\"admin123\""
    );
  }

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  if (await alreadySeeded(db)) {
    console.log("Seed atlanıyor: 'odalar' koleksiyonunda veri var (zaten seed edilmiş).");
    return;
  }

  const adminUser = await ensureAdminAuth(auth, adminEmail, adminPassword);

  // Admin user doc
  await setDoc(doc(db, "users", adminUser.uid), {
    id: adminUser.uid,
    ad: "Yönetici",
    soyad: "Admin",
    email: adminEmail,
    telefon: "0532 000 0000",
    rol: "admin",
    uyelikDurumu: "aktif",
    uyelikBaslangic: "2020-01-01",
    olusturulmaTarihi: new Date().toISOString(),
  });

  // Ayarlar: dernek durumu
  await setDoc(doc(db, "ayarlar", "dernekDurumu"), {
    acik: true,
    mesaj: "Bugün 14:00 - 22:00 saatleri arasında açığız!",
    guncellenmeTarihi: new Date().toISOString(),
    guncelleyenKullanici: "Yönetici Admin",
  });

  await setDoc(doc(db, "ayarlar", "aidatAylikMiktar"), {
    miktar: 300,
    guncellenmeTarihi: new Date().toISOString(),
  });

  await setDoc(doc(db, "duyurular", "duyuru-ornek-001"), {
    baslik: "Genel kurul hatırlatması",
    icerik:
      "Yıllık genel kurul 15 Haziran Cumartesi 14:00’te dernek merkezinde yapılacaktır. Katılımınızı rica ederiz.",
    olusturulmaTarihi: new Date().toISOString(),
    olusturanId: adminUser.uid,
    olusturanAdi: "Yönetici Admin",
  });

  // Odalar
  const odalar = [
    {
      ad: "Giriş",
      aciklama: "Turnuvalar ve büyük grup etkinlikleri için ana salon",
      kapasite: 20,
      ozellikler: ["Projeksiyon", "Whiteboard", "WiFi", "Klima"],
      aktif: true,
    },
    {
      ad: "FRP 1",
      aciklama: "FRP oyunları için özel oda",
      kapasite: 8,
      ozellikler: ["Geniş Masa", "WiFi", "Klima"],
      aktif: true,
    },
    {
      ad: "FRP 2",
      aciklama: "D&D ve diğer RPG oyunları için özel oda",
      kapasite: 6,
      ozellikler: ["Loş Aydınlatma", "WiFi", "Ses Sistemi"],
      aktif: true,
    },
    {
      ad: "Wargame Odası",
      aciklama: "Wargame oyunları için özel oda",
      kapasite: 6,
      ozellikler: ["Geniş Masa", "WiFi", "Klima"],
      aktif: true,
    },
    {
      ad: "Arka Bahçe",
      aciklama: "",
      kapasite: 6,
      ozellikler: ["Geniş Masa", "WiFi"],
      aktif: true,
    },
    {
      ad: "Üst Kat",
      aciklama: "Kütüphane ve FRP oyunları için özel oda",
      kapasite: 6,
      ozellikler: ["Geniş Masa", "WiFi"],
      aktif: true,
    },
  ];
  for (const oda of odalar) {
    await addDoc(collection(db, "odalar"), oda);
  }

  // Kitaplar
  const kitaplar = [
    {
      baslik: "Dungeons & Dragons Oyuncu El Kitabı",
      yazar: "Wizards of the Coast",
      kategori: "RPG",
      toplamAdet: 3,
      musaitAdet: 3,
      aciklama: "D&D 5. Baskı temel oyuncu el kitabı",
      yayinYili: 2014,
    },
    {
      baslik: "Catan Strateji Rehberi",
      yazar: "Klaus Teuber",
      kategori: "Strateji",
      toplamAdet: 2,
      musaitAdet: 2,
      aciklama: "Catan oyunu için kapsamlı strateji rehberi",
      yayinYili: 2019,
    },
  ];
  for (const kitap of kitaplar) {
    await addDoc(collection(db, "kitaplar"), kitap);
  }

  // Burslar
  const burslar = [
    {
      ad: "Oyun Tasarımı Burs Programı",
      aciklama: "Oyun tasarımı alanında eğitim gören öğrenciler için yıllık burs",
      miktar: 5000,
      programSuresiAy: 10,
      saglayanKurum: "Kule Sakinleri Derneği",
      sonBasvuruTarihi: "2026-06-30",
      gereksinimler: [
        "Oyun tasarımı bölümü öğrencisi olmak",
        "Not ortalaması min. 2.5/4.0",
        "Dernek üyesi olmak",
      ],
      durum: "aktif",
      olusturulmaTarihi: new Date().toISOString(),
    },
  ];
  for (const burs of burslar) {
    await addDoc(collection(db, "burslar"), burs);
  }

  // Etkinlikler
  const etkinlikler = [
    {
      baslik: "Aylık Turnuva: Catan Şampiyonası",
      aciklama: "Her ay düzenlenen Catan turnuvamız bu ay özel ödüllü!",
      tarih: "2026-05-20T14:00:00",
      bitisTarihi: "2026-05-20T19:00:00",
      konum: "Büyük Salon",
      organizator: "Yönetim Kurulu",
      organizatorId: adminUser.uid,
      durum: "onaylandi",
      maxKatilimci: 16,
      katilimcilar: [],
      olusturulmaTarihi: new Date().toISOString(),
    },
  ];
  for (const e of etkinlikler) {
    await addDoc(collection(db, "etkinlikler"), e);
  }

  console.log("Seed tamamlandı. Firestore koleksiyonları oluşturuldu.");
  console.log("Admin UID:", adminUser.uid);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

