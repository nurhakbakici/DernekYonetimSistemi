/* eslint-disable no-console */
/**
 * Mevcut demo derneğe sunum için ek örnek veri yükler.
 * Önkoşul: `npm run seed:firestore` veya en azından `dernekler/demo-dernek` kaydı.
 *
 *   npm run seed:rich
 *   SEED_RICH_FORCE=1 npm run seed:rich   (tekrar eklemek için — çoğaltır)
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
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
} = require("firebase/firestore");

const DERNEK_ID = "demo-dernek";
const MEMBER_PASS = process.env.SEED_MEMBER_PASSWORD || "Demo123!";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID,
};

function gun(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

async function ensureUser(auth, db, { email, ad, soyad, rol, uyelikDurumu }) {
  let user;
  try {
    user = (await signInWithEmailAndPassword(auth, email, MEMBER_PASS)).user;
  } catch {
    user = (await createUserWithEmailAndPassword(auth, email, MEMBER_PASS)).user;
  }
  const iso = new Date().toISOString();
  await setDoc(
    doc(db, "users", user.uid),
    { ad, soyad, email: email.toLowerCase(), olusturulmaTarihi: iso },
    { merge: true },
  );
  await setDoc(
    doc(db, "uyelikler", `${user.uid}_${DERNEK_ID}`),
    {
      userId: user.uid,
      dernekId: DERNEK_ID,
      rol,
      uyelikDurumu,
      uyelikBaslangic: "2024-01-01",
      olusturulmaTarihi: iso,
    },
    { merge: true },
  );
  return { uid: user.uid, adSoyad: `${ad} ${soyad}` };
}

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error("SEED_ADMIN_EMAIL ve SEED_ADMIN_PASSWORD gerekli.");
  }

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  const adminCred = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
  const adminUid = adminCred.user.uid;

  const dernekRef = doc(db, "dernekler", DERNEK_ID);
  const dernekSnap = await getDoc(dernekRef);
  if (!dernekSnap.exists()) {
    throw new Error(`Önce temel seed: dernekler/${DERNEK_ID} yok. npm run seed:firestore`);
  }
  if (dernekSnap.data().richSeedAt && process.env.SEED_RICH_FORCE !== "1") {
    console.log("Zengin seed atlandı (richSeedAt dolu). Tekrar için: SEED_RICH_FORCE=1");
    return;
  }

  const iso = new Date().toISOString();
  const members = [];
  for (const m of [
    { email: "uye1@kulesakinleri.com", ad: "Ayşe", soyad: "Kaya", rol: "uye", uyelikDurumu: "aktif" },
    { email: "uye2@kulesakinleri.com", ad: "Can", soyad: "Demir", rol: "uye", uyelikDurumu: "aktif" },
    { email: "uye3@kulesakinleri.com", ad: "Zeynep", soyad: "Arslan", rol: "uye", uyelikDurumu: "aktif" },
    { email: "aday1@kulesakinleri.com", ad: "Burak", soyad: "Öztürk", rol: "aday", uyelikDurumu: "beklemede" },
    { email: "pasif1@kulesakinleri.com", ad: "Elif", soyad: "Şahin", rol: "uye", uyelikDurumu: "pasif" },
  ]) {
    members.push(await ensureUser(auth, db, m));
  }

  const allUsers = [{ uid: adminUid, adSoyad: "Yönetici Demo" }, ...members];

  const kitaplar = [
    { baslik: "D&D Player's Handbook 5e", yazar: "WotC", kategori: "RPG", toplamAdet: 4, musaitAdet: 2, yayinYili: 2014 },
    { baslik: "D&D Dungeon Master's Guide", yazar: "WotC", kategori: "RPG", toplamAdet: 2, musaitAdet: 1, yayinYili: 2014 },
    { baslik: "Pathfinder Core Rulebook", yazar: "Paizo", kategori: "RPG", toplamAdet: 2, musaitAdet: 2, yayinYili: 2019 },
    { baslik: "Catan", yazar: "K. Teuber", kategori: "Strateji", toplamAdet: 5, musaitAdet: 4, yayinYili: 2018 },
    { baslik: "Ticket to Ride", yazar: "A. Moon", kategori: "Aile", toplamAdet: 3, musaitAdet: 1, yayinYili: 2020 },
    { baslik: "Pandemic", yazar: "M. Leacock", kategori: "Kooperatif", toplamAdet: 2, musaitAdet: 2, yayinYili: 2020 },
    { baslik: "Azul", yazar: "M. Kiesling", kategori: "Bulmaca", toplamAdet: 2, musaitAdet: 2, yayinYili: 2021 },
    { baslik: "Gloomhaven Rulebook", yazar: "I. Childres", kategori: "RPG", toplamAdet: 1, musaitAdet: 0, yayinYili: 2022 },
  ];
  const kitapRefs = [];
  for (const k of kitaplar) {
    kitapRefs.push(await addDoc(collection(db, "kitaplar"), { ...k, dernekId: DERNEK_ID }));
  }

  const bursRefs = [];
  for (const b of [
    {
      ad: "Oyun Tasarımı Bursu",
      aciklama: "Tasarım öğrencileri",
      miktar: 8000,
      programSuresiAy: 10,
      saglayanKurum: "Demo Derneği",
      sonBasvuruTarihi: gun(40),
      gereksinimler: ["3. sınıf+", "Min 2.50 GNO"],
      gerekliBelgeler: [{ id: "tr", baslik: "Transkript" }],
      durum: "aktif",
      olusturulmaTarihi: iso,
    },
    {
      ad: "Genel Destek Bursu",
      aciklama: "Mali destek",
      miktar: 4000,
      programSuresiAy: 6,
      saglayanKurum: "Demo Derneği",
      sonBasvuruTarihi: gun(25),
      gereksinimler: ["Aktif üye"],
      durum: "aktif",
      olusturulmaTarihi: iso,
    },
  ]) {
    bursRefs.push(await addDoc(collection(db, "burslar"), { ...b, dernekId: DERNEK_ID }));
  }

  const bursDurumlar = ["beklemede", "onaylandi", "reddedildi", "beklemede", "onaylandi"];
  for (let i = 0; i < members.length; i++) {
    const m = members[i];
    const burs = bursRefs[i % bursRefs.length];
    const bursSnap = await getDoc(burs);
    const bursAdi = bursSnap.data().ad;
    const durum = bursDurumlar[i % bursDurumlar.length];
    const row = {
      bursId: burs.id,
      bursAdi,
      kullaniciId: m.uid,
      kullaniciAdi: m.adSoyad,
      basvuruTarihi: gun(-i - 2),
      durum,
      dernekId: DERNEK_ID,
    };
    if (durum === "onaylandi") {
      row.bursOdemeDurumu = i % 2 === 0 ? "yatirildi" : "beklemede";
      if (row.bursOdemeDurumu === "yatirildi") row.bursOdemeTarihi = gun(-1);
      row.iban = "TR330006100519786457841326";
    }
    if (durum === "reddedildi") row.notlar = "Eksik belge";
    await addDoc(collection(db, "bursBasvurulari"), row);
  }

  const odalarSnap = await getDocs(collection(db, "odalar"));
  const odalar = odalarSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  for (let i = 0; i < 8; i++) {
    const oda = odalar[i % odalar.length] || { id: "", ad: "Salon" };
    const u = allUsers[i % allUsers.length];
    await addDoc(collection(db, "rezervasyonlar"), {
      odaId: oda.id,
      odaAdi: oda.ad || "Oda",
      kullaniciId: u.uid,
      kullaniciAdi: u.adSoyad,
      tarih: gun(i - 2),
      baslangicSaati: `${10 + i}:00`,
      bitisSaati: `${12 + i}:00`,
      amac: ["Toplantı", "Oyun gecesi", "Kampanya", "Atölye"][i % 4],
      durum: i % 3 === 0 ? "beklemede" : i % 5 === 0 ? "iptal" : "onaylandi",
      olusturulmaTarihi: iso,
      dernekId: DERNEK_ID,
    });
  }

  for (let i = 0; i < kitapRefs.length && i < 5; i++) {
    const k = kitapRefs[i];
    const kSnap = await getDoc(k);
    const u = members[i % members.length];
    await addDoc(collection(db, "oduncAlmalar"), {
      kitapId: k.id,
      kitapBaslik: kSnap.data().baslik,
      kullaniciId: u.uid,
      kullaniciAdi: u.adSoyad,
      oduncTarihi: gun(-15 - i),
      iadeTarihi: gun(-2 + i),
      durum: i % 2 === 0 ? "gecikti" : "aktif",
      dernekId: DERNEK_ID,
    });
  }

  const yil = new Date().getFullYear();
  const ay = new Date().getMonth() + 1;
  for (const u of allUsers) {
    await addDoc(collection(db, "aidatOdemeleri"), {
      kullaniciId: u.uid,
      kullaniciAdi: u.adSoyad,
      yil,
      ay,
      miktar: 300,
      odendi: Math.random() > 0.4,
      odemeTarihi: gun(-5),
      sonOdemeTarihi: new Date(yil, ay, 0).toISOString().split("T")[0],
      dernekId: DERNEK_ID,
    });
  }

  for (const t of [
    { baslik: "Catan Şampiyonası", gun: 7, durum: "onaylandi" },
    { baslik: "D&D One-Shot", gun: 10, durum: "onaylandi" },
    { baslik: "Warhammer Günü", gun: 14, durum: "beklemede" },
    { baslik: "Genel Kurul", gun: 21, durum: "onaylandi" },
    { baslik: "Magic Standard", gun: 3, durum: "onaylandi" },
  ]) {
    const tarih = `${gun(t.gun)}T14:00:00`;
    await addDoc(collection(db, "etkinlikler"), {
      baslik: t.baslik,
      aciklama: "Demo etkinlik",
      tarih,
      bitisTarihi: `${gun(t.gun)}T18:00:00`,
      konum: "Ana Salon",
      organizator: "Yönetim",
      organizatorId: adminUid,
      durum: t.durum,
      maxKatilimci: 20,
      katilimcilar: members.slice(0, 2).map((m) => m.uid),
      olusturulmaTarihi: iso,
      dernekId: DERNEK_ID,
    });
  }

  for (const d of [
    "Aidat son ödeme tarihi yaklaşıyor.",
    "Kütüphaneye 8 yeni kitap eklendi.",
    "Gönüllü başvuruları açıldı — turnuva için.",
    "22 Mayıs bakım günü — dernek kapalı.",
  ]) {
    await addDoc(collection(db, "duyurular"), {
      baslik: d.slice(0, 40),
      icerik: d,
      olusturulmaTarihi: iso,
      olusturanId: adminUid,
      olusturanAdi: "Yönetici Demo",
      dernekId: DERNEK_ID,
    });
  }

  const gorevRef = await addDoc(collection(db, "gonulluGorevler"), {
    baslik: "Turnuva karşılama ekibi",
    aciklama: "Kayıt ve yönlendirme",
    tarih: gun(7),
    baslangicSaati: "09:00",
    bitisSaati: "13:00",
    konum: "Ana Salon",
    kontenjan: 8,
    durum: "acik",
    olusturanId: adminUid,
    olusturanAdi: "Yönetici Demo",
    olusturulmaTarihi: iso,
    dernekId: DERNEK_ID,
  });
  for (let i = 0; i < members.length; i++) {
    await addDoc(collection(db, "gonulluBasvurular"), {
      gorevId: gorevRef.id,
      gorevBaslik: "Turnuva karşılama ekibi",
      kullaniciId: members[i].uid,
      kullaniciAdi: members[i].adSoyad,
      basvuruTarihi: gun(-i),
      durum: i === 0 ? "onaylandi" : "beklemede",
      dernekId: DERNEK_ID,
    });
  }

  const envRef = await addDoc(collection(db, "envanterler"), {
    ad: "Projeksiyon",
    kategori: "Teknik",
    toplamAdet: 3,
    musaitAdet: 1,
    lokasyon: "Depo",
    durum: "kullanilabilir",
    olusturulmaTarihi: gun(-100),
    dernekId: DERNEK_ID,
  });
  await addDoc(collection(db, "envanterZimmetler"), {
    envanterId: envRef.id,
    envanterAd: "Projeksiyon",
    kullaniciId: members[0].uid,
    kullaniciAdi: members[0].adSoyad,
    zimmetTarihi: gun(-3),
    planlananIade: gun(10),
    durum: "aktif",
    dernekId: DERNEK_ID,
  });

  await updateDoc(dernekRef, { richSeedAt: iso });

  console.log("Zengin seed tamamlandı.");
  console.log("Ek demo üyeler (şifre:", MEMBER_PASS + "):");
  console.log("  uye1@kulesakinleri.com, uye2@..., uye3@..., aday1@..., pasif1@...");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
