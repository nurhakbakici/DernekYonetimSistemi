/* eslint-disable no-console */
/**
 * Firestore genel dernek yönetim sistemi seed (client SDK).
 *
 * 1) Proje kökünde `.env` oluşturun (`EXPO_PUBLIC_FIREBASE_*`, `SEED_ADMIN_*`).
 * 2) Firebase Console → Firestore → `firestore.rules` ve indeksleri yükleyin.
 * 3) `npm run seed:firestore`
 *
 * Oluşturur: `dernekler/demo-dernek`, `users/{adminUid}` (profil), `uyelikler/{uid}_demo-dernek`,
 * örnek odalar/kitaplar/burs/etkinlik/duyuru (hepsi `dernekId: demo-dernek`).
 * Platform yöneticisi: `platformYoneticiler` yerine `.env` içindeki `EXPO_PUBLIC_PLATFORM_ADMIN_UIDS` kullanılır.
 */

const path = require("path");
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

const DERNEK_ID = "demo-dernek";

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

const PAKETLER = ["duyurular", "odalar", "kutuphane", "etkinlikler", "burslar", "aidat", "uyelik", "acikKapali", "gonulluluk", "envanter"];

function assertConfigured() {
  const bos =
    !firebaseConfig.apiKey ||
    firebaseConfig.apiKey === "YOUR_API_KEY" ||
    !firebaseConfig.projectId ||
    firebaseConfig.projectId === "YOUR_PROJECT_ID";
  if (bos) {
    throw new Error(
      "Firebase config eksik. `.env` içinde EXPO_PUBLIC_FIREBASE_API_KEY ve EXPO_PUBLIC_FIREBASE_PROJECT_ID vb. doldurun.",
    );
  }
}

async function ensureAdminAuth(auth, email, password) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  } catch {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    return cred.user;
  }
}

async function alreadySeeded(db) {
  const d = await getDocs(query(collection(db, "dernekler"), limit(1)));
  return !d.empty;
}

async function main() {
  assertConfigured();

  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error("SEED_ADMIN_EMAIL ve SEED_ADMIN_PASSWORD .env içinde tanımlı olmalı.");
  }

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  /** Firestore kuralları okuma için oturum gerekir; önce giriş yapılmalı. */
  const adminUser = await ensureAdminAuth(auth, adminEmail, adminPassword);
  const uid = adminUser.uid;

  if (await alreadySeeded(db)) {
    console.log("Seed atlanıyor: Firestore'da zaten dernek kaydı var.");
    return;
  }

  const iso = new Date().toISOString();

  await setDoc(doc(db, "users", uid), {
    ad: "Yönetici",
    soyad: "Demo",
    email: adminEmail.toLowerCase(),
    telefon: "0532 000 0000",
    olusturulmaTarihi: iso,
  });

  // Platform onay yetkisi (Firestore kuralları `platformYoneticiler/{uid}` okur)
  try {
    await setDoc(doc(db, "platformYoneticiler", uid), {
      email: adminEmail.toLowerCase(),
      olusturulmaTarihi: iso,
    });
    console.log("platformYoneticiler kaydı oluşturuldu:", uid);
  } catch (e) {
    console.warn(
      "platformYoneticiler yazılamadı (kurallar). Firebase Console'dan manuel ekleyin:",
      uid,
    );
  }

  await setDoc(doc(db, "dernekler", DERNEK_ID), {
    ad: "Demo Derneği",
    slug: "demo-dernek",
    derbisNo: "1234567890",
    durum: "aktif",
    paketler: PAKETLER,
    katilimKodu: "",
    olusturanUserId: uid,
    olusturulmaTarihi: iso,
    dernekDurumu: {
      acik: true,
      mesaj: "Bugün 14:00 - 22:00 saatleri arasında açığız!",
      guncellenmeTarihi: iso,
      guncelleyenKullanici: "Yönetici Demo",
    },
    aidatAylikMiktar: 300,
  });

  await setDoc(doc(db, "uyelikler", `${uid}_${DERNEK_ID}`), {
    userId: uid,
    dernekId: DERNEK_ID,
    rol: "admin",
    uyelikDurumu: "aktif",
    uyelikBaslangic: "2020-01-01",
    olusturulmaTarihi: iso,
  });

  const odalar = [
    { ad: "Ana Salon", aciklama: "Toplantılar ve büyük grup etkinlikleri için ana salon", kapasite: 20, ozellikler: ["Projeksiyon", "Whiteboard", "WiFi", "Klima"], aktif: true },
    { ad: "Toplantı Odası A", aciklama: "Küçük grup toplantıları için", kapasite: 8, ozellikler: ["Geniş Masa", "WiFi", "Klima"], aktif: true },
    { ad: "Toplantı Odası B", aciklama: "Eğitim ve seminer için oda", kapasite: 6, ozellikler: ["Projeksiyon", "WiFi", "Ses Sistemi"], aktif: true },
    { ad: "Çalışma Odası", aciklama: "Sessiz çalışma ve proje geliştirme için", kapasite: 6, ozellikler: ["Geniş Masa", "WiFi", "Klima"], aktif: true },
    { ad: "Bahçe Alanı", aciklama: "Açık hava etkinlikleri için", kapasite: 30, ozellikler: ["WiFi"], aktif: true },
    { ad: "Kütüphane", aciklama: "Okuma ve araştırma alanı", kapasite: 6, ozellikler: ["Geniş Masa", "WiFi"], aktif: true },
  ];
  for (const oda of odalar) {
    await addDoc(collection(db, "odalar"), { ...oda, dernekId: DERNEK_ID });
  }

  const kitaplar = [
    { baslik: "Dernek Yönetimi El Kitabı", yazar: "T.C. İçişleri Bakanlığı", kategori: "Mevzuat", toplamAdet: 3, musaitAdet: 3, aciklama: "Dernekler kanunu ve yönetim rehberi", yayinYili: 2020 },
    { baslik: "Sivil Toplum Kuruluşları Rehberi", yazar: "Çeşitli Yazarlar", kategori: "Rehber", toplamAdet: 2, musaitAdet: 2, aciklama: "STK yönetimi ve gönüllülük üzerine kapsamlı rehber", yayinYili: 2022 },
  ];
  for (const kitap of kitaplar) {
    await addDoc(collection(db, "kitaplar"), { ...kitap, dernekId: DERNEK_ID });
  }

  const burslar = [
    {
      ad: "Genel Öğrenci Destek Bursu",
      aciklama: "Üye öğrencilere yönelik yıllık destek bursu",
      miktar: 5000,
      programSuresiAy: 10,
      saglayanKurum: "Demo Derneği",
      sonBasvuruTarihi: "2026-06-30",
      gereksinimler: ["Üniversite öğrencisi olmak", "Not ortalaması min. 2.5/4.0", "Dernek üyesi olmak"],
      durum: "aktif",
      olusturulmaTarihi: iso,
      dernekId: DERNEK_ID,
    },
  ];
  for (const burs of burslar) {
    await addDoc(collection(db, "burslar"), burs);
  }

  const etkinlikler = [
    {
      baslik: "Aylık Üye Toplantısı",
      aciklama: "Her ay düzenlenen olağan üye toplantısı.",
      tarih: "2026-05-20T14:00:00",
      bitisTarihi: "2026-05-20T17:00:00",
      konum: "Ana Salon",
      organizator: "Yönetim Kurulu",
      organizatorId: uid,
      durum: "onaylandi",
      maxKatilimci: 30,
      katilimcilar: [],
      olusturulmaTarihi: iso,
      dernekId: DERNEK_ID,
    },
  ];
  for (const e of etkinlikler) {
    await addDoc(collection(db, "etkinlikler"), e);
  }

  await addDoc(collection(db, "duyurular"), {
    baslik: "Genel kurul hatırlatması",
    icerik:
      "Yıllık genel kurul 15 Haziran Cumartesi 14:00’te dernek merkezinde yapılacaktır. Katılımınızı rica ederiz.",
    olusturulmaTarihi: iso,
    olusturanId: uid,
    olusturanAdi: "Yönetici Demo",
    dernekId: DERNEK_ID,
  });

  // ── Demo rezervasyonlar ──────────────────────────────────────────────────────
  const bugun = new Date();
  const yarinIso = new Date(bugun.getFullYear(), bugun.getMonth(), bugun.getDate() + 1)
    .toISOString().split("T")[0];
  const oncekiIso = new Date(bugun.getFullYear(), bugun.getMonth(), bugun.getDate() - 3)
    .toISOString().split("T")[0];

  const odalarSnap = await getDocs(collection(db, "odalar"));
  const odaIdler = odalarSnap.docs.map((d) => d.id);

  if (odaIdler.length > 0) {
    await addDoc(collection(db, "rezervasyonlar"), {
      odaId: odaIdler[0], odaAdi: "Ana Salon",
      kullaniciId: uid, kullaniciAdi: "Yönetici Demo",
      tarih: yarinIso, baslangicSaati: "14:00", bitisSaati: "16:00",
      amac: "Yönetim kurulu toplantısı", durum: "onaylandi",
      olusturulmaTarihi: iso, dernekId: DERNEK_ID,
    });
    await addDoc(collection(db, "rezervasyonlar"), {
      odaId: odaIdler[1] ?? odaIdler[0], odaAdi: "Toplantı Odası A",
      kullaniciId: uid, kullaniciAdi: "Yönetici Demo",
      tarih: oncekiIso, baslangicSaati: "10:00", bitisSaati: "11:30",
      amac: "Proje çalışması", durum: "onaylandi",
      olusturulmaTarihi: iso, dernekId: DERNEK_ID,
    });
    await addDoc(collection(db, "rezervasyonlar"), {
      odaId: odaIdler[2] ?? odaIdler[0], odaAdi: "Çalışma Odası",
      kullaniciId: uid, kullaniciAdi: "Yönetici Demo",
      tarih: yarinIso, baslangicSaati: "18:00", bitisSaati: "20:00",
      amac: "Toplantı", durum: "beklemede",
      olusturulmaTarihi: iso, dernekId: DERNEK_ID,
    });
  }

  // ── Demo ödünç almalar ───────────────────────────────────────────────────────
  const kitaplarSnap = await getDocs(collection(db, "kitaplar"));
  const kitapIdler = kitaplarSnap.docs.map((d) => d.id);

  if (kitapIdler.length > 0) {
    const oduncTarih = new Date(bugun.getFullYear(), bugun.getMonth() - 1, 10).toISOString().split("T")[0];
    const iadeTarih  = new Date(bugun.getFullYear(), bugun.getMonth(), 10).toISOString().split("T")[0];
    await addDoc(collection(db, "oduncAlmalar"), {
      kitapId: kitapIdler[0], kitapBaslik: "Dernek Yönetimi El Kitabı",
      kullaniciId: uid, kullaniciAdi: "Yönetici Demo",
      oduncTarihi: oduncTarih, iadeTarihi: iadeTarih,
      durum: new Date(iadeTarih) < bugun ? "gecikti" : "aktif",
      dernekId: DERNEK_ID,
    });
    if (kitapIdler.length > 1) {
      const od2 = new Date(bugun.getFullYear(), bugun.getMonth(), 5).toISOString().split("T")[0];
      const ia2 = new Date(bugun.getFullYear(), bugun.getMonth() + 1, 5).toISOString().split("T")[0];
      await addDoc(collection(db, "oduncAlmalar"), {
        kitapId: kitapIdler[1], kitapBaslik: "Sivil Toplum Kuruluşları Rehberi",
        kullaniciId: uid, kullaniciAdi: "Yönetici Demo",
        oduncTarihi: od2, iadeTarihi: ia2, durum: "aktif",
        dernekId: DERNEK_ID,
      });
    }
  }

  // ── Demo aidat ödemeleri ─────────────────────────────────────────────────────
  const ay   = bugun.getMonth() + 1;
  const yil  = bugun.getFullYear();
  const oncAy  = ay === 1 ? 12 : ay - 1;
  const oncYil = ay === 1 ? yil - 1 : yil;

  await addDoc(collection(db, "aidatOdemeleri"), {
    kullaniciId: uid, kullaniciAdi: "Yönetici Demo",
    yil: oncYil, ay: oncAy, miktar: 300, odendi: true,
    odemeTarihi: new Date(oncYil, oncAy - 1, 20).toISOString().split("T")[0],
    sonOdemeTarihi: new Date(oncYil, oncAy, 0).toISOString().split("T")[0],
    dernekId: DERNEK_ID,
  });
  await addDoc(collection(db, "aidatOdemeleri"), {
    kullaniciId: uid, kullaniciAdi: "Yönetici Demo",
    yil, ay, miktar: 300, odendi: false,
    sonOdemeTarihi: new Date(yil, ay, 0).toISOString().split("T")[0],
    dernekId: DERNEK_ID,
  });

  // Bir önceki önceki ay da ödendi
  const onc2Ay  = oncAy === 1 ? 12 : oncAy - 1;
  const onc2Yil = oncAy === 1 ? oncYil - 1 : oncYil;
  await addDoc(collection(db, "aidatOdemeleri"), {
    kullaniciId: uid, kullaniciAdi: "Yönetici Demo",
    yil: onc2Yil, ay: onc2Ay, miktar: 300, odendi: true,
    odemeTarihi: new Date(onc2Yil, onc2Ay - 1, 18).toISOString().split("T")[0],
    sonOdemeTarihi: new Date(onc2Yil, onc2Ay, 0).toISOString().split("T")[0],
    dernekId: DERNEK_ID,
  });

  const gorevRef = await addDoc(collection(db, "gonulluGorevler"), {
    baslik: "Etkinlik karşılama ekibi",
    aciklama: "Kayıt masası ve yönlendirme desteği.",
    tarih: new Date(bugun.getFullYear(), bugun.getMonth(), bugun.getDate() + 14).toISOString().split("T")[0],
    konum: "Ana Salon",
    kontenjan: 6,
    durum: "acik",
    olusturanId: uid,
    olusturanAdi: "Yönetici Demo",
    olusturulmaTarihi: iso,
    dernekId: DERNEK_ID,
  });
  await addDoc(collection(db, "gonulluBasvurular"), {
    gorevId: gorevRef.id,
    gorevBaslik: "Etkinlik karşılama ekibi",
    kullaniciId: uid,
    kullaniciAdi: "Yönetici Demo",
    basvuruTarihi: bugun.toISOString().split("T")[0],
    durum: "beklemede",
    dernekId: DERNEK_ID,
  });

  const envRef = await addDoc(collection(db, "envanterler"), {
    ad: "Projeksiyon cihazı",
    kategori: "Teknik",
    aciklama: "Full HD, HDMI",
    toplamAdet: 2,
    musaitAdet: 1,
    lokasyon: "Depo A",
    durum: "kullanilabilir",
    olusturulmaTarihi: iso.split("T")[0],
    dernekId: DERNEK_ID,
  });
  await addDoc(collection(db, "envanterZimmetler"), {
    envanterId: envRef.id,
    envanterAd: "Projeksiyon cihazı",
    kullaniciId: uid,
    kullaniciAdi: "Yönetici Demo",
    zimmetTarihi: bugun.toISOString().split("T")[0],
    planlananIade: new Date(bugun.getFullYear(), bugun.getMonth(), bugun.getDate() + 7).toISOString().split("T")[0],
    durum: "aktif",
    dernekId: DERNEK_ID,
  });

  console.log("Seed tamamlandı.");
  console.log("Dernek id:", DERNEK_ID);
  console.log("Demo dernek hazır. Rezervasyon, ödünç ve aidat örnek verileri oluşturuldu.");
  console.log("Admin UID (platform yöneticisi + dernek admini):", uid);
  console.log("EXPO_PUBLIC_PLATFORM_ADMIN_UIDS=.env içine şu UID'yi ekleyin:", uid);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
